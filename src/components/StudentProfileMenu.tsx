'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, UserAvatar } from '@/components/vn-ui';

type StudentProfileMenuProps = {
  name: string;
};

export default function StudentProfileMenu({ name }: StudentProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } finally {
        router.push('/login');
        router.refresh();
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        onClick={() => setOpen((prev) => !prev)}
        className="hidden min-h-10 items-center gap-3 rounded-lg px-3 py-2 transition-colors md:flex"
        style={{
          background: 'rgba(74,68,102,0.07)',
          border: '1px solid #c8dfc9',
        }}
      >
        <UserAvatar name={name} />
        <div className="min-w-0 text-left">
          <div className="truncate text-sm font-medium" style={{ color: '#4A4466' }}>{name}</div>
          <div className="font-mono text-[11px] uppercase tracking-wide" style={{ color: 'rgba(74,68,102,0.55)' }}>Student</div>
        </div>
        <Icon name={open ? 'expand_less' : 'expand_more'} style={{ color: 'rgba(74,68,102,0.55)' }} />
      </button>

      <button
        type="button"
        aria-label="Open profile menu"
        onClick={() => setOpen((prev) => !prev)}
        className="focus-ring md:hidden"
      >
        <UserAvatar name={name} />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-44 rounded-lg p-1"
          style={{
            background: '#f9fce8',
            border: '1px solid #c8dfc9',
            boxShadow: '0 8px 32px rgba(74,68,102,0.15)',
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{ color: '#4A4466' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(74,68,102,0.07)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Icon name="logout" className="text-[18px]" />
            {isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
