const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/barinak';
const pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 });

async function run() {
  try {
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
