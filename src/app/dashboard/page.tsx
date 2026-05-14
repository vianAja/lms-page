import Link from 'next/link';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/vn-ui';

type CountRow = {
  count: string;
};

type AccessActivityRow = {
  username: string;
  fullname: string | null;
  lab_id: string;
  has_access: boolean;
};

const sparklinePoints = [
  '0,25 20,20 40,28 60,15 80,10 100,5',
  '0,20 20,25 40,15 60,18 80,5 100,2',
  '0,15 20,10 40,20 60,15 80,25 100,10',
  '0,28 20,25 40,10 60,15 80,5 100,8',
];

export default async function DashboardPage() {
  const [studentsResult, labsResult, sessionsResult, activityResult] = await Promise.all([
    db.query<CountRow>("SELECT COUNT(*) FROM users WHERE role='student' AND is_active=true"),
    db.query<CountRow>('SELECT COUNT(*) FROM labs'),
    db.query<CountRow>('SELECT COUNT(*) FROM lab_sessions'),
    db.query<AccessActivityRow>(`
      SELECT la.username, la.lab_id, la.has_access, u.fullname
      FROM lab_access la
      JOIN users u ON u.username = la.username
      ORDER BY la.id DESC
      LIMIT 8
    `),
  ]);

  const stats = [
    { label: 'Total Students', value: Number(studentsResult.rows[0]?.count || 0), meta: '+3 this week', color: 'text-primary' },
    { label: 'Active Labs', value: Number(labsResult.rows[0]?.count || 0), meta: `${Number(sessionsResult.rows[0]?.count || 0)} live sessions`, color: 'text-on-surface' },
    { label: 'Completion Rate', value: '84%', meta: 'Above target', color: 'text-secondary' },
    { label: 'Avg Score', value: '87', meta: 'B+ cohort average', color: 'text-tertiary' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">Overview</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Thursday, May 14, 2026</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-lg border border-outline-variant bg-surface-container p-1">
            {['Today', 'This Week', 'This Month'].map((item, index) => (
              <button key={item} className={`rounded-sm px-3 py-2 font-code text-[12px] ${index === 0 ? 'bg-surface-variant text-on-surface' : 'text-on-surface-variant'}`}>
                {item}
              </button>
            ))}
          </div>
          <Link href="/dashboard/classes" className="button-primary">Create New Class</Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <article key={stat.label} className="relative h-40 overflow-hidden rounded-xl border border-outline-variant bg-[#161B22] p-5 transition-colors hover:border-primary-container">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="text-body-sm text-on-surface-variant">{stat.label}</div>
              <div>
                <div className={`font-headline text-headline-xl ${stat.color}`}>{stat.value}</div>
                <div className="text-body-sm text-on-surface-variant">{stat.meta}</div>
              </div>
            </div>
            <svg className="absolute bottom-0 left-0 right-0 h-12 w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 30">
              <polyline points={sparklinePoints[index]} stroke="#0ea5e9" strokeWidth="2" fill="none" />
            </svg>
          </article>
        ))}
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high px-5 py-4">
          <div>
            <div className="text-label-caps text-on-surface-variant">Active Sessions</div>
            <h2 className="mt-1 font-headline text-headline-md text-on-surface">Recent Access Activity</h2>
          </div>
          <span className="rounded-full border border-outline-variant px-3 py-1 font-code text-[12px] text-on-surface-variant">
            {activityResult.rows.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-outline-variant text-label-caps text-on-surface-variant">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Lab</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {activityResult.rows.map((row: AccessActivityRow, index: number) => (
                <tr key={`${row.username}-${row.lab_id}-${index}`} className="border-b border-outline-variant/60 transition-colors hover:bg-surface-variant">
                  <td className="px-5 py-4">
                    <div className="font-body text-body-md text-on-surface">{row.fullname || row.username}</div>
                    <div className="text-body-sm text-on-surface-variant">@{row.username}</div>
                  </td>
                  <td className="px-5 py-4 font-code text-code-md text-on-surface">{row.lab_id}</td>
                  <td className="px-5 py-4 text-body-sm text-on-surface-variant">{18 + index}m</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={row.has_access ? 'completed' : 'locked'} className="capitalize" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="rounded-sm border border-error/30 bg-error-container/15 px-3 py-2 font-code text-[12px] text-error transition-colors hover:border-error">
                      Disconnect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          ['Manage access', 'Grant or revoke lab visibility per student and per class.', '/dashboard/manage-student'],
          ['Update class roadmap', 'Adjust lab order, publish drafts, and reorganize progression.', '/dashboard/classes'],
          ['Review user accounts', 'Create staff accounts and deactivate dormant users.', '/dashboard/users'],
        ].map(([title, copy, href]) => (
          <Link key={title} href={href} className="panel p-5 transition-colors hover:border-primary-container">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-outline-variant bg-surface-container-high">
                <span className="material-symbols-outlined text-primary">arrow_outward</span>
              </div>
              <div>
                <h3 className="font-headline text-xl text-on-surface">{title}</h3>
                <p className="mt-2 text-body-sm text-on-surface-variant">{copy}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
