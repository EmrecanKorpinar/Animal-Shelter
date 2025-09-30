const pool = require('../db/pool');

async function getAll() {
  const res = await pool.query('SELECT * FROM animals ORDER BY id');
  return res.rows;
}

async function getById(id) {
  const res = await pool.query('SELECT * FROM animals WHERE id = $1', [id]);
  return res.rows[0];
}

async function create(animal) {
  const { name, species, age, imageurl, adopted } = animal;
  const res = await pool.query(
    'INSERT INTO animals (name, species, age, imageurl, adopted) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, species, age, imageurl || null, adopted || false]
  );
  return res.rows[0];
}

async function update(id, animal) {
  const { name, species, age, imageurl, adopted } = animal;
  const res = await pool.query(
    `UPDATE animals SET name = $1, species = $2, age = $3, imageurl = $4, adopted = $5 WHERE id = $6 RETURNING *`,
    [name, species, age, imageurl || null, adopted || false, id]
  );
  return res.rows[0];
}

async function markAdopted(id, adopted, adopted_by) {
  try {
    // Önce mevcut durumu kontrol et
    const current = await getById(id);
    if (!current) {
      throw new Error('Animal not found');
    }

    // Eğer zaten hedeflenen durumda ise, işlem yapma
    if (current.adopted === adopted && current.adopted_by === adopted_by) {
      return current;
    }

    // adopted_by null ise, sadece adopted kolonunu güncelle
    if (adopted_by === null || adopted_by === undefined) {
      const res = await pool.query(
        'UPDATE animals SET adopted = $1 WHERE id = $2 RETURNING *',
        [adopted, id]
      );
      return res.rows[0];
    }

    // Hem adopted hem de adopted_by kolonlarını güncelle
    const res = await pool.query(
      'UPDATE animals SET adopted = $1, adopted_by = $2 WHERE id = $3 RETURNING *',
      [adopted, adopted_by, id]
    );
    return res.rows[0];
  } catch (err) {
    // Hata durumunda logla ve tekrar fırlat
    console.error('Error in markAdopted:', err);
    throw err;
  }
}

async function getAdoptedWithUser() {
  // Only return records where we know the adopter (avoid logical inconsistency in UI)
  const res = await pool.query(
    `SELECT a.id,
            a.name,
            a.species,
            a.age,
            a.imageurl,
            TRUE AS adopted,
            ar.user_id AS adopted_by,
            u.username AS adopter_username
     FROM adoption_requests ar
     JOIN animals a ON a.id = ar.animal_id
     JOIN users u ON u.id = ar.user_id
     WHERE ar.status = 'approved'
     ORDER BY ar.processed_at DESC NULLS LAST, a.id DESC`
  );
  return res.rows;
}

async function remove(id) {
  const res = await pool.query('DELETE FROM animals WHERE id = $1 RETURNING *', [id]);
  return res.rows[0];
}

module.exports = { getAll, getById, create, update, remove, markAdopted, getAdoptedWithUser };
