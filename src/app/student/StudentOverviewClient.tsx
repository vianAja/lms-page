'use client';

import { Icon } from '@/components/vn-ui';

type StudentOverviewClientProps = {
  displayName: string;
  stats: {
    labsCompleted: number;
    activeCourses: number;
    streak: number;
    totalXP: number;
  };
};

// Simulated sparkline data for the area chart
const SPARKLINE_POINTS = [0, 50, 86, 123, 260, 243, 480];
const LABELS = [0, 5, 10, 15, 20, 25, 30];

const RECENT_ACTIVITY = [
  { text: 'Completed Lab: Pod Networking', time: '2 hours ago' },
  { text: 'Earned +50 XP', time: 'Yesterday' },
  { text: 'Started course: CI/CD Pipelines', time: 'Oct 24, 2023' },
  { text: 'Completed Lab: Docker Basics', time: 'Oct 22, 2023' },
];

const ACTIVE_CLASSES = [
  { name: 'Introduction to Kubernetes', module: 'Module 3: Deployments & Services', progress: 65, status: 'In Progress' },
  { name: 'CI/CD Pipelines Fundamentals', module: 'Module 1: Version Control Basics', progress: 15, status: 'In Progress' },
];

function AreaChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const w = 540;
  const h = 200;
  const pad = { top: 20, right: 10, bottom: 30, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const xs = data.map((_, i) => pad.left + (i / (data.length - 1)) * chartW);
  const ys = data.map((v) => pad.top + chartH - (v / max) * chartH);

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const areaPath = `${linePath} L${xs[xs.length - 1]},${h - pad.bottom} L${xs[0]},${h - pad.bottom} Z`;

  // Y-axis labels
  const yLabels = [0, 100, 200, 300];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 220 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E8B57" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2E8B57" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y gridlines + labels */}
      {yLabels.map((v) => {
        const y = pad.top + chartH - (v / max) * chartH;
        return (
          <g key={v}>
            <line x1={pad.left} x2={w - pad.right} y1={y} y2={y} stroke="#E5E7EB" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">{v}</text>
          </g>
        );
      })}

      {/* X labels */}
      {LABELS.map((lbl, i) => {
        const x = pad.left + (i / (LABELS.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={h - pad.bottom + 16} textAnchor="middle" fontSize="11" fill="#9CA3AF">{lbl}</text>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#2E8B57" strokeWidth="2" strokeLinejoin="round" />

      {/* Data points with labels */}
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r="3.5" fill="#2E8B57" />
          {i > 0 && (
            <text x={x} y={ys[i] - 8} textAnchor="middle" fontSize="10" fill="#6B7280">{data[i]}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function StudentOverviewClient({ displayName, stats }: StudentOverviewClientProps) {
  const statCards = [
    { label: 'LABS COMPLETED', value: stats.labsCompleted, icon: 'check_circle', suffix: '' },
    { label: 'ACTIVE CLASSES', value: stats.activeCourses, icon: 'menu_book', suffix: '' },
    { label: 'STREAK', value: stats.streak, icon: 'local_fire_department', suffix: 'days' },
    { label: 'TOTAL XP', value: stats.totalXP, icon: 'military_tech', suffix: '' },
  ];

  return (
    <div className="space-y-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-[32px] font-bold" style={{ color: '#111827' }}>
            Hi {displayName}
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: '#6B7280' }}>
            Welcome back to your lab environment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}>
            <Icon name="notifications" className="text-[20px]" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm" style={{ background: 'var(--green-500)', color: '#fff' }}>
            {displayName[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-caps" style={{ color: '#9CA3AF' }}>{card.label}</span>
              <Icon name={card.icon} className="text-[18px]" style={{ color: '#D1D5DB' }} />
            </div>
            <div className="font-headline text-[36px] font-bold" style={{ color: '#111827' }}>
              {card.value.toLocaleString()}
            </div>
            {card.suffix && (
              <div className="mt-1 text-[13px]" style={{ color: '#9CA3AF' }}>{card.suffix}</div>
            )}
          </div>
        ))}
      </div>

      {/* Activity Chart + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Area Chart */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="font-headline text-[15px] font-semibold" style={{ color: '#111827' }}>
              ACTIVITY GROWTH
            </span>
            <span className="text-[12px]" style={{ color: '#9CA3AF' }}>Last 30 days</span>
          </div>
          <div className="px-4 py-3">
            <AreaChart data={SPARKLINE_POINTS} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <span className="font-headline text-[14px] font-semibold" style={{ color: '#111827' }}>
              RECENT ACTIVITY
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <div
                  className="mt-1 h-2 w-2 rounded-full shrink-0"
                  style={{ background: i === 0 ? 'var(--green-500)' : '#D1D5DB' }}
                />
                <div>
                  <p className="text-[13px] font-medium" style={{ color: '#111827' }}>{item.text}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: '#9CA3AF' }}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t px-5 py-3" style={{ borderColor: 'var(--border)' }}>
            <button className="text-label-caps w-full text-center transition-colors hover:text-green-600" style={{ color: 'var(--green-500)' }}>
              VIEW ALL HISTORY
            </button>
          </div>
        </div>
      </div>

      {/* Active Classes */}
      <div>
        <h2 className="font-headline text-[17px] font-semibold mb-4" style={{ color: '#111827' }}>
          Active Classes
        </h2>
        <div className="space-y-4">
          {ACTIVE_CLASSES.map((cls, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-[15px]" style={{ color: '#111827' }}>{cls.name}</div>
                  <div className="mt-0.5 text-[12px]" style={{ color: '#9CA3AF' }}>{cls.module}</div>
                </div>
                <span className="badge-new">{cls.status}</span>
              </div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px]" style={{ color: '#9CA3AF' }}>Progress</span>
                <span className="font-code text-[12px]" style={{ color: '#374151' }}>{cls.progress}%</span>
              </div>
              <div className="progress-track mb-4">
                <div className="progress-fill" style={{ width: `${cls.progress}%` }} />
              </div>
              <div className="flex justify-end">
                <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 20px' }}>
                  {cls.progress === 100 ? 'Explore' : 'Continue'} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
