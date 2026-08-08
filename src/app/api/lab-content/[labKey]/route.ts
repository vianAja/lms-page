import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { LAB_ALLOWLIST } = require('@/lib/lab-allowlist') as {
  LAB_ALLOWLIST: Record<string, { exactCommands: string[] }>;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ labKey: string }> }
) {
  const { labKey } = await params;
  const session = await getSession();

  // Access guard for students
  if (session?.role === 'student') {
    const accessResult = await db.query(
      `SELECT 1 FROM lab_access WHERE username = $1 AND lab_key = $2 AND has_access = true LIMIT 1`,
      [session.username, labKey]
    );
    if (!accessResult.rowCount) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  let markdownContent = '';
  let labTitle = `Lab ${labKey}`;
  let topicKey = '';
  let nextLabHref: string | null = null;
  let prevLabHref: string | null = null;

  try {
    const dbResult = await db.query(
      'SELECT id, topic_key, order_num, title, content FROM labs WHERE lab_key = $1 LIMIT 1',
      [labKey]
    );
    const dbLab = dbResult.rows[0];

    if (dbLab?.title) labTitle = dbLab.title;
    if (dbLab?.topic_key) topicKey = dbLab.topic_key;

    if (dbLab?.content && dbLab.content.trim().length > 0) {
      markdownContent = dbLab.content;
    } else {
      try {
        markdownContent = await fs.readFile(
          path.join(process.cwd(), 'page', `${labKey}.md`),
          'utf8'
        );
      } catch {
        markdownContent = `# ${labTitle}\n\nKonten lab sedang dalam persiapan.`;
      }
    }

    if (dbLab?.topic_key && typeof dbLab.order_num === 'number') {
      const nextResult = await db.query<{ lab_key: string }>(
        `SELECT lab_key FROM labs WHERE topic_key = $1 AND order_num > $2 ORDER BY order_num ASC LIMIT 1`,
        [dbLab.topic_key, dbLab.order_num]
      );
      if (nextResult.rows[0]?.lab_key) {
        nextLabHref = `/lab/${nextResult.rows[0].lab_key}`;
      }

      const prevResult = await db.query<{ lab_key: string }>(
        `SELECT lab_key FROM labs WHERE topic_key = $1 AND order_num < $2 ORDER BY order_num DESC LIMIT 1`,
        [dbLab.topic_key, dbLab.order_num]
      );
      if (prevResult.rows[0]?.lab_key) {
        prevLabHref = `/lab/${prevResult.rows[0].lab_key}`;
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

  return NextResponse.json({
    labId: labKey,
    labTitle,
    topicKey,
    markdownContent,
    allowlist: LAB_ALLOWLIST[labKey] ?? null,
    nextLabHref,
    prevLabHref,
  });
}
