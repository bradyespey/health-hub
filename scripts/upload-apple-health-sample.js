/**
 * Script to upload sample Apple Health data from Health Auto Export
 * Run: node scripts/upload-apple-health-sample.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your Firebase Cloud Function endpoint
const FIREBASE_FUNCTION_URL = 'https://us-central1-healthhub-d43d3.cloudfunctions.net/ingestAppleHealth';

// Path to sample data
const SAMPLE_DATA_PATH = path.join(__dirname, '../docs/HealthAutoExport_20251004040521/HealthAutoExport-2025-09-04-2025-10-04.json');

async function uploadHealthData() {
  try {
    console.log('Reading sample data...');
    const rawData = fs.readFileSync(SAMPLE_DATA_PATH, 'utf8');
    const healthData = JSON.parse(rawData);
    
    console.log(`Found ${healthData.data.metrics.length} metrics`);
    console.log(`Found ${healthData.data.workouts ? healthData.data.workouts.length : 0} workouts`);
    
    // Calculate total data points
    let totalDataPoints = 0;
    for (const metric of healthData.data.metrics) {
      if (metric.data && Array.isArray(metric.data)) {
        totalDataPoints += metric.data.length;
      }
    }
    console.log(`Total data points: ${totalDataPoints}`);
    
    // Batch metrics into smaller chunks (10 metrics at a time)
    const METRICS_PER_BATCH = 10;
    const metricBatches = [];
    for (let i = 0; i < healthData.data.metrics.length; i += METRICS_PER_BATCH) {
      metricBatches.push(healthData.data.metrics.slice(i, i + METRICS_PER_BATCH));
    }
    
    console.log(`\nUploading in ${metricBatches.length} batches...`);
    
    for (let i = 0; i < metricBatches.length; i++) {
      const batchData = {
        data: {
          metrics: metricBatches[i]
        }
      };
      
      console.log(`\nBatch ${i + 1}/${metricBatches.length} - ${metricBatches[i].length} metrics`);
      
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData)
      });
    
      const responseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error(`❌ Batch ${i + 1} failed - Status: ${response.status}`);
        console.error('Response:', responseText.substring(0, 200));
        continue;
      }
      
      if (response.ok) {
        console.log(`✅ Batch ${i + 1} success - ${result.message}`);
      } else {
        console.error(`❌ Batch ${i + 1} error:`, result.error);
        if (result.hint) console.error('Hint:', result.hint);
      }
      
      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ All batches completed!');
    
  } catch (error) {
    console.error('❌ Failed to upload:', error.message);
    if (error.cause) console.error('Cause:', error.cause);
  }
}

// Run the upload
uploadHealthData();

