import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { withCsrf } from '@/lib/withCsrf';

type SessionData = {
  id?: number;
  role?: string;
};

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
    const session = JSON.parse(sessionCookie.value) as SessionData;
    if (session.role !== 'admin') {
      return { ok: false as const, response: jsonMessage('Forbidden', 403) };
    }
    return { ok: true as const, session };
  } catch {
    return { ok: false as const, response: jsonMessage('Forbidden', 403) };
  }
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const result = await db.query(
      'SELECT id, username, fullname, role, is_active FROM users ORDER BY id ASC'
    );

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return jsonMessage('Internal server error', 500);
  }
}

export const POST = withCsrf(async (request: Request) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as {
      username?: string;
      fullname?: string;
      password?: string;
      role?: string;
    };

    const username = body.username?.trim();
    const fullname = body.fullname?.trim();
    const password = body.password || '';
    const role = body.role === 'admin' ? 'admin' : body.role === 'student' ? 'student' : null;

    if (!username || !fullname || !password || !role) {
      return jsonMessage('Invalid request body', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
        INSERT INTO users (username, fullname, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, fullname, role, is_active
      `,
      [username, fullname, hashedPassword, role]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505') {
      return jsonMessage('Username already taken', 409);
    }

    console.error('Error creating user:', error);
    return jsonMessage('Internal server error', 500);
  }
});
