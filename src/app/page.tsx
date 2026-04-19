import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FolderOpen, Lock } from 'lucide-react';
import { db } from '@/lib/db';
import Header from '@/components/Header';

type SessionData = {
  id?: number;
  username?: string;
  fullname?: string;
  role?: string;
};

type ClassLabRow = {
  class_id: number;
  class_name: string;
  class_description: string | null;
  lab_id: number | null;
  lab_key: string | null;
  lab_title: string | null;
  order_num: number | null;
  has_access: boolean;
};

type ClassItem = {
  id: number;
  name: string;
  description: string | null;
  labs: Array<{
    id: number;
    lab_key: string;
    title: string;
    order_num: number;
    has_access: boolean;
  }>;
};

function mapClasses(rows: ClassLabRow[]): ClassItem[] {
  const classMap = new Map<number, ClassItem>();

  for (const row of rows) {
    if (!classMap.has(row.class_id)) {
      classMap.set(row.class_id, {
        id: row.class_id,
        name: row.class_name,
        description: row.class_description,
        labs: [],
      });
    }

    if (row.lab_id !== null && row.lab_key && row.lab_title && row.order_num !== null) {
      classMap.get(row.class_id)!.labs.push({
        id: row.lab_id,
        lab_key: row.lab_key,
        title: row.lab_title,
        order_num: row.order_num,
        has_access: row.has_access,
      });
    }
  }

  return Array.from(classMap.values());
}

export default async function HomePage() {
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

  if (!session.username || !session.role) {
    redirect('/login');
  }

  if (session.role === 'admin') {
    redirect('/dashboard');
  }

  const result = await db.query<ClassLabRow>(
    `
      SELECT
        c.id AS class_id,
        c.name AS class_name,
        c.description AS class_description,
        l.id AS lab_id,
        l.lab_key,
        l.title AS lab_title,
        l.order_num,
        COALESCE(la.has_access, false) AS has_access
      FROM class_enrollments ce
      JOIN classes c ON c.id = ce.class_id
      LEFT JOIN labs l ON l.class_id = c.id
      LEFT JOIN lab_access la
        ON la.username = $1
       AND la.lab_id = l.lab_key
      WHERE ce.username = $1
      ORDER BY c.id ASC, l.order_num ASC, l.id ASC
    `,
    [session.username]
  );

  const classes = mapClasses(result.rows);
  const displayName = session.fullname || session.username;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F2F5F8] flex flex-col text-[#333]">
      <Header title="My Learning Portal" />

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-6">
              <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold">
                {avatarInitial}
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#333]">{displayName}</h2>
              <p className="text-[#828282] mt-1">@{session.username}</p>
              <span
                className={`inline-flex items-center mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  session.role === 'admin'
                    ? 'bg-purple-50 text-purple-600 border-purple-100'
                    : 'bg-blue-50 text-[#2D9CDB] border-blue-100'
                }`}
              >
                {session.role}
              </span>
            </div>
          </aside>

          <section className="lg:col-span-3">
            <div className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-6 md:p-8">
              <h1 className="text-2xl font-bold text-[#333]">My Classes</h1>

              {classes.length === 0 && (
                <div className="mt-6 border border-dashed border-[#E0E6ED] rounded-xl p-10 text-center text-[#828282] font-medium">
                  No classes assigned yet.
                </div>
              )}

              {classes.length > 0 && (
                <div className="mt-6 space-y-5">
                  {classes.map((classItem) => (
                    <article
                      key={classItem.id}
                      className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm p-5"
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen size={20} className="text-[#2D9CDB]" />
                        <h2 className="text-lg font-bold text-[#333]">{classItem.name}</h2>
                      </div>

                      {classItem.description && (
                        <p className="mt-2 text-sm text-[#828282]">{classItem.description}</p>
                      )}

                      <ul className="mt-4 space-y-3">
                        {classItem.labs.map((lab) => (
                          <li
                            key={lab.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#E0E6ED] bg-[#F9FBFC]"
                          >
                            <span className="font-medium text-[#333]">{lab.title}</span>

                            {lab.has_access ? (
                              <Link
                                href={`/lab/${lab.lab_key}`}
                                className="text-sm font-semibold text-[#2D9CDB] hover:text-[#2789C2]"
                              >
                                Start Lab →
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#828282]">
                                <Lock size={14} />
                                Access Restricted
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
