import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Icon({
  name,
  filled = false,
  className,
}: {
  name: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('material-symbols-outlined select-none', filled && 'material-symbols-filled', className)} aria-hidden="true">
      {name}
    </span>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest">
        <Icon name="terminal" className="text-primary" />
      </div>
      <div className={cn(compact && 'hidden sm:block')}>
        <div className="font-headline text-headline-md font-semibold text-on-surface">VN-Labs</div>
        <div className="text-label-caps text-on-surface-variant">DevOps Lab Platform</div>
      </div>
    </div>
  );
}

export function UserAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-white', className)}>
      {initials || 'VN'}
    </div>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: 'active' | 'locked' | 'completed' | 'draft' | 'published' | 'warning';
  className?: string;
}) {
  const map = {
    active: 'border-primary-container/30 bg-primary-container/10 text-primary',
    locked: 'border-error/30 bg-error-container/20 text-error',
    completed: 'border-secondary/30 bg-secondary-container/10 text-secondary',
    draft: 'border-outline-variant bg-surface-container text-on-surface-variant',
    published: 'border-secondary/30 bg-secondary-container/10 text-secondary',
    warning: 'border-tertiary/30 bg-tertiary-container/10 text-tertiary',
  } as const;

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-code text-[12px] leading-none', map[status], className)}>
      {status}
    </span>
  );
}

export function ToggleSwitch({
  checked,
  label,
  className,
}: {
  checked: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out',
          checked ? 'bg-secondary' : 'bg-surface-container-highest',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full transition-all duration-200 ease-in-out',
            checked ? 'translate-x-6 bg-white' : 'translate-x-1 bg-outline',
          )}
        />
      </span>
      <span className="font-code text-code-md text-on-surface-variant">{label ?? (checked ? 'Active' : 'Revoked')}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  copy,
  cta,
}: {
  icon: string;
  title: string;
  copy: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <Icon name={icon} className="text-[64px] text-outline" />
      <div className="space-y-2">
        <h2 className="font-headline text-headline-md text-on-surface">{title}</h2>
        <p className="mx-auto max-w-md text-body-md text-on-surface-variant">{copy}</p>
      </div>
      {cta}
    </div>
  );
}

export function TopAppBar({
  active = 'Class',
  name,
}: {
  active?: 'Class' | 'Module' | 'Profile';
  name: string;
}) {
  const links = [
    { label: 'Class', href: '/' },
    { label: 'Module', href: '/progress' },
    { label: 'Profile', href: '/progress' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
        <BrandMark compact />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                'pb-1 font-body text-body-sm transition-colors hover:text-secondary',
                active === link.label ? 'border-b-2 border-secondary text-secondary' : 'text-on-surface-variant',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button aria-label="Open notifications" className="focus-ring relative flex h-11 w-11 items-center justify-center rounded-sm border border-outline-variant bg-surface-container-high text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary">
            <Icon name="notifications" />
            <span className="absolute right-2 top-2 rounded-full bg-error px-1.5 py-0.5 font-code text-[10px] leading-none text-[#1b0000]">3</span>
          </button>
          <div className="hidden items-center gap-3 rounded-sm border border-outline-variant bg-surface-container-high px-3 py-2 md:flex">
            <UserAvatar name={name} />
            <div className="min-w-0">
              <div className="truncate font-body text-body-sm text-on-surface">{name}</div>
              <div className="text-label-caps text-on-surface-variant">Student</div>
            </div>
          </div>
          <div className="md:hidden">
            <UserAvatar name={name} />
          </div>
        </div>
      </div>
    </header>
  );
}
