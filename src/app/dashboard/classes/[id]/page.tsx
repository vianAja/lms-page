import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import LabRowActions from './LabRowActions';

type SessionData = {
  role?: string;
  csrf_token?: string;
};

type ClassRow = {
  id: number;
  name: string;
  description: string | null;
};

type LabRow = {
  id: number;
  order_num: number;
  lab_key: string;
  title: string;
  updated_at: string;
};

export default async function ClassLabsPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (!sessionCookie?.value) {
    redirect('/login');
  }

  let session: SessionData;

  try {
    session = JSON.parse(sessionCookie.value) as SessionData;
  } catch {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    redirect('/');
  }

  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId)) {
    redirect('/dashboard/classes');
  }

  const [classResult, labsResult] = await Promise.all([
    db.query<ClassRow>('SELECT id, name, description FROM classes WHERE id = $1 LIMIT 1', [classId]),
    db.query<LabRow>(
      'SELECT id, order_num, lab_key, title, updated_at FROM labs WHERE class_id = $1 ORDER BY order_num ASC, id ASC',
      [classId]
    ),
  ]);

  if (classResult.rowCount === 0) {
    redirect('/dashboard/classes');
  }

  const classItem = classResult.rows[0];
  const labs = labsResult.rows;

  return (
    <div className="w-full space-y-6">
      <meta name="csrf-token" content={session.csrf_token || ''} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">{classItem.name}</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Manage labs for this class.</p>
        </div>
        <Link
          href={`/dashboard/classes/${classId}/labs/new`}
          className="button-primary"
        >
          Add New Lab
        </Link>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-outline-variant bg-surface-container-high text-label-caps text-on-surface-variant">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Lab Key</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab: LabRow) => (
                <tr key={lab.id} className="border-b border-outline-variant/60 transition-colors hover:bg-surface-variant">
                  <td className="px-6 py-4 font-code text-code-md text-on-surface">{lab.order_num}</td>
                  <td className="px-6 py-4 font-code text-code-md text-on-surface">{lab.lab_key}</td>
                  <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{lab.title}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{new Date(lab.updated_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <LabRowActions classId={classId} labId={lab.id} csrfToken={session.csrf_token || ''} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {labs.length === 0 && (
          <div className="p-12 text-center text-body-sm text-on-surface-variant">No labs in this class yet.</div>
        )}
      </div>
    </div>
  );
}
