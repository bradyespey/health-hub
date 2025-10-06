import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

interface BackupRequest {
  backupData: {
    version: string;
    backupDate: string;
    userId: string;
    userEmail: string;
    data: {
      layouts: {
        current: unknown[];
        presets: unknown[];
      };
      textCards: unknown[];
      systemSettings?: unknown;
    };
  };
  folderId: string;
}

/**
 * HTTP Cloud Function to backup data to Google Drive
 */
export const backupToGoogleDrive = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify request method
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      // Verify authentication (optional: add your own auth logic)
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).send('Unauthorized');
        return;
      }

      const { backupData, folderId }: BackupRequest = req.body;

      if (!backupData || !folderId) {
        res.status(400).send('Missing backupData or folderId');
        return;
      }

      // Set up Google Drive API with service account
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      const drive = google.drive({ version: 'v3', auth });

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `health-hub-backup-${timestamp}-${Date.now()}.json`;

      // Upload to Google Drive
      const fileMetadata = {
        name: filename,
        parents: [folderId],
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(backupData, null, 2),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,size',
      });

      console.log('Backup uploaded to Google Drive:', response.data);

      res.status(200).json({
        success: true,
        fileId: response.data.id,
        fileName: response.data.name,
        size: response.data.size,
      });

    } catch (error) {
      console.error('Error backing up to Google Drive:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to backup to Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
});

/**
 * HTTP Cloud Function to ingest Apple Health data from Health Auto Export app
 * Single-user app - userId defaults to 'brady' if not provided
 */
export const ingestAppleHealth = functions.https.onRequest({
  memory: '512MiB',
  timeoutSeconds: 120
}, async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify request method
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
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
      const db = admin.firestore();
      
      // Process records in batches of 450 (Firestore limit is 500)
      const BATCH_SIZE = 450;
      const processedDates = new Set<string>();
      let processedCount = 0;

      for (let i = 0; i < dataToProcess.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchRecords = dataToProcess.slice(i, i + BATCH_SIZE);

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
          
          // Create document path: appleHealth/{userId}/{date}/{type}
          const docRef = db
            .collection('appleHealth')
            .doc(userId)
            .collection(dateStr)
            .doc(type);

          // Prepare data for storage
          const healthData: Record<string, unknown> = {
            type,
            date: dateStr,
            value,
            unit: unit || '',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            source: source || 'health-auto-export'
          };
          
          // Include min/max if available
          if (min !== undefined) healthData.min = min;
          if (max !== undefined) healthData.max = max;

          batch.set(docRef, healthData, { merge: true });
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
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
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