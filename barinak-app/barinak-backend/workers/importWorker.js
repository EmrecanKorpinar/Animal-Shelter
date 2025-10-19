const { importJobQueue } = require('../utils/importQueue');
const Animal = require('../models/animalModel');
const { invalidateCache } = require('../utils/pubsub');
const { uploadBuffer } = require('../utils/s3');
const ImageCompressor = require('../utils/imageCompressor');
const path = require('path');
const fs = require('fs').promises;

const imageCompressor = new ImageCompressor();

// Database retry helper
async function withRetry(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

async function downloadImageBuffer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType: res.headers.get('content-type') || 'image/jpeg' };
  } catch (err) {
    console.warn('Image download failed for', url, err.message || err);
    return null;
  }
}

async function loadLocalTestImage() {
  try {
    // Path to a frontend raster image we ship in the repo
    const imgPath = path.resolve(__dirname, '..', '..', 'src', 'assets', 'logo.png');
    const buf = await fs.readFile(imgPath);
    return { buffer: buf, contentType: 'image/png' };
  } catch (err) {
    console.warn('Failed to load local test image:', err.message || err);
    return null;
  }
}

importJobQueue.process(async (job) => {
  console.log(`Processing import job ${job.id}:`, job.data);
  
  try {
    const animal = job.data;
    if (!animal.name || !animal.species) {
      throw new Error('Eksik veri: name/species');
    }

    // Image processing with retry
    if (animal.imageurl && typeof animal.imageurl === 'string' && animal.imageurl.startsWith('http')) {
      const downloaded = await withRetry(() => downloadImageBuffer(animal.imageurl));
      if (downloaded && downloaded.buffer) {
        try {
          const compressed = await withRetry(() => 
            imageCompressor.optimizeAndCompress(downloaded.buffer, {
              maxWidth: 1200,
              quality: 80,
              format: 'jpeg',
              algorithm: 'lz4'
            })
          );

          const urlPath = new URL(animal.imageurl).pathname;
          const ext = path.extname(urlPath) || '.jpg';
          const fakeName = `import-${Date.now()}${ext}`;

          // Decompress for S3 upload
          const optimizedBuffer = imageCompressor.decompress(compressed.compressedData, compressed.algorithm);
          const uploadedUrl = await withRetry(() => uploadBuffer(optimizedBuffer, fakeName, downloaded.contentType));
          animal.imageurl = uploadedUrl;
          
          // Store compressed data for DB
          animal.compressed_image = compressed.compressedData;
          animal.compression_algorithm = compressed.algorithm;
          animal.original_size = compressed.originalSize;
          animal.compressed_size = compressed.compressedSize;
          
          console.log(`Image processed and compressed for job ${job.id}, ratio: ${compressed.compressionRatio}%`);
        } catch (e) {
          console.warn(`Image process/upload failed for job ${job.id}:`, e.message || e);
          // Keep original imageurl as fallback
        }
      }
    } else {
      // Use local test image
      const local = await loadLocalTestImage();
      if (local && local.buffer) {
        try {
          const compressed = await withRetry(() =>
            imageCompressor.optimizeAndCompress(local.buffer, {
              maxWidth: 1200,
              quality: 80,
              format: 'png',
              algorithm: 'lz4'
            })
          );

          const fakeName = `import-test-${Date.now()}.png`;
          
          // Decompress for S3 upload
          const optimizedBuffer = imageCompressor.decompress(compressed.compressedData, compressed.algorithm);
          const uploadedUrl = await withRetry(() => uploadBuffer(optimizedBuffer, fakeName, local.contentType));
          animal.imageurl = uploadedUrl;
          
          // Store compressed data for DB
          animal.compressed_image = compressed.compressedData;
          animal.compression_algorithm = compressed.algorithm;
          animal.original_size = compressed.originalSize;
          animal.compressed_size = compressed.compressedSize;
          
          console.log(`Local test image compressed for job ${job.id}, ratio: ${compressed.compressionRatio}%`);
        } catch (e) {
          console.warn(`Local image process/upload failed for job ${job.id}:`, e.message || e);
        }
      }
    }

    // Create animal with retry and transaction safety
    const created = await withRetry(async () => {
      return await Animal.create(animal);
    });

    console.log(`Animal created successfully for job ${job.id}:`, created.name);

    // Cache invalidation with retry
    await withRetry(() => invalidateCache('animals:*'));

    return { success: true, animalId: created.id, animalName: created.name };

  } catch (error) {
    console.error(`Import job ${job.id} failed:`, error.message || error);
    throw error; // Let Bull handle the retry
  }
});

console.log('Import worker started with enhanced retry and persistence. Waiting for jobs...');
