import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { StudentFrame } from '@/components/AppFrame';
import MarkdownViewer from '@/components/MarkdownViewer';
import ResizableSplit from '@/components/ResizableSplit';
import WebTerminal from '@/components/WebTerminal';
import { EmptyState, StatusBadge } from '@/components/vn-ui';

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: labId } = await params;
  const session = await requireSession();

  if (session.role === 'student') {
    const accessResult = await db.query(
      `
        SELECT 1
        FROM class_enrollments ce
        JOIN labs l ON l.class_id = ce.class_id
        WHERE ce.username = $1 AND l.lab_key = $2
        LIMIT 1
      `,
      [session.username, labId]
    );

    if (!accessResult.rowCount) {
      return (
        <StudentFrame name={session.fullname || session.username || 'Student'}>
          <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1440px] items-center justify-center px-4 py-10">
            <EmptyState
              icon="lock"
              title="Access Restricted"
              copy="You do not have permission to open this lab environment."
              cta={<Link href="/" className="button-primary">Go to Home</Link>}
            />
          </div>
        </StudentFrame>
      );
    }
  }

  let markdownContent = '';
  let labTitle = `Lab ${labId}`;

  try {
    const dbResult = await db.query('SELECT title, content FROM labs WHERE lab_key = $1 LIMIT 1', [labId]);
    const dbLab = dbResult.rows[0];

    if (dbLab?.title) {
      labTitle = dbLab.title;
    }

    if (dbLab?.content) {
      markdownContent = dbLab.content;
    } else {
      markdownContent = await fs.readFile(path.join(process.cwd(), 'page', `lab${labId}.md`), 'utf8');
    }
  } catch {
    try {
      markdownContent = await fs.readFile(path.join(process.cwd(), 'page', `lab${labId}.md`), 'utf8');
    } catch {
      markdownContent = '# Lab Not Found\nThe requested lab document could not be loaded.';
    }
  }

  const name = session.fullname || session.username || 'Student';

  return (
    <StudentFrame name={name} active="Class">
      <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-[1440px] flex-col overflow-hidden">
        <div className="flex h-12 items-center gap-3 border-b border-outline-variant bg-surface px-4 text-body-sm text-on-surface-variant md:px-6">
          <Link href="/" className="transition-colors hover:text-primary">← Back to Portal</Link>
          <span>|</span>
          <span>Lab: {labTitle}</span>
        </div>

        <ResizableSplit
          leftPanel={
            <div className="flex h-full flex-col">
              <div className="border-b border-outline-variant bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status="warning" />
                  <span className="rounded-full border border-outline-variant px-2.5 py-1 font-code text-[12px] text-on-surface-variant">45 min</span>
                  <span className="rounded-full border border-primary-container/30 bg-primary-container/10 px-2.5 py-1 font-code text-[12px] text-primary">+120 XP</span>
                </div>
                <h1 className="mt-4 font-headline text-headline-lg text-on-surface">{labTitle}</h1>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-body-sm text-on-surface-variant">
                    <span>Tasks: 2/4 completed</span>
                    <span className="font-code">50%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[true, true, false, false].map((filled, index) => (
                      <div key={index} className={`h-2 rounded-full ${filled ? 'bg-primary-container shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'bg-surface-container-high'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <MarkdownViewer content={markdownContent} />
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant bg-surface p-4">
                <button className="button-secondary">← Previous Lab</button>
                <button className="button-primary">Next Lab →</button>
              </div>
            </div>
          }
          rightPanel={
            <div className="h-full bg-black p-3">
              <WebTerminal labId={labId} username={session.username || ''} />
            </div>
          }
        />
      </div>
    </StudentFrame>
  );
}
