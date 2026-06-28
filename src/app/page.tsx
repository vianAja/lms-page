import { db } from '@/lib/db';
import { requireStudentSession } from '@/lib/session';
import HomeClient from '@/components/HomeClient';

type Lab = {
  lab_key: string;
  title: string;
  description: string | null;
  order_num: number;
  icon: string;
  has_access: boolean;
};

type Topic = {
  topic_key: string;
  topic_name: string;
  labs: Lab[];
};

export default async function HomePage() {
  const session = await requireStudentSession();
  const displayName = session.fullname || session.username || 'Student';
  const isAdmin = session.role === 'admin';

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

  let accessKeys = new Set<string>();
  if (!isAdmin) {
    const accessResult = await db.query<{ lab_key: string }>(
      `SELECT lab_key FROM lab_access WHERE username = $1 AND has_access = true`,
      [session.username]
    );
    accessKeys = new Set(accessResult.rows.map((r: { lab_key: string }) => r.lab_key));
  }

  const topicMap = new Map<string, Topic>();
  for (const lab of labsResult.rows) {
    if (!topicMap.has(lab.topic_key)) {
      topicMap.set(lab.topic_key, {
        topic_key: lab.topic_key,
        topic_name: lab.topic_name,
        labs: [],
      });
    }
    topicMap.get(lab.topic_key)!.labs.push({
      lab_key: lab.lab_key,
      title: lab.title,
      description: lab.description,
      order_num: lab.order_num,
      icon: lab.icon,
      has_access: isAdmin || accessKeys.has(lab.lab_key),
    });
  }
  const topics = Array.from(topicMap.values());

  return (
    <HomeClient
      topics={topics}
      displayName={displayName}
      isAdmin={isAdmin}
    />
  );
}
