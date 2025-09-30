const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/barinak';
const pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 });

async function seed() {
  try {
    console.log('Seeding users and sample animals...');

    // Create admin and a normal user (idempotent)
    const adminPass = await bcrypt.hash('adminpass', 10);
    const userPass = await bcrypt.hash('userpass', 10);

    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
      ['admin', adminPass, 'admin']
    );

    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
      ['user1', userPass, 'user']
    );

    const animals = [
      { name: 'Boncuk', species: 'Kedi', age: 2, imageurl: '/images/cat1.jpg', adopted: false },
      { name: 'Karabas', species: 'Köpek', age: 4, imageurl: '/images/dog1.jpg', adopted: false },
      { name: 'Ponçik', species: 'Kedi', age: 1, imageurl: '/images/cat2.jpg', adopted: false }
    ];

    for (const a of animals) {
      await pool.query(
        'INSERT INTO animals (name, species, age, imageurl, adopted) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        [a.name, a.species, a.age, a.imageurl, a.adopted]
      );
    }

    // Create a sample adoption request by user1 for the first animal (if exists)
    const userRes = await pool.query('SELECT id FROM users WHERE username = $1', ['user1']);
    const animalRes = await pool.query('SELECT id FROM animals ORDER BY id LIMIT 1');

    if (userRes.rowCount && animalRes.rowCount) {
      await pool.query(
        'INSERT INTO adoption_requests (user_id, animal_id, message) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [userRes.rows[0].id, animalRes.rows[0].id, 'Çok seviyorum, sahiplenmek istiyorum']
      );
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
