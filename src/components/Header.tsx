import Link from 'next/link';
import { cookies } from 'next/headers';
import ProfileDropdown from './ProfileDropdown';

interface HeaderProps {
  title: string;
}

type SessionDetails = {
  fullname?: string;
  username?: string;
  role?: string;
  csrf_token?: string;
};

export default async function Header({ title }: HeaderProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  let sessionDetails: SessionDetails | null = null;

  if (sessionCookie) {
    try {
      sessionDetails = JSON.parse(sessionCookie.value) as SessionDetails;
    } catch {
      console.error('Failed to parse session cookie for Header');
    }
  }
  
  const isAdmin = sessionDetails?.role === 'admin';

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-[#E0E6ED] sticky top-0 z-50">
      <meta name="csrf-token" content={sessionDetails?.csrf_token || ''} />

      <div className="flex items-center gap-4">
        <Link href="/login" className="text-[#828282] hover:text-[#333] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-sm font-bold text-[#333] uppercase tracking-widest">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link href="/dashboard" className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
            Admin Dashboard
          </Link>
        )}
        <button className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
          Grade
        </button>
        <button className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
          Start
        </button>
        <button className="btn-primary" style={{ fontSize: '13px', padding: '6px 14px' }}>
          Next
        </button>
        {sessionDetails && (
          <>
            <div className="w-px h-6 bg-[#E0E6ED] mx-1"></div>
            <ProfileDropdown
              fullname={sessionDetails.fullname || ''}
              username={sessionDetails.username || ''}
              csrfToken={sessionDetails.csrf_token}
            />
          </>
        )}
      </div>
    </header>
  );
}
