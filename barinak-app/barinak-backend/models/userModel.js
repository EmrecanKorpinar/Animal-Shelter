const pool = require('../db/pool');

async function create(user) {
  const { username, password, role } = user;
  const res = await pool.query(
    'INSERT INTO users (username, password, role) VALUES ($1,$2,$3) RETURNING *',
    [username, password, role || 'user']
  );
  return res.rows[0];
}

async function getById(id) {
  const res = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

async function getByUsername(username) {
  const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return res.rows[0];
}

async function getAll() {
  const res = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
  return res.rows;
}

async function update(id, data) {
  const { username, password, role } = data;
  const res = await pool.query('UPDATE users SET username = $1, password = $2, role = $3 WHERE id = $4 RETURNING id, username, role, created_at', [username, password, role, id]);
  return res.rows[0];
}

async function remove(id) {
  const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return res.rows[0];
}

module.exports = { create, getById, getByUsername, getAll, update, remove };
