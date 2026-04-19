import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserManagementClient, { UserRow } from './UserManagementClient';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (!sessionCookie?.value) {
    redirect('/login');
  }

  let session: { username?: string; role?: string; csrf_token?: string };

  try {
    session = JSON.parse(sessionCookie.value) as { username?: string; role?: string; csrf_token?: string };
  } catch {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    redirect('/');
  }

  let users: UserRow[] = [];
  try {
    const result = await db.query<UserRow>(
      'SELECT id, username, role, fullname, is_active FROM users ORDER BY id ASC'
    );
    users = result.rows;
  } catch (error) {
    console.error('Error fetching users:', error);
  }

  return (
    <UserManagementClient
      users={users}
      currentUsername={session.username || ''}
      csrfToken={session.csrf_token || ''}
    />
  );
}
