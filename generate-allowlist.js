const fs = require('fs');
const path = require('path');

const pageDir = path.join(__dirname, 'page');
const outputFile = path.join(__dirname, 'src', 'lib', 'lab-allowlist.js');

const labs = ['docker-1', 'docker-2', 'docker-3', 'linux-1', 'linux-2', 'linux-3'];
const allowlist = {};

labs.forEach(lab => {
  const mdPath = path.join(pageDir, `${lab}.md`);
  if (!fs.existsSync(mdPath)) return;
  const content = fs.readFileSync(mdPath, 'utf8');
  
  const commands = [];
  const regex = /```bash\n([\s\S]*?)```/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    const lines = block.split('\n');
    let currentCmd = '';
    
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      
      // Handle multi-line commands with \
      if (line.endsWith('\\')) {
        currentCmd += line.slice(0, -1) + ' ';
      } else if (line.endsWith("<< 'EOF'")) {
        // Heredoc, let's just add the first line as prefix, but the user wants exact.
        // Actually, for heredocs, the user will paste line by line.
        // We need to allow the heredoc lines too. Let's just add all non-empty lines!
        commands.push(line);
      } else {
        currentCmd += line;
        commands.push(currentCmd.trim());
        currentCmd = '';
      }
    }
  }
  
  // Also add heredoc bodies and simple common commands just in case
  const extraCommands = [
    'ls', 'clear', 'exit', 'pwd', 'cd', 'docker ps', 'docker ps -a'
  ];
  
  // Deduplicate
  allowlist[lab] = {
    exactCommands: [...new Set([...commands, ...extraCommands])]
  };
});

// Also add a few exceptions like EOF for heredocs
allowlist['linux-1'].exactCommands.push('EOF', 'Catatan Penting:', '- Gunakan mkdir untuk membuat folder', '- Gunakan touch untuk membuat file kosong', '- Gunakan echo > untuk menulis ke file', '- Gunakan cat untuk membaca file');
allowlist['linux-3'].exactCommands.push('EOF', '#!/bin/bash', '# Konfigurasi', 'SOURCE_DIR="$HOME/devops-lab"', 'BACKUP_DIR="$HOME/backup"', 'BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).tar.gz"', 'echo "=== Memulai Proses Backup ==="', 'if [ -d "$SOURCE_DIR" ]; then', 'mkdir -p "$BACKUP_DIR"', 'tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$SOURCE_DIR" .', 'echo "Backup berhasil disimpan di: $BACKUP_DIR/$BACKUP_FILE"', 'else', 'echo "Error: Direktori sumber $SOURCE_DIR tidak ditemukan."', 'exit 1', 'fi', 'echo "=== Backup Selesai ==="', 'echo "=== System Monitoring ==="', 'for i in {1..3}', 'do', 'echo "Pengecekan ke-$i pada: $(date)"', 'echo "Free Memory:"', 'free -h | grep "Mem:"', 'echo "------------------------"', 'sleep 2', 'done');
allowlist['docker-3'].exactCommands.push('EOF', "version: '3.8'", "services:", "  web:", "    image: nginx:latest", "    ports:", '      - "8080:80"', "    volumes:", "      - ./html:/usr/share/nginx/html", "    networks:", "      - app-network", "    depends_on:", "      - db", "  db:", "    image: postgres:15-alpine", "    environment:", "      POSTGRES_USER: lmsuser", "      POSTGRES_PASSWORD: secretpassword", "      POSTGRES_DB: compose_db", "    volumes:", "      - db-data:/var/lib/postgresql/data", "    networks:", "      - app-network", "volumes:", "  db-data:", "networks:", "  app-network:", "    driver: bridge");

const fileContent = `/**
 * lab-allowlist.js
 * ==================
 * Defines the exact shell commands that are ALLOWED to be run in each lab.
 * The allowlist is strictly enforced client-side to prevent arbitrary command execution.
 */

const UNIVERSAL_COMMANDS = ['clear', 'exit', 'ls', 'pwd', 'cd'];

const LAB_ALLOWLIST = ${JSON.stringify(allowlist, null, 2)};

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
  const baseCmd = input.split(/\\s+/)[0];
  if (UNIVERSAL_COMMANDS.includes(baseCmd) && !/[;&|$\`<>]/.test(input)) {
    return { allowed: true, reason: 'universal-safe' };
  }

  const labRules = LAB_ALLOWLIST[labKey];
  if (!labRules) {
    return { allowed: false, reason: 'no rules defined for this lab' };
  }

  // Exact Match Validation
  // Try to match the exact command ignoring extra spaces
  const normalizedInput = input.replace(/\\s+/g, ' ');
  for (const cmd of labRules.exactCommands) {
    if (cmd.replace(/\\s+/g, ' ') === normalizedInput) {
      return { allowed: true, reason: 'exact-match' };
    }
    // Also allow prefix match for things like cd ... or if it's safe
  }
  
  // Exception for cd commands since paths can vary slightly
  if (input.startsWith('cd ') && !/[;&|$\`<>]/.test(input)) {
      return { allowed: true, reason: 'safe-cd' };
  }

  return {
    allowed: false,
    reason: \`Command '\${input}' is not listed in the lab instructions. Strict exact match required.\`,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { LAB_ALLOWLIST, UNIVERSAL_COMMANDS, isCommandAllowed };
}
if (typeof window !== 'undefined') {
  window.__LAB_ALLOWLIST__ = { LAB_ALLOWLIST, UNIVERSAL_COMMANDS, isCommandAllowed };
}
`;

fs.writeFileSync(outputFile, fileContent, 'utf8');
console.log('lab-allowlist.js generated successfully!');
