module.exports = {
  apps: [
    {
      name: 'lms-page',
      script: './start-pm2.sh',
      env: {
        PORT: 3067,
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/vian/.pm2/logs/lms-page-error.log',
      out_file: '/home/vian/.pm2/logs/lms-page-out.log'
    }
  ]
};
