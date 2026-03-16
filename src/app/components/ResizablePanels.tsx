"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface ResizableHorizontalProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export function ResizableHorizontal({
  left,
  right,
  defaultLeftWidth = 35,
  minLeftWidth = 20,
  maxLeftWidth = 60,
}: ResizableHorizontalProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(Math.max(percent, minLeftWidth), maxLeftWidth));
    };

    const handleEnd = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", handleEnd);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [minLeftWidth, maxLeftWidth]);

  return (
    <div ref={containerRef} className="flex h-full">
      <div
        style={{ width: `${leftWidth}%` }}
        className="overflow-hidden flex flex-col"
      >
        {left}
      </div>
      <div
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        className="w-1 bg-[#e5e5e5] hover:bg-[#1B4F72] cursor-col-resize flex-shrink-0 transition-colors"
      />
      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="overflow-hidden flex flex-col"
      >
        {right}
      </div>
    </div>
  );
}

interface ResizableVerticalProps {
  top: React.ReactNode;
  bottom: React.ReactNode;
  defaultTopHeight?: number;
  minTopHeight?: number;
  maxTopHeight?: number;
}

export function ResizableVertical({
  top,
  bottom,
  defaultTopHeight = 60,
  minTopHeight = 30,
  maxTopHeight = 85,
}: ResizableVerticalProps) {
  const [topHeight, setTopHeight] = useState(defaultTopHeight);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMove = (clientY: number) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((clientY - rect.top) / rect.height) * 100;
      setTopHeight(Math.min(Math.max(percent, minTopHeight), maxTopHeight));
    };

    const handleEnd = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", handleEnd);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [minTopHeight, maxTopHeight]);

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div style={{ height: `${topHeight}%` }} className="overflow-hidden">
        {top}
      </div>
      <div
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        className="h-1 bg-[#e5e5e5] hover:bg-[#1B4F72] cursor-row-resize flex-shrink-0 transition-colors"
      />
      <div
        style={{ height: `${100 - topHeight}%` }}
        className="overflow-hidden"
      >
        {bottom}
      </div>
    </div>
  );
}
