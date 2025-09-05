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
 * HTTP Cloud Function to ingest Apple Health data from iOS Shortcut
 */
export const ingestAppleHealth = functions.https.onRequest(async (req, res) => {
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

      const { userId, data } = req.body;

      if (!userId || !data || !Array.isArray(data)) {
        res.status(400).json({
          error: 'Invalid payload. Expected: { userId: string, data: Array<{ type: string, date: string, value: number, unit?: string }> }'
        });
        return;
      }

      console.log(`Received Apple Health data for user: ${userId}, records: ${data.length}`);

      // Get Firestore instance
      const db = admin.firestore();
      
      // Process each health record
      const batch = db.batch();
      const processedDates = new Set<string>();

      for (const record of data) {
        const { type, date, value, unit } = record;

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
        const healthData = {
          type,
          date: dateStr,
          value,
          unit: unit || '',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          source: 'ios-shortcut'
        };

        batch.set(docRef, healthData, { merge: true });
        processedDates.add(dateStr);
      }

      // Also update a "latest" document for quick access
      const latestRef = db
        .collection('appleHealth')
        .doc(userId)
        .collection('latest')
        .doc('summary');

      batch.set(latestRef, {
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        recordCount: data.length,
        datesUpdated: Array.from(processedDates)
      }, { merge: true });

      // Commit the batch
      await batch.commit();

      console.log(`Successfully processed ${data.length} Apple Health records for ${processedDates.size} dates`);

      res.status(200).json({
        success: true,
        message: `Processed ${data.length} records for ${processedDates.size} dates`,
        processedDates: Array.from(processedDates)
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