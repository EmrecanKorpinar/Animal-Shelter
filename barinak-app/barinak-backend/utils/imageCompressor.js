const lz4 = require('lz4');
const zstd = require('zstd-codec');
const sharp = require('sharp');

class ImageCompressor {
  constructor() {
    this.algorithms = {
      lz4: {
        compress: (buffer) => lz4.encode(buffer),
        decompress: (buffer) => lz4.decode(buffer),
        extension: '.lz4'
      },
      zstd: {
        compress: (buffer) => zstd.compress(buffer, 6), // Level 6 - good balance
        decompress: (buffer) => zstd.decompress(buffer),
        extension: '.zst'
      }
    };
  }

  // Fotoğrafı optimize et ve sıkıştır
  async optimizeAndCompress(imageBuffer, options = {}) {
    try {
      const {
        maxWidth = 1200,
        quality = 80,
        format = 'jpeg',
        algorithm = 'lz4'
      } = options;

      // Sharp ile fotoğrafı optimize et
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(maxWidth, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality })
        .toBuffer();

      // Meta veri al
      const metadata = await sharp(imageBuffer).metadata();
      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      // Sıkıştır
      const compressedBuffer = this.compress(optimizedBuffer, algorithm);

      return {
        compressedData: compressedBuffer,
        originalSize: imageBuffer.length,
        optimizedSize: optimizedBuffer.length,
        compressedSize: compressedBuffer.length,
        compressionRatio: ((imageBuffer.length - compressedBuffer.length) / imageBuffer.length * 100).toFixed(2),
        algorithm,
        format,
        metadata: {
          original: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size
          },
          optimized: {
            width: optimizedMetadata.width,
            height: optimizedMetadata.height,
            format: optimizedMetadata.format,
            size: optimizedMetadata.size
          }
        }
      };
    } catch (error) {
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  // Sadece sıkıştır (optimize etme)
  compress(buffer, algorithm = 'lz4') {
    if (!this.algorithms[algorithm]) {
      throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }

    try {
      return this.algorithms[algorithm].compress(buffer);
    } catch (error) {
      throw new Error(`Compression failed: ${error.message}`);
    }
  }

  // Sıkıştırılmış veriyi aç
  decompress(compressedBuffer, algorithm = 'lz4') {
    if (!this.algorithms[algorithm]) {
      throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }

    try {
      return this.algorithms[algorithm].decompress(compressedBuffer);
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`);
    }
  }

  // En iyi algoritma seç (boyut ve hıza göre)
  async findBestAlgorithm(buffer) {
    const results = {};
    
    for (const [name, algo] of Object.entries(this.algorithms)) {
      try {
        const start = Date.now();
        const compressed = algo.compress(buffer);
        const compressionTime = Date.now() - start;
        
        const decompressStart = Date.now();
        algo.decompress(compressed);
        const decompressionTime = Date.now() - decompressStart;

        results[name] = {
          originalSize: buffer.length,
          compressedSize: compressed.length,
          compressionRatio: ((buffer.length - compressed.length) / buffer.length * 100).toFixed(2),
          compressionTime,
          decompressionTime,
          totalTime: compressionTime + decompressionTime
        };
      } catch (error) {
        results[name] = { error: error.message };
      }
    }

    // En iyi algoritma seç (kompresyon oranı + hız)
    let bestAlgorithm = 'lz4';
    let bestScore = 0;

    for (const [name, result] of Object.entries(results)) {
      if (result.error) continue;
      
      // Score = compression ratio - (time penalty)
      const score = parseFloat(result.compressionRatio) - (result.totalTime * 0.01);
      
      if (score > bestScore) {
        bestScore = score;
        bestAlgorithm = name;
      }
    }

    return {
      bestAlgorithm,
      results
    };
  }

  // URL'den fotoğraf indir ve işle
  async downloadAndCompress(imageUrl, options = {}) {
    try {
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      return await this.optimizeAndCompress(imageBuffer, options);
    } catch (error) {
      throw new Error(`Download and compression failed: ${error.message}`);
    }
  }

  // Buffer'ı Base64 data URL'e çevir (frontend için)
  bufferToDataUrl(buffer, format = 'jpeg') {
    const base64 = buffer.toString('base64');
    return `data:image/${format};base64,${base64}`;
  }

  // Data URL'i buffer'a çevir
  dataUrlToBuffer(dataUrl) {
    const matches = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    return Buffer.from(matches[1], 'base64');
  }
}

module.exports = ImageCompressor;