'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownViewer from '@/components/MarkdownViewer';
import ResizableSplit from '@/components/ResizableSplit';
import WebTerminal from '@/components/WebTerminal';

type LabShellClientProps = {
  labId: string;
  labTitle: string;
  markdownContent: string;
  username: string;
  nextLabHref: string | null;
};

const SESSION_LIMIT_SECONDS = 15 * 60; // 15 minutes

export default function LabShellClient({ labId, labTitle, markdownContent, username, nextLabHref }: LabShellClientProps) {
  const router = useRouter();
  const [connectSignal, setConnectSignal] = useState(0);
  const [disconnectSignal, setDisconnectSignal] = useState(0);
  const [terminalStatus, setTerminalStatus] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'>('idle');
  
  // "Start" button loading animation state
  const [isStarting, setIsStarting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session countdown (15 min auto-cut)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessionRemaining, setSessionRemaining] = useState(SESSION_LIMIT_SECONDS);

  // Next lab transition animation
  const [isNavigating, setIsNavigating] = useState(false);

  const isRunning = terminalStatus === 'connected' || terminalStatus === 'connecting' || terminalStatus === 'reconnecting';

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  // Start session countdown when connected
  useEffect(() => {
    if (terminalStatus === 'connected') {
      setSessionRemaining(SESSION_LIMIT_SECONDS);
      sessionTimerRef.current = setInterval(() => {
        setSessionRemaining((prev) => {
          if (prev <= 1) {
            // Auto-disconnect
            setDisconnectSignal((v) => v + 1);
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [terminalStatus]);

  const handleStartStop = () => {
    if (isRunning) {
      setDisconnectSignal((v) => v + 1);
      return;
    }
    if (isStarting) return;

    // 15 seconds loading animation then connect
    setIsStarting(true);
    setLoadingStep(0);

    // Increment loading steps
    let currentStep = 0;
    stepIntervalRef.current = setInterval(() => {
      currentStep += 1;
      setLoadingStep(currentStep);
    }, 2800);

    startTimerRef.current = setTimeout(() => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      setIsStarting(false);
      setConnectSignal((v) => v + 1);
    }, 15000); // 15 seconds delay
  };

  const handleNextLab = () => {
    if (!nextLabHref) return;
    setIsNavigating(true);
    setTimeout(() => {
      router.push(nextLabHref);
    }, 400);
  };

  // Format session remaining
  const sMin = String(Math.floor(sessionRemaining / 60)).padStart(2, '0');
  const sSec = String(sessionRemaining % 60).padStart(2, '0');
  const sessionWarning = sessionRemaining <= 120 && terminalStatus === 'connected';

  // Loading steps text
  const loadingStepsText = [
    'Provisioning dynamic virtual environment...',
    'Initializing Docker daemon & sandbox resources...',
    'Configuring secure container networking interfaces...',
    'Deploying SSH proxy gateways...',
    'Establishing connection handshake and final checks...',
    'Almost ready, final configuration...'
  ];
  const activeStepText = loadingStepsText[loadingStep] || loadingStepsText[loadingStepsText.length - 1];

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

      {/* Start-lab loading overlay */}
      {isStarting && (
        <div
          className="fixed inset-0 z-[998] flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(30,29,46,0.88)', backdropFilter: 'blur(5px)' }}
        >
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-[#c8dfc9]/25 p-12 max-w-md w-full mx-4 text-center"
            style={{ background: 'rgba(26,26,36,0.96)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            {/* Pulsing ring animation */}
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-[#6EADBC] opacity-35" />
              <div className="absolute inset-2 animate-ping rounded-full border-2 border-[#9FCBAD] opacity-25" style={{ animationDelay: '0.2s' }} />
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1a1a24] border-t-[#6EADBC]" />
            </div>
            <div className="space-y-3">
              <div className="font-mono text-sm font-semibold text-[#F1F7D4] uppercase tracking-wider">
                Setting Up Lab Environment
              </div>
              
              {/* Fake progress bar */}
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-[#F1F7D4]/10">
                <div 
                  className="h-full bg-[#6EADBC] transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${Math.min(((loadingStep + 1) / loadingStepsText.length) * 100, 100)}%` }}
                />
              </div>

              <div className="font-mono text-xs text-[#F1F7D4]/65 animate-pulse min-h-[32px] flex items-center justify-center px-4">
                {activeStepText}
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
          {/* Left: back only */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded border px-3 py-1 text-xs font-semibold transition-all"
              style={{
                color: '#F1F7D4',
                borderColor: 'rgba(241,247,212,0.28)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(241,247,212,0.70)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(241,247,212,0.28)'; }}
            >
              ← Back to Portal
            </Link>
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
              disabled={isStarting}
              className="min-h-7 rounded px-4 py-1 text-xs font-bold transition-all disabled:opacity-70"
              style={
                isRunning
                  ? { background: '#b04040', color: '#fff' }
                  : isStarting
                    ? { background: 'rgba(110,173,188,0.60)', color: '#1e1d2e' }
                    : { background: '#6EADBC', color: '#1e1d2e' }
              }
            >
              {isStarting ? 'Starting...' : isRunning ? 'Stop' : 'Start'}
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

        {/* Main Split Panels */}
        <div className="flex-1 min-h-0">
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
                  <MarkdownViewer content={markdownContent} />
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
                  onStatusChange={setTerminalStatus}
                />
              </div>
            }
          />
        </div>
      </div>
    </>
  );
}
