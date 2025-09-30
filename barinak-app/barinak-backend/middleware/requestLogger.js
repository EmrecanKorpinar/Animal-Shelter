const pool = require('../db/pool');

// Non-blocking request logger. Writes after response is finished.
module.exports = function requestLogger(req, res, next) {
  const start = Date.now();
  const ua = req.headers['user-agent'] || null;
  const method = req.method;
  const path = req.originalUrl || req.url;
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '').toString();

  // Capture user id if middleware/auth has populated it on authenticated routes
  const getUserId = () => {
    try {
      if (req.user && typeof req.user.id === 'number') return req.user.id;
      if (req.user && req.user.id) return Number(req.user.id) || null;
    } catch (_) {}
    return null;
  };

  res.on('finish', async () => {
    const duration = Date.now() - start; // optional: you could store it later
    const status = res.statusCode || 0;
    const userId = getUserId();

    try {
      await pool.query(
        `INSERT INTO request_logs (method, path, status_code, user_id, ip, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [method, path, status, userId, ip, ua]
      );
    } catch (err) {
      // Swallow logging errors silently to avoid side-effects in any environment
    }
  });

  next();
};
