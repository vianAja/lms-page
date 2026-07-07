import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import StudentLayoutShell from '@/components/StudentLayoutShell';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.username) redirect('/login');

  const studentName = session.fullname || session.username || 'Student';

  return (
    <StudentLayoutShell studentName={studentName}>
      {children}
    </StudentLayoutShell>
  );
}
