'use client';

import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import ProgressDots from './ProgressDots';
import LiveTitleStrip from './LiveTitleStrip';

interface FlowShellProps {
  children: React.ReactNode;
  onExit?: () => void;
  /** Current step index within resolvedSteps (0-based). */
  stepIndex: number;
  /** Total number of steps minus 1 (i.e. the index of the last step). */
  totalSteps: number;
  canGoBack: boolean;
  onBack: () => void;
  /** false on the terminal "success" screen — hides header + title strip. */
  showChrome: boolean;
  /** Live-building summary text for this step (e.g. generated pact/circle title). */
  titleStripText: string;
  titleStripPlaceholder: string;
  /**
   * Which flow's chrome accent to use. Defaults to the Pact flow's
   * pink→violet pairing (via the CSS defaults on .pact-flow) — pass
   * "circle" to switch progress dots / title strip / CTA gradients to
   * Circle's violet→mint pairing instead. Create Dare never sets this,
   * so it keeps the default pink→violet chrome unchanged.
   */
  accent?: 'pact' | 'circle';
  /** Small icon shown in the live-title strip to hint at the flow's own
   * visual language (e.g. a target for Pact, people for Circle). */
  titleStripIcon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  /** Optional persistent context banner (e.g. an already-attached participant) shown under the title strip on every step. */
  banner?: React.ReactNode;
}

/**
 * Shared immersive tap-flow shell — back button, progress dots, live-title
 * strip, main content well. Used by Create Pact, Create Circle, and Create
 * Dare so all three flows share one visual/motion language instead of each
 * building its own one-off chrome.
 */
export default function FlowShell({
  children,
  onExit,
  stepIndex,
  totalSteps,
  canGoBack,
  onBack,
  showChrome,
  titleStripText,
  titleStripPlaceholder,
  accent,
  titleStripIcon,
  banner,
}: FlowShellProps) {
  return (
    <div
      className="pact-flow flex min-h-dvh flex-col"
      style={
        accent === 'circle'
          ? ({ '--flow-accent': 'var(--pact-violet)', '--flow-accent-2': 'var(--pact-mint)' } as React.CSSProperties)
          : undefined
      }
    >
      {showChrome && (
        <header className="flex items-center gap-3 px-5 pt-5">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--pact-text)] disabled:opacity-0"
            style={{ background: canGoBack ? 'var(--pact-surface)' : 'transparent' }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <ProgressDots current={stepIndex} total={totalSteps} />
          </div>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--pact-surface)' }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>
      )}

      {showChrome && (
        <div className="px-5 pt-6">
          <LiveTitleStrip text={titleStripText} placeholder={titleStripPlaceholder} icon={titleStripIcon} />
        </div>
      )}

      {showChrome && banner && <div className="px-5 pt-3">{banner}</div>}

      <main className="flex flex-1 flex-col px-5 pb-10 pt-6">{children}</main>
    </div>
  );
}
