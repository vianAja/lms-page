'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon, UserAvatar } from '@/components/vn-ui';
import { cn } from '@/lib/utils';

type StudentLayoutShellProps = {
  studentName: string;
  children: React.ReactNode;
};

const navItems = [
  { href: '/student', label: 'Overview', icon: 'dashboard', exact: true },
  { href: '/student/classes', label: 'My Classes', icon: 'menu_book' },
  { href: '/student/progress', label: 'Progress', icon: 'bar_chart' },
  { href: '/student/settings', label: 'Settings', icon: 'settings' },
];

function Sidebar({
  studentName,
  onNavigate,
}: {
  studentName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className="flex h-full w-[228px] flex-col"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Brand */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div className="font-headline text-[16px] font-bold" style={{ color: '#4ADE80' }}>
          VN-Labs
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: 'var(--sidebar-muted)' }}>
          Student Portal
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn('sidebar-nav-item', isActive && 'active')}
            >
              <Icon name={item.icon} filled={isActive} className="text-[18px]" />
              <span className="text-[13px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="px-3 pb-5" style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '16px' }}>
        <Link href="/support" className="sidebar-nav-item">
          <Icon name="help_outline" className="text-[18px]" />
          <span className="text-[13px]">Support</span>
        </Link>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="sidebar-nav-item w-full text-left">
            <Icon name="logout" className="text-[18px]" />
            <span className="text-[13px]">Logout</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StudentLayoutShell({ studentName, children }: StudentLayoutShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 md:flex">
        <Sidebar studentName={studentName} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            aria-label="Close navigation"
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <Sidebar studentName={studentName} onNavigate={() => setOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div
          className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 md:hidden"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            aria-label="Open navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ border: '1px solid var(--border)' }}
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <span className="font-headline text-[15px] font-bold" style={{ color: '#111827' }}>VN-Labs</span>
          <UserAvatar name={studentName} />
        </div>

        {/* Page Content */}
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
