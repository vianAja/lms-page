import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { withCsrf } from '@/lib/withCsrf';

type SessionData = {
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
    return { ok: true as const };
  } catch {
    return { ok: false as const, response: jsonMessage('Forbidden', 403) };
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const labId = Number(id);

  if (!Number.isInteger(labId)) {
    return jsonMessage('Invalid lab id', 400);
  }

  try {
    const result = await db.query(
      `
        SELECT id, class_id, lab_key, title, content, order_num, created_at, updated_at
        FROM labs
        WHERE id = $1
      `,
      [labId]
    );

    if (result.rowCount === 0) {
      return jsonMessage('Lab not found', 404);
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching lab:', error);
    return jsonMessage('Internal server error', 500);
  }
}

export const PATCH = withCsrf(async (request: Request, context?: unknown) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await (context as RouteContext).params;
  const labId = Number(id);

  if (!Number.isInteger(labId)) {
    return jsonMessage('Invalid lab id', 400);
  }

  try {
    const body = await request.json() as {
      title?: string;
      content?: string;
      order_num?: number;
    };

    const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title');
    const hasContent = Object.prototype.hasOwnProperty.call(body, 'content');
    const hasOrderNum = Object.prototype.hasOwnProperty.call(body, 'order_num');

    if (!hasTitle && !hasContent && !hasOrderNum) {
      return jsonMessage('No fields to update', 400);
    }

    const updates: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (hasTitle) {
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title) {
        return jsonMessage('Title is required', 400);
      }
      updates.push(`title = $${idx}`);
      values.push(title);
      idx += 1;
    }

    if (hasContent) {
      const content = typeof body.content === 'string' ? body.content : '';
      if (!content) {
        return jsonMessage('Content is required', 400);
      }
      updates.push(`content = $${idx}`);
      values.push(content);
      idx += 1;
    }

    if (hasOrderNum) {
      const orderNum = Number(body.order_num);
      if (!Number.isFinite(orderNum)) {
        return jsonMessage('Invalid order_num', 400);
      }
      updates.push(`order_num = $${idx}`);
      values.push(orderNum);
      idx += 1;
    }

    updates.push('updated_at = NOW()');
    values.push(labId);

    const query = `
      UPDATE labs
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING id, class_id, lab_key, title, content, order_num, created_at, updated_at
    `;

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return jsonMessage('Lab not found', 404);
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating lab:', error);
    return jsonMessage('Internal server error', 500);
  }
});

export const DELETE = withCsrf(async (_request: Request, context?: unknown) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await (context as RouteContext).params;
  const labId = Number(id);

  if (!Number.isInteger(labId)) {
    return jsonMessage('Invalid lab id', 400);
  }

  try {
    const result = await db.query('DELETE FROM labs WHERE id = $1', [labId]);

    if (result.rowCount === 0) {
      return jsonMessage('Lab not found', 404);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting lab:', error);
    return jsonMessage('Internal server error', 500);
  }
});
