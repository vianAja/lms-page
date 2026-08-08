import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { Client } from 'ssh2';
import fs from 'fs';

function runHostCmd(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';
    const keyPath = '/app/id_rsa';
    if (!fs.existsSync(keyPath)) {
      return reject(new Error('SSH key not found at /app/id_rsa'));
    }
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return reject(err); }
        stream.on('close', () => { conn.end(); resolve({ stdout: stdout.trim(), stderr: stderr.trim() }); })
          .on('data', (d: Buffer) => { stdout += d.toString(); })
          .stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
      });
    }).on('error', reject).connect({
      host: '127.0.0.1', port: 22, username: 'vian',
      privateKey: fs.readFileSync(keyPath),
    });
  });
}

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const res = await runHostCmd('sudo /home/vian/firecracker/manage_vm.sh list');
    const lines = res.stdout.split('\n');
    const vms: { topic: string; pid: string; socket: string; guestIp: string }[] = [];
    for (let i = 2; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 4) {
        vms.push({ topic: parts[0], pid: parts[1], socket: parts[2], guestIp: parts[3] });
      }
    }
    return NextResponse.json({ vms });
  } catch (err) {
    console.error('[API/vmm/list] Error:', err);
    return NextResponse.json({ error: 'Failed to list VMs', vms: [] }, { status: 500 });
  }
}
