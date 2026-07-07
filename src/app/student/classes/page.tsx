import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import StudentClassesClient from './StudentClassesClient';

export default async function StudentClassesPage() {
  const session = await getSession();
  if (!session?.username) redirect('/login');

  const username = session.username;

  const accessResult = await db.query<{ lab_key: string }>(
    `SELECT lab_key FROM lab_access WHERE username = $1 AND has_access = true`,
    [username]
  );
  const accessKeys = new Set(accessResult.rows.map((r: { lab_key: string }) => r.lab_key));

  const labsResult = await db.query<{
    lab_key: string;
    topic_key: string;
    topic_name: string;
    title: string;
    description: string | null;
    order_num: number;
    icon: string;
  }>(`SELECT lab_key, topic_key, topic_name, title, description, order_num, icon
      FROM labs ORDER BY topic_key ASC, order_num ASC`);

  // Group by topic
  const topicMap = new Map<string, {
    topic_key: string;
    topic_name: string;
    labs: typeof labsResult.rows;
  }>();

  for (const lab of labsResult.rows) {
    if (!topicMap.has(lab.topic_key)) {
      topicMap.set(lab.topic_key, {
        topic_key: lab.topic_key,
        topic_name: lab.topic_name,
        labs: [],
      });
    }
    topicMap.get(lab.topic_key)!.labs.push(lab);
  }

  const classes = Array.from(topicMap.values()).map((topic) => {
    const completed = topic.labs.filter((l: any) => accessKeys.has(l.lab_key)).length;
    const total = topic.labs.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const status = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
    const firstLab = topic.labs.find((l: any) => accessKeys.has(l.lab_key)) || topic.labs[0];
    return {
      topic_key: topic.topic_key,
      topic_name: topic.topic_name,
      progress,
      status,
      completed,
      total,
      currentModule: firstLab ? `Module ${firstLab.order_num}: ${firstLab.title}` : 'Not started',
      href: firstLab ? `/lab/${firstLab.lab_key}` : '#',
      icon: firstLab?.icon || 'science',
    };
  });

  return <StudentClassesClient classes={classes} />;
}
