import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { withCsrf } from '@/lib/withCsrf';

type SessionData = {
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
    return { ok: true as const };
  } catch {
    return { ok: false as const, response: jsonMessage('Forbidden', 403) };
  }
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const result = await db.query(
      `
        SELECT id, class_id, lab_key, title, content, order_num, created_at, updated_at
        FROM labs
        ORDER BY class_id ASC, order_num ASC, id ASC
      `
    );

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching labs:', error);
    return jsonMessage('Internal server error', 500);
  }
}

export const POST = withCsrf(async (request: Request) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as {
      class_id?: number;
      lab_key?: string;
      title?: string;
      content?: string;
      order_num?: number;
    };

    const classId = Number(body.class_id);
    const labKey = body.lab_key?.trim();
    const title = body.title?.trim();
    const content = typeof body.content === 'string' ? body.content : '';
    const orderNum = body.order_num === undefined ? 0 : Number(body.order_num);

    if (!Number.isInteger(classId) || !labKey || !title || !content || !Number.isFinite(orderNum)) {
      return jsonMessage('Invalid request body', 400);
    }

    const duplicate = await db.query('SELECT 1 FROM labs WHERE lab_key = $1 LIMIT 1', [labKey]);
    if (duplicate.rowCount && duplicate.rowCount > 0) {
      return jsonMessage('Lab key already exists', 409);
    }

    const result = await db.query(
      `
        INSERT INTO labs (class_id, lab_key, title, content, order_num)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, class_id, lab_key, title, content, order_num, created_at, updated_at
      `,
      [classId, labKey, title, content, orderNum]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505') {
      return jsonMessage('Lab key already exists', 409);
    }

    console.error('Error creating lab:', error);
    return jsonMessage('Internal server error', 500);
  }
});
