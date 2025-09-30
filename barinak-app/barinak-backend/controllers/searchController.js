/* eslint-env node */
const pool = require('../db/pool');
const { redisClient } = require('../config');
const { invalidateCache } = require('../utils/pubsub');

// Helper to build cache key
function buildCacheKey({ q = '', species = '', adopted = '', page = 1, limit = 20 }) {
  const safeQ = String(q || '').trim().toLowerCase();
  return `animals:search:q:${encodeURIComponent(safeQ)}:species:${encodeURIComponent(species)}:adopted:${encodeURIComponent(adopted)}:page:${page}:limit:${limit}`;
}

async function searchAnimals(req, res) {
  try {
    const { q = '', species = '', adopted = '', page = 1, limit = 20 } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (p - 1) * l;

    const cacheKey = buildCacheKey({ q, species, adopted, page: p, limit: l });

    // Check cache
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (e) {
      // ignore cache errors
      console.error('Redis get error', e.message || e);
    }

    // Build SQL and params
    const params = [];
    let whereClauses = [];

    if (q && q.trim().length > 0) {
      // simple ILIKE match on name, species, description
      params.push(`%${q.trim()}%`);
      params.push(`%${q.trim()}%`);
      params.push(`%${q.trim()}%`);
      whereClauses.push(`(name ILIKE $${params.length - 2} OR species ILIKE $${params.length - 1} OR description ILIKE $${params.length})`);
    }

    if (species && species.trim().length > 0) {
      params.push(species.trim());
      whereClauses.push(`species = $${params.length}`);
    }

    if (adopted !== '' && adopted !== undefined) {
      const a = adopted === 'true' || adopted === '1' ? true : false;
      params.push(a);
      whereClauses.push(`adopted = $${params.length}`);
    }

    // Count total
    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as count FROM animals ${whereSQL}`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    // Add pagination params
    params.push(l);
    params.push(offset);

    const dataQuery = `SELECT * FROM animals ${whereSQL} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const dataRes = await pool.query(dataQuery, params);

    const result = {
      success: true,
      total,
      page: p,
      limit: l,
      items: dataRes.rows
    };

    // Cache result for short time
    try {
      await redisClient.setex(cacheKey, 60, JSON.stringify(result));
    } catch (e) {
      console.error('Redis setex error', e.message || e);
    }

    return res.json(result);
  } catch (err) {
    console.error('Search error', err);
    return res.status(500).json({ error: err.message || 'search_error' });
  }
}

module.exports = { searchAnimals, buildCacheKey };

