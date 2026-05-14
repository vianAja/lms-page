'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';
import { Icon } from '@/components/vn-ui';

interface WebTerminalProps {
  labId: string;
  username: string;
}

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAYS_MS = [1000, 2000, 4000];

export default function WebTerminal({ labId, username }: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const statusRef = useRef<'connecting' | 'connected' | 'reconnecting' | 'failed'>('connecting');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'failed'>('connecting');
  const [attempt, setAttempt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [labId]);

  useEffect(() => {
    if (!terminalRef.current) return;
    isUnmountedRef.current = false;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: '#000000',
        foreground: '#dfe2eb',
        cursor: '#89ceff',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connectSocket = () => {
      clearReconnectTimer();
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
      }

      const socket = io({ reconnection: false });
      socketRef.current = socket;

      socket.on('connect', () => {
        reconnectAttemptRef.current = 0;
        setAttempt(0);
        setStatus('connecting');
        socket.emit('init-ssh', { labId, appUser: username });
      });

      socket.on('ssh-ready', () => {
        setStatus('connected');
        term.write('\r\n\x1b[32m[Connected to SSH Proxy]\x1b[0m\r\n');
      });

      socket.on('ssh-output', (data: string) => {
        term.write(data);
      });

      socket.on('ssh-error', (err: string) => {
        setStatus('failed');
        clearReconnectTimer();
        reconnectAttemptRef.current = MAX_RECONNECT_ATTEMPTS;
        setAttempt(MAX_RECONNECT_ATTEMPTS);
        term.write(`\r\n\x1b[31m[SSH Error]: ${err}\x1b[0m\r\n`);
      });

      socket.on('disconnect', () => {
        if (isUnmountedRef.current || statusRef.current === 'failed') return;

        const nextAttempt = reconnectAttemptRef.current + 1;
        if (nextAttempt > MAX_RECONNECT_ATTEMPTS) {
          setStatus('failed');
          return;
        }

        reconnectAttemptRef.current = nextAttempt;
        setAttempt(nextAttempt);
        setStatus('reconnecting');

        const delay = RECONNECT_DELAYS_MS[nextAttempt - 1] ?? RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1];
        reconnectTimerRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            connectSocket();
          }
        }, delay);
      });
    };

    connectSocket();

    term.onData((data) => {
      socketRef.current?.emit('ssh-input', data);
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      isUnmountedRef.current = true;
      clearReconnectTimer();
      window.removeEventListener('resize', handleResize);
      socketRef.current?.disconnect();
      term.dispose();
    };
  }, [labId, username]);

  const handleRetry = () => {
    reconnectAttemptRef.current = 0;
    setAttempt(0);
    setStatus('connecting');
    socketRef.current?.disconnect();
  };

  const statusDotClass =
    status === 'connected'
      ? 'bg-secondary'
      : status === 'reconnecting'
        ? 'bg-tertiary'
        : status === 'failed'
          ? 'bg-error'
          : 'bg-outline';

  const statusText =
    status === 'connected'
      ? 'Connected'
      : status === 'reconnecting'
        ? `Reconnecting... (attempt ${attempt} of ${MAX_RECONNECT_ATTEMPTS})`
        : status === 'failed'
          ? 'Connection failed.'
          : 'Connecting to lab environment...';

  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-outline-variant bg-black">
      <div className="flex h-12 items-center justify-between border-b border-outline-variant bg-black px-4 text-xs text-on-surface-variant">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#ff5f56' }} />
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#27c93f' }} />
          </div>
          <div className="flex items-center gap-2 font-code text-code-md">
            <Icon name="terminal" className="text-[18px]" />
            <span>SSH Terminal — {labId}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-sm border border-outline-variant/50 bg-surface-variant/50 px-3 py-1 font-code tabular-nums text-on-surface">
            {hours}:{minutes}:{seconds}
          </div>
          <div className="flex items-center gap-2 font-code text-code-md">
            <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass} ${status === 'connected' ? 'animate-pulse' : ''}`} />
            <span>{statusText}</span>
          </div>
          <div className="flex items-center gap-1">
            <button aria-label="Keyboard shortcuts" className="focus-ring flex h-9 w-9 items-center justify-center rounded-sm border border-outline-variant bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary">
              <Icon name="keyboard" className="text-[18px]" />
            </button>
            <button aria-label="Refresh terminal" onClick={handleRetry} className="focus-ring flex h-9 w-9 items-center justify-center rounded-sm border border-outline-variant bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary">
              <Icon name="refresh" className="text-[18px]" />
            </button>
            <button aria-label="Clear terminal" className="focus-ring flex h-9 w-9 items-center justify-center rounded-sm border border-outline-variant bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary">
              <Icon name="mop" className="text-[18px]" />
            </button>
            <button aria-label="Fullscreen terminal" className="focus-ring flex h-9 w-9 items-center justify-center rounded-sm border border-outline-variant bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary">
              <Icon name="fullscreen" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>
      <div ref={terminalRef} className="w-full flex-1 p-3" />
      <div className="flex items-center justify-between border-t border-outline-variant bg-black px-4 py-2 font-code text-[12px] text-on-surface-variant">
        <span>Lines: 34 | Cols: 120</span>
        <span>xterm.js v5 | SSH2</span>
      </div>
    </div>
  );
}
