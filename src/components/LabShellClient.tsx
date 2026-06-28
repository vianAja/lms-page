'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ResizableSplit from '@/components/ResizableSplit';
import WebTerminal from '@/components/WebTerminal';
import { useLabStore } from '@/lib/labStore';

type LabShellClientProps = {
  username: string;
  children: React.ReactNode;
};

type TerminalStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

const SESSION_LIMIT_SECONDS = 15 * 60; // 15 minutes

export default function LabShellClient({ username, children }: LabShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const labData = useLabStore((state) => state.labData);
  
  const labId = labData?.labId || '';
  const labTitle = labData?.labTitle || '';
  const allowlist = labData?.allowlist;
  const nextLabHref = labData?.nextLabHref || null;
  const prevLabHref = labData?.prevLabHref || null;
  const [connectSignal, setConnectSignal] = useState(0);
  const [disconnectSignal, setDisconnectSignal] = useState(0);
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus>('idle');
  const [connectionElapsedMs, setConnectionElapsedMs] = useState(0);
  const connectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionStartedAtRef = useRef<number | null>(null);

  // Session countdown (15 min auto-cut)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessionRemaining, setSessionRemaining] = useState(SESSION_LIMIT_SECONDS);

  // Next lab transition animation
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);
  const isNavigating = pendingNavigationHref !== null && pendingNavigationHref !== pathname;

  const isRunning = terminalStatus === 'connected' || terminalStatus === 'connecting' || terminalStatus === 'reconnecting';

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
      if (connectionTimerRef.current) {
        clearInterval(connectionTimerRef.current);
      }
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
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
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
    
    // Connect immediately
    setConnectSignal((v) => v + 1);
  };

  const handleNextLab = () => {
    if (!nextLabHref) return;
    setPendingNavigationHref(nextLabHref);
    router.push(nextLabHref);
  };

  // Format session remaining
  const sMin = String(Math.floor(sessionRemaining / 60)).padStart(2, '0');
  const sSec = String(sessionRemaining % 60).padStart(2, '0');
  const sessionWarning = sessionRemaining <= 120 && terminalStatus === 'connected';

  const connectionElapsedText = `${(connectionElapsedMs / 1000).toFixed(connectionElapsedMs < 1000 ? 1 : 0)}s`;

  return (
    <>
      {/* Page-level transition overlay */}
      {isNavigating && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: '#4A4466' }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F1F7D4]/20 border-t-[#F1F7D4]" />
            <span className="font-mono text-sm text-[#F1F7D4]/80">Loading next lab...</span>
          </div>
        </div>
      )}

      {/* Start-lab loading overlay - Tied to real connection status */}
      {(terminalStatus === 'connecting' || terminalStatus === 'reconnecting') && (
        <div
          className="fixed inset-0 z-[998] flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(30,29,46,0.88)', backdropFilter: 'blur(5px)' }}
        >
          <div
            className="mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-[#c8dfc9]/25 p-12 text-center"
            style={{ background: 'rgba(26,26,36,0.96)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-[#6EADBC] opacity-35" />
              <div className="absolute inset-2 animate-ping rounded-full border-2 border-[#9FCBAD] opacity-25" style={{ animationDelay: '0.2s' }} />
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1a1a24] border-t-[#6EADBC]" />
            </div>
            <div className="w-full space-y-3">
              <div className="font-mono text-sm font-semibold uppercase tracking-wider text-[#F1F7D4]">
                Setting Up Lab Environment
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full border border-[#F1F7D4]/10 bg-black/40">
                <div
                  className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-transparent via-[#6EADBC] to-transparent opacity-80"
                  style={{ animationDuration: '1.1s' }}
                />
              </div>

              <div className="flex min-h-[32px] items-center justify-center px-4 font-mono text-xs text-[#F1F7D4]/70">
                SSH handshake in progress · {connectionElapsedText}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-dvh w-full flex-col overflow-hidden" style={{ background: '#1e1d2e' }}>
        {/* Top Header Bar */}
        <div
          className="flex h-12 shrink-0 items-center justify-between gap-3 px-4 md:px-6"
          style={{
            background: '#4A4466',
            borderBottom: '1px solid rgba(241,247,212,0.10)',
          }}
        >
          {/* Left: back arrow icon only + previous lab */}
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/"
              title="Back to Portal"
              className="inline-flex items-center justify-center h-8 w-8 rounded border transition-all"
              style={{
                color: '#F1F7D4',
                borderColor: 'rgba(241,247,212,0.28)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(241,247,212,0.70)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(241,247,212,0.28)'; }}
            >
              ←
            </Link>

            {prevLabHref ? (
              <button
                type="button"
                onClick={() => { setPendingNavigationHref(prevLabHref); router.push(prevLabHref); }}
                className="inline-flex items-center justify-center min-h-7 rounded px-3 py-1 text-xs font-bold transition-all"
                style={{ background: 'rgba(241,247,212,0.10)', color: 'rgba(241,247,212,0.75)', border: '1px solid rgba(241,247,212,0.20)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(241,247,212,0.20)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(241,247,212,0.10)'; }}
              >
                ← Prev Lab
              </button>
            ) : null}
          </div>

          {/* Center: session countdown (only when connected) */}
          {terminalStatus === 'connected' && (
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs font-semibold tabular-nums transition-all"
              style={{
                background: sessionWarning ? 'rgba(176,64,64,0.20)' : 'rgba(241,247,212,0.08)',
                border: `1px solid ${sessionWarning ? 'rgba(176,64,64,0.50)' : 'rgba(241,247,212,0.15)'}`,
                color: sessionWarning ? '#ff8080' : 'rgba(241,247,212,0.80)',
              }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${sessionWarning ? 'animate-pulse bg-[#ff8080]' : 'bg-[#9FCBAD]'}`} />
              Session: {sMin}:{sSec}
            </div>
          )}

          {/* Right: Start/Stop + Next Lab */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleStartStop}
              disabled={terminalStatus === 'connecting' || terminalStatus === 'reconnecting'}
              className="min-h-7 rounded px-4 py-1 text-xs font-bold transition-all disabled:opacity-70"
              style={
                isRunning
                  ? { background: '#b04040', color: '#fff' }
                  : { background: '#6EADBC', color: '#1e1d2e' }
              }
            >
              {(terminalStatus === 'connecting' || terminalStatus === 'reconnecting') ? 'Starting...' : isRunning ? 'Stop' : 'Start'}
            </button>

            {nextLabHref ? (
              <button
                type="button"
                onClick={handleNextLab}
                className="inline-flex items-center justify-center min-h-7 rounded px-4 py-1 text-xs font-bold transition-all"
                style={{ background: 'rgba(110,173,188,0.20)', color: '#6EADBC', border: '1px solid rgba(110,173,188,0.35)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6EADBC'; (e.currentTarget as HTMLButtonElement).style.color = '#1e1d2e'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(110,173,188,0.20)'; (e.currentTarget as HTMLButtonElement).style.color = '#6EADBC'; }}
              >
                Next Lab →
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="min-h-7 cursor-not-allowed rounded px-4 py-1 text-xs font-bold opacity-30"
                style={{ background: 'rgba(110,173,188,0.15)', color: '#6EADBC', border: '1px solid rgba(110,173,188,0.20)' }}
              >
                Next Lab →
              </button>
            )}
          </div>
        </div>

        {/* Main Split Panels — fills remaining height, panels scroll internally */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <ResizableSplit
            initialLeftWidth={50}
            leftPanel={
              <div className="flex h-full flex-col" style={{ background: '#ffffff' }}>
                <div className="flex-1 overflow-y-auto px-8 py-10 md:px-12 md:py-12">
                  <h1
                    className="font-headline text-3xl font-bold mb-5 tracking-tight leading-tight"
                    style={{ color: '#4A4466' }}
                  >
                    {labTitle}
                  </h1>
                  <div className="mb-8 h-px" style={{ background: '#c8dfc9' }} />
                  {children}
                </div>
              </div>
            }
            rightPanel={
              <div className="h-full p-3" style={{ background: '#1e1d2e' }}>
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
