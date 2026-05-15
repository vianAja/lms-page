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
        className="focus-ring hidden min-h-11 items-center gap-3 rounded-sm border border-outline-variant bg-surface-container-high px-3 py-2 md:flex"
      >
        <UserAvatar name={name} />
        <div className="min-w-0 text-left">
          <div className="truncate font-body text-body-sm text-on-surface">{name}</div>
          <div className="text-label-caps text-on-surface-variant">Student</div>
        </div>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="text-on-surface-variant" />
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
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-44 rounded-lg border border-outline-variant bg-surface-container-highest p-1 shadow-2xl shadow-black/40">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left font-code text-code-md text-on-surface transition-colors hover:bg-surface-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="logout" className="text-[18px]" />
            {isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
