import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { validateCsrfToken } from '@/lib/csrf';
import ManageStudentClient, { StudentAccessCard } from './ManageStudentClient';

async function toggleAccess(formData: FormData) {
  'use server';
  const username = formData.get('username') as string;
  const labId = formData.get('labId') as string;
  const currentAccess = formData.get('currentAccess') === 'true';

  await db.query(`
    INSERT INTO lab_access (username, lab_id, has_access) VALUES ($1, $2, $3)
    ON CONFLICT (username, lab_id) DO UPDATE SET has_access = EXCLUDED.has_access
  `, [username, labId, !currentAccess]);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  if (!sessionCookie?.value) {
    throw new Error('Unauthorized');
  }

  let sessionUsername = '';
  let sessionCsrfToken = '';

  try {
    const session = JSON.parse(sessionCookie.value) as { username?: string; csrf_token?: string };
    sessionUsername = session.username || '';
    sessionCsrfToken = session.csrf_token || '';
  } catch {
    throw new Error('Unauthorized');
  }

  const isValidCsrf = await validateCsrfToken(sessionUsername, sessionCsrfToken);
  if (!isValidCsrf) {
    throw new Error('Unauthorized');
  }

  revalidatePath('/dashboard/manage-student');
}

export default async function ManageStudentPage() {
  let students: StudentAccessCard[] = [];
  try {
    const result = await db.query(`
      SELECT 
        u.username, 
        u.fullname,
        l.lab_key,
        l.title as lab_title,
        l.id as lab_id,
        COALESCE(la.has_access, false) as has_access
      FROM users u
      CROSS JOIN labs l
      LEFT JOIN lab_access la ON la.username = u.username AND la.lab_id = l.lab_key
      WHERE u.role = 'student' AND u.is_active = true
      ORDER BY u.username ASC, l.order_num ASC
    `);

    const grouped = new Map<string, StudentAccessCard>();

    for (const row of result.rows) {
      const existing = grouped.get(row.username);

      if (!existing) {
        grouped.set(row.username, {
          username: row.username,
          fullname: row.fullname,
          labs: [
            {
              lab_id: row.lab_id,
              lab_key: row.lab_key,
              lab_title: row.lab_title,
              has_access: row.has_access,
            },
          ],
        });
        continue;
      }

      existing.labs.push({
        lab_id: row.lab_id,
        lab_key: row.lab_key,
        lab_title: row.lab_title,
        has_access: row.has_access,
      });
    }

    students = Array.from(grouped.values());
  } catch (error) {
    console.error('Error fetching students:', error);
  }

  return <ManageStudentClient students={students} toggleAccessAction={toggleAccess} />;
}
