import Link from 'next/link';
import { cn } from '@/lib/utils';
import StudentProfileMenu from '@/components/StudentProfileMenu';

export function Icon({
  name,
  filled = false,
  className,
  style,
}: {
  name: string;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span 
      className={cn('material-symbols-outlined select-none', filled && 'material-symbols-filled', className)} 
      aria-hidden="true"
      style={style}
    >
      {name}
    </span>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{
          background: '#4A4466',
          border: '1px solid rgba(74,68,102,0.25)',
        }}
      >
        <Icon name="terminal" className="text-xl" style={{ color: '#F1F7D4' }} />
      </div>
      <div className={cn(compact && 'hidden sm:block')}>
        <div className="font-headline text-[17px] font-bold" style={{ color: '#4A4466' }}>VN-Labs</div>
        <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'rgba(74,68,102,0.60)' }}>DevOps Lab Platform</div>
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
    <div
      className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold', className)}
      style={{ background: '#4A4466', color: '#F1F7D4' }}
    >
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
  name,
}: {
  active?: 'Class' | 'Module' | 'Profile';
  name: string;
}) {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-sm"
      style={{
        background: 'rgba(249,252,232,0.94)',
        borderBottom: '1px solid #c8dfc9',
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
        <BrandMark compact />
        <StudentProfileMenu name={name} />
      </div>
    </header>
  );
}
