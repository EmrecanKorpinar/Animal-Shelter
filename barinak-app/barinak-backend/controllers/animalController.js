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

async function create(req, res) {
  try {
    // Eğer bir dosya yüklendiyse, MinIO'ya yükle ve imageurl ayarla
    if (req.file && req.file.buffer) {
      try {
        const url = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
        req.body.imageurl = url;
      } catch (e) {
        console.error('S3 upload failed:', e.message || e);
        // Hata olsa bile devam et; frontend default gösterir
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

    // Eğer yeni bir dosya yüklendiyse, MinIO'ya yükle ve imageurl ayarla
    if (req.file && req.file.buffer) {
      try {
        const url = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
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

module.exports = { list, listAdoptedWithUser, getById, create, update, remove };
