'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/vn-ui';

type ClassItem = {
  topic_key: string;
  topic_name: string;
  progress: number;
  status: string;
  completed: number;
  total: number;
  currentModule: string;
  href: string;
  icon: string;
};

const ICON_MAP: Record<string, string> = {
  linux: 'terminal',
  docker: 'widgets',
  kubernetes: 'hub',
  cicd: 'sync_alt',
  networking: 'wifi',
  security: 'security',
};

type Filter = 'All' | 'In Progress' | 'Completed';

export default function StudentClassesClient({ classes }: { classes: ClassItem[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = classes.filter((c) => {
    const matchSearch = c.topic_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'All' ||
      (filter === 'In Progress' && c.status === 'In Progress') ||
      (filter === 'Completed' && c.status === 'Completed');
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-[1100px] space-y-6">
      {/* Header */}
      <h1 className="font-headline text-[28px] font-bold" style={{ color: '#111827' }}>
        My Classes
      </h1>

      {/* Search + Filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search box */}
        <div className="relative flex-1">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
            style={{ color: '#9CA3AF' }}
          />
          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-9"
          />
        </div>

        {/* Filter chips */}
        <div className="filter-row shrink-0">
          {(['All', 'In Progress', 'Completed'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((cls) => {
          const iconName = ICON_MAP[cls.topic_key] || cls.icon || 'science';
          const actionLabel =
            cls.status === 'Completed' ? 'Explore' : cls.progress > 0 ? 'Resume' : 'Start';

          return (
            <div key={cls.topic_key} className="card p-5">
              {/* Top section */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: 'var(--green-50)',
                    border: '1px solid var(--green-100)',
                    color: 'var(--green-600)',
                  }}
                >
                  <Icon name={iconName} className="text-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-headline text-[16px] font-semibold" style={{ color: '#111827' }}>
                    {cls.topic_name}
                  </div>
                  <div className="mt-0.5 truncate text-[12px]" style={{ color: '#9CA3AF' }}>
                    {cls.currentModule}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="mb-3 h-px" style={{ background: 'var(--border)' }} />

              {/* Progress */}
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px]" style={{ color: '#6B7280' }}>Progress</span>
                <span className="font-code text-[12px] font-semibold" style={{ color: '#374151' }}>
                  {cls.progress}%
                </span>
              </div>
              <div className="progress-track mb-4">
                <div className="progress-fill" style={{ width: `${cls.progress}%` }} />
              </div>

              {/* CTA */}
              <div className="flex justify-end">
                <Link
                  href={cls.href}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                >
                  {actionLabel} →
                </Link>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            className="col-span-2 rounded-xl border py-16 text-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Icon name="search_off" className="text-[48px] mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-[14px]" style={{ color: '#9CA3AF' }}>
              No classes match your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
