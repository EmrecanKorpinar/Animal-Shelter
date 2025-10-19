-- Add compression columns to animals table
ALTER TABLE animals 
ADD COLUMN IF NOT EXISTS compressed_image BYTEA,
ADD COLUMN IF NOT EXISTS original_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS compressed_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS compression_ratio REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS compression_algorithm TEXT DEFAULT 'lz4',
ADD COLUMN IF NOT EXISTS image_format TEXT DEFAULT 'jpeg',
ADD COLUMN IF NOT EXISTS image_metadata JSONB DEFAULT '{}';

-- Create index for better performance on compression queries
CREATE INDEX IF NOT EXISTS idx_animals_compression_ratio ON animals(compression_ratio);
CREATE INDEX IF NOT EXISTS idx_animals_compressed_size ON animals(compressed_size);
CREATE INDEX IF NOT EXISTS idx_animals_image_format ON animals(image_format);