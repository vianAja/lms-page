'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark, Icon } from '@/components/vn-ui';
import { StudentFrame } from '@/components/AppFrame';

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
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    tags: string[];
    icon: string;
    accent: string; // hex
  }
> = {
  linux: {
    displayName: 'Linux Administration',
    description:
      'Essential Linux skills for DevOps. Master shell scripting, file manipulation, directory navigation, and system administration fundamentals.',
    difficulty: 'Beginner',
    tags: ['Shell', 'Files', 'CLI', 'Permissions'],
    icon: 'terminal',
    accent: '#4A4466',
  },
  docker: {
    displayName: 'Docker Containerization',
    description:
      'Containerization with Docker. Learn container execution, image management, port mapping, and service verification in real environments.',
    difficulty: 'Beginner',
    tags: ['Containers', 'Images', 'Nginx', 'Networking'],
    icon: 'widgets',
    accent: '#6EADBC',
  },
};

const DIFFICULTY_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: {
    bg: 'rgba(159,203,173,0.12)',
    text: '#3d8a5f',
    border: 'rgba(159,203,173,0.40)',
  },
  Intermediate: {
    bg: 'rgba(110,173,188,0.12)',
    text: '#2d7a8a',
    border: 'rgba(110,173,188,0.40)',
  },
  Advanced: {
    bg: 'rgba(74,68,102,0.10)',
    text: '#4A4466',
    border: 'rgba(74,68,102,0.30)',
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

  const content = (
    <>
      {/* Page Transition Overlay */}
      {navigatingTo && (
        <div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center animate-fade-in"
          style={{ background: '#4A4466' }}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border border-[#F1F7D4]/40" />
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A4466] border-t-[#F1F7D4]" />
            </div>
            <div className="space-y-1">
              <h2 className="font-headline text-lg font-bold text-[#F1F7D4]">Preparing Lab Environment</h2>
              <p className="font-mono text-xs text-[#F1F7D4]/60">Opening {navigatingTo}...</p>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1200px] px-6 py-12 md:py-16">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-block rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest"
                style={{
                  background: 'rgba(74,68,102,0.10)',
                  color: '#4A4466',
                  border: '1px solid rgba(74,68,102,0.20)',
                }}
              >
                Learning Pathways
              </span>
              {isGuest ? (
                <span
                  className="inline-block rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest"
                  style={{
                    background: 'rgba(159,203,173,0.18)',
                    color: '#3d8a5f',
                    border: '1px solid rgba(159,203,173,0.35)',
                  }}
                >
                  Guest access enabled
                </span>
              ) : (
                <span
                  className="inline-block rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest"
                  style={{
                    background: 'rgba(110,173,188,0.15)',
                    color: '#2d7a8a',
                    border: '1px solid rgba(110,173,188,0.28)',
                  }}
                >
                  Signed in as {displayName}
                </span>
              )}
            </div>
            <h1
              className="font-headline text-3xl font-bold tracking-tight md:text-4xl"
              style={{ color: '#4A4466' }}
            >
              DevOps Hands-on Labs
            </h1>
            <p
              className="mt-3 max-w-2xl text-base leading-relaxed"
              style={{ color: 'rgba(74,68,102,0.75)' }}
            >
              Explore Linux and Docker labs instantly. You can open the web terminal right away, and
              sign in later to save progress and unlock personalized access.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {isGuest ? (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all"
                  style={{
                    background: '#4A4466',
                    color: '#F1F7D4',
                    border: '1px solid #4A4466',
                  }}
                >
                  Sign In
                </Link>
                <a
                  href="#topics"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all"
                  style={{
                    background: 'rgba(110,173,188,0.12)',
                    color: '#2d7a8a',
                    border: '1px solid rgba(110,173,188,0.28)',
                  }}
                >
                  Explore Labs
                </a>
              </>
            ) : (
              <a
                href="#topics"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all"
                style={{
                  background: 'rgba(110,173,188,0.12)',
                  color: '#2d7a8a',
                  border: '1px solid rgba(110,173,188,0.28)',
                }}
              >
                Jump to Labs
              </a>
            )}
          </div>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {[
            { label: 'Linux', copy: 'Shell basics, filesystem navigation, permissions, and scripting.' },
            { label: 'Docker', copy: 'Run containers, map ports, and work with multi-container stacks.' },
            { label: 'No login required', copy: 'Open the terminal and try labs immediately as a guest.' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border bg-white p-5"
              style={{ borderColor: '#c8dfc9', boxShadow: '0 1px 4px rgba(74,68,102,0.06)' }}
            >
              <div className="mb-2 font-headline text-lg font-bold" style={{ color: '#4A4466' }}>
                {item.label}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(74,68,102,0.72)' }}>
                {item.copy}
              </p>
            </div>
          ))}
        </div>

        {/* Topic Cards Grid */}
        <div id="topics" className="grid gap-6 md:grid-cols-2">
          {topics.map((topic) => {
            const details = TOPIC_DETAILS[topic.topic_key] ?? {
              displayName: topic.topic_name,
              description: 'Explore hands-on challenges and live environments.',
              difficulty: 'Beginner' as const,
              tags: ['DevOps', 'Labs'],
              icon: 'science',
              accent: '#9FCBAD',
            };

            const totalLabs = topic.labs.length;
            const accessibleCount = topic.labs.filter((l) => l.has_access).length;
            const firstAccessibleLab = topic.labs.find((l) => l.has_access);
            const diffStyle = DIFFICULTY_COLOR[details.difficulty] ?? DIFFICULTY_COLOR.Beginner;
            const href = firstAccessibleLab ? `/lab/${firstAccessibleLab.lab_key}` : '#';

            return (
              <div
                key={topic.topic_key}
                onClick={() => handleCardClick(href, details.displayName)}
                className="group block cursor-pointer overflow-hidden rounded-xl transition-all duration-300"
                style={{
                  background: '#ffffff',
                  border: '1px solid #c8dfc9',
                  boxShadow: '0 1px 4px rgba(74,68,102,0.06)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = details.accent;
                  el.style.boxShadow = `0 8px 32px rgba(74,68,102,0.12), 0 2px 8px rgba(74,68,102,0.08)`;
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = '#c8dfc9';
                  el.style.boxShadow = '0 1px 4px rgba(74,68,102,0.06)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div className="h-1 w-full" style={{ background: details.accent }} />
                <div className="p-6">
                  <div className="mb-5 flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{
                        background: `${details.accent}18`,
                        border: `1px solid ${details.accent}35`,
                        color: details.accent,
                      }}
                    >
                      <Icon name={details.icon} className="text-2xl" />
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide"
                      style={{
                        background: diffStyle.bg,
                        color: diffStyle.text,
                        border: `1px solid ${diffStyle.border}`,
                      }}
                    >
                      {details.difficulty}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <h2
                        className="font-headline text-xl font-bold tracking-tight transition-colors"
                        style={{ color: '#4A4466' }}
                      >
                        {details.displayName}
                      </h2>
                      <span className="text-sm" style={{ color: 'rgba(74,68,102,0.50)' }}>
                        {totalLabs} {totalLabs === 1 ? 'Lab' : 'Labs'}
                      </span>
                    </div>
                    <p className="mt-2 min-h-[48px] text-sm leading-relaxed" style={{ color: 'rgba(74,68,102,0.75)' }}>
                      {details.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="font-mono text-[11px] uppercase tracking-wide"
                        style={{ color: 'rgba(74,68,102,0.55)' }}
                      >
                        Access
                      </span>
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: 'rgba(74,68,102,0.55)' }}
                      >
                        {accessibleCount}/{totalLabs}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'rgba(159,203,173,0.25)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${totalLabs > 0 ? (accessibleCount / totalLabs) * 100 : 0}%`,
                          background: '#9FCBAD',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: '#e2eabe' }}>
                    <div className="flex flex-wrap gap-2">
                      {details.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium"
                          style={{
                            background: 'rgba(74,68,102,0.07)',
                            color: 'rgba(74,68,102,0.65)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {firstAccessibleLab ? (
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold transition-all" style={{ color: details.accent }}>
                        Start Lab
                        <Icon name="arrow_forward" className="text-[14px]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: 'rgba(74,68,102,0.40)' }}>
                        Locked
                        <Icon name="lock" className="text-[14px]" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {topics.length === 0 && (
          <div
            className="mt-16 rounded-xl border p-16 text-center"
            style={{ background: '#ffffff', borderColor: '#c8dfc9' }}
          >
            <Icon name="school" className="mb-4 text-[52px]" style={{ color: '#9FCBAD' }} />
            <h2 className="font-headline text-xl font-semibold" style={{ color: '#4A4466' }}>
              No labs available yet
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'rgba(74,68,102,0.65)' }}>
              Check back soon - lab content is being prepared for you.
            </p>
          </div>
        )}
      </main>
    </>
  );

  if (isGuest) {
    return (
      <div className="min-h-dvh" style={{ background: '#F1F7D4' }}>
        <header
          className="sticky top-0 z-50 border-b"
          style={{
            background: 'rgba(249,252,232,0.94)',
            borderColor: '#c8dfc9',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-6">
            <BrandMark />
            <div className="flex items-center gap-3">
              <span
                className="hidden rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest md:inline-flex"
                style={{
                  background: 'rgba(159,203,173,0.18)',
                  color: '#3d8a5f',
                  border: '1px solid rgba(159,203,173,0.35)',
                }}
              >
                Guest access
              </span>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition-all"
                style={{
                  background: '#4A4466',
                  color: '#F1F7D4',
                  border: '1px solid #4A4466',
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </header>
        {content}
      </div>
    );
  }

  return <StudentFrame name={displayName} active="Class">{content}</StudentFrame>;
}
