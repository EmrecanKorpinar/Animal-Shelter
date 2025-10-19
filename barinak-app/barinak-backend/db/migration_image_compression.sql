-- Image compression migration
-- Fotoğrafları sıkıştırılmış olarak tutmak için yeni column'lar ekliyoruz

-- Mevcut imageurl'i backup olarak saklayacağız
ALTER TABLE animals ADD COLUMN IF NOT EXISTS original_imageurl TEXT;

-- Sıkıştırılmış fotoğraf verisi için
ALTER TABLE animals ADD COLUMN IF NOT EXISTS compressed_image BYTEA;

-- Sıkıştırma algoritması bilgisi (lz4, zstd, etc.)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS compression_algorithm TEXT DEFAULT 'lz4';

-- Orijinal fotoğraf boyutu
ALTER TABLE animals ADD COLUMN IF NOT EXISTS original_size INTEGER;

-- Sıkıştırılmış boyut
ALTER TABLE animals ADD COLUMN IF NOT EXISTS compressed_size INTEGER;

-- Sıkıştırma oranı (yüzde)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS compression_ratio NUMERIC(5,2);

-- Fotoğraf formatı (jpeg, png, webp)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS image_format TEXT DEFAULT 'jpeg';

-- Fotoğraf meta verileri (genişlik, yükseklik, etc.)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS image_metadata JSONB;

-- İndeks ekleyelim
CREATE INDEX IF NOT EXISTS idx_animals_compression_algorithm ON animals(compression_algorithm);
CREATE INDEX IF NOT EXISTS idx_animals_compressed_size ON animals(compressed_size);

-- ID ile hızlı arama için (zaten PRIMARY KEY ama explicit index)
CREATE INDEX IF NOT EXISTS idx_animals_id_search ON animals(id);