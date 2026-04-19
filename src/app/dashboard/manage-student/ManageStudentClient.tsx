'use client';

import { useMemo, useState } from 'react';

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
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">Manage Student</h1>
          <p className="text-[#828282] text-sm mt-1">Assign class access to students. All labs in an assigned class become accessible automatically.</p>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by full name or username..."
          className="w-full md:w-96 px-4 py-2.5 bg-white border border-[#E0E6ED] rounded-lg text-sm text-[#333] placeholder:text-[#BDBDBD] outline-none focus:ring-2 focus:ring-[#2D9CDB]/30 focus:border-[#2D9CDB]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => {
          const enrolledCount = student.classes.filter((classItem) => classItem.is_enrolled).length;
          return (
            <div key={student.username} className="bg-white border border-[#E0E6ED] rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#F2F5F8] border border-[#E0E6ED] flex items-center justify-center text-[#2D9CDB] font-bold text-lg">
                    {student.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#333] leading-tight">{student.fullname || student.username}</h3>
                    <p className="text-xs text-[#828282]">@{student.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {student.classes.map((classItem) => (
                    <div key={`${student.username}-${classItem.class_id}`} className="flex items-center justify-between p-3 bg-[#F9FBFC] rounded-lg border border-[#E0E6ED] gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#333] uppercase tracking-wider truncate">
                          {classItem.class_name}
                        </p>
                        <p className="text-xs text-[#828282] truncate">{classItem.class_description || 'No class description'}</p>
                      </div>
                      <form action={toggleClassAccessAction}>
                        <input type="hidden" name="username" value={student.username} />
                        <input type="hidden" name="classId" value={classItem.class_id} />
                        <input type="hidden" name="currentEnrolled" value={classItem.is_enrolled ? 'true' : 'false'} />
                        <button
                          type="submit"
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            classItem.is_enrolled ? 'bg-[#27AE60]' : 'bg-[#E0E6ED]'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              classItem.is_enrolled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-[#F9FBFC] border-t border-[#E0E6ED] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-widest text-[#828282]">Assigned Classes</span>
                <span className="text-[10px] font-bold uppercase text-[#27AE60]">
                  {enrolledCount}/{student.classes.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="bg-white border border-dashed border-[#E0E6ED] rounded-xl p-12 text-center">
          <p className="text-[#BDBDBD] font-medium font-bold text-sm">
            {students.length === 0 ? 'No students found in record.' : 'No students match your search.'}
          </p>
        </div>
      )}
    </div>
  );
}
