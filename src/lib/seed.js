const pool = require('./db');
const bcrypt = require('bcrypt');

async function checkAndCreateTable() {
  const client = await pool.connect();
  const saltRounds = 10;
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS fullname VARCHAR(255);

      CREATE TABLE IF NOT EXISTS lab_sessions (
        id SERIAL PRIMARY KEY,
        lab_id VARCHAR(255) NOT NULL,
        app_user VARCHAR(255) NOT NULL,
        ssh_host VARCHAR(255) NOT NULL,
        ssh_user VARCHAR(255) NOT NULL,
        ssh_pass VARCHAR(255) NOT NULL,
        ssh_port INTEGER DEFAULT 22,
        UNIQUE(lab_id, app_user)
      );

      CREATE TABLE IF NOT EXISTS lab_access (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        lab_id VARCHAR(255) NOT NULL,
        has_access BOOLEAN DEFAULT true,
        UNIQUE(username, lab_id)
      );
    `);

    // Define users and passwords
    const users = [
      { username: 'lms_admin', fullname: 'LMS Administrator', password: 'Lms#123', role: 'admin' },
      { username: 'super_admin', fullname: 'Super Admin', password: 'password123', role: 'admin' },
      { username: 'vian', fullname: 'Vian Student', password: '123', role: 'student' },
      { username: 'najwan', fullname: 'Najwan Student', password: '123', role: 'student' }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      await client.query(`
        INSERT INTO users (username, password, role, fullname) VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO UPDATE SET 
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          fullname = EXCLUDED.fullname;
      `, [user.username, hashedPassword, user.role, user.fullname]);

      // Give default lab access
      await client.query(`
        INSERT INTO lab_access (username, lab_id, has_access) VALUES ($1, '1-1', true)
        ON CONFLICT (username, lab_id) DO NOTHING;
      `, [user.username]);
    }

    // Map app user 'vian' to system user 'vian-lms'
    // Update SSH password to 'Najwan@Oct408'
    await client.query(`
      INSERT INTO lab_sessions (lab_id, app_user, ssh_host, ssh_user, ssh_pass, ssh_port) VALUES 
      ('1-1', 'vian', 'localhost', 'vian-lms', 'Najwan@Oct408', 22)
      ON CONFLICT (lab_id, app_user) DO UPDATE SET 
        ssh_host = EXCLUDED.ssh_host,
        ssh_user = EXCLUDED.ssh_user, 
        ssh_pass = EXCLUDED.ssh_pass,
        ssh_port = EXCLUDED.ssh_port;
    `);

    console.log('Database seeded successfully with fullname and lab access.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    pool.end();
  }
}

checkAndCreateTable();
