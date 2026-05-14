import { db } from '@/lib/db';
import { requireStudentSession } from '@/lib/session';
import { StudentFrame } from '@/components/AppFrame';
import { StatusBadge } from '@/components/vn-ui';

type ProgressRow = {
  class_name: string;
  lab_title: string;
  lab_key: string;
  order_num: number;
};

export default async function ProgressPage() {
  const session = await requireStudentSession();
  const displayName = session.fullname || session.username || 'Student';
  const result = await db.query<ProgressRow>(
    `
      SELECT c.name AS class_name, l.title AS lab_title, l.lab_key, l.order_num
      FROM class_enrollments ce
      JOIN classes c ON c.id = ce.class_id
      JOIN labs l ON l.class_id = c.id
      WHERE ce.username = $1
      ORDER BY c.name ASC, l.order_num ASC
    `,
    [session.username]
  );

  const grouped = result.rows.reduce<Record<string, ProgressRow[]>>((acc: Record<string, ProgressRow[]>, row: ProgressRow) => {
    acc[row.class_name] ??= [];
    acc[row.class_name].push(row);
    return acc;
  }, {});

  const totalLabs = result.rows.length;
  const completed = result.rows.filter((row: ProgressRow) => row.order_num > 1).length;
  const streak = Math.max(2, Math.min(9, completed + 2));
  const totalXp = completed * 120 + 80;
  const avgScore = totalLabs ? Math.round((completed / totalLabs) * 100) : 0;

  return (
    <StudentFrame name={displayName} active="Module">
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
        <div className="space-y-2">
          <h1 className="font-headline text-headline-lg text-on-surface">My Progress</h1>
          <p className="text-body-md text-on-surface-variant">Track completed labs, class-by-class momentum, and overall achievement.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total Labs Completed', completed, 'secondary'],
            ['Current Streak', `${streak} days`, 'tertiary'],
            ['Total XP', totalXp, 'primary'],
            ['Average Score', `${avgScore}%`, 'outline'],
          ].map(([label, value, tone]) => (
            <section key={label} className="panel p-5">
              <div className="text-label-caps text-on-surface-variant">{label}</div>
              <div className={`mt-3 font-headline text-headline-md ${tone === 'secondary' ? 'text-secondary' : tone === 'tertiary' ? 'text-tertiary' : tone === 'primary' ? 'text-primary' : 'text-on-surface'}`}>
                {value}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          {Object.entries(grouped as Record<string, ProgressRow[]>).map(([className, labs]: [string, ProgressRow[]]) => (
            <section key={className} className="panel overflow-hidden">
              <div className="border-b border-outline-variant px-5 py-4">
                <h2 className="font-headline text-headline-md text-on-surface">{className}</h2>
              </div>
              <div className="space-y-3 p-5">
                {labs.map((lab: ProgressRow) => {
                  const score = lab.order_num === 1 ? 72 : lab.order_num === 2 ? 58 : 93;
                  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';
                  return (
                    <article key={lab.lab_key} className="rounded-lg border border-outline-variant bg-surface-container-high p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="font-body text-body-md text-on-surface">{lab.lab_title}</div>
                          <div className="mt-1 text-body-sm text-on-surface-variant">Completed on May {14 - lab.order_num}, 2026</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={lab.order_num === 1 ? 'warning' : 'completed'} className="capitalize" />
                          <span className={`rounded-full border px-2.5 py-1 font-code text-[12px] ${score >= 85 ? 'border-secondary/30 bg-secondary-container/10 text-secondary' : score >= 60 ? 'border-tertiary/30 bg-tertiary-container/10 text-tertiary' : 'border-error/30 bg-error-container/20 text-error'}`}>
                            Grade {grade}
                          </span>
                          <span className="rounded-full border border-outline-variant px-2.5 py-1 font-code text-[12px] text-on-surface-variant">
                            Score {score}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 h-1 rounded-full bg-surface-container">
                        <div className="h-1 rounded-full bg-secondary" style={{ width: `${score}%` }} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </StudentFrame>
  );
}
