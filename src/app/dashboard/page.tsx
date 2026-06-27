import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import DashboardOverviewClient from '@/app/dashboard/DashboardOverviewClient';

type CountRow = {
  count: string;
};

type AccessActivityRow = {
  username: string;
  fullname: string | null;
  lab_id: string;
  has_access: boolean;
  changed_at: string;
};

const sparklinePoints = [
  '0,25 20,20 40,28 60,15 80,10 100,5',
  '0,20 20,25 40,15 60,18 80,5 100,2',
  '0,15 20,10 40,20 60,15 80,25 100,10',
  '0,28 20,25 40,10 60,15 80,5 100,8',
];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  let csrfToken = '';

  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value) as { csrf_token?: unknown };
      if (typeof session.csrf_token === 'string') {
        csrfToken = session.csrf_token;
      }
    } catch {
      csrfToken = '';
    }
  }

  const [studentsResult, labsResult, sessionsResult, activityResult] = await Promise.all([
    db.query<CountRow>("SELECT COUNT(*) FROM users WHERE role='student' AND is_active=true"),
    db.query<CountRow>('SELECT COUNT(*) FROM labs'),
    db.query<CountRow>('SELECT COUNT(*) FROM lab_sessions'),
    db.query<AccessActivityRow>(`
      SELECT la.username, la.lab_id, la.has_access, la.updated_at AS changed_at, u.fullname
      FROM lab_access la
      JOIN users u ON u.username = la.username
      ORDER BY la.id DESC
      LIMIT 30
    `),
  ]);

  const stats = [
    { label: 'Total Students', value: Number(studentsResult.rows[0]?.count || 0), meta: '+3 this week', color: 'text-primary' },
    { label: 'Active Labs', value: Number(labsResult.rows[0]?.count || 0), meta: `${Number(sessionsResult.rows[0]?.count || 0)} live sessions`, color: 'text-on-surface' },
    { label: 'Completion Rate', value: '84%', meta: 'Above target', color: 'text-secondary' },
    { label: 'Avg Score', value: '87', meta: 'B+ cohort average', color: 'text-tertiary' },
  ];

  return <DashboardOverviewClient stats={stats} activityRows={activityResult.rows} sparklinePoints={sparklinePoints} csrfToken={csrfToken} />;
}
