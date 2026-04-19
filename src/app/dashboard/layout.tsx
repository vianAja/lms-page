import Link from 'next/link';
import Header from '@/components/Header';
import DashboardSidebar from '@/components/DashboardSidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (!sessionCookie) redirect('/login');
  
  const session = JSON.parse(sessionCookie.value);
  if (session.role !== 'admin') redirect('/lab/1-1');

  return (
    <div className="min-h-screen bg-[#F2F5F8] flex flex-col font-sans text-[#333]">
      <Header title="LMS Overview" />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#E0E6ED] flex-shrink-0 flex flex-col shadow-sm z-20">
          <div className="p-6 border-b border-[#F2F5F8]">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {session.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-[#828282] uppercase tracking-wider font-semibold">Welcome,</p>
                  <p className="text-sm font-bold text-[#333]">{session.fullname || session.username}</p>
                </div>
             </div>
          </div>

          <DashboardSidebar />

          <div className="p-4 border-t border-[#F2F5F8]">
            <p className="text-[10px] text-[#BDBDBD] text-center uppercase tracking-widest font-bold">LMS Platform v1.0</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           <div className="absolute top-0 left-0 right-0 h-32 bg-white border-b border-[#E0E6ED] -z-10"></div>
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
