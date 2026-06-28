const pool = require('./db');

async function seedV2() {
  const client = await pool.connect();
  try {
    console.log('Seeding labs and access...');

    // 1. Insert new labs into the labs table
    await client.query(`
      INSERT INTO labs (topic_key, topic_name, lab_key, title, description, content, order_num, icon)
      VALUES 
      ('docker', 'Docker Containerization', 'docker-3', 'Docker Compose & Multi-Container App', 'Learn to orchestrate multi-container application stacks using Docker Compose and named volumes.', '', 3, 'widgets'),
      ('linux', 'Linux Administration', 'linux-3', 'Bash Scripting & Automation', 'Master Bash scripting fundamentals including loops, conditionals, variables, and automated tasks.', '', 3, 'terminal')
      ON CONFLICT (lab_key) DO UPDATE SET
        topic_key = EXCLUDED.topic_key,
        topic_name = EXCLUDED.topic_name,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        order_num = EXCLUDED.order_num,
        icon = EXCLUDED.icon;
    `);
    console.log('Labs successfully updated/seeded.');

    // 2. Grant lab access to students 'vian' and 'najwan' for all labs
    const students = ['vian', 'najwan'];
    const labsResult = await client.query('SELECT lab_key FROM labs');
    const labKeys = labsResult.rows.map(r => r.lab_key);

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

    // 3. Create active lab sessions for ALL users for all labs (so WebTerminal works)
    const { encrypt } = require('./crypto');
    const encryptedPass = encrypt('admin123');

    // Get all usernames from the users table
    const usersResult = await client.query('SELECT username FROM users');
    const allUsers = usersResult.rows.map(r => r.username);

    for (const appUser of allUsers) {
      for (const key of labKeys) {
        await client.query(`
          INSERT INTO lab_sessions (lab_id, app_user, ssh_host, ssh_user, ssh_pass, ssh_port)
          VALUES ($1, $2, 'host.docker.internal', 'lmsuser', $3, 22)
          ON CONFLICT (lab_id, app_user) DO UPDATE SET
            ssh_host = EXCLUDED.ssh_host,
            ssh_user = EXCLUDED.ssh_user,
            ssh_pass = EXCLUDED.ssh_pass,
            ssh_port = EXCLUDED.ssh_port;
        `, [key, appUser, encryptedPass]);
      }
    }
    console.log(`Lab SSH proxy sessions initialized for users: ${allUsers.join(', ')}`);

  } catch (err) {
    console.error('Error during V2 seeding:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seedV2();
