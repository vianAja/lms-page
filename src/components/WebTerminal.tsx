'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface WebTerminalProps {
  labId: string;
  username: string;
}

export default function WebTerminal({ labId, username }: WebTerminalProps) {
  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAYS_MS = [1000, 2000, 4000];

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'failed'>('connecting');

  useEffect(() => {
    if (!terminalRef.current) return;
    isUnmountedRef.current = false;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#09090b', // zinc-950 roughly
        foreground: '#e4e4e7', // zinc-200
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
        term.write(`\r\n\x1b[31m[SSH Error]: ${err}\x1b[0m\r\n`);
      });

      socket.on('disconnect', () => {
        if (isUnmountedRef.current || status === 'failed') return;

        const nextAttempt = reconnectAttemptRef.current + 1;
        if (nextAttempt > MAX_RECONNECT_ATTEMPTS) {
          setStatus('failed');
          return;
        }

        reconnectAttemptRef.current = nextAttempt;
        setStatus('reconnecting');

        const delay = RECONNECT_DELAYS_MS[nextAttempt - 1] ?? RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1];
        reconnectTimerRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            connectSocket();
          }
        }, delay);
      });
    };

    setStatus('connecting');
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
    setStatus('connecting');
    socketRef.current?.disconnect();
  };

  const statusDotClass =
    status === 'connected'
      ? 'bg-green-500'
      : status === 'reconnecting'
        ? 'bg-yellow-400'
        : status === 'failed'
          ? 'bg-red-500'
          : 'bg-zinc-500';

  const statusText =
    status === 'connected'
      ? 'Connected'
      : status === 'reconnecting'
        ? `Reconnecting... (attempt ${reconnectAttemptRef.current} of ${MAX_RECONNECT_ATTEMPTS})`
        : status === 'failed'
          ? 'Connection failed.'
          : 'Connecting to lab environment...';

  return (
    <div className="w-full h-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-inner flex flex-col">
      <div className="h-9 px-3 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300 bg-zinc-950/90">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
          <span>{statusText}</span>
        </div>
        {status === 'failed' && (
          <button
            type="button"
            onClick={handleRetry}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
      <div ref={terminalRef} className="w-full flex-1 p-2" />
    </div>
  );
}
