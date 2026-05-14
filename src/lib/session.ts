import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type AppSession = {
  id?: number;
  username?: string;
  fullname?: string;
  role?: 'admin' | 'student';
  csrf_token?: string;
};

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as AppSession;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.username || !session.role) {
    redirect('/login');
  }
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (session.role !== 'admin') {
    redirect('/403');
  }
  return session;
}

export async function requireStudentSession() {
  const session = await requireSession();
  if (session.role !== 'student') {
    redirect('/dashboard');
  }
  return session;
}
