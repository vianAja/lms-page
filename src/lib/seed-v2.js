const pool = require('./db');

// ─── SSH Credentials ────────────────────────────────────────────────────────
// Hardcoded here so they don't need to be in .env / Jenkins credentials.
// Change these values when the SSH server credentials change.
const SSH_HOST = '127.0.0.1';
const SSH_USER = 'labuser';
const SSH_PASS = 'admin123';
const SSH_PORT = 22;
// ────────────────────────────────────────────────────────────────────────────

async function seedV2() {
  const client = await pool.connect();
  try {
    console.log('[seed-v2] Starting seed...');

    // 1. Insert ALL labs with correct order_num
    console.log('[seed-v2] Step 1: Inserting/updating labs...');
    await client.query(`
      INSERT INTO labs (topic_key, topic_name, lab_key, title, description, content, order_num, icon)
      VALUES
      ('docker', 'Docker Containerization', 'docker-1', 'Running Your First Container',         'Get started with Docker by pulling images and running your first container.',                                    '', 1, 'widgets'),
      ('docker', 'Docker Containerization', 'docker-2', 'Port Mapping & Data Persistence',      'Learn how to expose container ports and persist data using Docker volumes.',                                     '', 2, 'widgets'),
      ('docker', 'Docker Containerization', 'docker-3', 'Docker Compose & Multi-Container App', 'Learn to orchestrate multi-container application stacks using Docker Compose and named volumes.',                '', 3, 'widgets'),
      ('linux',  'Linux Administration',    'linux-1',  'File System Navigation',               'Navigate the Linux file system with essential commands like ls, cd, mkdir, and find.',                          '', 1, 'terminal'),
      ('linux',  'Linux Administration',    'linux-2',  'File Permissions & Ownership',         'Master Linux file permissions, ownership, and chmod/chown commands for system security.',                        '', 2, 'terminal'),
      ('linux',  'Linux Administration',    'linux-3',  'Bash Scripting & Automation',          'Master Bash scripting fundamentals including loops, conditionals, variables, and automated tasks.',             '', 3, 'terminal')
      ON CONFLICT (lab_key) DO UPDATE SET
        topic_key   = EXCLUDED.topic_key,
        topic_name  = EXCLUDED.topic_name,
        title       = EXCLUDED.title,
        description = EXCLUDED.description,
        order_num   = EXCLUDED.order_num,
        icon        = EXCLUDED.icon;
    `);
    console.log('[seed-v2] All 6 labs seeded successfully.');

    // 2. Get all labs
    const labsResult = await client.query('SELECT lab_key FROM labs ORDER BY topic_key, order_num');
    const labKeys = labsResult.rows.map(r => r.lab_key);
    console.log(`[seed-v2] Found labs: ${labKeys.join(', ')}`);

    // 3. Grant lab access to student users
    console.log('[seed-v2] Step 2: Granting lab access to students...');
    const students = ['vian', 'najwan'];
    for (const student of students) {
      for (const key of labKeys) {
        try {
          await client.query(`
            INSERT INTO lab_access (username, lab_key, has_access)
            VALUES ($1, $2, true)
            ON CONFLICT (username, lab_key) DO UPDATE SET has_access = true;
          `, [student, key]);
        } catch (e) {
          console.warn(`[seed-v2] WARN: Could not grant access for ${student}/${key}: ${e.message}`);
        }
      }
    }
    console.log('[seed-v2] Lab access permissions seeded.');

    // 4. Create SSH lab sessions for ALL users
    console.log('[seed-v2] Step 3: Seeding lab_sessions for all users...');
    const { encrypt } = require('./crypto');
    const encryptedPass = encrypt(SSH_PASS);

    const usersResult = await client.query('SELECT username FROM users');
    const allUsers = usersResult.rows.map(r => r.username);
    console.log(`[seed-v2] Seeding sessions for users: ${allUsers.join(', ')}`);

    for (const appUser of allUsers) {
      for (const key of labKeys) {
        try {
          await client.query(`
            INSERT INTO lab_sessions (lab_id, app_user, ssh_host, ssh_user, ssh_pass, ssh_port)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (lab_id, app_user) DO UPDATE SET
              ssh_host = EXCLUDED.ssh_host,
              ssh_user = EXCLUDED.ssh_user,
              ssh_pass = EXCLUDED.ssh_pass,
              ssh_port = EXCLUDED.ssh_port;
          `, [key, appUser, SSH_HOST, SSH_USER, encryptedPass, SSH_PORT]);
        } catch (e) {
          console.error(`[seed-v2] ERROR inserting session for ${appUser}/${key}: ${e.message}`);
        }
      }
    }
    console.log(`[seed-v2] Done. SSH config: ${SSH_USER}@${SSH_HOST}:${SSH_PORT}`);

  } catch (err) {
    console.error('[seed-v2] Fatal error during V2 seeding:', err.message);
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

seedV2();
