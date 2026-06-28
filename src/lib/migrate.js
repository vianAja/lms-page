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
        topic_key VARCHAR(255),
        topic_name VARCHAR(255),
        lab_key VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT DEFAULT '',
        order_num INTEGER DEFAULT 0,
        icon VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Step 3b/5: Patching existing labs table with missing columns (if any)...');
    const labsPatch = [
      `ALTER TABLE labs ADD COLUMN IF NOT EXISTS topic_key VARCHAR(255)`,
      `ALTER TABLE labs ADD COLUMN IF NOT EXISTS topic_name VARCHAR(255)`,
      `ALTER TABLE labs ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE labs ADD COLUMN IF NOT EXISTS icon VARCHAR(100)`,
    ];
    for (const sql of labsPatch) {
      await client.query(sql);
    }

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

    console.log('Step 4b/5: Patching lab_access to use lab_key column (if not exists)...');
    // Run outside transaction block since CREATE CONSTRAINT requires careful handling
    await client.query('COMMIT');
    await client.query('BEGIN');

    await client.query(`ALTER TABLE lab_access ADD COLUMN IF NOT EXISTS lab_key VARCHAR(255)`);
    await client.query(`UPDATE lab_access SET lab_key = lab_id WHERE lab_key IS NULL`);

    // Add unique constraint on (username, lab_key) if not already exists
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'lab_access_username_lab_key_key'
        ) THEN
          ALTER TABLE lab_access ADD CONSTRAINT lab_access_username_lab_key_key UNIQUE (username, lab_key);
        END IF;
      END $$;
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
