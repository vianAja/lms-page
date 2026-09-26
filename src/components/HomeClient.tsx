'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon, StatusBadge } from '@/components/vn-ui';

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
    tag: string;
  }
> = {
  linux: {
    displayName: 'Linux Kernel & System Administration',
    description:
      'Execute kernel modules, inspect namespaces & cgroups, and master Linux sysadmin & eBPF tracing.',
    labCount: '12 Interactive Labs',
    icon: 'terminal',
    image: '/images/linux_module.webp',
    tag: 'Linux Internals',
  },
  docker: {
    displayName: 'Docker & OCI Container Runtime Architectures',
    description:
      'Deep dive into container runtimes, OCI specs, Dockerfile optimization, overlay network namespaces, and multi-container orchestration.',
    labCount: '10 Interactive Labs',
    icon: 'widgets',
    image: '/images/docker_module.webp',
    tag: 'Docker & OCI',
  },
};

export default function HomeClient({ topics, displayName, isGuest }: HomeClientProps) {
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const handleCardClick = (href: string, topicName: string) => {
    if (href === '#') return;
    setNavigatingTo(topicName);
    router.push(href);
  };

  const filteredTopics = topics.filter((t) => {
    if (activeFilter === 'docker' && t.topic_key !== 'docker') return false;
    if (activeFilter === 'linux' && t.topic_key !== 'linux') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.topic_name.toLowerCase().includes(q) ||
      t.topic_key.toLowerCase().includes(q) ||
      t.labs.some((l) => l.title.toLowerCase().includes(q) || (l.description && l.description.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-[#0b0f12] text-[#e0e3e7] font-mono text-[13px] selection:bg-primary/20 selection:text-primary">
      {/* Page Transition Overlay */}
      {navigatingTo && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0b0f12]/95 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary shadow-[0_0_15px_#00d598]" />
            <div className="space-y-1">
              <p className="font-headline text-[15px] font-semibold text-white">Spinning up Firecracker microVM...</p>
              <p className="font-mono text-[12px] text-primary">Provisioning TAP network interface & SSH tunnel to {navigatingTo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-50 h-16 w-full bg-[#101417]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded border border-primary/40 bg-primary/10 flex items-center justify-center text-primary group-hover:border-primary transition-colors shadow-[0_0_10px_rgba(0,213,152,0.15)]">
                <Icon name="terminal" className="text-[19px]" />
              </div>
              <span className="font-headline font-bold text-[19px] tracking-tight text-white">
                DevLab<span className="text-primary font-mono text-[17px]">.io</span>
              </span>
            </Link>
            <nav className="hidden xl:flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-white bg-white/[0.06] border border-white/[0.08] rounded text-[12px] font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#00d598]"></span>
                Explore Courses
              </Link>
              {!isGuest && (
                <Link href="/student" className="px-3 py-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.04] rounded transition-colors text-[12px] font-medium">
                  My Dashboard
                </Link>
              )}
              <a href="#how-it-works" className="px-3 py-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.04] rounded transition-colors text-[12px] font-medium">
                Architecture
              </a>
              <Link href="/dashboard" className="px-3 py-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.04] rounded transition-colors text-[12px] font-medium">
                Admin Panel
              </Link>
            </nav>
          </div>

          {/* Search Input in Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[18px]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, commands, lab modules..."
                className="w-full h-9 pl-9 pr-14 bg-surface-container-low text-white font-mono text-[12px] rounded border border-white/[0.08] placeholder:text-neutral-500 focus:outline-none focus:border-primary/60 focus:bg-surface-container transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-400 border border-white/[0.08]">⌘K</kbd>
            </div>
          </div>

          {/* Status & Profile Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-surface-container-low border border-primary/20 px-3 py-1 rounded text-[11px] font-mono text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00d598]"></span>
              <span className="text-white font-medium">FIRECRACKER VMM</span>
              <span className="text-neutral-600">•</span>
              <span className="text-primary font-mono font-medium">READY</span>
            </div>

            {isGuest ? (
              <Link
                href="/login"
                className="btn-primary"
              >
                SIGN IN
              </Link>
            ) : (
              <Link
                href="/student"
                className="flex items-center gap-2 border border-white/[0.08] bg-surface-container-low px-3 py-1.5 rounded hover:border-primary/40 transition-all text-white font-headline font-semibold text-[13px]"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-mono text-[11px]">
                  {displayName[0]?.toUpperCase()}
                </div>
                <span>{displayName}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="w-full bg-[#0b0f12]">
        {/* Hero Banner Section with Radial Background */}
        <section className="relative w-full overflow-hidden bg-[#101417] pt-12 pb-10 px-6 border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-[radial-gradient(#00d598_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none"></div>
          <div className="absolute -top-32 right-12 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
          <div className="absolute top-20 left-1/3 w-64 h-64 rounded-full bg-secondary/10 blur-[100px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
            {/* Status Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-300 bg-surface-container-low border border-white/[0.08] px-3 py-1 rounded">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                <span className="font-semibold text-primary tracking-wide">HYPERVISOR POOL ACTIVE:</span>
                <span className="text-neutral-300">Sub-second MicroVM Boot • 100% Isolated Linux Kernel</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                <span>Latency:</span>
                <span className="text-primary font-mono font-medium">12ms</span>
                <span className="mx-1 text-neutral-600">•</span>
                <span className="font-mono">Kernel: v6.8.0-firecracker</span>
              </div>
            </div>

            {/* Main Headline & Telemetry Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mt-2">
              <div className="lg:col-span-8 flex flex-col gap-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
                  <Icon name="terminal" className="text-[16px] text-primary" />
                  Next-Gen Virtual Lab LMS
                </div>
                <h1 className="font-headline text-[32px] lg:text-[44px] text-[#f9fafb] tracking-tight leading-[1.15] font-semibold">
                  Master Systems Engineering &amp; DevOps with <span className="text-primary underline decoration-primary/40 decoration-2 underline-offset-8">Real microVM</span> Sandboxes.
                </h1>
                <p className="font-mono text-[13px] text-neutral-400 max-w-2xl leading-relaxed">
                  Execute real kernel modules, orchestrate Docker containers, and debug system call logs in isolated sub-second Firecracker microVMs directly inside your browser canvas.
                </p>
              </div>

              {/* Telemetry Card */}
              <div className="lg:col-span-4 bg-surface-container-low/90 backdrop-blur border border-white/[0.08] p-4 rounded-lg flex flex-col gap-3">
                <div className="flex items-center justify-between text-neutral-400 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <Icon name="memory" className="text-[16px] text-primary" /> Active MicroVM Host
                  </span>
                  <span className="text-primary font-mono font-semibold">99.98% Uptime</span>
                </div>
                <div className="w-full bg-[#0b0f12] h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                  <div className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full w-4/5 shadow-[0_0_10px_#00d598]"></div>
                </div>
                <div className="flex justify-between items-center text-neutral-400 text-[11px] font-mono pt-0.5">
                  <span>Cold-start boot: <strong className="text-white">340ms</strong></span>
                  <span>Isolation: <strong className="text-primary">Firecracker KVM</strong></span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-surface-container-lowest/80 backdrop-blur p-2.5 rounded-lg border border-white/[0.08] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mt-2">
              <div className="relative flex-1">
                <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-[18px]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter labs by technology, command, or topic (e.g. Linux, Docker, SSH)..."
                  className="w-full h-10 pl-10 pr-4 bg-surface-container-low text-white font-mono text-[12px] rounded border border-white/[0.08] focus:outline-none focus:border-primary/60 transition-all placeholder:text-neutral-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'all', label: 'All Modules' },
                  { key: 'linux', label: 'Linux Internals' },
                  { key: 'docker', label: 'Docker & OCI' },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-3 py-1.5 rounded text-[11px] font-mono font-semibold transition-all ${
                      activeFilter === filter.key
                        ? 'bg-primary text-[#0b0f12] shadow-[0_0_12px_rgba(0,213,152,0.3)]'
                        : 'bg-surface-container-low text-neutral-300 border border-white/[0.08] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Showcase Banner */}
        <section className="w-full px-6 py-6 bg-[#0b0f12]">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-surface-container-low via-[#161b1f] to-surface-container-low border border-white/[0.08] rounded-xl p-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-primary/10 via-transparent to-transparent pointer-events-none"></div>
              <div className="flex flex-col gap-2 z-10 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/15 text-primary border border-primary/30 font-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold">Curated Track</span>
                  <span className="text-neutral-400 font-mono text-[11px]">Interactive Real-world VM Labs</span>
                </div>
                <h2 className="font-headline text-[22px] lg:text-[26px] text-[#f9fafb] tracking-tight font-semibold">
                  Systems Engineer &amp; Cloud Native Architecture Track
                </h2>
                <p className="font-mono text-[13px] text-neutral-400 leading-relaxed">
                  Structured step-by-step roadmap from low-level Linux namespace isolation to multi-container microservice deployments.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-[11px] text-neutral-300">
                  <div className="flex items-center gap-1.5">
                    <Icon name="stacks" className="text-primary text-[16px]" /> Live Terminal Environment
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon name="terminal" className="text-primary text-[16px]" /> Command Execution Allowlist Protection
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-2 z-10 w-full lg:w-auto shrink-0">
                <a
                  href="#topics"
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-[#00d598] text-[#0b0f12] font-headline text-[14px] font-semibold rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,213,152,0.35)]"
                >
                  <span>Explore All Labs</span>
                  <Icon name="arrow_forward" className="text-[16px]" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Process (How It Works) */}
        <section id="how-it-works" className="w-full px-6 py-4 bg-[#0b0f12]">
          <div className="max-w-7xl mx-auto bg-surface-container-low border border-white/[0.08] rounded-xl p-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-primary uppercase font-bold tracking-wider">
                  <Icon name="bolt" className="text-[15px]" /> Instant MicroVM Architecture
                </div>
                <h3 className="font-headline text-[18px] text-white font-semibold mt-0.5">How DevLab Works: Real microVM Execution with Web Terminal</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-surface-container-lowest border border-white/[0.08] p-4 rounded-lg flex flex-col gap-1.5 relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="text-neutral-800 font-headline text-[48px] absolute -right-1 -bottom-2 select-none pointer-events-none font-bold">01</div>
                <div className="w-7 h-7 rounded border border-primary/40 bg-primary/10 text-primary flex items-center justify-center font-mono text-[12px] font-bold">01</div>
                <h4 className="font-headline text-[15px] font-semibold text-white pt-1">Select Module &amp; Topic</h4>
                <p className="font-mono text-[12px] text-neutral-400 leading-relaxed">Browse curated hands-on labs designed around Linux kernel mechanics and Docker containerization.</p>
              </div>

              <div className="bg-surface-container-lowest border border-white/[0.08] p-4 rounded-lg flex flex-col gap-1.5 relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="text-neutral-800 font-headline text-[48px] absolute -right-1 -bottom-2 select-none pointer-events-none font-bold">02</div>
                <div className="w-7 h-7 rounded border border-primary/40 bg-primary/10 text-primary flex items-center justify-center font-mono text-[12px] font-bold">02</div>
                <h4 className="font-headline text-[15px] font-semibold text-white pt-1">Launch MicroVM Session</h4>
                <p className="font-mono text-[12px] text-neutral-400 leading-relaxed">A dedicated Firecracker microVM initializes in milliseconds with full SSH root access and custom TAP interface.</p>
              </div>

              <div className="bg-surface-container-lowest border border-white/[0.08] p-4 rounded-lg flex flex-col gap-1.5 relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="text-neutral-800 font-headline text-[48px] absolute -right-1 -bottom-2 select-none pointer-events-none font-bold">03</div>
                <div className="w-7 h-7 rounded border border-primary/40 bg-primary/10 text-primary flex items-center justify-center font-mono text-[12px] font-bold">03</div>
                <h4 className="font-headline text-[15px] font-semibold text-white pt-1">Execute &amp; Verify Commands</h4>
                <p className="font-mono text-[12px] text-neutral-400 leading-relaxed">Run commands in the integrated WebTerminal with real-time feedback and dynamic allowlist verification.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Course / Topic Catalog Grid */}
        <section id="topics" className="w-full px-6 pt-4 pb-16 bg-[#0b0f12]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="font-headline text-[22px] font-semibold text-white">
                  Available Lab Modules ({filteredTopics.reduce((acc, t) => acc + t.labs.length, 0)} Total Labs)
                </h2>
                <p className="font-mono text-[12px] text-neutral-400 mt-0.5">
                  Select a module to spin up your microVM sandbox environment
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {filteredTopics.map((topic) => {
                const details = TOPIC_DETAILS[topic.topic_key] ?? {
                  displayName: topic.topic_name,
                  description: 'Explore hands-on challenges and live terminal environments.',
                  labCount: `${topic.labs.length} Interactive Labs`,
                  icon: 'science',
                  tag: 'General Engineering',
                };

                const firstAccessibleLab = topic.labs.find((l) => l.has_access);
                const href = firstAccessibleLab ? `/lab/${firstAccessibleLab.lab_key}` : '#';

                return (
                  <div
                    key={topic.topic_key}
                    onClick={() => handleCardClick(href, details.displayName)}
                    className="group cursor-pointer rounded-xl bg-surface-container-low border border-white/[0.08] hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,213,152,0.12)] transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Header Image & Badge Area */}
                    <div className="relative p-6 border-b border-white/[0.06] bg-[#13171b] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {details.image ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f12] p-2 flex items-center justify-center shrink-0">
                            <img
                              src={details.image}
                              alt={details.displayName}
                              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center shrink-0">
                            <Icon name={details.icon} className="text-[30px]" />
                          </div>
                        )}
                        <div>
                          <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase font-semibold">
                            {details.tag}
                          </span>
                          <h3 className="font-headline text-[18px] font-bold text-white mt-1 group-hover:text-primary transition-colors">
                            {details.displayName}
                          </h3>
                        </div>
                      </div>
                      <StatusBadge status="running" />
                    </div>

                    {/* Description & Labs List */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                      <p className="font-mono text-[13px] text-neutral-400 leading-relaxed">
                        {details.description}
                      </p>

                      {/* Sub-labs pill tags */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-b border-white/[0.04] pb-1.5">
                          <span>MODULE CURRICULUM</span>
                          <span className="text-primary font-semibold">{topic.labs.length} LABS</span>
                        </div>
                        <div className="space-y-1.5">
                          {topic.labs.slice(0, 3).map((lab) => (
                            <div key={lab.lab_key} className="flex items-center justify-between text-[12px] font-mono py-1 px-2.5 rounded bg-surface-container border border-white/[0.04] group-hover:border-white/10 transition-colors">
                              <span className="flex items-center gap-2 text-neutral-200 truncate">
                                <Icon name={lab.icon || 'terminal'} className="text-[14px] text-primary" />
                                {lab.title}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-500 uppercase shrink-0">Step {lab.order_num}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                        <span className="font-mono text-[11px] text-neutral-400">
                          Firecracker VM: <strong className="text-white">sub-400ms boot</strong>
                        </span>
                        <div className="flex items-center gap-1 text-primary font-headline font-semibold text-[13px] group-hover:translate-x-1 transition-transform">
                          <span>Launch Sandbox</span>
                          <Icon name="arrow_forward" className="text-[16px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTopics.length === 0 && (
                <div className="col-span-2 rounded-xl border border-white/[0.08] p-16 text-center bg-surface-container-low">
                  <Icon name="search_off" className="mb-4 text-[48px] text-neutral-600" />
                  <h2 className="font-headline text-[18px] font-semibold text-white">
                    No matching labs found
                  </h2>
                  <p className="mt-2 text-mono text-[13px] text-neutral-400">
                    Try refining your search term or filter tags.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-white/[0.08] bg-[#101417]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-[15px] text-white">DevLab<span className="text-primary font-mono text-[13px]">.io</span></span>
            <span className="text-neutral-600">•</span>
            <span className="font-mono text-[12px] text-neutral-400">Obsidian Telemetry LMS Platform</span>
          </div>
          <div className="flex gap-6 font-mono text-[12px] text-neutral-400">
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Firecracker Specs</a>
            <a href="#" className="hover:text-primary transition-colors">Allowlist Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

