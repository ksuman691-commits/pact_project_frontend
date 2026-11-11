'use client';

import React, { useRef, useState } from 'react';
import { Zap } from 'lucide-react';

interface SlideToSendProps {
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  onSend: () => void;
}

const THUMB = 52;
const PAD = 6;

/**
 * Slide the bolt across to send. Dragging is the gesture; a keyboard or a
 * screen reader activates it like any button, so nobody is locked out.
 */
export default function SlideToSend({ label, busyLabel = 'Sending…', busy = false, disabled = false, onSend }: SlideToSendProps) {
  const trackRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<{ x: number; pointer: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const off = disabled || busy;

  const room = () => Math.max(1, (trackRef.current?.clientWidth ?? 0) - THUMB - PAD * 2);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (off) return;
    startRef.current = { x: e.clientX, pointer: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!startRef.current) return;
    setOffset(Math.max(0, Math.min(room(), e.clientX - startRef.current.x)));
  };
  const finish = () => {
    if (!startRef.current) return;
    startRef.current = null;
    setDragging(false);
    if (offset >= room() * 0.82) {
      setOffset(room());
      onSend();
    } else {
      setOffset(0);
    }
  };

  return (
    <button
      ref={trackRef}
      type="button"
      disabled={off}
      aria-label={busy ? busyLabel : label.replace(/^Slide to /, '')}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      // A real click from a pointer is a drag that didn't travel; only keyboards and assistive tech (detail 0) send here.
      onClick={(e) => {
        if (e.detail === 0 && !off) onSend();
      }}
      className="relative flex h-16 w-full touch-none select-none items-center rounded-full bg-[var(--ink)] disabled:opacity-50"
      style={{ padding: PAD }}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--dare)] ${dragging || busy || offset > 0 ? '' : 'cp-slide-hint'}`}
        style={{ width: THUMB, height: THUMB, transform: `translateX(${busy ? room() : offset}px)`, transition: dragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        aria-hidden="true"
      >
        <Zap className="h-6 w-6 text-[var(--ink)]" fill="currentColor" strokeWidth={0} />
      </span>
      <span className="pointer-events-none absolute inset-x-0 text-center text-[16px] font-bold text-white" style={{ paddingLeft: THUMB, opacity: busy ? 1 : Math.max(0, 1 - offset / (room() * 0.6)) }} aria-hidden="true">
        {busy ? busyLabel : label}
      </span>
    </button>
  );
}
