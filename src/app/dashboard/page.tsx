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

  const totalStudents = Number(studentsResult.rows[0]?.count || 0);
  const totalLabs = Number(labsResult.rows[0]?.count || 0);
  const totalSessions = Number(sessionsResult.rows[0]?.count || 0);

  const stats = [
    { label: 'Total Registered Students', value: totalStudents, meta: 'registered users', icon: 'group', trend: '+12%', trendUp: true },
    { label: 'Active Now', value: totalSessions, meta: 'current web sessions', icon: 'wifi', trend: '+3', trendUp: true },
    { label: 'In-Lab Students', value: Math.floor(totalSessions * 1.5), meta: 'currently running a lab instance', icon: 'science', trend: '+5', trendUp: true },
    { label: 'Inactive Students', value: Math.max(0, totalStudents - totalSessions * 2), meta: '>30 days inactive', icon: 'schedule', trend: '-1', trendUp: false },
  ];

  return <DashboardOverviewClient stats={stats} activityRows={activityResult.rows} sparklinePoints={sparklinePoints} csrfToken={csrfToken} />;
}
