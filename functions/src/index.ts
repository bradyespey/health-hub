import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

/**
 * HTTP Cloud Function that proxies Habitify API requests, holding the real
 * API key server-side instead of shipping it in the client bundle.
 * Client sends its Firebase ID token; caller must be in ALLOWED_EMAILS.
 */
export const habitifyProxy = functions.https.onRequest({
  memory: '256MiB',
  timeoutSeconds: 30,
  secrets: ['HABITIFY_API_KEY'],
}, async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!idToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      let decoded;
      try {
        decoded = await getAuth().verifyIdToken(idToken);
      } catch {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const allowedEmails = (process.env.ALLOWED_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (!decoded.email || !allowedEmails.includes(decoded.email.toLowerCase())) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const apiKey = process.env.HABITIFY_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'Habitify not configured' });
        return;
      }

      const response = await fetch(`https://api.habitify.me${req.url}`, {
        method: req.method,
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      });

      const data = await response.text();
      res.status(response.status).set('Content-Type', 'application/json').send(data);
    } catch (error) {
      console.error('habitifyProxy error:', error);
      res.status(500).json({ error: 'Proxy request failed' });
    }
  });
});

/**
 * HTTP Cloud Function to ingest Apple Health data from Health Auto Export app
 * Single-user app - userId defaults to 'brady' if not provided
 */
export const ingestAppleHealth = functions.https.onRequest({
  memory: '512MiB',
  timeoutSeconds: 120,
  secrets: ['HEALTH_INGEST_SECRET']
}, async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify request method
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      // Verify shared secret — this endpoint is hit by the Health Auto Export
      // iOS app in the background, so it can't do an interactive Firebase sign-in.
      // A static per-deployment secret is the fail-closed alternative.
      const providedSecret = req.headers['x-ingest-secret'] || req.query.secret;
      if (!process.env.HEALTH_INGEST_SECRET || providedSecret !== process.env.HEALTH_INGEST_SECRET) {
        res.status(401).send('Unauthorized');
        return;
      }

      // Verify content type
      if (req.headers['content-type'] !== 'application/json') {
        res.status(400).send('Content-Type must be application/json');
        return;
      }

      // Extract userId - default to 'brady' for single-user app
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'] || 'brady';
      
      // Support both simple array format and Health Auto Export format
      let dataToProcess = [];
      
      if (req.body.data && Array.isArray(req.body.data)) {
        // Simple format: { data: [{ type, date, value, unit }] }
        dataToProcess = req.body.data;
      } else if (req.body.data && req.body.data.metrics) {
        // Health Auto Export format: { data: { metrics: [...], workouts: [...] } }
        // Convert metrics to simple format
        for (const metric of req.body.data.metrics) {
          const metricName = metric.name;
          const units = metric.units || '';
          
          if (metric.data && Array.isArray(metric.data)) {
            for (const dataPoint of metric.data) {
              // Some metrics have qty, others have Avg/Min/Max
              const value = dataPoint.qty !== undefined ? dataPoint.qty : dataPoint.Avg;
              
              if (value !== undefined) {
                const recordData: Record<string, unknown> = {
                  type: metricName,
                  date: dataPoint.date,
                  value: value,
                  unit: units,
                  source: dataPoint.source || 'health-auto-export'
                };
                
                // Include Min/Max if available (for heart rate, etc.)
                if (dataPoint.Min !== undefined) recordData.min = dataPoint.Min;
                if (dataPoint.Max !== undefined) recordData.max = dataPoint.Max;
                
                dataToProcess.push(recordData);
              }
            }
          }
        }
      }

      if (dataToProcess.length === 0) {
        res.status(400).json({
          error: 'No data found. Expected Health Auto Export format or simple array format.',
          hint: 'Send { data: { metrics: [...] } } from Health Auto Export or { data: [{ type, date, value, unit }] }'
        });
        return;
      }

      console.log(`Received Apple Health data for user: ${userId}, records: ${dataToProcess.length}`);

      // Get Firestore instance
      const db = getFirestore();
      
      // Process records in batches of 450 (Firestore limit is 500)
      const BATCH_SIZE = 450;
      const processedDates = new Set<string>();
      let processedCount = 0;

      for (let i = 0; i < dataToProcess.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchRecords = dataToProcess.slice(i, i + BATCH_SIZE);

        // Group records by date and type to sum values
        const recordsByDateType: Record<string, {
          type: string;
          date: string;
          value: number;
          unit: string;
          source: string;
          min?: number;
          max?: number;
        }> = {};

        for (const record of batchRecords) {
          const { type, date, value, unit, source, min, max } = record as {
            type: string;
            date: string;
            value: number;
            unit?: string;
            source?: string;
            min?: number;
            max?: number;
          };

          // Validate record structure
          if (!type || !date || value === undefined) {
            console.warn('Skipping invalid record:', record);
            continue;
          }

          // Ensure date is in YYYY-MM-DD format
          const dateStr = new Date(date).toISOString().split('T')[0];
          const key = `${dateStr}_${type}`;
          
          // For nutrition/cumulative metrics, sum the values
          const isCumulative = type.includes('dietary') || type.includes('protein') || 
                              type.includes('carbohydrate') || type.includes('fat') ||
                              type.includes('sugar');
          
          if (recordsByDateType[key] && isCumulative) {
            // Sum values for nutrition data
            recordsByDateType[key].value += value;
            // Update min/max if provided
            if (min !== undefined) {
              recordsByDateType[key].min = Math.min(recordsByDateType[key].min || min, min);
            }
            if (max !== undefined) {
              recordsByDateType[key].max = Math.max(recordsByDateType[key].max || max, max);
            }
          } else {
            // Store new record (or replace for non-cumulative like weight)
            recordsByDateType[key] = {
              type,
              date: dateStr,
              value,
              unit: unit || '',
              source: source || 'health-auto-export',
              min,
              max
            };
          }
        }

        // Now batch write the summed records
        for (const record of Object.values(recordsByDateType)) {
          const { type, date: dateStr, value, unit, source, min, max } = record;
          
          // Create document path: appleHealth/{userId}/{date}/{type}
          const docRef = db
            .collection('appleHealth')
            .doc(userId)
            .collection(dateStr)
            .doc(type);

          // For nutrition/cumulative metrics, use increment to sum across batches
          const isCumulative = type.includes('dietary') || type.includes('protein') || 
                              type.includes('carbohydrate') || type.includes('fat') ||
                              type.includes('sugar');
          
          if (isCumulative) {
            // For nutrition data, set the value directly (not increment)
            // This will overwrite any existing incorrect data
            batch.set(docRef, {
              type,
              date: dateStr,
              value,
              unit,
              timestamp: FieldValue.serverTimestamp(),
              source
            });
          } else {
            // Use set for non-cumulative data (weight, HRV, etc.)
            const healthData: Record<string, unknown> = {
              type,
              date: dateStr,
              value,
              unit,
              timestamp: FieldValue.serverTimestamp(),
              source
            };
            
            // Include min/max if available
            if (min !== undefined) healthData.min = min;
            if (max !== undefined) healthData.max = max;

            batch.set(docRef, healthData);
          }
          
          processedDates.add(dateStr);
          processedCount++;
        }

        // Commit this batch
        await batch.commit();
        console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1}, processed ${batchRecords.length} records`);
      }

      // Update summary in a separate transaction
      const latestRef = db
        .collection('appleHealth')
        .doc(userId)
        .collection('latest')
        .doc('summary');

      await latestRef.set({
        lastUpdated: FieldValue.serverTimestamp(),
        recordCount: processedCount,
        datesUpdated: Array.from(processedDates)
      }, { merge: true });

      console.log(`Successfully processed ${processedCount} Apple Health records for ${processedDates.size} dates`);

      res.status(200).json({
        success: true,
        message: `Processed ${processedCount} records for ${processedDates.size} dates`,
        processedDates: Array.from(processedDates),
        userId: userId
      });

    } catch (error) {
      console.error('Error ingesting Apple Health data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to ingest Apple Health data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

// Helper functions for backup functionality
// These will be used when we add the scheduled backup later
