'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import ResizableSplit from '@/components/ResizableSplit';
import WebTerminal from '@/components/WebTerminal';
import MarkdownViewer from '@/components/MarkdownViewer';
import { useLabStore } from '@/lib/labStore';
import { Icon, StatusBadge } from '@/components/vn-ui';

type LabShellClientProps = {
  username: string;
  children: React.ReactNode;
};

type TerminalStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

const SESSION_LIMIT_SECONDS = 15 * 60; // 15 minutes

export default function LabShellClient({ username, children }: LabShellClientProps) {
  const pathname = usePathname();
  const labData = useLabStore((state: any) => state.labData);
  const setLabData = useLabStore((state: any) => state.setLabData);

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
  const totalSteps = labData?.totalSteps || 3;

  const [connectSignal, setConnectSignal] = useState(0);
  const [disconnectSignal, setDisconnectSignal] = useState(0);
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus>('idle');
  const [connectionElapsedMs, setConnectionElapsedMs] = useState(0);

  const connectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionStartedAtRef = useRef<number | null>(null);

  // Session countdown (15 min auto-cut)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessionRemaining, setSessionRemaining] = useState(SESSION_LIMIT_SECONDS);

  // When labData is first set, rewrite URL
  useEffect(() => {
    if (!topicKey) return;
    const staticSlug = `/${topicKey}-labs`;
    if (typeof window !== 'undefined' && window.location.pathname !== staticSlug) {
      window.history.replaceState({}, '', staticSlug);
    }
  }, [topicKey]);

  useEffect(() => {
    setClientMarkdown(null);
  }, [pathname]);

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

  const fetchLabContent = useCallback(async (labKey: string) => {
    setIsFetchingContent(true);
    try {
      const res = await fetch(`/api/lab-content/${labKey}`);
      if (!res.ok) throw new Error('Failed to fetch lab content');
      const data = await res.json();
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

  const showClientMarkdown = clientMarkdown !== null;

  return (
    <>
      {/* Start-lab loading overlay with Firecracker styling */}
      {(terminalStatus === 'connecting' || terminalStatus === 'reconnecting') && (
        <div className="fixed inset-0 z-[998] flex items-center justify-center bg-[#0b0f12]/95 backdrop-blur-md">
          <div className="mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-xl border border-white/[0.08] bg-[#101417] p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-20" />
              <div className="absolute inset-2 animate-ping rounded-full border-2 border-primary opacity-20" style={{ animationDelay: '0.2s' }} />
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-primary shadow-[0_0_12px_#00d598]" />
            </div>
            <div className="w-full space-y-3 font-mono">
              <div className="text-[12px] font-bold uppercase tracking-widest text-primary">
                PROVISIONING FIRECRACKER MICROVM
              </div>
              <div className="progress-track bg-[#06090b]">
                <div className="progress-fill" style={{ width: '100%', animation: 'pulse 1.2s infinite' }} />
              </div>
              <div className="flex min-h-[32px] items-center justify-center px-4 text-[11px] text-neutral-400">
                Attaching TAP netdev interface · {connectionElapsedText}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#0b0f12] text-[#e0e3e7] font-mono">
        {/* Top Navigation Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 md:px-6 bg-[#101417]/95 backdrop-blur-md border-b border-white/[0.08] z-30">
          {/* Left: Back Link & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded border border-white/[0.08] bg-surface-container-low text-neutral-400 hover:text-white hover:border-white/20 transition-all"
            >
              <Icon name="arrow_back" className="text-[18px]" />
            </Link>
            <div className="h-5 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Icon name="terminal" className="text-[14px]" />
              </div>
              <span className="font-headline font-semibold text-[14px] text-white tracking-tight truncate max-w-[240px] md:max-w-md">
                {labTitle || 'DevLab.io Interactive Sandbox'}
              </span>
            </div>
          </div>

          {/* Center: Step Progress Indicator */}
          <div className="hidden absolute inset-0 md:flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-3 px-3 py-1 rounded bg-surface-container-low border border-white/[0.08] pointer-events-auto">
              <span className="text-[11px] font-mono text-neutral-400 font-medium">
                STEP <strong className="text-primary">{currentStep}</strong> OF {totalSteps}
              </span>
              <div className="w-24 bg-[#0b0f12] h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                <div
                  className="bg-primary h-full rounded-full shadow-[0_0_8px_#00d598] transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Controls & Timer */}
          <div className="flex shrink-0 items-center gap-2.5">
            {terminalStatus === 'connected' && (
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded border text-[11px] font-mono font-medium ${
                sessionWarning
                  ? 'border-red-500/40 bg-red-500/10 text-red-400 animate-pulse'
                  : 'border-primary/30 bg-primary/10 text-primary'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sessionWarning ? 'bg-red-500' : 'bg-primary animate-pulse shadow-[0_0_6px_#00d598]'}`} />
                <span>{sMin}:{sSec}</span>
              </div>
            )}

            <button
              onClick={handleStartStop}
              disabled={terminalStatus === 'connecting' || terminalStatus === 'reconnecting'}
              className={`px-3.5 py-1.5 rounded text-[12px] font-mono font-semibold transition-all flex items-center gap-1.5 ${
                isRunning
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  : 'bg-primary text-[#0b0f12] border border-primary hover:bg-[#45f2b2] shadow-[0_0_12px_rgba(0,213,152,0.3)]'
              }`}
            >
              <Icon name={isRunning ? 'power_settings_new' : 'play_arrow'} className="text-[15px]" />
              <span>
                {(terminalStatus === 'connecting' || terminalStatus === 'reconnecting')
                  ? 'Booting...'
                  : isRunning ? 'Stop VM' : 'Start Lab'}
              </span>
            </button>

            {/* Prev & Next Lab Buttons */}
            {prevLabHref && (
              <button
                onClick={handlePrevLab}
                disabled={isFetchingContent}
                className="px-3 py-1.5 rounded text-[12px] font-mono text-neutral-300 bg-surface-container-low border border-white/[0.08] hover:border-white/20 hover:text-white transition-all flex items-center gap-1"
              >
                <Icon name="arrow_back" className="text-[14px]" />
                Prev
              </button>
            )}

            <button
              onClick={handleNextLab}
              disabled={!nextLabHref || isFetchingContent}
              className={`px-3 py-1.5 rounded text-[12px] font-mono transition-all flex items-center gap-1 ${
                !nextLabHref
                  ? 'opacity-40 cursor-not-allowed bg-surface-container-low text-neutral-500 border border-white/[0.04]'
                  : 'bg-surface-container-low text-neutral-300 border border-white/[0.08] hover:border-primary/40 hover:text-primary'
              }`}
            >
              {isFetchingContent ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
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
        <div className="flex-1 overflow-hidden p-2 md:p-3 bg-[#0b0f12]" style={{ minHeight: 0 }}>
          <ResizableSplit
            initialLeftWidth={45}
            leftPanel={
              <div className="flex h-full flex-col rounded-lg border border-white/[0.08] bg-[#101417] relative overflow-hidden">
                {/* Curriculum Header */}
                <div className="px-5 py-3 border-b border-white/[0.06] bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 uppercase font-semibold">
                    <Icon name="menu_book" className="text-[15px] text-primary" /> Lab Curriculum Guide
                  </div>
                  <StatusBadge status={isRunning ? 'running' : 'idle'} />
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className={`app-prose max-w-none transition-opacity duration-300 ${isFetchingContent ? 'opacity-30' : 'opacity-100'}`}>
                    {showClientMarkdown ? (
                      <MarkdownViewer content={clientMarkdown} />
                    ) : (
                      children
                    )}
                  </div>
                  
                  {isFetchingContent && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#101417]/80 backdrop-blur-sm">
                      <div className="flex items-center gap-2 rounded bg-surface-container-low px-4 py-2 border border-white/[0.08]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                        <span className="font-mono text-xs text-neutral-300">Fetching lab step...</span>
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

