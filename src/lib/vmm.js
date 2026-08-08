const { Client } = require('ssh2');
const fs = require('fs');

const TOPIC_INDICES = {
  'linux': 0,
  'docker': 1
};

function runHostCommand(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';
    
    // Check if key exists
    if (!fs.existsSync('/app/id_rsa')) {
      return reject(new Error('SSH private key /app/id_rsa not found in container'));
    }
    
    const privateKey = fs.readFileSync('/app/id_rsa');
    
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
        }).on('data', (data) => {
          stdout += data.toString();
        }).stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host: '127.0.0.1',
      port: 22,
      username: 'vian',
      privateKey: privateKey
    });
  });
}

/**
 * Ensure the microVM for the given topic is running.
 * Starts it if stopped.
 */
async function ensureVmRunning(topicKey) {
  const normalizedTopic = String(topicKey || '').trim().toLowerCase();
  
  // Default to linux if unrecognized
  const topic = TOPIC_INDICES.hasOwnProperty(normalizedTopic) ? normalizedTopic : 'linux';
  const index = TOPIC_INDICES[topic];
  
  console.log(`[VMM] Checking status for VM: ${topic} (index ${index})`);
  
  try {
    const statusRes = await runHostCommand(`sudo /home/vian/firecracker/manage_vm.sh status ${topic}`);
    if (statusRes.stdout === 'running') {
      console.log(`[VMM] VM for ${topic} is already running.`);
      return {
        topic,
        guestIp: `172.16.${index * 4}.2`,
        status: 'running'
      };
    }
    
    console.log(`[VMM] VM for ${topic} is stopped. Starting it...`);
    const startRes = await runHostCommand(`sudo /home/vian/firecracker/manage_vm.sh start ${topic} ${index}`);
    console.log(`[VMM] Start command output:`, startRes.stdout);
    
    return {
      topic,
      guestIp: `172.16.${index * 4}.2`,
      status: 'started'
    };
  } catch (error) {
    console.error(`[VMM] Error in ensureVmRunning for topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Get all running microVMs from host.
 */
async function getRunningVms() {
  try {
    const res = await runHostCommand(`sudo /home/vian/firecracker/manage_vm.sh list`);
    // Parse output:
    // Topic           PID      Socket          Guest IP       
    // linux           34964    fc-linux.socket 172.16.0.2     
    const lines = res.stdout.split('\n');
    const vms = [];
    
    // Skip header lines
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        vms.push({
          topic: parts[0],
          pid: parts[1],
          socket: parts[2],
          guestIp: parts[3]
        });
      }
    }
    
    return vms;
  } catch (error) {
    console.error('[VMM] Error listing running VMs:', error);
    return [];
  }
}

/**
 * Stop a microVM.
 */
async function stopVm(topicKey) {
  const normalizedTopic = String(topicKey || '').trim().toLowerCase();
  const topic = TOPIC_INDICES.hasOwnProperty(normalizedTopic) ? normalizedTopic : 'linux';
  const index = TOPIC_INDICES[topic];
  
  console.log(`[VMM] Stopping VM for topic: ${topic}`);
  try {
    const res = await runHostCommand(`sudo /home/vian/firecracker/manage_vm.sh stop ${topic} ${index}`);
    return { success: true, output: res.stdout };
  } catch (error) {
    console.error(`[VMM] Error stopping VM for topic ${topic}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  ensureVmRunning,
  getRunningVms,
  stopVm
};
