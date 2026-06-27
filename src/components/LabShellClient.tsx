'use client';

import Link from 'next/link';
import { useState } from 'react';
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

export default function LabShellClient({ labId, labTitle, markdownContent, username, nextLabHref }: LabShellClientProps) {
  const [connectSignal, setConnectSignal] = useState(0);
  const [disconnectSignal, setDisconnectSignal] = useState(0);
  const [terminalStatus, setTerminalStatus] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'>('idle');

  const isRunning = terminalStatus === 'connected' || terminalStatus === 'connecting' || terminalStatus === 'reconnecting';

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-[1440px] flex-col overflow-hidden bg-surface-container-lowest">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-outline-variant bg-surface-dim px-4 py-2 text-body-sm text-on-surface-variant md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="button-secondary min-h-8 px-3 py-1 text-[12px]">← Back to Portal</Link>
          <span>|</span>
          <span className="truncate">Lab: {labTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="button-secondary min-h-8 px-3 py-1 text-[12px]">Grade</button>
          <button
            type="button"
            onClick={() => {
              if (isRunning) {
                setDisconnectSignal((value) => value + 1);
                return;
              }
              setConnectSignal((value) => value + 1);
            }}
            className="button-primary min-h-8 px-3 py-1 text-[12px]"
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          {nextLabHref ? (
            <Link href={nextLabHref} className="button-primary min-h-8 px-3 py-1 text-[12px]">
              Next Lab →
            </Link>
          ) : (
            <button type="button" disabled className="button-primary min-h-8 px-3 py-1 text-[12px]">
              Next Lab →
            </button>
          )}
        </div>
      </div>

      <ResizableSplit
        initialLeftWidth={56}
        leftPanel={
          <div className="flex h-full flex-col bg-background">
            <div className="border-b border-outline-variant bg-background px-5 py-6">
              <h1 className="mt-1 font-headline text-headline-lg text-on-surface">{labTitle}</h1>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-surface-container-low px-5 py-6">
              <MarkdownViewer content={markdownContent} />
            </div>
          </div>
        }
        rightPanel={
          <div className="h-full bg-[#000000] p-3">
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
  );
}
