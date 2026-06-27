'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/vn-ui';
import { csrfFetch } from '@/lib/client/csrf';

type StatCard = {
  label: string;
  value: number | string;
  meta: string;
  color: string;
};

type ActivityRow = {
  username: string;
  fullname: string | null;
  lab_id: string;
  has_access: boolean;
  changed_at: string;
};

type DashboardOverviewClientProps = {
  stats: StatCard[];
  activityRows: ActivityRow[];
  sparklinePoints: string[];
  csrfToken: string;
};

type FilterRange = 'today' | 'week' | 'month';

const RANGE_OPTIONS: Array<{ label: string; value: FilterRange }> = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

function getRangeStart(range: FilterRange): Date {
  const now = new Date();
  const start = new Date(now);

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === 'week') {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function DashboardOverviewClient({
  stats,
  activityRows,
  sparklinePoints,
  csrfToken,
}: DashboardOverviewClientProps) {
  const [range, setRange] = useState<FilterRange>('today');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredRows = useMemo(() => {
    const start = getRangeStart(range).getTime();
    return activityRows.filter((row) => {
      const changed = new Date(row.changed_at).getTime();
      return Number.isFinite(changed) && changed >= start;
    });
  }, [activityRows, range]);

  const handleDisconnect = (row: ActivityRow) => {
    startTransition(async () => {
      try {
        await csrfFetch('/api/sessions/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: row.username, labId: row.lab_id }),
        }, csrfToken);
      } finally {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">Overview</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Friday, May 15, 2026</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-lg border border-outline-variant bg-surface-container p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                className={`rounded-sm px-3 py-2 font-code text-[12px] ${
                  range === option.value ? 'bg-surface-variant text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <article key={stat.label} className="relative h-40 overflow-hidden rounded-xl border border-outline-variant bg-surface-container p-5 transition-colors hover:border-primary-container">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="text-body-sm text-on-surface-variant">{stat.label}</div>
              <div>
                <div className={`font-headline text-headline-xl ${stat.color}`}>{stat.value}</div>
                <div className="text-body-sm text-on-surface-variant">{stat.meta}</div>
              </div>
            </div>
            <svg className="absolute bottom-0 left-0 right-0 h-12 w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 30">
              <polyline points={sparklinePoints[index]} stroke="currentColor" className="text-primary-container" strokeWidth="2" fill="none" />
            </svg>
          </article>
        ))}
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high px-5 py-4">
          <div>
            <div className="text-label-caps text-on-surface-variant">Active Sessions</div>
            <h2 className="mt-1 font-headline text-headline-md text-on-surface">Recent Access Activity</h2>
          </div>
          <span className="rounded-full border border-outline-variant px-3 py-1 font-code text-[12px] text-on-surface-variant">
            {filteredRows.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-outline-variant text-label-caps text-on-surface-variant">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Lab</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={`${row.username}-${row.lab_id}-${index}`} className="border-b border-outline-variant/60 transition-colors hover:bg-surface-variant">
                  <td className="px-5 py-4">
                    <div className="font-body text-body-md text-on-surface">{row.fullname || row.username}</div>
                    <div className="text-body-sm text-on-surface-variant">@{row.username}</div>
                  </td>
                  <td className="px-5 py-4 font-code text-code-md text-on-surface">{row.lab_id}</td>
                  <td className="px-5 py-4 text-body-sm text-on-surface-variant">{18 + index}m</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={row.has_access ? 'completed' : 'locked'} className="capitalize" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDisconnect(row)}
                      disabled={isPending}
                      className="rounded-sm border border-error/30 bg-error-container/15 px-3 py-2 font-code text-[12px] text-error transition-colors hover:border-error disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Disconnect
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-body-sm text-on-surface-variant">
                    No activity for this filter range.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
