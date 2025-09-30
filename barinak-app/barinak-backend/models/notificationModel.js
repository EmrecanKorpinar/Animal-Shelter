const pool = require('../db/pool');

async function create({ user_id, type, title, message, data = {} }) {
  const res = await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [user_id, type, title, message, JSON.stringify(data)]
  );
  return res.rows[0];
}

async function getByUser(user_id) {
  const res = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  return res.rows.map(row => ({
    ...row,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
  }));
}

async function getUnreadCount(user_id) {
  const res = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
    [user_id]
  );
  return parseInt(res.rows[0].count);
}

async function markAsRead(id, user_id) {
  const res = await pool.query(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, user_id]
  );
  return res.rows[0];
}

async function markAllAsRead(user_id) {
  const res = await pool.query(
    'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
    [user_id]
  );
  return res.rowCount;
}

async function remove(id, user_id) {
  const res = await pool.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, user_id]
  );
  return res.rows[0];
}

async function removeOldNotifications(daysOld = 30) {
  const res = await pool.query(
    'DELETE FROM notifications WHERE created_at < NOW() - INTERVAL \'$1 days\'',
    [daysOld]
  );
  return res.rowCount;
}

module.exports = {
  create,
  getByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  remove,
  removeOldNotifications
};
