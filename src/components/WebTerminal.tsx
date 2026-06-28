'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface WebTerminalProps {
  labId: string;
  username: string;
  connectSignal?: number;
  disconnectSignal?: number;
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed') => void;
  /** Allowlist config for this specific lab — derived from lab-allowlist.js */
  allowlist?: {
    exactCommands: string[];
  };
}

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAYS_MS = [1000, 2000, 4000];

// Universal commands allowed in every lab without exact matching
const UNIVERSAL_COMMANDS = ['clear', 'exit', 'ls', 'pwd', 'cd'];

function checkAllowed(
  input: string,
  labId: string,
  allowlist?: { exactCommands: string[] }
): { allowed: boolean; reason: string } {
  const trimmed = input.trim();
  if (!trimmed) return { allowed: true, reason: 'empty' };
  if (trimmed.startsWith('#')) return { allowed: true, reason: 'comment' };

  // Allow safe basic navigation
  const baseCmd = trimmed.split(/\\s+/)[0];
  if (UNIVERSAL_COMMANDS.includes(baseCmd) && !/[;&|$\\`<>]/.test(trimmed)) {
    return { allowed: true, reason: 'universal-safe' };
  }

  // No allowlist configured → permissive fallback
  if (!allowlist || !allowlist.exactCommands) return { allowed: true, reason: 'no-rules' };

  // Exact Match Validation
  const normalizedInput = trimmed.replace(/\\s+/g, ' ');
  for (const cmd of allowlist.exactCommands) {
    if (cmd.replace(/\\s+/g, ' ') === normalizedInput) {
      return { allowed: true, reason: 'exact-match' };
    }
  }

  // Exception for cd commands since paths can vary slightly
  if (trimmed.startsWith('cd ') && !/[;&|$\\`<>]/.test(trimmed)) {
      return { allowed: true, reason: 'safe-cd' };
  }

  return { 
    allowed: false, 
    reason: `Command '${trimmed}' is not listed in the lab instructions. Strict exact match required.` 
  };
}

export default function WebTerminal({
  labId,
  username,
  connectSignal = 0,
  disconnectSignal = 0,
  onStatusChange,
  allowlist,
}: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const connectSocketRef = useRef<(() => void) | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const statusRef = useRef<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'>('idle');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'>('idle');
  const [attempt, setAttempt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    statusRef.current = status;
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    if (status !== 'connected') return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    if (!terminalRef.current) return;
    isUnmountedRef.current = false;

    // Initialize Terminal — palette-matched theme
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", monospace',
      lineHeight: 1.5,
      theme: {
        background: '#0d0d14',
        foreground: '#F1F7D4',
        cursor: '#6EADBC',
        cursorAccent: '#0d0d14',
        selectionBackground: 'rgba(110, 173, 188, 0.28)',
        black: '#1e1d2e',
        red: '#b04040',
        green: '#9FCBAD',
        yellow: '#e8c86a',
        blue: '#6EADBC',
        magenta: '#8a7fc0',
        cyan: '#6EADBC',
        white: '#F1F7D4',
        brightBlack: '#4A4466',
        brightRed: '#d46060',
        brightGreen: '#b8dfc4',
        brightYellow: '#f0d880',
        brightBlue: '#88c8d8',
        brightMagenta: '#a89ed8',
        brightCyan: '#88c8d8',
        brightWhite: '#ffffff',
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

    connectSocketRef.current = connectSocket;

    // Command buffer — tracks what the user has typed on the current line
    let commandBuffer = '';

    term.onData((data) => {
      const socket = socketRef.current;

      // Handle Backspace (^H or DEL) — maintain buffer
      if (data === '\x7f' || data === '\b') {
        commandBuffer = commandBuffer.slice(0, -1);
        socket?.emit('ssh-input', data);
        return;
      }

      // Handle Enter (\r or \n) — evaluate the buffered line
      if (data === '\r' || data === '\n') {
        const line = commandBuffer.trim();
        commandBuffer = '';

        if (line) {
          const check = checkAllowed(line, labId, allowlist);
          if (!check.allowed) {
            // Block the command — do NOT send to SSH
            term.write(
              `\r\n\x1b[1;33m⚠ Command blocked:\x1b[0m \x1b[31m${check.reason}\x1b[0m\r\n` +
              `\x1b[90m  This command is not part of the current lab exercises.\x1b[0m\r\n` +
              `\x1b[90m  Only commands listed in the lab guide are permitted.\x1b[0m\r\n`
            );
            // Move to new prompt line visually by sending Enter through
            socket?.emit('ssh-input', '\x03'); // Ctrl+C to cancel any partial input
            socket?.emit('ssh-input', data);   // Enter to get new prompt
            return;
          }
        }

        // Allowed — pass through normally
        socket?.emit('ssh-input', data);
        return;
      }

      // Printable characters — append to buffer and pass through
      if (data >= ' ' || data === '\t') {
        commandBuffer += data;
      }

      socket?.emit('ssh-input', data);
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      isUnmountedRef.current = true;
      clearReconnectTimer();
      window.removeEventListener('resize', handleResize);
      socketRef.current?.disconnect();
      connectSocketRef.current = null;
      term.dispose();
    };
  }, [labId, username]);

  const handleConnectVm = () => {
    if (status === 'connected' || status === 'connecting' || status === 'reconnecting') return;
    setElapsedSeconds(0);
    connectSocketRef.current?.();
  };

  const handleStopVm = () => {
    reconnectAttemptRef.current = 0;
    setAttempt(0);
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setElapsedSeconds(0);
    setStatus('idle');
    xtermRef.current?.write('\r\n\x1b[33m[Session closed]\x1b[0m\r\n');
  };

  useEffect(() => {
    if (connectSignal <= 0) return;
    handleConnectVm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectSignal]);

  useEffect(() => {
    if (disconnectSignal <= 0) return;
    handleStopVm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disconnectSignal]);

  // Status indicator colors
  const dotColor =
    status === 'connected'
      ? '#9FCBAD'
      : status === 'reconnecting'
        ? '#e8c86a'
        : status === 'failed'
          ? '#b04040'
          : 'rgba(110,173,188,0.45)';

  const statusText =
    status === 'connected'
      ? 'Connected'
      : status === 'reconnecting'
        ? `Reconnecting... (${attempt}/${MAX_RECONNECT_ATTEMPTS})`
        : status === 'failed'
          ? 'Connection failed'
          : status === 'connecting'
            ? 'Connecting...'
            : 'Disconnected';

  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{
        borderRadius: '10px',
        border: '1px solid rgba(0,0,0,0.45)',
        background: '#0d0d14',
        boxShadow: '0 20px 60px rgba(0,0,0,0.60), 0 4px 16px rgba(0,0,0,0.40)',
      }}
    >
      {/* Mac-style title bar — only dots + status + timer */}
      <div
        className="flex h-10 shrink-0 items-center justify-between px-4"
        style={{
          background: '#1a1a24',
          borderBottom: '1px solid rgba(0,0,0,0.40)',
          borderRadius: '10px 10px 0 0',
        }}
      >
        {/* Left: traffic light dots only */}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f56' }} />
          <span className="h-3 w-3 rounded-full" style={{ background: '#ffbd2e' }} />
          <span className="h-3 w-3 rounded-full" style={{ background: '#27c93f' }} />
        </div>

        {/* Right: status dot + text + timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'rgba(241,247,212,0.70)' }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: dotColor,
                boxShadow: status === 'connected' ? `0 0 5px ${dotColor}` : 'none',
                transition: 'background 0.3s',
              }}
            />
            <span>{statusText}</span>
          </div>
          <div
            className="rounded px-2.5 py-0.5 font-mono tabular-nums text-xs"
            style={{
              background: 'rgba(241,247,212,0.05)',
              border: '1px solid rgba(241,247,212,0.09)',
              color: 'rgba(241,247,212,0.75)',
            }}
          >
            {hours}:{minutes}:{seconds}
          </div>
        </div>
      </div>

      {/* xterm viewport */}
      <div ref={terminalRef} className="w-full flex-1 overflow-hidden" style={{ padding: '12px 8px 8px' }} />
    </div>
  );
}
