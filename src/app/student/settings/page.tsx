import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import StudentSettingsClient from './StudentSettingsClient';

export default async function StudentSettingsPage() {
  const session = await getSession();
  if (!session?.username) redirect('/login');

  return (
    <StudentSettingsClient
      initialName={session.fullname || ''}
      initialUsername={session.username || ''}
    />
  );
}
