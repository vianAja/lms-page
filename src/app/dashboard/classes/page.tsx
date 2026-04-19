import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import ClassListClient from './ClassListClient';

type SessionData = {
  role?: string;
  csrf_token?: string;
};

type ClassRow = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  lab_count: string;
};

export default async function DashboardClassesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (!sessionCookie?.value) {
    redirect('/login');
  }

  let session: SessionData;

  try {
    session = JSON.parse(sessionCookie.value) as SessionData;
  } catch {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    redirect('/');
  }

  const result = await db.query<ClassRow>(`
    SELECT c.*, COUNT(l.id) as lab_count
    FROM classes c
    LEFT JOIN labs l ON l.class_id = c.id
    GROUP BY c.id ORDER BY c.created_at DESC
  `);

  const classes = result.rows.map((row: ClassRow) => ({
    ...row,
    lab_count: Number(row.lab_count || 0),
  }));

  return <ClassListClient classes={classes} csrfToken={session.csrf_token || ''} />;
}
