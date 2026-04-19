const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'lms_admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lms',
  password: process.env.DB_PASSWORD || 'Lms#123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to PostgreSQL');
  release();
});

// For CommonJS compatibility (server.js, seed.js)
module.exports = pool;
// For ESM compatibility (Next.js API routes)
module.exports.db = pool;
