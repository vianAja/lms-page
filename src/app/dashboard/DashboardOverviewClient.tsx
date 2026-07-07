'use client';

import { useState } from 'react';
import { Icon } from '@/components/vn-ui';

type StatCard = {
  label: string;
  value: number | string;
  meta: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
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

// Simulated dual area chart data (engagement chart)
const CHART_LABELS = ['12:00', '18:00', '15 Apr', '24 Dec', '01:00', '02:00', '03:00'];
const READING_DATA  = [10,  40,  90,  150, 130, 100, 105];
const LAB_DATA      = [5,   30,  120, 200, 190, 160, 100];

function DualAreaChart() {
  const w = 800;
  const h = 200;
  const pad = { top: 16, right: 20, bottom: 30, left: 36 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const max = Math.max(...READING_DATA, ...LAB_DATA);

  function xs(i: number) { return pad.left + (i / (READING_DATA.length - 1)) * cw; }
  function ys(v: number) { return pad.top + ch - (v / max) * ch; }

  function makePath(data: number[]) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i)},${ys(v)}`).join(' ');
  }
  function makeArea(data: number[]) {
    return `${makePath(data)} L${xs(data.length - 1)},${h - pad.bottom} L${xs(0)},${h - pad.bottom} Z`;
  }

  const yTicks = [0, 50, 100, 150, 200];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 220 }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E8B57" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2E8B57" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTicks.map((v) => {
        const y = ys(v);
        return (
          <g key={v}>
            <line x1={pad.left} x2={w - pad.right} y1={y} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{v}</text>
          </g>
        );
      })}

      {CHART_LABELS.map((lbl, i) => (
        <text key={i} x={xs(i)} y={h - pad.bottom + 16} textAnchor="middle" fontSize="10" fill="#9CA3AF">{lbl}</text>
      ))}

      <path d={makeArea(READING_DATA)} fill="url(#g1)" />
      <path d={makePath(READING_DATA)} fill="none" stroke="#2E8B57" strokeWidth="2" strokeLinejoin="round" />

      <path d={makeArea(LAB_DATA)} fill="url(#g2)" />
      <path d={makePath(LAB_DATA)} fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const RECENT_USERS = [
  { username: 'jsmith_01', course: 'Intro to Security', status: 'active' },
  { username: 'm_davis_std', course: 'Cloud Architecture', status: 'idle' },
  { username: 'b_rodriguez', course: 'Database Management', status: 'offline' },
  { username: 'c_chen_99', course: 'Linux Basics', status: 'suspended' },
];

const LIVE_PROGRESS = [
  { student: 'k_lee_web', topic: 'Kube Cluster Demo', progress: 85, time: '01:15:42' },
  { student: 'a_khan_net', topic: 'DB Migration Test', progress: 42, time: '00:32:11' },
  { student: 'l_garcia', topic: 'Linux Basics v2', progress: 15, time: '00:15:30' },
];

const STATUS_STYLES: Record<string, string> = {
  active: 'badge-active',
  idle: 'badge-idle',
  offline: 'badge-offline',
  suspended: 'badge-suspended',
};

export default function DashboardOverviewClient({
  stats,
  activityRows,
  sparklinePoints,
  csrfToken,
}: DashboardOverviewClientProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="space-y-7 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-[26px] font-bold" style={{ color: '#111827' }}>
            VN-Labs | Student Monitoring Dashboard
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: '#9CA3AF' }}>
            Real-time metrics and administrative controls.
          </p>
        </div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="btn-primary flex items-center gap-2"
          style={{ fontSize: '13px' }}
        >
          <Icon name="filter_list" className="text-[16px]" />
          Filter Status
          <Icon name="expand_more" className="text-[16px]" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px]" style={{ color: '#9CA3AF' }}>{s.label}</span>
              <Icon name={s.icon} className="text-[20px]" style={{ color: '#D1D5DB' }} />
            </div>
            <div className="font-headline text-[32px] font-bold" style={{ color: '#111827' }}>
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              {s.trend && (
                <span
                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-code text-[11px] font-semibold"
                  style={{
                    background: s.trendUp ? 'var(--status-active-bg)' : 'var(--status-suspended-bg)',
                    color: s.trendUp ? 'var(--status-active-text)' : 'var(--status-suspended-text)',
                  }}
                >
                  {s.trendUp ? '↑' : '↓'} {s.trend}
                </span>
              )}
              <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{s.meta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement Chart */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span className="font-headline text-[15px] font-semibold" style={{ color: '#111827' }}>
            Student Engagement: Reading vs. Lab Activity
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-6 rounded-full" style={{ background: '#2E8B57' }} />
              <span className="text-[11px]" style={{ color: '#6B7280' }}>Material Reading</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-6 rounded-full" style={{ background: '#4ADE80' }} />
              <span className="text-[11px]" style={{ color: '#6B7280' }}>Hands-on Lab Activity</span>
            </div>
          </div>
        </div>
        <div
          className="px-4 py-4"
          style={{ background: 'var(--sidebar-bg)', borderRadius: '0 0 8px 8px' }}
        >
          <DualAreaChart />
        </div>
      </div>

      {/* Bottom two panels */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Recent Users */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="font-headline text-[15px] font-semibold" style={{ color: '#111827' }}>Recent Users</span>
            <button className="text-[12px] font-medium" style={{ color: 'var(--green-500)' }}>View All</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Assigned Course</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_USERS.map((u) => (
                <tr key={u.username}>
                  <td className="font-code text-[13px]">{u.username}</td>
                  <td className="text-[13px]" style={{ color: '#374151' }}>{u.course}</td>
                  <td>
                    <span className={STATUS_STYLES[u.status] || 'badge-offline'}>
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Student Progress */}
        <div className="card">
          <div className="card-header">
            <span className="font-headline text-[15px] font-semibold" style={{ color: '#111827' }}>
              Live Student Progress
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Progress</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {LIVE_PROGRESS.map((p) => (
                <tr key={p.student}>
                  <td>
                    <div className="font-code text-[12px]">{p.student}</div>
                    <div className="text-[11px]" style={{ color: '#9CA3AF' }}>{p.topic}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-track w-16">
                        <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="font-code text-[11px]" style={{ color: '#374151' }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td className="font-code text-[11px]" style={{ color: '#9CA3AF' }}>{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
