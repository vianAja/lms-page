import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { withCsrf } from '@/lib/withCsrf';

type SessionData = {
  id?: number;
  role?: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
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

export const PATCH = withCsrf(async (request: Request, context?: unknown) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await (context as RouteContext).params;
  const userId = Number(id);

  if (!Number.isInteger(userId)) {
    return jsonMessage('Invalid user id', 400);
  }

  try {
    const body = await request.json() as {
      fullname?: string;
      role?: string;
      is_active?: boolean;
      password?: string;
    };

    if (body.is_active === false && auth.session.id === userId) {
      return jsonMessage('Admins cannot deactivate themselves', 400);
    }

    const updates: string[] = [];
    const values: Array<string | boolean | number> = [];
    let idx = 1;

    if (Object.prototype.hasOwnProperty.call(body, 'fullname')) {
      const fullname = typeof body.fullname === 'string' ? body.fullname.trim() : '';
      if (!fullname) {
        return jsonMessage('Fullname is required', 400);
      }
      updates.push(`fullname = $${idx}`);
      values.push(fullname);
      idx += 1;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'role')) {
      const role = body.role === 'admin' ? 'admin' : body.role === 'student' ? 'student' : null;
      if (!role) {
        return jsonMessage('Invalid role', 400);
      }
      updates.push(`role = $${idx}`);
      values.push(role);
      idx += 1;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
      if (typeof body.is_active !== 'boolean') {
        return jsonMessage('Invalid is_active value', 400);
      }
      updates.push(`is_active = $${idx}`);
      values.push(body.is_active);
      idx += 1;
    }

    if (typeof body.password === 'string' && body.password.trim()) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      updates.push(`password = $${idx}`);
      values.push(hashedPassword);
      idx += 1;
    }

    if (updates.length === 0) {
      return jsonMessage('No fields to update', 400);
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING id, username, fullname, role, is_active
    `;

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return jsonMessage('User not found', 404);
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return jsonMessage('Internal server error', 500);
  }
});
