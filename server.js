const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { Client } = require('ssh2');
const db = require('./src/lib/db');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const buildLabIdCandidates = (rawLabId) => {
    const source = String(rawLabId || '').trim();
    const values = new Set();

    if (!source) return [];
    values.add(source);

    // Handle "lab01-1" / "lab1-1" -> "1-1"
    const prefixed = source.match(/^lab(\d+)-(\d+)$/i);
    if (prefixed) {
      const major = String(parseInt(prefixed[1], 10));
      const minor = String(parseInt(prefixed[2], 10));
      values.add(`${major}-${minor}`);
      values.add(`lab${major}-${minor}`);
    }

    // Handle "01-01" -> "1-1", and reverse to "lab1-1"
    const plain = source.match(/^(\d+)-(\d+)$/);
    if (plain) {
      const major = String(parseInt(plain[1], 10));
      const minor = String(parseInt(plain[2], 10));
      values.add(`${major}-${minor}`);
      values.add(`lab${major}-${minor}`);
    }

    return Array.from(values);
  };

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    let sshClient = null;

    socket.on('init-ssh', async ({ labId, appUser }) => {
      try {
        const candidates = buildLabIdCandidates(labId);
        const requestedUser = String(appUser || '').trim() || 'guest';
        console.log(`[SSH] init-ssh requested: labId=${labId} appUser=${requestedUser} candidates=${JSON.stringify(candidates)}`);

        let result = await db.query(
          'SELECT * FROM lab_sessions WHERE lab_id = ANY($1) AND app_user = $2 LIMIT 1',
          [candidates, requestedUser]
        );
        let lab = result.rows[0];

        if (!lab) {
          console.log(`[SSH] No exact session found for ${requestedUser}, falling back to any lab session for ${labId}`);
          result = await db.query(
            'SELECT * FROM lab_sessions WHERE lab_id = ANY($1) ORDER BY app_user ASC LIMIT 1',
            [candidates]
          );
          lab = result.rows[0];
        }

        if (!lab) {
          console.warn(`[SSH] No session found in DB for labId=${labId} appUser=${requestedUser}`);
          socket.emit('ssh-error', `Lab session not found for ${labId}`);
          return;
        }

        let dbLabResult = await db.query(
          'SELECT topic_key FROM labs WHERE lab_key = ANY($1) LIMIT 1',
          [candidates]
        );
        let topicKey = dbLabResult.rows[0]?.topic_key || 'linux';
        
        console.log(`[SSH] Resolved topicKey='${topicKey}' for labId='${labId}'`);
        
        // Ensure microVM is running
        const vmm = require('./src/lib/vmm');
        const vmInfo = await vmm.ensureVmRunning(topicKey);
        console.log(`[SSH] VM is ready at ${vmInfo.guestIp} (${vmInfo.status})`);

        // Override connection to point to the microVM
        const targetHost = vmInfo.guestIp;
        const targetUser = 'root';
        const targetPass = 'admin123';
        const targetPort = 22;

      sshClient = new Client();
      sshClient
        .on('ready', () => {
          socket.emit('ssh-ready');
          sshClient.shell((err, stream) => {
            if (err) {
              socket.emit('ssh-error', err.message);
              return;
            }

            socket.on('ssh-input', (data) => {
              stream.write(data);
            });

            stream.on('data', (data) => {
              socket.emit('ssh-output', data.toString());
            });

            stream.on('close', () => {
              sshClient.end();
            });
          });
        })
        .on('error', (err) => {
          console.error(`[SSH] Connection error for ${targetUser}@${targetHost}: ${err.message}`);
          socket.emit('ssh-error', err.message);
        })
        .connect({
          host: targetHost,
          port: targetPort,
          username: targetUser,
          password: targetPass,
        });
        console.log(`[SSH] Connecting to ${targetUser}@${targetHost}:${targetPort}...`);
      } catch (error) {
        console.error('[SSH] Unexpected error in init-ssh handler:', error);
        socket.emit('ssh-error', 'Internal server error');
      }
    });

    socket.on('disconnect', () => {
      if (sshClient) sshClient.end();
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3002;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
