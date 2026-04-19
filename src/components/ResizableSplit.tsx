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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[45vh] overflow-hidden flex flex-col border-b border-zinc-800 bg-zinc-900/20">
          {leftPanel}
        </div>
        <div className="h-[45vh] overflow-hidden flex flex-col bg-zinc-950">
          {rightPanel}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex overflow-hidden select-none"
      style={{ cursor: isResizing ? 'col-resize' : 'default' }}
    >
      {/* Left Panel */}
      <div 
        style={{ width: `${leftWidth}%` }} 
        className="overflow-hidden flex flex-col border-r border-zinc-800 bg-zinc-900/20"
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        onTouchStart={startResizing}
        className="w-1.5 flex-shrink-0 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors z-10 flex items-center justify-center group"
      >
         <div className="w-0.5 h-8 bg-zinc-700 group-hover:bg-blue-300 rounded-full transition-colors"></div>
      </div>

      {/* Right Panel */}
      <div 
        style={{ width: `${100 - leftWidth}%` }} 
        className="flex flex-col bg-zinc-950"
      >
        {rightPanel}
      </div>
    </div>
  );
}
