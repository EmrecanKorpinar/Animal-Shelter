/* eslint-env node */

const pool = require('../db/pool');

const UserViews = {
  async addView(userId, animalId) {
    const query = `
      INSERT INTO user_views (user_id, animal_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, animal_id) DO UPDATE SET viewed_at = NOW()
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [userId, animalId]);
    return rows[0];
  },

  async getViewedAnimals(userId) {
    const query = `
      SELECT a.*
      FROM user_views uv
      JOIN animals a ON uv.animal_id = a.id
      WHERE uv.user_id = $1
      ORDER BY uv.viewed_at DESC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  },

  async getViewCount(userId) {
    const query = `SELECT COUNT(*) FROM user_views WHERE user_id = $1;`;
    const { rows } = await pool.query(query, [userId]);
    return parseInt(rows[0].count, 10);
  }
};

module.exports = UserViews;
