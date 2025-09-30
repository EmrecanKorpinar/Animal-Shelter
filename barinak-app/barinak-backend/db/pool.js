const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/barinak';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 3000, // 3s içinde bağlanamıyorsa hızlıca hata
  idleTimeoutMillis: 10000,      // idle client timeout
});

// Her yeni bağlantıda sorgu zaman aşımı 5s olsun
pool.on('connect', (client) => {
  client.query('SET statement_timeout TO 5000').catch(() => {});
});

module.exports = pool;
