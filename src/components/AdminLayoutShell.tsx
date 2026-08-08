'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon, UserAvatar } from '@/components/vn-ui';
import { cn } from '@/lib/utils';

type AdminLayoutShellProps = {
  adminName: string;
  counts: {
    users: number;
    labs: number;
  };
  children: React.ReactNode;
};

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '/dashboard/manage-student', label: 'Student Management', icon: 'manage_accounts' },
  { href: '/dashboard/classes', label: 'Classes & Labs', icon: 'school', countKey: 'labs' as const },
  { href: '/dashboard/users', label: 'User Management', icon: 'group', countKey: 'users' as const },
];

function Sidebar({
  adminName,
  counts,
  onNavigate,
}: {
  adminName: string;
  counts: AdminLayoutShellProps['counts'];
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
        className="flex items-center gap-2 px-5 py-5"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ background: 'var(--green-500)' }}
        >
          <Icon name="terminal" className="text-[16px]" style={{ color: '#fff' }} />
        </div>
        <div>
          <div className="font-headline text-[15px] font-bold" style={{ color: '#D4EDDA' }}>
            VN-Labs
          </div>
          <div className="text-[10px] font-medium" style={{ color: 'var(--sidebar-muted)' }}>
            Admin Dashboard
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isOverview = item.href === '/dashboard';
          const isActive = isOverview
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn('sidebar-nav-item', isActive && 'active')}
            >
              <Icon name={item.icon} filled={isActive} className="text-[18px]" />
              <span className="flex-1 text-[13px]">{item.label}</span>
              {item.countKey ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-code font-semibold"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--sidebar-muted)' }}
                >
                  {counts[item.countKey]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '16px' }}>
        <Link
          href="/dashboard/settings"
          className={cn('sidebar-nav-item', pathname === '/dashboard/settings' && 'active')}
        >
          <Icon name="settings" className="text-[18px]" />
          <span className="text-[13px]">Settings</span>
        </Link>

        <div
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <UserAvatar name={adminName} className="h-7 w-7 text-[11px]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold" style={{ color: '#D4EDDA' }}>
              {adminName}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--sidebar-muted)' }}>
              Administrator
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              aria-label="Log out"
              className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:text-red-400"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              <Icon name="logout" className="text-[16px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayoutShell({ adminName, counts, children }: AdminLayoutShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 md:flex">
        <Sidebar adminName={adminName} counts={counts} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button aria-label="Close navigation" className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
          <Sidebar adminName={adminName} counts={counts} onNavigate={() => setOpen(false)} />
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
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <span className="font-headline text-[15px] font-bold" style={{ color: '#111827' }}>
            VN-Labs
          </span>
          <UserAvatar name={adminName} />
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
