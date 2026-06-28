/**
 * lab-allowlist.js
 * ==================
 * Defines the exact shell commands that are ALLOWED to be run in each lab.
 * The allowlist is strictly enforced client-side to prevent arbitrary command execution.
 */

const UNIVERSAL_COMMANDS = ['clear', 'exit', 'ls', 'pwd', 'cd'];

const LAB_ALLOWLIST = {
  "docker-1": {
    "exactCommands": [
      "docker --version",
      "docker info | grep \"Server Version\"",
      "docker pull nginx:latest",
      "docker images | grep nginx",
      "docker run -d  --name my-nginx  -p 8080:80  nginx:latest",
      "docker ps",
      "curl -s http://localhost:8080",
      "curl -I http://localhost:8080",
      "curl -o /dev/null -s -w \"HTTP Status: %{http_code}\\n\" http://localhost:8080",
      "docker logs my-nginx",
      "docker inspect my-nginx | grep -A5 '\"Ports\"'",
      "docker exec -it my-nginx /bin/bash",
      "cat /etc/nginx/nginx.conf",
      "ls /usr/share/nginx/html/",
      "exit",
      "docker stop my-nginx",
      "docker start my-nginx",
      "docker restart my-nginx",
      "docker rm my-nginx",
      "docker rmi nginx:latest",
      "docker run -d --name nginx-1 -p 8081:80 nginx:latest",
      "docker run -d --name nginx-2 -p 8082:80 nginx:latest",
      "curl -s -o /dev/null -w \"nginx-1 status: %{http_code}\\n\" http://localhost:8081",
      "curl -s -o /dev/null -w \"nginx-2 status: %{http_code}\\n\" http://localhost:8082",
      "docker stop nginx-1 nginx-2",
      "docker rm nginx-1 nginx-2",
      "ls",
      "clear",
      "pwd",
      "cd",
      "docker ps -a"
    ]
  },
  "docker-2": {
    "exactCommands": [
      "docker run -d  --name multi-port  -p 8080:80  -p 8443:443  nginx:latest",
      "docker port multi-port",
      "curl -s -o /dev/null -w \"Status: %{http_code}\\n\" http://localhost:8080",
      "docker run -d --name local-only -p 127.0.0.1:9090:80 nginx:latest",
      "docker volume create my-data",
      "docker volume ls",
      "docker volume inspect my-data",
      "docker run -d  --name app-with-data  -v my-data:/usr/share/nginx/html  -p 8080:80  nginx:latest",
      "docker exec app-with-data bash -c \"echo '<h1>Hello from Volume!</h1>' > /usr/share/nginx/html/index.html\"",
      "curl http://localhost:8080",
      "docker restart app-with-data",
      "mkdir -p ~/docker-webroot",
      "echo \"<h1>Served from Host!</h1>\" > ~/docker-webroot/index.html",
      "docker run -d  --name bind-nginx  -v ~/docker-webroot:/usr/share/nginx/html:ro  -p 8081:80  nginx:latest",
      "curl http://localhost:8081",
      "echo \"<h1>Updated from Host!</h1>\" > ~/docker-webroot/index.html",
      "docker run -d  --name writer  -v shared-vol:/data  alpine  sh -c \"while true; do date >> /data/log.txt; sleep 2; done\"",
      "docker run --rm  -v shared-vol:/data:ro  alpine  cat /data/log.txt",
      "docker stop multi-port local-only app-with-data bind-nginx writer",
      "docker rm multi-port local-only app-with-data bind-nginx writer",
      "docker volume rm my-data shared-vol",
      "docker system prune -f",
      "docker volume prune -f",
      "docker volume create webdata",
      "docker run -d --name mysite -v webdata:/usr/share/nginx/html -p 8080:80 nginx:latest",
      "docker exec mysite bash -c \"echo '<h1>My Persistent Site</h1>' > /usr/share/nginx/html/index.html\"",
      "docker stop mysite && docker rm mysite",
      "docker run -d --name mysite2 -v webdata:/usr/share/nginx/html -p 8080:80 nginx:latest",
      "ls",
      "clear",
      "exit",
      "pwd",
      "cd",
      "docker ps",
      "docker ps -a"
    ]
  },
  "docker-3": {
    "exactCommands": [
      "mkdir -p ~/compose-app",
      "cd ~/compose-app",
      "mkdir -p html",
      "echo \"<h1>Hello from Docker Compose!</h1>\" > html/index.html",
      "docker-compose up -d",
      "docker-compose ps",
      "curl http://localhost:8080",
      "docker-compose exec web ping -c 3 db",
      "docker-compose down",
      "docker-compose down -v",
      "ls",
      "clear",
      "exit",
      "pwd",
      "cd",
      "docker ps",
      "docker ps -a",
      "EOF",
      "version: '3.8'",
      "services:",
      "  web:",
      "    image: nginx:latest",
      "    ports:",
      "      - \"8080:80\"",
      "    volumes:",
      "      - ./html:/usr/share/nginx/html",
      "    networks:",
      "      - app-network",
      "    depends_on:",
      "      - db",
      "  db:",
      "    image: postgres:15-alpine",
      "    environment:",
      "      POSTGRES_USER: lmsuser",
      "      POSTGRES_PASSWORD: secretpassword",
      "      POSTGRES_DB: compose_db",
      "    volumes:",
      "      - db-data:/var/lib/postgresql/data",
      "    networks:",
      "      - app-network",
      "volumes:",
      "  db-data:",
      "networks:",
      "  app-network:",
      "    driver: bridge"
    ]
  },
  "linux-1": {
    "exactCommands": [
      "mkdir my-project",
      "mkdir -p my-project/src/components",
      "ls -la my-project/",
      "touch my-project/README.md",
      "touch my-project/src/index.js",
      "ls -l my-project/",
      "ls -l my-project/src/",
      "echo \"# My Project\" > my-project/README.md",
      "echo \"console.log('Hello, Linux!');\" > my-project/src/index.js",
      "echo \"\" >> my-project/README.md",
      "echo \"Proyek latihan dasar Linux.\" >> my-project/README.md",
      "echo \"Dibuat pada: $(date)\" >> my-project/README.md",
      "cat > my-project/notes.txt << 'EOF'",
      "Catatan Penting:",
      "- Gunakan mkdir untuk membuat folder",
      "- Gunakan touch untuk membuat file kosong",
      "- Gunakan echo > untuk menulis ke file",
      "- Gunakan cat untuk membaca file",
      "EOF",
      "cat my-project/README.md",
      "less my-project/notes.txt",
      "head -5 my-project/README.md   # 5 baris pertama",
      "tail -5 my-project/README.md   # 5 baris terakhir",
      "mkdir -p ~/devops-lab/{config,logs,scripts}",
      "touch ~/devops-lab/config/app.env",
      "echo \"APP_ENV=development\" > ~/devops-lab/config/app.env",
      "echo \"PORT=8080\" >> ~/devops-lab/config/app.env",
      "echo \"LOG_LEVEL=debug\" >> ~/devops-lab/config/app.env",
      "echo \"[$(date)] Server started\" > ~/devops-lab/logs/app.log",
      "cat ~/devops-lab/config/app.env",
      "cat ~/devops-lab/logs/app.log",
      "find ~/devops-lab -type f",
      "ls",
      "clear",
      "exit",
      "pwd",
      "cd",
      "docker ps",
      "docker ps -a",
      "EOF",
      "Catatan Penting:",
      "- Gunakan mkdir untuk membuat folder",
      "- Gunakan touch untuk membuat file kosong",
      "- Gunakan echo > untuk menulis ke file",
      "- Gunakan cat untuk membaca file"
    ]
  },
  "linux-2": {
    "exactCommands": [
      "ls -la ~/",
      "stat my-project/README.md",
      "chmod u+x script.sh",
      "chmod o-w config.txt",
      "chmod g=rx logs/",
      "chmod 644 config.txt",
      "chmod 755 deploy.sh",
      "chmod 700 secret.sh",
      "chmod 600 ~/.ssh/id_rsa",
      "touch test-permission.sh",
      "echo \"#!/bin/bash\" > test-permission.sh",
      "echo \"echo 'Hello World'\" >> test-permission.sh",
      "ls -l test-permission.sh",
      "chmod +x test-permission.sh",
      "./test-permission.sh",
      "chown [owner][:group] file",
      "sudo chown www-data file.txt",
      "sudo chown www-data:www-data /var/www/html/",
      "sudo chown :developers project/",
      "sudo chown -R labuser:labuser ~/my-project/",
      "sudo chgrp developers /var/www/html/",
      "chmod u+s program",
      "chmod 4755 program",
      "chmod g+s shared-dir/",
      "chmod 2755 shared-dir/",
      "chmod +t /tmp/shared/",
      "chmod 1777 /tmp/shared/",
      "ls -ld /tmp",
      "mkdir -p ~/webserver/{public,private,logs}",
      "echo \"<?php phpinfo(); ?>\" > ~/webserver/public/index.php",
      "echo \"DB_PASSWORD=secret123\" > ~/webserver/private/.env",
      "touch ~/webserver/logs/access.log",
      "chmod 755 ~/webserver/public/          # direktori publik",
      "chmod 644 ~/webserver/public/index.php # file publik (bisa dibaca semua)",
      "chmod 700 ~/webserver/private/         # direktori privat (hanya owner)",
      "chmod 600 ~/webserver/private/.env     # file sensitif (hanya owner baca/tulis)",
      "chmod 755 ~/webserver/logs/            # direktori log",
      "chmod 644 ~/webserver/logs/access.log  # log bisa dibaca",
      "ls -la ~/webserver/",
      "ls -la ~/webserver/public/",
      "ls -la ~/webserver/private/",
      "ls",
      "clear",
      "exit",
      "pwd",
      "cd",
      "docker ps",
      "docker ps -a"
    ]
  },
  "linux-3": {
    "exactCommands": [
      "mkdir -p ~/scripts",
      "cd ~/scripts",
      "touch backup.sh",
      "cat > backup.sh << 'EOF'",
      "SOURCE_DIR=\"$HOME/devops-lab\"",
      "BACKUP_DIR=\"$HOME/backup\"",
      "BACKUP_FILE=\"backup_$(date +%Y%m%d_%H%M%S).tar.gz\"",
      "echo \"=== Memulai Proses Backup ===\"",
      "if [ -d \"$SOURCE_DIR\" ]; then",
      "mkdir -p \"$BACKUP_DIR\"",
      "tar -czf \"$BACKUP_DIR/$BACKUP_FILE\" -C \"$SOURCE_DIR\" .",
      "echo \"Backup berhasil disimpan di: $BACKUP_DIR/$BACKUP_FILE\"",
      "else",
      "echo \"Error: Direktori sumber $SOURCE_DIR tidak ditemukan.\"",
      "exit 1",
      "fi",
      "echo \"=== Backup Selesai ===\"",
      "EOF",
      "chmod +x backup.sh",
      "mkdir -p ~/devops-lab",
      "echo \"Data penting 1\" > ~/devops-lab/file1.txt",
      "echo \"Data penting 2\" > ~/devops-lab/file2.txt",
      "./backup.sh",
      "ls -l ~/backup",
      "cat > monitor.sh << 'EOF'",
      "echo \"=== System Monitoring ===\"",
      "for i in {1..3}",
      "do",
      "echo \"Pengecekan ke-$i pada: $(date)\"",
      "echo \"Free Memory:\"",
      "free -h | grep \"Mem:\"",
      "echo \"------------------------\"",
      "sleep 2",
      "done",
      "chmod +x monitor.sh",
      "./monitor.sh",
      "ls",
      "clear",
      "exit",
      "pwd",
      "cd",
      "docker ps",
      "docker ps -a",
      "EOF",
      "#!/bin/bash",
      "# Konfigurasi",
      "SOURCE_DIR=\"$HOME/devops-lab\"",
      "BACKUP_DIR=\"$HOME/backup\"",
      "BACKUP_FILE=\"backup_$(date +%Y%m%d_%H%M%S).tar.gz\"",
      "echo \"=== Memulai Proses Backup ===\"",
      "if [ -d \"$SOURCE_DIR\" ]; then",
      "mkdir -p \"$BACKUP_DIR\"",
      "tar -czf \"$BACKUP_DIR/$BACKUP_FILE\" -C \"$SOURCE_DIR\" .",
      "echo \"Backup berhasil disimpan di: $BACKUP_DIR/$BACKUP_FILE\"",
      "else",
      "echo \"Error: Direktori sumber $SOURCE_DIR tidak ditemukan.\"",
      "exit 1",
      "fi",
      "echo \"=== Backup Selesai ===\"",
      "echo \"=== System Monitoring ===\"",
      "for i in {1..3}",
      "do",
      "echo \"Pengecekan ke-$i pada: $(date)\"",
      "echo \"Free Memory:\"",
      "free -h | grep \"Mem:\"",
      "echo \"------------------------\"",
      "sleep 2",
      "done"
    ]
  }
};

/**
 * Check whether a given raw shell input is allowed for the current lab.
 * @param {string} labKey   - e.g. 'docker-1'
 * @param {string} rawInput - the full line typed by the user
 * @returns {{ allowed: boolean, reason: string }}
 */
function isCommandAllowed(labKey, rawInput) {
  const input = rawInput.trim();
  if (!input) return { allowed: true, reason: 'empty' };
  
  // Allow safe basic navigation
  const baseCmd = input.split(/\s+/)[0];
  if (UNIVERSAL_COMMANDS.includes(baseCmd) && !/[;&|$`<>]/.test(input)) {
    return { allowed: true, reason: 'universal-safe' };
  }

  const labRules = LAB_ALLOWLIST[labKey];
  if (!labRules) {
    return { allowed: false, reason: 'no rules defined for this lab' };
  }

  // Exact Match Validation
  // Try to match the exact command ignoring extra spaces
  const normalizedInput = input.replace(/\s+/g, ' ');
  for (const cmd of labRules.exactCommands) {
    if (cmd.replace(/\s+/g, ' ') === normalizedInput) {
      return { allowed: true, reason: 'exact-match' };
    }
    // Also allow prefix match for things like cd ... or if it's safe
  }
  
  // Exception for cd commands since paths can vary slightly
  if (input.startsWith('cd ') && !/[;&|$`<>]/.test(input)) {
      return { allowed: true, reason: 'safe-cd' };
  }

  return {
    allowed: false,
    reason: `Command '${input}' is not listed in the lab instructions. Strict exact match required.`,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { LAB_ALLOWLIST, UNIVERSAL_COMMANDS, isCommandAllowed };
}
if (typeof window !== 'undefined') {
  window.__LAB_ALLOWLIST__ = { LAB_ALLOWLIST, UNIVERSAL_COMMANDS, isCommandAllowed };
}
