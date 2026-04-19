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
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    return jsonMessage('Invalid class id', 400);
  }

  try {
    const classResult = await db.query(
      'SELECT id, name, description, created_at, updated_at FROM classes WHERE id = $1',
      [classId]
    );

    if (classResult.rowCount === 0) {
      return jsonMessage('Class not found', 404);
    }

    const labsResult = await db.query(
      `
        SELECT id, class_id, lab_key, title, content, order_num, created_at, updated_at
        FROM labs
        WHERE class_id = $1
        ORDER BY order_num ASC, id ASC
      `,
      [classId]
    );

    return new Response(JSON.stringify({ ...classResult.rows[0], labs: labsResult.rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    return jsonMessage('Internal server error', 500);
  }
}

export const PATCH = withCsrf(async (request: Request, context?: unknown) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await (context as RouteContext).params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    return jsonMessage('Invalid class id', 400);
  }

  try {
    const body = await request.json() as { name?: string; description?: string | null };
    const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
    const hasDescription = Object.prototype.hasOwnProperty.call(body, 'description');

    if (!hasName && !hasDescription) {
      return jsonMessage('No fields to update', 400);
    }

    const updates: string[] = [];
    const values: Array<string | null | number> = [];
    let idx = 1;

    if (hasName) {
      const trimmedName = typeof body.name === 'string' ? body.name.trim() : '';
      if (!trimmedName) {
        return jsonMessage('Name is required', 400);
      }
      updates.push(`name = $${idx}`);
      values.push(trimmedName);
      idx += 1;
    }

    if (hasDescription) {
      const descriptionValue = typeof body.description === 'string' ? body.description : null;
      updates.push(`description = $${idx}`);
      values.push(descriptionValue);
      idx += 1;
    }

    updates.push('updated_at = NOW()');
    values.push(classId);

    const query = `
      UPDATE classes
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, description, created_at, updated_at
    `;

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return jsonMessage('Class not found', 404);
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return jsonMessage('Internal server error', 500);
  }
});

export const DELETE = withCsrf(async (_request: Request, context?: unknown) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await (context as RouteContext).params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    return jsonMessage('Invalid class id', 400);
  }

  try {
    const result = await db.query('DELETE FROM classes WHERE id = $1', [classId]);

    if (result.rowCount === 0) {
      return jsonMessage('Class not found', 404);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting class:', error);
    return jsonMessage('Internal server error', 500);
  }
});
