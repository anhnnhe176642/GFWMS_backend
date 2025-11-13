#!/usr/bin/env node
/**
 * Import existing YOLO dataset into API
 * Reads import_data.json and uploads all images with labels
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const IMPORT_DATA_FILE = path.join(__dirname, 'import_data.json');

/**
 * Create dataset via API
 */
async function createDataset(name, description) {
  console.log(`📦 Creating dataset: ${name}`);
  
  const response = await fetch(`${API_URL}/yolo/datasets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description,
      status: 'ACTIVE'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create dataset: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data.id;
}

/**
 * Upload image with labels
 */
async function uploadImage(datasetId, imageData, split = 'train') {
  const { image_path, labels } = imageData;
  
  try {
    // Read image file
    const imageBuffer = await fs.readFile(image_path);
    const fileName = path.basename(image_path);
    
    // Determine MIME type from file extension
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    
    // Create FormData
    const formData = new FormData();
    
    // Create a Blob with proper MIME type
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append('image', blob, fileName);
    formData.append('labels', JSON.stringify(labels));
    formData.append('split', split);

    // Upload
    const response = await fetch(`${API_URL}/yolo/datasets/${datasetId}/images`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let error = response.statusText;
      if (contentType?.includes('application/json')) {
        const json = await response.json();
        error = json.message || json.error || error;
      } else {
        error = await response.text();
      }
      throw new Error(error);
    }

    const result = await response.json();
    return result.data;
    
  } catch (error) {
    console.error(`❌ Error uploading ${image_path}:`, error.message);
    return null;
  }
}

/**
 * Main import function
 */
async function importDataset() {
  console.log('=' .repeat(60));
  console.log('YOLO Dataset Import via API');
  console.log('=' .repeat(60));
  console.log(`API URL: ${API_URL}\n`);

  // Read import data
  let importData;
  try {
    const content = await fs.readFile(IMPORT_DATA_FILE, 'utf-8');
    importData = JSON.parse(content);
  } catch {
    console.error(`❌ Cannot read import data: ${IMPORT_DATA_FILE}`);
    console.error('Run: python import_dataset.py first');
    process.exit(1);
  }

  const { dataset_name, dataset_description, images, classes, total } = importData;
  
  console.log(`📊 Import Info:`);
  console.log(`   Dataset: ${dataset_name}`);
  console.log(`   Total images: ${total}`);
  console.log(`   Classes: ${classes.join(', ')}\n`);

  // Create dataset or use existing
  let datasetId;
  const DATASET_ID = process.env.DATASET_ID; // Use env var if provided
  
  if (DATASET_ID) {
    datasetId = parseInt(DATASET_ID);
    console.log(`✓ Using existing dataset ID: ${datasetId}\n`);
  } else {
    try {
      datasetId = await createDataset(dataset_name, dataset_description);
      console.log(`✓ Dataset created with ID: ${datasetId}\n`);
    } catch (error) {
      console.error(`❌ Failed to create dataset:`, error.message);
      console.error(`\nYou can use existing dataset with: DATASET_ID=<id> node import_api.js`);
      process.exit(1);
    }
  }

  // Upload images
  console.log('📤 Uploading images...\n');
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < images.length; i++) {
    const imageData = images[i];
    const progress = `[${i + 1}/${total}]`;
    
    process.stdout.write(`${progress} Uploading ${path.basename(imageData.image_path)}...`);
    
    const result = await uploadImage(datasetId, imageData, 'train');
    
    if (result) {
      console.log(' ✓');
      successCount++;
    } else {
      console.log(' ✗');
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary:');
  console.log(`   ✓ Success: ${successCount}/${total}`);
  console.log(`   ✗ Failed: ${failCount}/${total}`);
  console.log(`   Dataset ID: ${datasetId}`);
  console.log('='.repeat(60));

  if (failCount === 0) {
    console.log('\n✓ All images imported successfully!');
    console.log(`\nNext: Start training at POST /api/v1/yolo/datasets/${datasetId}/train`);
  } else {
    console.log(`\n⚠️  ${failCount} images failed to import`);
  }
}

// Run import
importDataset().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

