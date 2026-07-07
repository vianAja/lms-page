import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import StudentProgressClient from './StudentProgressClient';

export default async function StudentProgressPage() {
  const session = await getSession();
  if (!session?.username) redirect('/login');

  return <StudentProgressClient displayName={session.fullname || session.username || 'Student'} />;
}
