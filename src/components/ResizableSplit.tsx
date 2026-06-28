"use client";

import React, { useState, useEffect, useRef } from 'react';

interface ResizableSplitProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialLeftWidth?: number; // percentage
}

export default function ResizableSplit({ leftPanel, rightPanel, initialLeftWidth = 50 }: ResizableSplitProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !containerRef.current) return;

    let clientX: number;
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
    } else {
      clientX = e.touches[0].clientX;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((clientX - containerRect.left) / containerRect.width) * 100;

    if (newLeftWidth > 15 && newLeftWidth < 85) {
      setLeftWidth(newLeftWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      window.addEventListener('touchmove', resize);
      window.addEventListener('touchend', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    const checkBreakpoint = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => {
      window.removeEventListener('resize', checkBreakpoint);
    };
  }, []);

  if (!isDesktop) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ height: '100%' }}>
        <div className="flex flex-col overflow-hidden" style={{ height: '45%', borderBottom: '1px solid #c8dfc9', background: '#ffffff' }}>
          {leftPanel}
        </div>
        <div className="flex flex-col overflow-hidden" style={{ height: '55%', background: '#1e1d2e' }}>
          {rightPanel}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex h-full overflow-hidden select-none"
      style={{ cursor: isResizing ? 'col-resize' : 'default' }}
    >
      {/* Left Panel — white content area, scrolls internally */}
      <div
        style={{ width: `${leftWidth}%`, background: '#ffffff', borderRight: '1px solid #c8dfc9' }}
        className="flex h-full flex-col overflow-hidden"
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        onTouchStart={startResizing}
        className="group z-10 flex w-[5px] flex-shrink-0 cursor-col-resize items-center justify-center transition-all"
        style={{ background: '#e2eabe' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#9FCBAD'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#e2eabe'; }}
      >
        <div
          className="h-10 w-[3px] rounded-full transition-colors"
          style={{ background: '#c8dfc9' }}
        />
      </div>

      {/* Right Panel — dark terminal area, fills remaining space */}
      <div
        style={{ width: `${100 - leftWidth}%`, background: '#1e1d2e' }}
        className="flex h-full flex-col"
      >
        {rightPanel}
      </div>
    </div>
  );
}
