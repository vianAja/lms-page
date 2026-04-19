import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await db.query('SELECT * FROM lab_sessions WHERE lab_id = $1', [id]);
  const lab = result.rows[0];

  if (!lab) {
    return new Response(JSON.stringify({ error: 'Lab not found' }), { status: 404 });
  }

  // Omit password for security in this simple example, though in real apps we'd handle this better
  const { ssh_pass, ...labData } = lab;

  return new Response(JSON.stringify(labData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
