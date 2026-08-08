'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/vn-ui';

type Lab = {
  lab_key: string;
  title: string;
  description: string | null;
  order_num: number;
  icon: string;
  has_access: boolean;
};

type Topic = {
  topic_key: string;
  topic_name: string;
  labs: Lab[];
};

type HomeClientProps = {
  topics: Topic[];
  displayName: string;
  isGuest: boolean;
};

const TOPIC_DETAILS: Record<
  string,
  {
    displayName: string;
    description: string;
    labCount: string;
    icon: string;
    image?: string;
  }
> = {
  linux: {
    displayName: 'Linux Administration',
    description:
      'Master the command line, manage file systems, configure networking, and understand user permissions.',
    labCount: '12 Labs',
    icon: 'terminal',
    image: '/images/linux_module.webp',
  },
  docker: {
    displayName: 'Docker Containerization',
    description:
      'Learn containerization basics, from writing Dockerfiles to managing multi-container applications.',
    labCount: '10 Labs',
    icon: 'widgets',
    image: '/images/docker_module.webp',
  },
};

export default function HomeClient({ topics, displayName, isGuest }: HomeClientProps) {
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleCardClick = (href: string, topicName: string) => {
    if (href === '#') return;
    setNavigatingTo(topicName);
    router.push(href);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Page Transition Overlay */}
      {navigatingTo && (
        <div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
          style={{ background: 'rgba(23,36,23,0.92)', backdropFilter: 'blur(4px)' }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-white" />
            <div className="space-y-1">
              <p className="font-body text-sm text-white/70">Opening {navigatingTo}...</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="font-headline text-[17px] font-bold" style={{ color: '#111827' }}>
              VN-Labs
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              style={{ color: '#6B7280' }}
            >
              <Icon name="notifications" className="text-[20px]" />
            </button>
            <button
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              style={{ color: '#6B7280' }}
            >
              <Icon name="settings" className="text-[20px]" />
            </button>
            {isGuest ? (
              <Link
                href="/login"
                className="btn-primary"
                style={{ fontSize: '13px', padding: '7px 16px', borderRadius: '6px' }}
              >
                SIGN IN
              </Link>
            ) : (
              <Link
                href="/student"
                className="btn-primary"
                style={{ fontSize: '13px', padding: '7px 16px', borderRadius: '6px' }}
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 pt-16 pb-20">
        <div className="mb-12 text-center">
          <h1
            className="font-headline text-[40px] font-bold leading-tight tracking-tight"
            style={{ color: '#111827', letterSpacing: '-0.02em' }}
          >
            DevOps Hands-on Labs
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed" style={{ color: '#6B7280' }}>
            Master infrastructure automation, containerization, and deployment pipelines in
            realistic, browser-based terminal environments. No setup required.
          </p>

          {/* Feature Tags */}
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {[
              { icon: 'terminal', label: 'Linux' },
              { icon: 'widgets', label: 'Docker' },
              { icon: 'lock_open', label: 'No Login Required' },
            ].map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-code text-[12px]"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-strong)',
                  color: '#374151',
                }}
              >
                <Icon name={tag.icon} className="text-[14px]" style={{ color: '#6B7280' }} />
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Top Learner Banner */}
        <div
          className="mb-10 flex items-center gap-4 rounded-xl px-6 py-4"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: 'var(--sidebar-bg)', color: '#4ADE80' }}
          >
            A
          </div>
          <span className="text-[14px]" style={{ color: '#374151' }}>
            Top Learner:{' '}
            <span className="font-semibold" style={{ color: '#111827' }}>
              @alex_dev
            </span>{' '}
            • 15,200 XP
          </span>
          <span className="ml-auto text-[20px]">🏅</span>
        </div>

        {/* Available Lab Modules */}
        <div className="mb-6">
          <h2 className="font-headline text-[17px] font-semibold" style={{ color: '#111827' }}>
            Available Lab Modules
          </h2>
        </div>

        {/* Topic Cards Grid */}
        <div id="topics" className="grid gap-6 md:grid-cols-2">
          {topics.map((topic) => {
            const details = TOPIC_DETAILS[topic.topic_key] ?? {
              displayName: topic.topic_name,
              description: 'Explore hands-on challenges and live terminal environments.',
              labCount: `${topic.labs.length} Labs`,
              icon: 'science',
            };

            const firstAccessibleLab = topic.labs.find((l) => l.has_access);
            const href = firstAccessibleLab ? `/lab/${firstAccessibleLab.lab_key}` : '#';

            return (
              <div
                key={topic.topic_key}
                onClick={() => handleCardClick(href, details.displayName)}
                className="group cursor-pointer rounded-xl transition-all duration-200"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--green-500)';
                  el.style.boxShadow = '0 4px 16px rgba(46,139,87,0.10)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--border)';
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Large Icon / WebP Image Area */}
                <div
                  className="flex items-center justify-center py-8"
                  style={{
                    background: '#F9FAF9',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: '12px 12px 0 0',
                  }}
                >
                  {details.image ? (
                    <div className="relative h-28 w-28 overflow-hidden rounded-2xl border bg-white p-2 shadow-sm flex items-center justify-center">
                      <img
                        src={details.image}
                        alt={details.displayName}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-2xl"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border-strong)',
                        color: '#9CA3AF',
                      }}
                    >
                      <Icon name={details.icon} className="text-[36px]" />
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <h3
                    className="font-headline text-[20px] font-bold mb-2 text-center"
                    style={{ color: '#111827' }}
                  >
                    {details.displayName}
                  </h3>
                  <p
                    className="text-center text-[14px] leading-relaxed mb-6"
                    style={{ color: '#6B7280' }}
                  >
                    {details.description}
                  </p>

                  {/* Arrow CTA */}
                  <div className="flex items-center justify-center">
                    {firstAccessibleLab ? (
                      <span
                        className="text-[20px] transition-transform group-hover:translate-x-1"
                        style={{ color: '#6B7280' }}
                      >
                        →
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[13px]" style={{ color: '#9CA3AF' }}>
                        <Icon name="lock" className="text-[14px]" /> Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {topics.length === 0 && (
            <div
              className="col-span-2 rounded-xl border p-16 text-center"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <Icon name="school" className="mb-4 text-[48px]" style={{ color: '#D1D5DB' }} />
              <h2 className="font-headline text-[18px] font-semibold" style={{ color: '#374151' }}>
                No labs available yet
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#9CA3AF' }}>
                Check back soon — lab content is being prepared.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <p className="text-[13px]" style={{ color: '#9CA3AF' }}>
            © 2024 VN-Labs. DevOps Education Platform.
          </p>
          <div className="flex gap-5">
            {['Documentation', 'Privacy', 'Terms'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[13px] transition-colors hover:text-gray-700"
                style={{ color: '#9CA3AF' }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
