'use client';

import { Icon } from '@/components/vn-ui';

// Radar chart data matching the mockup
const SKILLS = [
  { label: 'Linux', value: 75 },
  { label: 'DevOps', value: 60 },
  { label: 'Cloud', value: 85 },
  { label: 'Kubernetes', value: 50 },
  { label: 'Networking', value: 65 },
];

const BADGES = [
  { label: 'First Lab Completed', icon: 'military_tech', count: 1 },
  { label: '500 XP Milestone', icon: 'stars', count: 1 },
  { label: '5-Day Streak', icon: 'local_fire_department', count: 1 },
  { label: 'Kubernetes Intro', icon: 'hub', count: 1 },
];

const MILESTONES = [
  { date: 'Oct 15, 2023', label: 'Joined VN-Labs' },
  { date: 'Oct 20, 2023', label: 'Completed First Lab' },
  { date: 'Oct 24, 2023', label: 'Earned 500 XP' },
  { date: 'Nov 1, 2023', label: 'Kubernetes Intro Certified' },
];

function RadarChart({ skills }: { skills: typeof SKILLS }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 90;
  const n = skills.length;
  const levels = [25, 50, 75, 100];

  function polar(angle: number, r: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  const angleStep = 360 / n;

  // Grid polygons
  const gridPolygons = levels.map((lvl) => {
    const points = skills
      .map((_, i) => {
        const pt = polar(i * angleStep, (lvl / 100) * maxR);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
    return { points, lvl };
  });

  // Data polygon
  const dataPoints = skills.map((s, i) => {
    const pt = polar(i * angleStep, (s.value / 100) * maxR);
    return pt;
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  // Axis lines + labels
  const axes = skills.map((s, i) => {
    const end = polar(i * angleStep, maxR);
    const labelPt = polar(i * angleStep, maxR + 22);
    return { end, labelPt, label: s.label, value: s.value };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] mx-auto">
      {/* Grid */}
      {gridPolygons.map(({ points }, idx) => (
        <polygon
          key={idx}
          points={points}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {axes.map((ax, i) => (
        <line key={i} x1={cx} y1={cy} x2={ax.end.x} y2={ax.end.y} stroke="#E5E7EB" strokeWidth="1" />
      ))}

      {/* Data area */}
      <path d={dataPath} fill="rgba(46,139,87,0.18)" stroke="#2E8B57" strokeWidth="2" strokeLinejoin="round" />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2E8B57" />
      ))}

      {/* Labels */}
      {axes.map((ax, i) => (
        <text
          key={i}
          x={ax.labelPt.x}
          y={ax.labelPt.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
          fill="#6B7280"
        >
          {ax.label}
          {'\n'}
          <tspan x={ax.labelPt.x} dy="14" fontSize="10" fill="#9CA3AF">{ax.value}%</tspan>
        </text>
      ))}
    </svg>
  );
}

export default function StudentProgressClient({ displayName }: { displayName: string }) {
  return (
    <div className="max-w-[1100px] space-y-8">
      {/* Header */}
      <h1 className="font-headline text-[28px] font-bold" style={{ color: '#111827' }}>
        Achievements
      </h1>

      {/* Badges */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {BADGES.map((badge) => (
          <div key={badge.label} className="card flex flex-col items-center gap-3 py-6 px-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'var(--green-50)', border: '2px solid var(--green-100)' }}
            >
              <Icon name={badge.icon} className="text-[28px]" style={{ color: 'var(--green-500)' }} />
            </div>
            <div className="text-center">
              <div className="font-code text-[11px] font-semibold" style={{ color: '#374151' }}>
                {badge.label}
              </div>
              <div className="mt-1 font-headline text-[18px] font-bold" style={{ color: '#111827' }}>
                ({badge.count})
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skill Distribution */}
      <div>
        <h2 className="font-headline text-[20px] font-semibold mb-4" style={{ color: '#111827' }}>
          Skill Distribution
        </h2>
        <div className="card p-6">
          <RadarChart skills={SKILLS} />
        </div>
      </div>

      {/* Milestone Timeline */}
      <div>
        <h2 className="font-headline text-[20px] font-semibold mb-4" style={{ color: '#111827' }}>
          Milestone Timeline
        </h2>
        <div className="card p-6">
          {/* Timeline track */}
          <div className="relative flex items-start">
            {/* Horizontal line */}
            <div
              className="absolute top-[14px] left-0 right-0 h-px"
              style={{ background: 'var(--green-500)' }}
            />

            {MILESTONES.map((m, i) => (
              <div key={i} className="relative flex flex-1 flex-col items-center gap-3">
                {/* Dot */}
                <div
                  className="z-10 h-4 w-4 rounded-full ring-2 ring-white"
                  style={{ background: 'var(--green-500)' }}
                />
                {/* Label below/above alternating */}
                <div className={`text-center ${i % 2 === 0 ? 'mt-2' : '-mt-16 mb-2'}`}>
                  <div className="font-code text-[10px]" style={{ color: '#9CA3AF' }}>{m.date} —</div>
                  <div className="font-code text-[10px] font-semibold" style={{ color: '#374151' }}>
                    {m.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
