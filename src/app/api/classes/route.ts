import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { withCsrf } from '@/lib/withCsrf';

type SessionData = {
  username?: string;
  role?: string;
};

type ClassLabRow = {
  class_id: number;
  class_name: string;
  class_description: string | null;
  lab_id: number | null;
  lab_key: string | null;
  lab_title: string | null;
  order_num: number | null;
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

function buildClassesPayload(rows: ClassLabRow[]) {
  const classMap = new Map<
    number,
    {
      id: number;
      name: string;
      description: string | null;
      labs: Array<{
        id: number;
        lab_key: string;
        title: string;
        order_num: number;
      }>;
    }
  >();

  for (const row of rows) {
    if (!classMap.has(row.class_id)) {
      classMap.set(row.class_id, {
        id: row.class_id,
        name: row.class_name,
        description: row.class_description,
        labs: [],
      });
    }

    if (row.lab_id !== null && row.lab_key && row.lab_title && row.order_num !== null) {
      classMap.get(row.class_id)!.labs.push({
        id: row.lab_id,
        lab_key: row.lab_key,
        title: row.lab_title,
        order_num: row.order_num,
      });
    }
  }

  return Array.from(classMap.values());
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const result = await db.query<ClassLabRow>(`
      SELECT
        c.id AS class_id,
        c.name AS class_name,
        c.description AS class_description,
        l.id AS lab_id,
        l.lab_key,
        l.title AS lab_title,
        l.order_num
      FROM classes c
      LEFT JOIN labs l ON l.class_id = c.id
      ORDER BY c.id ASC, l.order_num ASC, l.id ASC
    `);

    return new Response(JSON.stringify(buildClassesPayload(result.rows)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return jsonMessage('Internal server error', 500);
  }
}

export const POST = withCsrf(async (request: Request) => {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json() as { name?: string; description?: string };
    const name = body.name?.trim();
    const description = typeof body.description === 'string' ? body.description : null;

    if (!name) {
      return jsonMessage('Name is required', 400);
    }

    const result = await db.query(
      `
        INSERT INTO classes (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
      `,
      [name, description]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return jsonMessage('Internal server error', 500);
  }
});
