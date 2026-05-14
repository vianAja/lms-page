import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireStudentSession } from '@/lib/session';
import { StudentFrame } from '@/components/AppFrame';
import MarkdownViewer from '@/components/MarkdownViewer';
import WebTerminal from '@/components/WebTerminal';
import { EmptyState, Icon, StatusBadge } from '@/components/vn-ui';

type ClassLabRow = {
  class_id: number;
  class_name: string;
  class_description: string | null;
  lab_id: number | null;
  lab_key: string | null;
  lab_title: string | null;
  order_num: number | null;
};

type LabCardData = {
  id: number;
  name: string;
  description: string | null;
  instructor: string;
  accent: 'primary' | 'secondary' | 'tertiary';
  labs: Array<{
    id: number;
    lab_key: string;
    title: string;
    order_num: number;
    progress: number;
    state: 'in-progress' | 'locked' | 'completed';
  }>;
};

function mapClasses(rows: ClassLabRow[]) {
  const accents: Array<LabCardData['accent']> = ['primary', 'tertiary', 'secondary'];
  const classMap = new Map<number, LabCardData>();

  for (const row of rows) {
    if (!classMap.has(row.class_id)) {
      classMap.set(row.class_id, {
        id: row.class_id,
        name: row.class_name,
        description: row.class_description,
        instructor: ['Najwan', 'Smith', 'Raka'][row.class_id % 3] ?? 'Instructor',
        accent: accents[row.class_id % accents.length] ?? 'primary',
        labs: [],
      });
    }

    if (row.lab_id && row.lab_key && row.lab_title && row.order_num !== null) {
      const progress = row.order_num === 1 ? 60 : row.order_num === 2 ? 0 : 100;
      classMap.get(row.class_id)!.labs.push({
        id: row.lab_id,
        lab_key: row.lab_key,
        title: row.lab_title,
        order_num: row.order_num,
        progress,
        state: row.order_num === 1 ? 'in-progress' : row.order_num === 2 ? 'locked' : 'completed',
      });
    }
  }

  return Array.from(classMap.values());
}

async function getPreviewContent(labKey: string) {
  try {
    const result = await db.query<{ content: string }>('SELECT content FROM labs WHERE lab_key = $1 LIMIT 1', [labKey]);
    if (result.rows[0]?.content) return result.rows[0].content;
  } catch {}

  try {
    return await fs.readFile(path.join(process.cwd(), 'page', `lab${labKey}.md`), 'utf8');
  } catch {
    return '# Welcome to VN-Labs\n\nChoose a lab to begin your guided environment.';
  }
}

export default async function HomePage() {
  const session = await requireStudentSession();
  const displayName = session.fullname || session.username || 'Student';

  const result = await db.query<ClassLabRow>(
    `
      SELECT
        c.id AS class_id,
        c.name AS class_name,
        c.description AS class_description,
        l.id AS lab_id,
        l.lab_key,
        l.title AS lab_title,
        l.order_num
      FROM class_enrollments ce
      JOIN classes c ON c.id = ce.class_id
      LEFT JOIN labs l ON l.class_id = c.id
      WHERE ce.username = $1
      ORDER BY c.id ASC, l.order_num ASC, l.id ASC
    `,
    [session.username]
  );

  const classes = mapClasses(result.rows);
  const featuredLab = classes.flatMap((item) => item.labs).find((lab) => lab.state !== 'locked');
  const previewContent = featuredLab ? await getPreviewContent(featuredLab.lab_key) : '';
  const recentLabs = classes.flatMap((item) => item.labs).slice(0, 3);

  return (
    <StudentFrame name={displayName} active="Class">
      <main className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[1440px] overflow-hidden">
        <aside className="hidden h-full w-80 flex-col border-r border-outline-variant bg-surface-container md:flex">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-headline text-headline-md text-on-surface">My Classes</h2>
            <div className="relative mt-4">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input className="field pl-10" placeholder="Search labs..." />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="button-secondary min-h-9 px-3 text-xs">Class</button>
              <button className="button-secondary min-h-9 border-primary-container px-3 text-xs text-primary">Latest</button>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <div>
              <div className="text-label-caps text-on-surface-variant">Recently Accessed</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {recentLabs.map((lab) => (
                  <Link key={lab.lab_key} href={`/lab/${lab.lab_key}`} className="rounded-sm border border-outline-variant bg-surface-container-high px-2.5 py-1.5 text-body-sm text-on-surface transition-colors hover:border-secondary hover:text-secondary">
                    Lab {lab.lab_key}
                  </Link>
                ))}
              </div>
            </div>

            {classes.length === 0 ? (
              <EmptyState
                icon="school"
                title="No Classes Yet"
                copy="You have not been enrolled in a class. Ask your instructor to grant access."
              />
            ) : (
              classes.map((classItem) => (
                <section key={classItem.id} className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
                  <div className="border-b border-outline-variant p-4">
                    <div className={`text-label-caps ${classItem.accent === 'primary' ? 'text-primary' : classItem.accent === 'tertiary' ? 'text-tertiary' : 'text-secondary'}`}>
                      {classItem.name}
                    </div>
                    <div className="mt-1 text-body-md text-on-surface">{classItem.instructor}</div>
                  </div>
                  <div className="space-y-2 p-3">
                    {classItem.labs.map((lab) => (
                      <Link
                        key={lab.lab_key}
                        href={lab.state === 'locked' ? '#' : `/lab/${lab.lab_key}`}
                        className={`block rounded-sm border px-3 py-3 transition-colors ${lab.state === 'in-progress' ? 'border-l-2 border-l-secondary border-outline-variant bg-surface-variant' : 'border-outline-variant bg-surface-container'} ${lab.state === 'locked' ? 'pointer-events-none opacity-60' : 'hover:border-primary-container'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="rounded-full border border-outline-variant px-2 py-1 font-code text-[11px] text-on-surface-variant">LAB {lab.lab_key}</span>
                            <span className={`text-body-sm ${lab.state === 'completed' ? 'line-through text-on-surface-variant' : lab.state === 'in-progress' ? 'text-secondary' : 'text-on-surface'}`}>
                              {lab.title}
                            </span>
                          </div>
                          <Icon
                            name={lab.state === 'locked' ? 'lock' : lab.state === 'completed' ? 'check_circle' : 'chevron_right'}
                            className={lab.state === 'locked' ? 'text-error' : lab.state === 'completed' ? 'text-secondary' : 'text-on-surface-variant'}
                          />
                        </div>
                        <div className="mt-3 h-1 rounded-full bg-surface-container-high">
                          <div className="h-1 rounded-full bg-secondary" style={{ width: `${lab.progress}%` }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          <div className="border-t border-outline-variant p-4 text-center text-[11px] text-on-surface-variant">
            Press <kbd className="rounded-sm border border-outline-variant bg-surface-container-high px-1.5 py-0.5 font-code">Tab</kbd> to switch panels ·{' '}
            <kbd className="rounded-sm border border-outline-variant bg-surface-container-high px-1.5 py-0.5 font-code">Ctrl+`</kbd> for terminal
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-[60px] items-center justify-between border-b border-outline-variant bg-surface-container px-4 md:px-6">
            <div className="min-w-0">
              <div className="text-label-caps text-on-surface-variant">Lab ID</div>
              <div className="truncate font-body text-body-lg text-on-surface">
                {featuredLab ? `LAB ${featuredLab.lab_key} · ${featuredLab.title}` : 'No active lab selected'}
              </div>
            </div>
            <button className="button-primary">Grade</button>
          </div>

          {featuredLab ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="min-h-0 overflow-y-auto border-b border-outline-variant bg-surface p-5 md:border-b-0 md:border-r">
                <div className="mb-4 flex items-center gap-3">
                  <StatusBadge status="active" />
                  <span className="text-body-sm text-on-surface-variant">Connected learning workspace</span>
                </div>
                <MarkdownViewer content={previewContent} />
              </div>
              <div className="min-h-[45vh] bg-black p-3">
                <WebTerminal labId={featuredLab.lab_key} username={session.username || ''} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon="science"
                title="No Labs Assigned"
                copy="There are no available labs in your enrolled classes yet."
                cta={<Link href="/progress" className="button-primary">View Progress</Link>}
              />
            </div>
          )}
        </section>
      </main>
    </StudentFrame>
  );
}
