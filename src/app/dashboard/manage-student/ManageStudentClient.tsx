'use client';

import { useMemo, useState } from 'react';
import { EmptyState, ToggleSwitch, UserAvatar } from '@/components/vn-ui';

export type StudentClassAccessCard = {
  username: string;
  fullname: string | null;
  classes: Array<{
    class_id: number;
    class_name: string;
    class_description: string | null;
    is_enrolled: boolean;
  }>;
};

type ManageStudentClientProps = {
  students: StudentClassAccessCard[];
  toggleClassAccessAction: (formData: FormData) => void | Promise<void>;
};

export default function ManageStudentClient({ students, toggleClassAccessAction }: ManageStudentClientProps) {
  const [search, setSearch] = useState('');

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) => {
      const fullname = (student.fullname || '').toLowerCase();
      const username = student.username.toLowerCase();
      return fullname.includes(term) || username.includes(term);
    });
  }, [search, students]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-headline-lg text-on-surface">Manage Student Access</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Assign class access to students. All labs in assigned classes become accessible automatically.
        </p>
      </header>

      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by full name or username..."
          className="field w-full md:w-96"
        />
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon="group_off"
          title={students.length === 0 ? 'No Students Found' : 'No Matching Students'}
          copy={
            students.length === 0
              ? 'No active students are available in record.'
              : 'Try a different search keyword for fullname or username.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map((student) => {
            const enrolledCount = student.classes.filter((classItem) => classItem.is_enrolled).length;
            return (
              <article
                key={student.username}
                className="panel flex flex-col overflow-hidden transition-colors hover:border-primary-container"
              >
                <div className="flex-1 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <UserAvatar name={student.fullname || student.username} className="h-10 w-10" />
                    <div className="min-w-0">
                      <h3 className="truncate font-body text-body-md font-semibold text-on-surface">
                        {student.fullname || student.username}
                      </h3>
                      <p className="text-body-sm text-on-surface-variant">@{student.username}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {student.classes.map((classItem) => (
                      <div
                        key={`${student.username}-${classItem.class_id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-high p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-label-caps text-on-surface">{classItem.class_name}</p>
                          <p className="truncate text-body-sm text-on-surface-variant">
                            {classItem.class_description || 'No class description'}
                          </p>
                        </div>
                        <form action={toggleClassAccessAction}>
                          <input type="hidden" name="username" value={student.username} />
                          <input type="hidden" name="classId" value={classItem.class_id} />
                          <input
                            type="hidden"
                            name="currentEnrolled"
                            value={classItem.is_enrolled ? 'true' : 'false'}
                          />
                          <button type="submit" className="focus-ring rounded-full">
                            <ToggleSwitch checked={classItem.is_enrolled} />
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-5 py-3">
                  <span className="text-label-caps text-on-surface-variant">Assigned Classes</span>
                  <span className="font-code text-code-md text-secondary">
                    {enrolledCount}/{student.classes.length}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
