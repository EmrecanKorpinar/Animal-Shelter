const { imageOptimizeQueue } = require('../utils/importQueue');
const ImageCompressor = require('../utils/imageCompressor');
const fs = require('fs');
const path = require('path');

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

imageOptimizeQueue.process(async (job) => {
  console.log(`Processing image optimize job ${job.id}:`, job.data);
  
  try {
    const { filePath } = job.data;
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const output = filePath.replace(ext, '-optimized' + ext);
    
    // Read original file
    const originalBuffer = fs.readFileSync(filePath);
    
    // Optimize and compress image with retry
    const compressed = await withRetry(async () => {
      return await imageCompressor.optimizeAndCompress(originalBuffer, {
        maxWidth: 1024,
        quality: 80,
        format: 'jpeg',
        algorithm: 'lz4'
      });
    });
    
    // Decompress for file output
    const optimizedBuffer = imageCompressor.decompress(compressed.compressedData, compressed.algorithm);
    
    // Replace original file with optimized version
    await withRetry(async () => {
      fs.writeFileSync(output, optimizedBuffer);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      fs.renameSync(output, filePath);
    });
    
    console.log(`Image optimized successfully for job ${job.id}, compression ratio: ${compressed.compressionRatio}%`);
    return { 
      success: true, 
      filePath,
      compressionRatio: compressed.compressionRatio,
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize
    };
    
  } catch (error) {
    console.error(`Image optimize job ${job.id} failed:`, error.message || error);
    throw error; // Let Bull handle the retry
  }
});

console.log('Image optimize worker started with enhanced retry. Waiting for jobs...');
