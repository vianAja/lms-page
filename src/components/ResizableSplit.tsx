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
        <div className="h-[45vh] overflow-hidden border-b border-outline-variant bg-surface-container">
          {leftPanel}
        </div>
        <div className="h-[45vh] overflow-hidden bg-black">
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
        className="overflow-hidden border-r border-outline-variant bg-surface-container"
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        onTouchStart={startResizing}
        className="group z-10 flex w-[6px] flex-shrink-0 cursor-col-resize items-center justify-center bg-surface-container-highest transition-all hover:bg-primary-container/40 hover:shadow-[0_0_10px_rgba(14,165,233,0.5)]"
      >
        <div className="h-8 w-1 rounded-full bg-outline-variant transition-colors group-hover:bg-primary-container" />
      </div>

      {/* Right Panel */}
      <div 
        style={{ width: `${100 - leftWidth}%` }} 
        className="flex flex-col bg-black"
      >
        {rightPanel}
      </div>
    </div>
  );
}
