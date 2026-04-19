import { BookOpen, FlaskConical, Terminal, Users } from 'lucide-react';
import { db } from '@/lib/db';

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

export default async function DashboardPage() {
  const [studentsResult, classesResult, labsResult, sessionsResult] = await Promise.all([
    db.query<CountRow>("SELECT COUNT(*) FROM users WHERE role='student' AND is_active=true"),
    db.query<CountRow>('SELECT COUNT(*) FROM classes'),
    db.query<CountRow>('SELECT COUNT(*) FROM labs'),
    db.query<CountRow>('SELECT COUNT(*) FROM lab_sessions'),
  ]);

  const activityResult = await db.query<AccessActivityRow>(`
    SELECT
      la.username,
      la.lab_id,
      la.has_access,
      u.fullname,
      COALESCE(la.updated_at, NOW()) AS changed_at
    FROM lab_access la
    JOIN users u ON u.username = la.username
    ORDER BY la.id DESC
    LIMIT 10
  `);

  const totalStudents = Number(studentsResult.rows[0]?.count || 0);
  const totalClasses = Number(classesResult.rows[0]?.count || 0);
  const totalLabs = Number(labsResult.rows[0]?.count || 0);
  const activeSessions = Number(sessionsResult.rows[0]?.count || 0);
  const recentActivity = activityResult.rows;

  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      icon: Users,
      iconStyle: 'bg-blue-50 text-[#2D9CDB]',
    },
    {
      label: 'Total Classes',
      value: totalClasses,
      icon: BookOpen,
      iconStyle: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Total Labs',
      value: totalLabs,
      icon: FlaskConical,
      iconStyle: 'bg-green-50 text-[#27AE60]',
    },
    {
      label: 'Active Sessions',
      value: activeSessions,
      icon: Terminal,
      iconStyle: 'bg-orange-50 text-orange-500',
    },
  ];

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#333]">Dashboard Overview</h1>
        <p className="text-[#828282] text-sm mt-1">Real-time summary of platform activity and access changes.</p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#828282] text-sm font-medium">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-[#333] tracking-tight">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconStyle}`}>
                  <Icon size={20} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E0E6ED] bg-[#F9FBFC]">
          <h2 className="text-lg font-bold text-[#333]">Recent Access Activity</h2>
        </div>

        {recentActivity.length === 0 ? (
          <div className="px-6 py-10 text-center text-[#828282] text-sm">No recent access activity found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E0E6ED]">
                  <th className="px-6 py-3 text-xs font-bold text-[#828282] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#828282] uppercase tracking-wider">Lab ID</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#828282] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F5F8]">
                {recentActivity.map((row: AccessActivityRow, index: number) => (
                  <tr key={`${row.username}-${row.lab_id}-${index}`} className="hover:bg-[#F9FBFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#333]">{row.fullname || row.username}</div>
                      <div className="text-xs text-[#828282]">@{row.username}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-[#333]">{row.lab_id}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          row.has_access
                            ? 'bg-green-50 text-[#27AE60] border-green-100'
                            : 'bg-red-50 text-red-500 border-red-100'
                        }`}
                      >
                        {row.has_access ? 'Authorized' : 'Restricted'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
