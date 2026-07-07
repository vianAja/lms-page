'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const effectiveUsername = username || 'guest';
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

  // Keep refs for dynamic values so they can be read in closures without triggering reconnections
  const currentLabId = useRef(labId);
  const currentAllowlist = useRef(allowlist);

  useEffect(() => {
    currentLabId.current = labId;
    currentAllowlist.current = allowlist;
  }, [labId, allowlist]);

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

    // Initialize Terminal — Utilitarian Clarity theme
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", monospace',
      lineHeight: 1.5,
      theme: {
        background: '#0A120A',
        foreground: '#D4EDDA',
        cursor: '#2E8B57',
        cursorAccent: '#0A120A',
        selectionBackground: 'rgba(46, 139, 87, 0.3)',
        black: '#0A120A',
        red: '#DC2626',
        green: '#2E8B57',
        yellow: '#D97706',
        blue: '#2563EB',
        magenta: '#9333EA',
        cyan: '#0891B2',
        white: '#D4EDDA',
        brightBlack: '#374151',
        brightRed: '#EF4444',
        brightGreen: '#4ADE80',
        brightYellow: '#F59E0B',
        brightBlue: '#3B82F6',
        brightMagenta: '#A855F7',
        brightCyan: '#06B6D4',
        brightWhite: '#FFFFFF',
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
        socket.emit('init-ssh', { labId: currentLabId.current, appUser: effectiveUsername });
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

      // Arrow keys & special sequences (ESC sequences like \x1b[A, \x1b[B, etc.)
      // Pass through directly AND reset our client-side buffer (the shell manages history)
      if (data.startsWith('\x1b')) {
        commandBuffer = '';
        socket?.emit('ssh-input', data);
        return;
      }

      // Handle Backspace (^H or DEL) — maintain buffer
      if (data === '\x7f' || data === '\b') {
        commandBuffer = commandBuffer.slice(0, -1);
        socket?.emit('ssh-input', data);
        return;
      }

      // Handle Ctrl+C (\x03) — pass through and reset buffer
      if (data === '\x03') {
        commandBuffer = '';
        socket?.emit('ssh-input', data);
        return;
      }

      // Handle Enter (\r or \n) — evaluate the buffered line
      if (data === '\r' || data === '\n') {
        const line = commandBuffer.trim();
        commandBuffer = '';

        if (line) {
          const check = checkAllowed(line, currentLabId.current, currentAllowlist.current);
          if (!check.allowed) {
            // Block the command — do NOT send to SSH, do NOT send Ctrl+C
            // Just write the warning and a blank new line client-side
            term.write(
              `\r\n\x1b[1;33m⚠ Command blocked:\x1b[0m Use the command as specified in the Content Lab\r\n`
            );
            // Send Ctrl+U (clear line) + Enter to get a clean prompt from shell
            // without echoing ^C
            socket?.emit('ssh-input', '\x15'); // Ctrl+U clears line silently
            socket?.emit('ssh-input', data);   // Enter for new prompt
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
  }, [effectiveUsername]); // Only remount if username changes! Removed labId to persist across labs.

  const handleConnectVm = useCallback(() => {
    if (status === 'connected' || status === 'connecting' || status === 'reconnecting') return;
    setElapsedSeconds(0);
    connectSocketRef.current?.();
  }, [status]);

  const handleStopVm = useCallback(() => {
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
  }, []);

  useEffect(() => {
    if (connectSignal <= 0) return;
    const timeout = window.setTimeout(() => {
      handleConnectVm();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [connectSignal, handleConnectVm]);

  useEffect(() => {
    if (disconnectSignal <= 0) return;
    const timeout = window.setTimeout(() => {
      handleStopVm();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [disconnectSignal, handleStopVm]);

  // Status indicator colors
  const dotColor =
    status === 'connected'
      ? '#2E8B57'
      : status === 'reconnecting'
        ? '#D97706'
        : status === 'failed'
          ? '#DC2626'
          : '#374151';

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
      className="flex h-full w-full flex-col overflow-hidden rounded-xl"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--terminal-bg)',
      }}
    >
      {/* Mac-style title bar */}
      <div
        className="flex h-11 shrink-0 items-center justify-between px-4"
        style={{
          background: 'var(--sidebar-bg)',
          borderBottom: '1px solid var(--border-strong)',
        }}
      >
        {/* Left: traffic light dots only */}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: '#FF5F56' }} />
          <span className="h-3 w-3 rounded-full" style={{ background: '#FFBD2E' }} />
          <span className="h-3 w-3 rounded-full" style={{ background: '#27C93F' }} />
        </div>

        {/* Right: status dot + text + timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-code text-xs font-medium" style={{ color: 'var(--terminal-text)' }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: dotColor,
                boxShadow: status === 'connected' ? `0 0 6px ${dotColor}` : 'none',
                transition: 'background 0.3s',
              }}
            />
            <span>{statusText}</span>
          </div>
          <div
            className="rounded px-2.5 py-1 font-code tabular-nums text-[11px] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--terminal-text)',
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
