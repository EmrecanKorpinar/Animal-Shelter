const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Lokal sabit gizli anahtar (dev ortamı için)
const JWT_SECRET = 'devsecret';

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    // Best-effort: update session last_seen for this user (if a session exists)
    try {
      pool.query(
        'UPDATE user_sessions SET last_seen = NOW() WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())',
        [payload.id]
      ).catch(() => {});
    } catch (_) {}
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin required' });
  next();
}

module.exports = { authenticate, requireAdmin };
