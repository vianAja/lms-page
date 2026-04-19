import { db } from '@/lib/db';
import { generateCsrfToken, storeCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const result = await db.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  const user = result.rows[0];

  if (user && await bcrypt.compare(password, user.password)) {
    const csrfToken = generateCsrfToken();
    await storeCsrfToken(user.username, csrfToken);

    const cookieStore = await cookies();
    cookieStore.set('user_session', JSON.stringify({ 
      id: user.id, 
      username: user.username, 
      fullname: user.fullname,
      role: user.role,
      csrf_token: csrfToken
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return new Response(JSON.stringify({ ok: true, csrf_token: csrfToken, role: user.role }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Invalid username or password' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
