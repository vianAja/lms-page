import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import StudentOverviewClient from './StudentOverviewClient';

export default async function StudentOverviewPage() {
  const session = await getSession();
  if (!session?.username) redirect('/login');

  const username = session.username;
  const displayName = session.fullname || session.username || 'Student';

  // Get access keys for this student
  const accessResult = await db.query<{ lab_key: string }>(
    `SELECT lab_key FROM lab_access WHERE username = $1 AND has_access = true`,
    [username]
  );
  const accessKeys = new Set(accessResult.rows.map((r: { lab_key: string }) => r.lab_key));

  // Get all labs
  const labsResult = await db.query<{
    lab_key: string;
    topic_key: string;
    topic_name: string;
    title: string;
    order_num: number;
  }>(`SELECT lab_key, topic_key, topic_name, title, order_num FROM labs ORDER BY topic_key, order_num`);

  const totalLabs = labsResult.rows.length;
  const completedLabs = accessKeys.size;
  const activeCourses = [...new Set(labsResult.rows.filter((l: any) => accessKeys.has(l.lab_key)).map((l: any) => l.topic_key))].length;

  return (
    <StudentOverviewClient
      displayName={displayName}
      stats={{
        labsCompleted: completedLabs,
        activeCourses,
        streak: 7,
        totalXP: completedLabs * 120,
      }}
    />
  );
}
