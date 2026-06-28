import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { StudentFrame } from '@/components/AppFrame';
import { EmptyState } from '@/components/vn-ui';
import LabShellClient from '@/components/LabShellClient';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { LAB_ALLOWLIST } = require('@/lib/lab-allowlist') as {
  LAB_ALLOWLIST: Record<string, { exactCommands: string[] }>;
};

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: labKey } = await params;
  const session = await requireSession();

  // Access control for students only
  if (session.role === 'student') {
    const accessResult = await db.query(
      `SELECT 1 FROM lab_access WHERE username = $1 AND lab_key = $2 AND has_access = true LIMIT 1`,
      [session.username, labKey]
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
  let labTitle = `Lab ${labKey}`;
  let nextLabHref: string | null = null;

  try {
    const dbResult = await db.query(
      'SELECT id, topic_key, order_num, title, content FROM labs WHERE lab_key = $1 LIMIT 1',
      [labKey]
    );
    const dbLab = dbResult.rows[0];

    if (dbLab?.title) {
      labTitle = dbLab.title;
    }

    if (dbLab?.content && dbLab.content.trim().length > 0) {
      markdownContent = dbLab.content;
    } else {
      // Fall back to md file
      try {
        markdownContent = await fs.readFile(
          path.join(process.cwd(), 'page', `${labKey}.md`),
          'utf8'
        );
      } catch {
        markdownContent = `# ${labTitle}\n\nKonten lab sedang dalam persiapan.`;
      }
    }

    // Find next lab in same topic
    if (dbLab?.topic_key && typeof dbLab.order_num === 'number') {
      const nextResult = await db.query<{ lab_key: string }>(
        `SELECT lab_key FROM labs
         WHERE topic_key = $1 AND order_num > $2
         ORDER BY order_num ASC LIMIT 1`,
        [dbLab.topic_key, dbLab.order_num]
      );
      if (nextResult.rows[0]?.lab_key) {
        nextLabHref = `/lab/${nextResult.rows[0].lab_key}`;
      }
    }
  } catch {
    try {
      markdownContent = await fs.readFile(
        path.join(process.cwd(), 'page', `${labKey}.md`),
        'utf8'
      );
    } catch {
      markdownContent = '# Lab Not Found\nThe requested lab document could not be loaded.';
    }
  }

  return (
    <div className="min-h-dvh bg-[#F1F7D4] text-[#1e1d2e]">
      <LabShellClient
        labId={labKey}
        labTitle={labTitle}
        markdownContent={markdownContent}
        username={session.username || ''}
        nextLabHref={nextLabHref}
        allowlist={LAB_ALLOWLIST[labKey] ?? undefined}
      />
    </div>
  );
}
