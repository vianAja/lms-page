const pool = require('./db');

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...');
    await client.query('BEGIN');

    console.log('Step 1/5: Adding is_active column to users table (if not exists)...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);

    console.log('Step 2/5: Creating classes table (if not exists)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Step 3/5: Creating labs table (if not exists)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS labs (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        lab_key VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        order_num INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Step 4/5: Creating class_enrollments table (if not exists)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS class_enrollments (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL REFERENCES users(username),
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(username, class_id)
      )
    `);

    console.log('Step 5/6: Creating csrf_tokens table (if not exists)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS csrf_tokens (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        token VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(username)
      )
    `);

    console.log('Step 6/6: Adding updated_at column to lab_access table (if not exists)...');
    await client.query(`
      ALTER TABLE lab_access
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed. Rolled back changes.', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then(async () => {
      console.log('Closing database pool...');
      await pool.end();
      console.log('Pool closed. Exiting.');
      process.exit(0);
    })
    .catch(async () => {
      console.log('Closing database pool after failure...');
      await pool.end();
      console.log('Pool closed. Exiting with error.');
      process.exit(1);
    });
}

module.exports = { migrate };
