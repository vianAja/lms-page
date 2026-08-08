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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json() as { topicKey?: string };
    const topicKey = body.topicKey?.trim();
    if (!topicKey) {
      return NextResponse.json({ error: 'topicKey is required' }, { status: 400 });
    }

    const TOPIC_INDICES: Record<string, number> = { linux: 0, docker: 1 };
    const index = TOPIC_INDICES[topicKey] ?? 0;
    const res = await runHostCmd(
      `sudo /home/vian/firecracker/manage_vm.sh stop ${topicKey} ${index}`
    );
    return NextResponse.json({ ok: true, output: res.stdout });
  } catch (err) {
    console.error('[API/vmm/stop] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
