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
    <div className="flex items-center gap-2.5 group">
      <div className="w-7 h-7 rounded border border-primary/40 bg-primary/10 flex items-center justify-center text-primary group-hover:border-primary transition-colors shadow-[0_0_10px_rgba(0,213,152,0.15)]">
        <Icon name="terminal" className="text-[17px] text-primary" />
      </div>
      <div className={cn(compact && 'hidden sm:block')}>
        <span className="font-display font-bold text-[18px] tracking-tight text-white">
          DevLab<span className="text-primary font-mono text-[16px]">.io</span>
        </span>
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
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold font-mono ring-1 ring-white/10 bg-surface-container border border-primary/30 text-primary',
        className
      )}
    >
      {initials || 'DL'}
    </div>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: 'active' | 'locked' | 'completed' | 'draft' | 'published' | 'warning' | 'new' | 'suspended' | 'idle' | 'offline' | 'running' | 'stopped';
  className?: string;
}) {
  const map: Record<string, string> = {
    active:    'badge-active',
    completed: 'badge-active',
    published: 'badge-active',
    running:   'badge-active',
    new:       'badge-new',
    draft:     'badge-offline',
    locked:    'badge-suspended',
    stopped:   'badge-suspended',
    suspended: 'badge-suspended',
    warning:   'badge-idle',
    idle:      'badge-idle',
    offline:   'badge-offline',
  };

  const label: Record<string, string> = {
    active: 'Active', locked: 'Locked', completed: 'Completed', draft: 'Draft',
    published: 'Published', warning: 'Idle', new: 'New', suspended: 'Suspended',
    idle: 'Idle', offline: 'Offline', running: 'RUNNING', stopped: 'STOPPED'
  };

  return (
    <span className={cn(map[status] || 'badge-offline', 'font-mono uppercase tracking-wider text-[10px]', className)}>
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
          'relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-200 ease-in-out border border-white/10',
          checked ? 'bg-primary/20 border-primary/50 shadow-[0_0_8px_rgba(0,213,152,0.3)]' : 'bg-surface-container',
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 rounded-full transition-all duration-200 ease-in-out shadow-sm',
            checked ? 'translate-x-5 bg-primary' : 'translate-x-1 bg-neutral-400',
          )}
        />
      </button>
      {label && (
        <span className="text-[13px] text-neutral-300 font-mono">
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
    <div className="card flex flex-col items-center justify-center gap-4 px-6 py-14 text-center bg-surface-container-low border border-white/[0.08]">
      <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <Icon name={icon} className="text-[32px]" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="font-headline text-[18px] font-semibold text-white">
          {title}
        </h2>
        <p className="text-[13px] text-neutral-400 leading-relaxed font-mono">
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
    <header className="sticky top-0 z-40 bg-[#101417]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark compact />
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-surface-container-low border border-primary/20 px-3 py-1 rounded text-[11px] font-mono text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00d598]"></span>
            <span className="text-white font-medium">MICROVM READY</span>
          </div>
          <UserAvatar name={name} />
        </div>
      </div>
    </header>
  );
}

