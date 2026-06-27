import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { withCsrf } from '@/lib/withCsrf';

function jsonMessage(message: string, status: number) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function requireAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (!sessionCookie?.value) {
    return { ok: false as const, response: jsonMessage('Forbidden', 403) };
  }

  try {
    const session = JSON.parse(sessionCookie.value) as { role?: string };
    if (session.role !== 'admin') {
      return { ok: false as const, response: jsonMessage('Forbidden', 403) };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, response: jsonMessage('Forbidden', 403) };
  }
}

function buildLabIdCandidates(input: string): string[] {
  const value = input.trim();
  const set = new Set<string>([value]);
  const stripped = value.startsWith('lab') ? value.slice(3) : value;
  set.add(stripped);

  const match = stripped.match(/^(\d+)-(\d+)$/);
  if (match) {
    const classNumber = Number(match[1]);
    const orderNumber = Number(match[2]);
    set.add(`${classNumber}-${orderNumber}`);
    set.add(`${String(classNumber).padStart(2, '0')}-${orderNumber}`);
    set.add(`lab${classNumber}-${orderNumber}`);
    set.add(`lab${String(classNumber).padStart(2, '0')}-${orderNumber}`);
  }

  return Array.from(set);
}

export const POST = withCsrf(async (request: Request) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as { username?: string; labId?: string };
    const username = body.username?.trim();
    const labId = body.labId?.trim();

    if (!username || !labId) {
      return jsonMessage('Invalid payload', 400);
    }

    const labCandidates = buildLabIdCandidates(labId);

    await db.query(
      `
        UPDATE lab_access
        SET has_access = false, updated_at = NOW()
        WHERE username = $1 AND lab_id = ANY($2)
      `,
      [username, labCandidates]
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error disconnecting session:', error);
    return jsonMessage('Internal server error', 500);
  }
});
