/**
 * lab-allowlist.js
 * ==================
 * Defines the exact shell commands that are ALLOWED to be run in each lab.
 * The allowlist is enforced client-side (instant UX feedback) via WebTerminal,
 * and also on the server-side via the Socket.IO "init-ssh" / "ssh-input" flow.
 *
 * Rules:
 *  - Each entry is the BASE command (first word before any spaces/flags).
 *  - Sub-commands (like `docker run`, `docker-compose up`) are listed separately
 *    under "subcommands" — the full prefix is checked.
 *  - The allowlist is intentionally STRICT. Add commands only if they appear
 *    in the corresponding lab's markdown (.md) file.
 *  - Universal shell utilities (cd, ls, pwd, echo, cat, etc.) are allowed on ALL labs.
 */

/** Commands permitted in every lab regardless of topic */
const UNIVERSAL_COMMANDS = [
  'ls',
  'pwd',
  'cd',
  'echo',
  'cat',
  'less',
  'head',
  'tail',
  'grep',
  'find',
  'mkdir',
  'touch',
  'rm',
  'rmdir',
  'mv',
  'cp',
  'stat',
  'exit',
  'clear',
  'help',
  'man',
  'history',
  'which',
  'whoami',
  'id',
  'date',
  'uname',
  'env',
  'export',
  'alias',
];

/**
 * Per-lab command allowlist.
 *
 * Structure per lab:
 * {
 *   commands: string[]      — base commands allowed (e.g. 'docker', 'curl')
 *   subcommands: string[]   — full prefixes that must match (e.g. 'docker run', 'docker-compose up')
 *   description: string     — human-readable summary of what this lab covers
 * }
 *
 * Matching logic:
 *   1. Extract the trimmed input line.
 *   2. Check if it starts with any UNIVERSAL_COMMANDS.
 *   3. Check if it starts with any allowed `subcommands` prefix (most specific first).
 *   4. Check if the base command (first word) is in `commands`.
 *   5. If none match → BLOCK.
 */
const LAB_ALLOWLIST = {
  /* ------------------------------------------------------------------ */
  /* DOCKER LABS                                                          */
  /* ------------------------------------------------------------------ */

  'docker-1': {
    description: 'Menjalankan Container nginx:latest',
    commands: [
      'docker',
      'curl',
    ],
    subcommands: [
      // Informational
      'docker --version',
      'docker info',
      'docker images',
      'docker ps',
      // Image management
      'docker pull nginx',
      'docker rmi nginx',
      // Container lifecycle
      'docker run',
      'docker stop',
      'docker start',
      'docker restart',
      'docker rm',
      // Inspection & exec
      'docker logs',
      'docker inspect',
      'docker exec',
      'docker port',
      // Curl variants
      'curl -s',
      'curl -I',
      'curl -o',
    ],
  },

  'docker-2': {
    description: 'Volumes & Port Mapping',
    commands: [
      'docker',
      'curl',
      'echo',
    ],
    subcommands: [
      // Port mapping
      'docker run',
      'docker port',
      'docker stop',
      'docker rm',
      'docker restart',
      'docker exec',
      'docker ps',
      'docker images',
      // Volume operations
      'docker volume create',
      'docker volume ls',
      'docker volume inspect',
      'docker volume rm',
      'docker volume prune',
      // System cleanup
      'docker system prune',
      // Curl
      'curl -s',
      'curl http',
    ],
    // Explicitly NOT allowed (illustrative — checked by absence from subcommands):
    // 'docker pull' — not in lab-2 content
    // 'docker rmi'  — not in lab-2 content
  },

  'docker-3': {
    description: 'Docker Compose & Multi-Container App',
    commands: [
      'docker-compose',
      'docker',
      'curl',
      'ping',
    ],
    subcommands: [
      // Compose operations
      'docker-compose up',
      'docker-compose down',
      'docker-compose ps',
      'docker-compose exec',
      'docker-compose build',
      'docker-compose logs',
      'docker-compose stop',
      // Docker basics needed for context
      'docker ps',
      'docker images',
      // Curl
      'curl http',
      // Ping (inter-container test)
      'ping',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* LINUX LABS                                                           */
  /* ------------------------------------------------------------------ */

  'linux-1': {
    description: 'Membuat Folder, File & Menulis File',
    commands: [
      'mkdir',
      'touch',
      'echo',
      'cat',
      'less',
      'head',
      'tail',
      'ls',
      'find',
      'tree',
    ],
    subcommands: [
      'mkdir -p',
      'ls -la',
      'ls -l',
      'find ~',
      'find .',
      'head -',
      'tail -',
      // Heredoc via cat
      'cat >',
    ],
  },

  'linux-2': {
    description: 'Permissions & Ownership (chmod / chown)',
    commands: [
      'chmod',
      'chown',
      'chgrp',
      'ls',
      'stat',
      'sudo',
      'touch',
      'echo',
      'mkdir',
    ],
    subcommands: [
      // chmod variants
      'chmod u+x',
      'chmod u+s',
      'chmod o-w',
      'chmod g=rx',
      'chmod g+s',
      'chmod +x',
      'chmod +t',
      'chmod -R',
      'chmod 644',
      'chmod 755',
      'chmod 700',
      'chmod 600',
      'chmod 4755',
      'chmod 2755',
      'chmod 1777',
      // chown
      'sudo chown',
      'chown',
      'sudo chgrp',
      'chgrp',
      // listing
      'ls -la',
      'ls -l',
      'ls -ld',
      // stat
      'stat ',
    ],
  },

  'linux-3': {
    description: 'Bash Scripting & Automation',
    commands: [
      'bash',
      'sh',
      'chmod',
      'touch',
      'mkdir',
      'cat',
      'echo',
      'ls',
      'tar',
      'free',
      'sleep',
      'date',
    ],
    subcommands: [
      // Script creation
      'touch backup.sh',
      'touch monitor.sh',
      'cat > backup.sh',
      'cat > monitor.sh',
      // Permissions
      'chmod +x',
      'chmod +x backup.sh',
      'chmod +x monitor.sh',
      // Execution
      './backup.sh',
      './monitor.sh',
      // Directory setup
      'mkdir -p ~/scripts',
      'mkdir -p ~/devops-lab',
      'mkdir -p ~/backup',
      // File ops
      'ls -l ~/backup',
      'ls -l ~/scripts',
      // Archive
      'tar -czf',
      // System monitoring
      'free -h',
      'sleep ',
    ],
  },
};

/**
 * Check whether a given raw shell input is allowed for the current lab.
 *
 * @param {string} labKey   - e.g. 'docker-1'
 * @param {string} rawInput - the full line typed by the user (may include flags)
 * @returns {{ allowed: boolean, reason: string }}
 */
function isCommandAllowed(labKey, rawInput) {
  const input = rawInput.trim();
  if (!input) return { allowed: true, reason: 'empty' };

  // Comments are fine
  if (input.startsWith('#')) return { allowed: true, reason: 'comment' };

  // Always allow navigational shortcuts: ctrl+c, clear, exit, cd, etc.
  const baseCmd = input.split(/\s+/)[0];

  if (UNIVERSAL_COMMANDS.includes(baseCmd)) {
    return { allowed: true, reason: 'universal' };
  }

  const labRules = LAB_ALLOWLIST[labKey];
  if (!labRules) {
    // No rules defined for this lab — permissive fallback
    return { allowed: true, reason: 'no-rules' };
  }

  // Check subcommands first (more specific, longest prefix match wins)
  const sortedSubs = [...labRules.subcommands].sort((a, b) => b.length - a.length);
  for (const sub of sortedSubs) {
    if (input.startsWith(sub)) {
      return { allowed: true, reason: `subcommand:${sub}` };
    }
  }

  // Check base command
  if (labRules.commands.includes(baseCmd)) {
    return { allowed: true, reason: `command:${baseCmd}` };
  }

  return {
    allowed: false,
    reason: `'${baseCmd}' is not available in lab '${labKey}'`,
  };
}

// Node.js export (used by server.js)
if (typeof module !== 'undefined') {
  module.exports = { LAB_ALLOWLIST, UNIVERSAL_COMMANDS, isCommandAllowed };
}

// ES module / browser export
if (typeof window !== 'undefined') {
  window.__LAB_ALLOWLIST__ = { LAB_ALLOWLIST, UNIVERSAL_COMMANDS, isCommandAllowed };
}
