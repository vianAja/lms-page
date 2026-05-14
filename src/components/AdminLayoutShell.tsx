'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BrandMark, Icon, UserAvatar } from '@/components/vn-ui';
import { cn } from '@/lib/utils';

type AdminLayoutShellProps = {
  adminName: string;
  counts: {
    users: number;
    classes: number;
    labs: number;
  };
  children: React.ReactNode;
};

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '/dashboard/users', label: 'Users', icon: 'group', countKey: 'users' as const },
  { href: '/dashboard/classes', label: 'Classes', icon: 'assignment', countKey: 'classes' as const },
  { href: '/dashboard/manage-student', label: 'Labs', icon: 'science', countKey: 'labs' as const },
  { href: '/dashboard/settings', label: 'Settings', icon: 'settings' },
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
    <div className="flex h-full w-80 flex-col border-r border-outline-variant bg-surface px-4 py-5">
      <div className="border-b border-outline-variant pb-5">
        <BrandMark />
        <div className="pt-3 text-label-caps text-on-surface-variant">Admin Panel</div>
      </div>

      <nav className="flex-1 space-y-2 py-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 font-code text-code-md transition-colors',
                isActive
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface',
              )}
            >
              <Icon name={item.icon} filled={isActive} />
              <span className="flex-1">{item.label}</span>
              {item.countKey ? (
                <span className="rounded-full border border-outline-variant bg-surface-container-high px-2 py-0.5 text-[11px] leading-none text-on-surface-variant">
                  {counts[item.countKey]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-outline-variant pt-4">
        <form action="/api/auth/logout" method="post" className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container p-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={adminName} />
            <div>
              <div className="font-body text-body-sm text-on-surface">{adminName}</div>
              <div className="text-label-caps text-on-surface-variant">Administrator</div>
            </div>
          </div>
          <button aria-label="Log out" className="focus-ring flex h-10 w-10 items-center justify-center rounded-sm text-on-surface-variant transition-colors hover:text-error">
            <Icon name="logout" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLayoutShell({ adminName, counts, children }: AdminLayoutShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-surface-container-lowest text-on-surface">
      <aside className="sticky top-0 hidden h-dvh md:flex">
        <Sidebar adminName={adminName} counts={counts} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button aria-label="Close navigation" className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
          <Sidebar adminName={adminName} counts={counts} onNavigate={() => setOpen(false)} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-4 backdrop-blur md:hidden">
          <button
            aria-label="Open navigation"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-sm border border-outline-variant bg-surface-container-high"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <BrandMark compact />
          <UserAvatar name={adminName} />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
