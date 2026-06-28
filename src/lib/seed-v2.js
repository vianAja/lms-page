const pool = require('./db');

async function seedV2() {
  const client = await pool.connect();
  try {
    console.log('Seeding labs and access...');

    // SSH config - reads from env or falls back to defaults
    const sshHost = process.env.SSH_HOST || '127.0.0.1';
    const sshUser = process.env.SSH_USER || 'labuser';
    const sshPort = parseInt(process.env.SSH_PORT || '22', 10);

    // 1. Insert ALL labs with correct order_num
    await client.query(`
      INSERT INTO labs (topic_key, topic_name, lab_key, title, description, content, order_num, icon)
      VALUES
      ('docker', 'Docker Containerization', 'docker-1', 'Running Your First Container',        'Get started with Docker by pulling images and running your first container.',                                        '', 1, 'widgets'),
      ('docker', 'Docker Containerization', 'docker-2', 'Port Mapping & Data Persistence',     'Learn how to expose container ports and persist data using Docker volumes.',                                         '', 2, 'widgets'),
      ('docker', 'Docker Containerization', 'docker-3', 'Docker Compose & Multi-Container App','Learn to orchestrate multi-container application stacks using Docker Compose and named volumes.',                    '', 3, 'widgets'),
      ('linux',  'Linux Administration',    'linux-1',  'File System Navigation',              'Navigate the Linux file system with essential commands like ls, cd, mkdir, and find.',                              '', 1, 'terminal'),
      ('linux',  'Linux Administration',    'linux-2',  'File Permissions & Ownership',        'Master Linux file permissions, ownership, and chmod/chown commands for system security.',                            '', 2, 'terminal'),
      ('linux',  'Linux Administration',    'linux-3',  'Bash Scripting & Automation',         'Master Bash scripting fundamentals including loops, conditionals, variables, and automated tasks.',                 '', 3, 'terminal')
      ON CONFLICT (lab_key) DO UPDATE SET
        topic_key   = EXCLUDED.topic_key,
        topic_name  = EXCLUDED.topic_name,
        title       = EXCLUDED.title,
        description = EXCLUDED.description,
        order_num   = EXCLUDED.order_num,
        icon        = EXCLUDED.icon;
    `);
    console.log('All 6 labs successfully seeded.');

    // 2. Grant lab access to students for all labs
    const labsResult = await client.query('SELECT lab_key FROM labs ORDER BY topic_key, order_num');
    const labKeys = labsResult.rows.map(r => r.lab_key);

    const students = ['vian', 'najwan'];
    for (const student of students) {
      for (const key of labKeys) {
        await client.query(`
          INSERT INTO lab_access (username, lab_key, has_access)
          VALUES ($1, $2, true)
          ON CONFLICT (username, lab_key) DO UPDATE SET has_access = true;
        `, [student, key]);
      }
    }
    console.log('Lab access permissions successfully seeded.');

    // 3. Create SSH lab sessions for ALL users for all labs
    const { encrypt } = require('./crypto');
    const sshPass = process.env.SSH_PASS || 'admin123';
    const encryptedPass = encrypt(sshPass);

    const usersResult = await client.query('SELECT username FROM users');
    const allUsers = usersResult.rows.map(r => r.username);

    for (const appUser of allUsers) {
      for (const key of labKeys) {
        await client.query(`
          INSERT INTO lab_sessions (lab_id, app_user, ssh_host, ssh_user, ssh_pass, ssh_port)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (lab_id, app_user) DO UPDATE SET
            ssh_host = EXCLUDED.ssh_host,
            ssh_user = EXCLUDED.ssh_user,
            ssh_pass = EXCLUDED.ssh_pass,
            ssh_port = EXCLUDED.ssh_port;
        `, [key, appUser, sshHost, sshUser, encryptedPass, sshPort]);
      }
    }
    console.log(`Lab SSH proxy sessions initialized for users: ${allUsers.join(', ')}`);
    console.log(`SSH config: ${sshUser}@${sshHost}:${sshPort}`);

  } catch (err) {
    console.error('Error during V2 seeding:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seedV2();
