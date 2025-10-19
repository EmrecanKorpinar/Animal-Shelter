const { imageOptimizeQueue } = require('../utils/importQueue');
const Animal = require('../models/animalModel');
const { invalidateCache } = require('../utils/pubsub');
const { uploadBuffer } = require('../utils/s3');

async function list(req, res) {
  try {
    const rows = await Animal.getAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listAdoptedWithUser(req, res) {
  try {
    const rows = await Animal.getAdoptedWithUser();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await Animal.getById(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin için ID ile arama
async function searchById(req, res) {
  try {
    console.log('Search request received. Params:', req.params);
    const id = Number(req.params.id);
    console.log('Parsed ID:', id);
    
    if (isNaN(id)) {
      console.log('Invalid ID format');
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const animal = await Animal.searchById(id);
    console.log('Database result:', animal);
    
    if (!animal) {
      console.log('Animal not found for ID:', id);
      return res.status(404).json({ error: 'Animal not found' });
    }
    
    res.json(animal);
  } catch (err) {
    console.error('Search by ID error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    // Eğer bir dosya yüklendiyse, önce optimize queue'ya ekle, sonra MinIO'ya yükle ve imageurl ayarla
    if (req.file && req.file.path) {
      try {
        await imageOptimizeQueue.add({ filePath: req.file.path });
      } catch (e) {
        console.error('Optimize queue eklenemedi:', e.message || e);
      }
      try {
        // Optimize işlemi tamamlandıktan sonra S3'e yükle
        const url = await uploadBuffer(
          require('fs').readFileSync(req.file.path),
          req.file.originalname,
          req.file.mimetype
        );
        req.body.imageurl = url;
      } catch (e) {
        console.error('S3 upload failed:', e.message || e);
      }
    }

    const created = await Animal.create(req.body);

    // Cache'i invalidate et
    await invalidateCache('animals:*');

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await Animal.getById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Eğer yeni bir dosya yüklendiyse, önce optimize queue'ya ekle, sonra MinIO'ya yükle ve imageurl ayarla
    if (req.file && req.file.path) {
      try {
        await imageOptimizeQueue.add({ filePath: req.file.path });
      } catch (e) {
        console.error('Optimize queue eklenemedi:', e.message || e);
      }
      try {
        const url = await uploadBuffer(
          require('fs').readFileSync(req.file.path),
          req.file.originalname,
          req.file.mimetype
        );
        req.body.imageurl = url;
      } catch (e) {
        console.error('S3 upload failed:', e.message || e);
      }
    }

    const updated = await Animal.update(id, req.body);

    // Cache'i invalidate et
    await invalidateCache(`animals:*`);
    await invalidateCache(`animal:${id}`);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await Animal.getById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const deleted = await Animal.remove(id);

    // Cache'i invalidate et
    await invalidateCache(`animals:*`);
    await invalidateCache(`animal:${id}`);

    res.json({ deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeAll(req, res) {
  try {
    // delete all rows and return count
    const deletedRows = await Animal.removeAll();

    // invalidate list/detail caches
    await invalidateCache('animals:*');
    await invalidateCache('animal:*');

    res.json({ deleted: deletedRows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { 
  list, 
  listAdoptedWithUser, 
  getById, 
  create, 
  update, 
  remove, 
  removeAll,
  searchById
};
