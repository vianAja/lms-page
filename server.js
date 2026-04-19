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
        const result = await db.query(
          'SELECT * FROM lab_sessions WHERE lab_id = $1 AND app_user = $2',
          [labId, appUser]
        );
        const lab = result.rows[0];

        if (!lab) {
        socket.emit('ssh-error', 'Lab session not found');
        return;
      }

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
          socket.emit('ssh-error', err.message);
        })
        .connect({
          host: lab.ssh_host,
          port: lab.ssh_port,
          username: lab.ssh_user,
          password: lab.ssh_pass,
        });
      } catch (error) {
        console.error('Error connecting to ssh or db:', error);
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
