'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import ResizableSplit from '@/components/ResizableSplit';
import WebTerminal from '@/components/WebTerminal';
import MarkdownViewer from '@/components/MarkdownViewer';
import { useLabStore } from '@/lib/labStore';
import { Icon } from '@/components/vn-ui';

type LabShellClientProps = {
  username: string;
  children: React.ReactNode;
};

type TerminalStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

const SESSION_LIMIT_SECONDS = 15 * 60; // 15 minutes

export default function LabShellClient({ username, children }: LabShellClientProps) {
  const pathname = usePathname();
  const labData = useLabStore((state) => state.labData);
  const setLabData = useLabStore((state) => state.setLabData);

  const labId = labData?.labId || '';
  const labTitle = labData?.labTitle || '';
  const topicKey = labData?.topicKey || '';
  const allowlist = labData?.allowlist;
  const nextLabHref = labData?.nextLabHref || null;
  const prevLabHref = labData?.prevLabHref || null;

  // Client-side markdown content (overrides server children after navigation)
  const [clientMarkdown, setClientMarkdown] = useState<string | null>(null);
  const [isFetchingContent, setIsFetchingContent] = useState(false);

  const currentStep = labData?.currentStep || 1;
  const totalSteps = labData?.totalSteps || 1;

  const [connectSignal, setConnectSignal] = useState(0);
  const [disconnectSignal, setDisconnectSignal] = useState(0);
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus>('idle');
  const [connectionElapsedMs, setConnectionElapsedMs] = useState(0);

  const connectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionStartedAtRef = useRef<number | null>(null);

  // Session countdown (15 min auto-cut)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessionRemaining, setSessionRemaining] = useState(SESSION_LIMIT_SECONDS);

  // When labData is first set, rewrite the URL to /{topicKey}-labs (no reload)
  // This keeps the URL stable across lab navigation
  useEffect(() => {
    if (!topicKey) return;
    const staticSlug = `/${topicKey}-labs`;
    if (typeof window !== 'undefined' && window.location.pathname !== staticSlug) {
      window.history.replaceState({}, '', staticSlug);
    }
  }, [topicKey]);

  // Reset client markdown when the server-side page changes (first load per route)
  useEffect(() => {
    setClientMarkdown(null);
  }, [pathname]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (connectionTimerRef.current) clearInterval(connectionTimerRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  const handleTerminalStatusChange = useCallback((status: TerminalStatus) => {
    setTerminalStatus(status);

    if (status === 'connecting' || status === 'reconnecting') {
      connectionStartedAtRef.current = Date.now();
      setConnectionElapsedMs(0);
      if (connectionTimerRef.current) clearInterval(connectionTimerRef.current);

      connectionTimerRef.current = setInterval(() => {
        if (connectionStartedAtRef.current !== null) {
          setConnectionElapsedMs(Date.now() - connectionStartedAtRef.current);
        }
      }, 100);
      return;
    }

    connectionStartedAtRef.current = null;
    setConnectionElapsedMs(0);
    if (connectionTimerRef.current) {
      clearInterval(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }

    if (status === 'connected') {
      setSessionRemaining(SESSION_LIMIT_SECONDS);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);

      sessionTimerRef.current = setInterval(() => {
        setSessionRemaining((prev) => {
          if (prev <= 1) {
            setDisconnectSignal((v) => v + 1);
            if (sessionTimerRef.current) {
              clearInterval(sessionTimerRef.current);
              sessionTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    setSessionRemaining(SESSION_LIMIT_SECONDS);
  }, []);

  const handleStartStop = () => {
    if (isRunning) {
      setDisconnectSignal((v) => v + 1);
      return;
    }
    setConnectSignal((v) => v + 1);
  };

  /**
   * Fetch new lab content from API without changing URL.
   * Terminal remains connected — only the left markdown panel updates.
   */
  const fetchLabContent = useCallback(async (labKey: string) => {
    setIsFetchingContent(true);
    try {
      const res = await fetch(`/api/lab-content/${labKey}`);
      if (!res.ok) throw new Error('Failed to fetch lab content');
      const data = await res.json();
      // Update store (labId, title, next/prev hrefs, allowlist)
      setLabData({
        labId: data.labId,
        labTitle: data.labTitle,
        topicKey: data.topicKey || topicKey,
        markdownContent: data.markdownContent,
        allowlist: data.allowlist ?? undefined,
        nextLabHref: data.nextLabHref,
        prevLabHref: data.prevLabHref,
      });
      setClientMarkdown(data.markdownContent);
    } catch (err) {
      console.error('Lab content fetch failed:', err);
    } finally {
      setIsFetchingContent(false);
    }
  }, [setLabData, topicKey]);

  const handleNextLab = () => {
    if (!nextLabHref) return;
    // Extract lab key from href e.g. /lab/docker-lab-2 -> docker-lab-2
    const nextLabKey = nextLabHref.replace('/lab/', '');
    fetchLabContent(nextLabKey);
  };

  const handlePrevLab = () => {
    if (!prevLabHref) return;
    const prevLabKey = prevLabHref.replace('/lab/', '');
    fetchLabContent(prevLabKey);
  };

  const isRunning = terminalStatus === 'connected' || terminalStatus === 'connecting' || terminalStatus === 'reconnecting';
  const sMin = String(Math.floor(sessionRemaining / 60)).padStart(2, '0');
  const sSec = String(sessionRemaining % 60).padStart(2, '0');
  const sessionWarning = sessionRemaining <= 120 && terminalStatus === 'connected';
  const connectionElapsedText = `${(connectionElapsedMs / 1000).toFixed(connectionElapsedMs < 1000 ? 1 : 0)}s`;

  // Determine what markdown to show: client-fetched takes priority over server-rendered children
  const showClientMarkdown = clientMarkdown !== null;

  return (
    <>
      {/* Start-lab loading overlay - Tied to real connection status */}
      {(terminalStatus === 'connecting' || terminalStatus === 'reconnecting') && (
        <div
          className="fixed inset-0 z-[998] flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border p-12 text-center shadow-xl"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-green-500 opacity-20" />
              <div className="absolute inset-2 animate-ping rounded-full border-2 border-green-500 opacity-20" style={{ animationDelay: '0.2s' }} />
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-100 border-t-green-500" />
            </div>
            <div className="w-full space-y-3">
              <div className="font-code text-[13px] font-semibold uppercase tracking-widest text-gray-900">
                Setting Up Environment
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill opacity-80"
                  style={{ animation: 'pulse 1.5s infinite', width: '100%' }}
                />
              </div>
              <div className="flex min-h-[32px] items-center justify-center px-4 font-code text-[11px] text-gray-500">
                Connecting to instance · {connectionElapsedText}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-dvh w-full flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Top Header Bar */}
        <header
          className="flex h-14 shrink-0 items-center justify-between px-4 md:px-6"
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Left: Back + Info */}
          <div className="flex items-center gap-4">
            <Link
              href="/student"
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: '#6B7280' }}
            >
              <Icon name="arrow_back" className="text-[20px]" />
            </Link>
            <div className="h-6 w-px" style={{ background: 'var(--border)' }} />
            <div>
              <div className="font-headline text-[15px] font-bold" style={{ color: '#111827' }}>
                {labTitle}
              </div>
              <div className="font-code text-[11px] font-medium" style={{ color: '#6B7280' }}>
                VN-Labs Runtime
              </div>
            </div>
          </div>

          {/* Center: Progress Bar (Absolutely centered, not affected by side widths) */}
          <div className="hidden absolute inset-0 md:flex items-center justify-center pointer-events-none">
            <div className="flex w-full max-w-sm items-center gap-4 pointer-events-auto">
              <span className="font-code text-[11px] font-semibold" style={{ color: '#374151', minWidth: '70px', textAlign: 'right' }}>
                Step {currentStep} of {totalSteps}
              </span>
              <div className="progress-track flex-1">
                <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex shrink-0 items-center gap-3">
            {terminalStatus === 'connected' && (
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1 font-code text-[11px] font-semibold tabular-nums"
                style={{
                  background: sessionWarning ? 'var(--status-suspended-bg)' : 'var(--bg)',
                  border: '1px solid var(--border-strong)',
                  color: sessionWarning ? '#DC2626' : '#374151',
                }}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${sessionWarning ? 'animate-pulse bg-red-500' : 'bg-green-500'}`} />
                {sMin}:{sSec}
              </div>
            )}

            <button
              onClick={handleStartStop}
              disabled={terminalStatus === 'connecting' || terminalStatus === 'reconnecting'}
              className="btn-primary"
              style={{
                fontSize: '13px',
                padding: '6px 14px',
                background: isRunning ? 'var(--status-suspended-bg)' : 'var(--green-500)',
                color: isRunning ? '#DC2626' : '#fff',
                borderColor: isRunning ? '#DC2626' : 'var(--green-500)',
                opacity: (terminalStatus === 'connecting' || terminalStatus === 'reconnecting') ? 0.7 : 1,
              }}
            >
              {(terminalStatus === 'connecting' || terminalStatus === 'reconnecting')
                ? 'Starting...'
                : isRunning ? 'Stop Lab' : 'Start Lab'}
            </button>

            {/* Prev Lab Button */}
            {prevLabHref && (
              <button
                onClick={handlePrevLab}
                disabled={isFetchingContent}
                className="btn-secondary flex items-center gap-1"
                style={{ fontSize: '13px', padding: '6px 14px' }}
              >
                <Icon name="arrow_back" className="text-[14px]" />
                Prev
              </button>
            )}

            {/* Next Lab Button */}
            <button
              onClick={handleNextLab}
              disabled={!nextLabHref || isFetchingContent}
              className="btn-secondary flex items-center gap-1"
              style={{
                fontSize: '13px',
                padding: '6px 14px',
                opacity: !nextLabHref ? 0.4 : 1,
                cursor: !nextLabHref ? 'not-allowed' : 'pointer',
              }}
            >
              {isFetchingContent ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700" />
              ) : (
                <>
                  Next
                  <Icon name="arrow_forward" className="text-[14px]" />
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main Split Panels */}
        <div className="flex-1 overflow-hidden p-2 md:p-3" style={{ minHeight: 0 }}>
          <ResizableSplit
            initialLeftWidth={45}
            leftPanel={
              <div className="flex h-full flex-col rounded-xl border bg-white relative" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
                  {/* Markdown Content */}
                  <div className={`app-prose max-w-none transition-opacity duration-300 ${isFetchingContent ? 'opacity-30' : 'opacity-100'}`}>
                    {showClientMarkdown ? (
                      <MarkdownViewer content={clientMarkdown} />
                    ) : (
                      children
                    )}
                  </div>
                  
                  {isFetchingContent && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border" style={{ borderColor: 'var(--border)' }}>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
                        <span className="font-code text-xs text-gray-500">Loading lab content...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }
            rightPanel={
              <div className="h-full pl-2 md:pl-3">
                <WebTerminal
                  labId={labId}
                  username={username}
                  connectSignal={connectSignal}
                  disconnectSignal={disconnectSignal}
                  onStatusChange={handleTerminalStatusChange}
                  allowlist={allowlist}
                />
              </div>
            }
          />
        </div>
      </div>
    </>
  );
}
