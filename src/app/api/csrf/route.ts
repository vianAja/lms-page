import { cookies } from 'next/headers';
import { generateCsrfToken, storeCsrfToken } from '@/lib/csrf';

type SessionPayload = {
  username?: string;
};

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  const token = generateCsrfToken();
  let username = '__guest__';

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value) as SessionPayload;
      if (typeof parsed?.username === 'string' && parsed.username.trim().length > 0) {
        username = parsed.username;
      }
    } catch {
      username = '__guest__';
    }
  }

  await storeCsrfToken(username, token);

  return new Response(JSON.stringify({ csrf_token: token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
