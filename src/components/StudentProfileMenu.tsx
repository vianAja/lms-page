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
        className="hidden min-h-9 items-center gap-2.5 rounded border border-white/[0.08] bg-surface-container-low px-3 py-1.5 transition-all hover:border-white/20 hover:bg-surface-container md:flex"
      >
        <UserAvatar name={name} />
        <div className="min-w-0 text-left">
          <div className="truncate font-headline text-[13px] font-semibold text-white">{name}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-primary">Student</div>
        </div>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="text-[16px] text-neutral-400" />
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
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-44 rounded-lg border border-white/[0.08] bg-[#161d24]/95 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left font-mono text-[12px] text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="logout" className="text-[16px] text-primary" />
            {isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

