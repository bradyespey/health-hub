import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Top-level collections to backup
const TOP_LEVEL_COLLECTIONS = [
  'users'
];

// Note: appleHealth, layouts, textCards, scratchOffPrizes are subcollections under users
// We'll handle these specially when backing up user documents

async function backupTopLevelCollection(collectionName) {
  console.log(`Backing up ${collectionName}...`);
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  const data = [];
  
  for (const doc of snapshot.docs) {
    const docData = { id: doc.id, ...doc.data() };
    
    // Backup subcollections for users collection
    if (collectionName === 'users') {
      console.log(`  Backing up subcollections for user ${doc.id}...`);
      
      // Backup scratchOffPrizes subcollection
      try {
        const scratchOffPrizesRef = doc.ref.collection('scratchOffPrizes');
        const scratchOffSnapshot = await scratchOffPrizesRef.get();
        if (!scratchOffSnapshot.empty) {
          docData.scratchOffPrizes = scratchOffSnapshot.docs.map(subDoc => ({
            id: subDoc.id,
            ...subDoc.data()
          }));
          console.log(`    Found ${docData.scratchOffPrizes.length} scratch-off prizes`);
        }
      } catch (error) {
        console.error(`    Error backing up scratchOffPrizes for user ${doc.id}:`, error.message);
      }
    }
    
    data.push(docData);
  }

  // Sort by id for consistent file ordering
  data.sort((a, b) => a.id.localeCompare(b.id));

  console.log(`  Found ${data.length} documents in ${collectionName}`);
  return data;
}

async function backupTopLevelDocumentCollections() {
  console.log('Backing up document-level collections...');
  const backupData = {};
  
  // Backup appleHealth collection (top-level, not subcollection)
  try {
    console.log('Backing up appleHealth...');
    const appleHealthRef = db.collection('appleHealth');
    const snapshot = await appleHealthRef.get();
    const data = [];
    
    for (const doc of snapshot.docs) {
      // Each document might have date subcollections
      const docData = { id: doc.id, ...doc.data() };
      
      // Get all subcollections (date-based)
      const subcollections = await doc.ref.listCollections();
      for (const subcol of subcollections) {
        const subSnapshot = await subcol.get();
        if (!subSnapshot.empty) {
          docData[subcol.id] = subSnapshot.docs.map(subDoc => ({
            id: subDoc.id,
            ...subDoc.data()
          }));
        }
      }
      
      data.push(docData);
    }
    
    backupData.appleHealth = data;
    console.log(`  Found ${data.length} documents in appleHealth`);
  } catch (error) {
    console.error('  Error backing up appleHealth:', error.message);
    backupData.appleHealth = [];
  }
  
  // Backup layouts collection (top-level)
  try {
    console.log('Backing up layouts...');
    const layoutsRef = db.collection('layouts');
    const snapshot = await layoutsRef.get();
    const data = [];
    
    for (const doc of snapshot.docs) {
      const docData = { id: doc.id, ...doc.data() };
      
      // Get presets subcollection
      const presetsRef = doc.ref.collection('presets');
      const presetsSnapshot = await presetsRef.get();
      if (!presetsSnapshot.empty) {
        docData.presets = presetsSnapshot.docs.map(subDoc => ({
          id: subDoc.id,
          ...subDoc.data()
        }));
      }
      
      data.push(docData);
    }
    
    backupData.layouts = data;
    console.log(`  Found ${data.length} documents in layouts`);
  } catch (error) {
    console.error('  Error backing up layouts:', error.message);
    backupData.layouts = [];
  }
  
  // Backup textCards collection (top-level)
  try {
    console.log('Backing up textCards...');
    const textCardsRef = db.collection('textCards');
    const snapshot = await textCardsRef.get();
    const data = [];
    
    for (const doc of snapshot.docs) {
      const docData = { id: doc.id, ...doc.data() };
      
      // Get page subcollections (index, goals, mission185)
      const subcollections = await doc.ref.listCollections();
      for (const subcol of subcollections) {
        const subSnapshot = await subcol.get();
        if (!subSnapshot.empty) {
          docData[subcol.id] = subSnapshot.docs.map(subDoc => ({
            id: subDoc.id,
            ...subDoc.data()
          }));
        }
      }
      
      data.push(docData);
    }
    
    backupData.textCards = data;
    console.log(`  Found ${data.length} documents in textCards`);
  } catch (error) {
    console.error('  Error backing up textCards:', error.message);
    backupData.textCards = [];
  }
  
  return backupData;
}

async function backup() {
  console.log('Starting backup...');
  
  // Create backups directory if it doesn't exist
  const backupDir = path.join(__dirname, '../data-backups');
  if (!fs.existsSync(backupDir)){
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData = {};
  let totalDocs = 0;

  // Backup top-level collections
  for (const collection of TOP_LEVEL_COLLECTIONS) {
    try {
      const data = await backupTopLevelCollection(collection);
      backupData[collection] = data;
      totalDocs += data.length;
    } catch (error) {
      console.error(`Error backing up ${collection}:`, error.message);
      backupData[collection] = [];
    }
  }
  
  // Backup document-level collections
  const docLevelCollections = await backupTopLevelDocumentCollections();
  Object.assign(backupData, docLevelCollections);
  totalDocs += Object.values(docLevelCollections).reduce((sum, arr) => sum + arr.length, 0);

  // Write backup file
  const timestamp = new Date().toISOString().split('T')[0];
  const filePath = path.join(backupDir, 'healthhub-data.json');
  
  const backupOutput = {
    timestamp: new Date().toISOString(),
    collections: backupData,
    metadata: {
      totalCollections: Object.keys(backupData).length,
      totalDocuments: totalDocs,
      backupDate: timestamp
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(backupOutput, null, 2));
  
  console.log(`\nBackup complete!`);
  console.log(`Total collections: ${Object.keys(backupData).length}`);
  console.log(`Total documents: ${totalDocs}`);
  console.log(`Saved to: ${filePath}`);
}

backup().catch(error => {
  console.error('Backup failed:', error);
  process.exit(1);
});

