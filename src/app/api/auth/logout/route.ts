import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { withCsrf } from '@/lib/withCsrf';

export function GET() {
  return new Response(JSON.stringify({ message: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST = withCsrf(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  let username: string | null = null;

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value) as { username?: unknown };
      if (typeof parsed.username === 'string' && parsed.username.trim().length > 0) {
        username = parsed.username;
      }
    } catch {
      username = null;
    }
  }

  if (username) {
    await db.query('DELETE FROM csrf_tokens WHERE username = $1', [username]);
  }

  cookieStore.delete('user_session');
  cookieStore.delete('csrf_token');

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
