const pool = require('../db/pool');

async function create({ user_id, animal_id, message }) {
  const res = await pool.query(
    'INSERT INTO adoption_requests (user_id, animal_id, message, status) VALUES ($1,$2,$3,$4) RETURNING *',
    [user_id, animal_id, message, 'pending']
  );
  return res.rows[0];
}

async function getAll() {
  const res = await pool.query(
    `SELECT ar.*, 
            u.username AS requester_username,
            a.name AS animal_name,
            a.species AS animal_species,
            a.imageurl AS animal_imageurl
     FROM adoption_requests ar
     LEFT JOIN users u ON u.id = ar.user_id
     LEFT JOIN animals a ON a.id = ar.animal_id
     ORDER BY ar.created_at DESC`
  );
  return res.rows;
}

async function getById(id) {
  const res = await pool.query('SELECT * FROM adoption_requests WHERE id = $1', [id]);
  return res.rows[0];
}

async function getByUser(user_id) {
  const res = await pool.query('SELECT * FROM adoption_requests WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
  return res.rows;
}

async function getByUserWithDetails(user_id) {
  const res = await pool.query(
    `SELECT ar.*, a.name AS animal_name, a.species AS animal_species, a.imageurl AS animal_imageurl
     FROM adoption_requests ar
     LEFT JOIN animals a ON a.id = ar.animal_id
     WHERE ar.user_id = $1
     ORDER BY ar.created_at DESC`,
    [user_id]
  );
  return res.rows;
}

async function updateStatus(id, status) {
  const res = await pool.query(
    'UPDATE adoption_requests SET status = $1, processed_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return res.rows[0];
}

async function removeIfOwnerPending(id, user_id) {
  // Only allow cancel if it belongs to user and still pending
  const res = await pool.query(
    "DELETE FROM adoption_requests WHERE id = $1 AND user_id = $2 AND status = 'pending' RETURNING *",
    [id, user_id]
  );
  return res.rows[0];
}

module.exports = { create, getAll, getById, getByUser, getByUserWithDetails, updateStatus, removeIfOwnerPending };
