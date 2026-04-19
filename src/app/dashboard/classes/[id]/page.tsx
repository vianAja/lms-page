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
    <div className="w-full">
      <meta name="csrf-token" content={session.csrf_token || ''} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">{classItem.name}</h1>
          <p className="text-sm text-[#828282] mt-1">Manage labs for this class.</p>
        </div>
        <Link
          href={`/dashboard/classes/${classId}/labs/new`}
          className="bg-[#2D9CDB] hover:bg-[#2789C2] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
        >
          Add New Lab
        </Link>
      </div>

      <div className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FBFC] border-b border-[#E0E6ED]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282]">Order</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282]">Lab Key</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282]">Title</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282]">Last Updated</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#828282] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F5F8]">
              {labs.map((lab: LabRow) => (
                <tr key={lab.id} className="hover:bg-[#F9FBFC] transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-[#333]">{lab.order_num}</td>
                  <td className="px-6 py-4 text-sm font-mono text-[#333]">{lab.lab_key}</td>
                  <td className="px-6 py-4 text-sm text-[#333] font-medium">{lab.title}</td>
                  <td className="px-6 py-4 text-sm text-[#828282]">{new Date(lab.updated_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <LabRowActions classId={classId} labId={lab.id} csrfToken={session.csrf_token || ''} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {labs.length === 0 && (
          <div className="p-12 text-center text-sm text-[#828282]">No labs in this class yet.</div>
        )}
      </div>
    </div>
  );
}
