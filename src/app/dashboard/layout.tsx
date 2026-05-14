import { db } from '@/lib/db';
import { requireAdminSession } from '@/lib/session';
import AdminLayoutShell from '@/components/AdminLayoutShell';

type CountRow = { count: string };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  const [usersResult, classesResult, labsResult] = await Promise.all([
    db.query<CountRow>("SELECT COUNT(*) FROM users WHERE role = 'student'"),
    db.query<CountRow>('SELECT COUNT(*) FROM classes'),
    db.query<CountRow>('SELECT COUNT(*) FROM labs'),
  ]);

  return (
    <AdminLayoutShell
      adminName={session.fullname || session.username || 'Admin'}
      counts={{
        users: Number(usersResult.rows[0]?.count || 0),
        classes: Number(classesResult.rows[0]?.count || 0),
        labs: Number(labsResult.rows[0]?.count || 0),
      }}
    >
      {children}
    </AdminLayoutShell>
  );
}
