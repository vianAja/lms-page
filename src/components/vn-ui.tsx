import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    <div className="flex items-center gap-2">
      <div
        className={cn(compact && 'hidden sm:block')}
      >
        <div className="font-headline text-[17px] font-bold" style={{ color: '#111827' }}>
          VN-Labs
        </div>
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
      style={{ background: 'var(--green-500)', color: '#fff' }}
    >
      {initials || 'VN'}
    </div>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: 'active' | 'locked' | 'completed' | 'draft' | 'published' | 'warning' | 'new' | 'suspended' | 'idle' | 'offline';
  className?: string;
}) {
  const map: Record<string, string> = {
    active:    'badge-active',
    completed: 'badge-active',
    published: 'badge-active',
    new:       'badge-new',
    draft:     'badge-offline',
    locked:    'badge-suspended',
    suspended: 'badge-suspended',
    warning:   'badge-idle',
    idle:      'badge-idle',
    offline:   'badge-offline',
  };

  const label: Record<string, string> = {
    active: 'Active', locked: 'Locked', completed: 'Active', draft: 'Draft',
    published: 'Active', warning: 'Idle', new: 'New', suspended: 'Suspended',
    idle: 'Idle', offline: 'Offline',
  };

  return (
    <span className={cn(map[status] || 'badge-offline', className)}>
      {label[status] || status}
    </span>
  );
}

export function ToggleSwitch({
  checked,
  label,
  onChange,
  className,
}: {
  checked: boolean;
  label?: string;
  onChange?: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out',
          checked ? 'bg-[var(--green-500)]' : 'bg-gray-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white transition-all duration-200 ease-in-out shadow-sm',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
      {label && (
        <span className="text-[14px]" style={{ color: '#374151' }}>
          {label}
        </span>
      )}
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
    <div className="card flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <Icon name={icon} className="text-[64px]" style={{ color: '#D1D5DB' }} />
      <div className="space-y-2">
        <h2 className="font-headline text-[18px] font-semibold" style={{ color: '#374151' }}>
          {title}
        </h2>
        <p className="mx-auto max-w-md text-[14px]" style={{ color: '#9CA3AF' }}>
          {copy}
        </p>
      </div>
      {cta}
    </div>
  );
}

export function TopAppBar({
  name,
}: {
  active?: string;
  name: string;
}) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
        <BrandMark compact />
        <div className="flex items-center gap-2">
          <UserAvatar name={name} />
        </div>
      </div>
    </header>
  );
}
