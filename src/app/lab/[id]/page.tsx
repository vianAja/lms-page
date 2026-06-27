import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { StudentFrame } from '@/components/AppFrame';
import { EmptyState } from '@/components/vn-ui';
import LabShellClient from '@/components/LabShellClient';

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
  let nextLabHref: string | null = null;

  try {
    const dbResult = await db.query(
      'SELECT id, class_id, order_num, title, content FROM labs WHERE lab_key = $1 LIMIT 1',
      [labId]
    );
    const dbLab = dbResult.rows[0];

    if (dbLab?.title) {
      labTitle = dbLab.title;
    }

    if (dbLab?.content) {
      markdownContent = dbLab.content;
    } else {
      markdownContent = await fs.readFile(path.join(process.cwd(), 'page', `lab${labId}.md`), 'utf8');
    }

    if (dbLab?.class_id && typeof dbLab.order_num === 'number') {
      const nextResult = await db.query<{ lab_key: string }>(
        `
          SELECT lab_key
          FROM labs
          WHERE class_id = $1 AND order_num > $2
          ORDER BY order_num ASC, id ASC
          LIMIT 1
        `,
        [dbLab.class_id, dbLab.order_num]
      );
      if (nextResult.rows[0]?.lab_key) {
        nextLabHref = `/lab/${nextResult.rows[0].lab_key}`;
      }
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
      <LabShellClient
        labId={labId}
        labTitle={labTitle}
        markdownContent={markdownContent}
        username={session.username || ''}
        nextLabHref={nextLabHref}
      />
    </StudentFrame>
  );
}
