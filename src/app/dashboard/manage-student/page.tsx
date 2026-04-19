import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ManageStudentClient, { StudentClassAccessCard } from './ManageStudentClient';

async function toggleClassAccess(formData: FormData) {
  'use server';
  const username = formData.get('username') as string;
  const classId = Number(formData.get('classId'));
  const currentEnrolled = formData.get('currentEnrolled') === 'true';

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  if (!sessionCookie?.value) {
    redirect('/login');
  }

  let sessionRole = '';
  try {
    const session = JSON.parse(sessionCookie.value) as { role?: string };
    sessionRole = session.role || '';
  } catch {
    redirect('/login');
  }

  if (sessionRole !== 'admin') {
    redirect('/login');
  }

  if (!username || !Number.isInteger(classId)) {
    return;
  }

  await db.query('BEGIN');
  try {
    if (currentEnrolled) {
      await db.query(
        'DELETE FROM class_enrollments WHERE username = $1 AND class_id = $2',
        [username, classId]
      );

      await db.query(
        `
          DELETE FROM lab_access
          WHERE username = $1
            AND lab_id IN (SELECT lab_key FROM labs WHERE class_id = $2)
        `,
        [username, classId]
      );
    } else {
      await db.query(
        `
          INSERT INTO class_enrollments (username, class_id)
          VALUES ($1, $2)
          ON CONFLICT (username, class_id) DO NOTHING
        `,
        [username, classId]
      );

      await db.query(
        `
          INSERT INTO lab_access (username, lab_id, has_access, updated_at)
          SELECT $1, l.lab_key, true, NOW()
          FROM labs l
          WHERE l.class_id = $2
          ON CONFLICT (username, lab_id) DO UPDATE
          SET has_access = true, updated_at = NOW()
        `,
        [username, classId]
      );
    }

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  revalidatePath('/dashboard/manage-student');
  revalidatePath('/');
}

export default async function ManageStudentPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  if (!sessionCookie?.value) {
    redirect('/login');
  }

  try {
    const session = JSON.parse(sessionCookie.value) as { role?: string };
    if (session.role !== 'admin') {
      redirect('/');
    }
  } catch {
    redirect('/login');
  }

  let students: StudentClassAccessCard[] = [];
  try {
    const result = await db.query(`
      SELECT 
        u.username, 
        u.fullname,
        c.id as class_id,
        c.name as class_name,
        c.description as class_description,
        COALESCE((ce.class_id IS NOT NULL), false) as is_enrolled
      FROM users u
      CROSS JOIN classes c
      LEFT JOIN class_enrollments ce ON ce.username = u.username AND ce.class_id = c.id
      WHERE u.role = 'student' AND u.is_active = true
      ORDER BY u.username ASC, c.created_at ASC
    `);

    const grouped = new Map<string, StudentClassAccessCard>();

    for (const row of result.rows) {
      const existing = grouped.get(row.username);

      if (!existing) {
        grouped.set(row.username, {
          username: row.username,
          fullname: row.fullname,
          classes: [
            {
              class_id: row.class_id,
              class_name: row.class_name,
              class_description: row.class_description,
              is_enrolled: row.is_enrolled,
            },
          ],
        });
        continue;
      }

      existing.classes.push({
        class_id: row.class_id,
        class_name: row.class_name,
        class_description: row.class_description,
        is_enrolled: row.is_enrolled,
      });
    }

    students = Array.from(grouped.values());
  } catch (error) {
    console.error('Error fetching students:', error);
  }

  return <ManageStudentClient students={students} toggleClassAccessAction={toggleClassAccess} />;
}
