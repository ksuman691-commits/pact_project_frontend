'use client';

import { useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { useToggleCheer } from '@/hooks/usePactMutations';

interface CheerButtonProps {
  pactId: number;
  /**
   * Frontend gate: only members who are not the creator may cheer. The real
   * authorization is enforced server-side (403 for creators and non-members).
   */
  canCheer: boolean;
  /** True once the current user already has a cheer on this pact. */
  hasCheered?: boolean;
  className?: string;
  /**
   * 'pill' (default) is the labeled CTA, 'icon' a compact gold button for
   * action rails, and 'stage' the round white button over a moment.
   */
  variant?: 'pill' | 'icon' | 'stage';
  /** Number of active cheers on the pact, as reported by the server. */
  cheerCount?: number;
  /** Optional: makes the count tappable for people who can't cheer. */
  onViewCheers?: () => void;
}

/**
 * One-tap cheer, like a like button: tap to cheer, tap again to undo. No
 * photo is captured or uploaded. The count updates immediately and is
 * reconciled with the server once the request settles (a failed request puts
 * everything back). One cheer per person per pact is enforced by the backend.
 *
 * People who can't cheer (the creator, non-members) see the same count as a
 * plain read-only badge rather than a button that does nothing.
 */
export default function CheerButton({
  pactId,
  canCheer,
  hasCheered = false,
  className = '',
  variant = 'pill',
  cheerCount = 0,
  onViewCheers,
}: CheerButtonProps) {
  const toggleCheer = useToggleCheer(pactId);
  // The value the user just asked for, held until the refetch lands. null
  // means "show what the server says".
  const [pending, setPending] = useState<boolean | null>(null);

  const cheered = pending ?? hasCheered;
  const optimisticDelta = pending === null ? 0 : Number(pending) - Number(hasCheered);
  const count = Math.max(0, cheerCount + optimisticDelta);

  const handleTap = () => {
    if (toggleCheer.isPending) return;
    const next = !cheered;
    setPending(next);
    if (typeof navigator !== 'undefined') navigator.vibrate?.(10);
    toggleCheer.mutate(next, { onSettled: () => setPending(null) });
  };

  const icon = (size: string) => (
    <PartyPopper
      className={`${size} transition-transform duration-150 ${cheered ? 'scale-110 text-[var(--pact-gold)]' : ''}`}
      aria-hidden="true"
    />
  );

  if (variant === 'stage') {
    const stageClass = `flex size-12 flex-col items-center justify-center gap-0.5 rounded-full bg-[var(--card)] text-[var(--ink)] shadow-lg transition ${className}`;
    const content = (
      <>
        {icon('size-4')}
        <span className="text-[11px] font-bold leading-none">{count}</span>
      </>
    );

    if (!canCheer) {
      // Read-only: the creator or a non-member looking at their own count.
      return onViewCheers ? (
        <button type="button" onClick={onViewCheers} aria-label={`${count} cheers, view`} className={stageClass}>
          {content}
        </button>
      ) : (
        <div role="img" aria-label={`${count} ${count === 1 ? 'cheer' : 'cheers'}`} className={stageClass}>
          {content}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleTap}
        disabled={toggleCheer.isPending}
        aria-pressed={cheered}
        aria-label={cheered ? 'Undo cheer' : 'Cheer this pact'}
        className={`${stageClass} active:scale-95 disabled:opacity-70`}
      >
        {content}
      </button>
    );
  }

  if (variant === 'icon') {
    const iconClass = `flex w-12 flex-col items-center gap-1 rounded-full border px-2 py-3 text-[var(--pact-gold)] backdrop-blur-md transition ${className}`;
    const content = (
      <>
        {icon('h-4 w-4')}
        <span className="text-[10px] font-semibold">{count}</span>
      </>
    );

    if (!canCheer) {
      const readOnlyClass = `${iconClass} border-[var(--pact-gold)]/50 bg-[var(--pact-gold)]/15 opacity-80`;
      return onViewCheers ? (
        <button type="button" onClick={onViewCheers} aria-label={`${count} cheers, view`} className={readOnlyClass}>
          {content}
        </button>
      ) : (
        <div role="img" aria-label={`${count} ${count === 1 ? 'cheer' : 'cheers'}`} className={readOnlyClass}>
          {content}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleTap}
        disabled={toggleCheer.isPending}
        aria-pressed={cheered}
        aria-label={cheered ? 'Undo cheer' : 'Cheer this pact'}
        className={`${iconClass} ${
          cheered
            ? 'border-[var(--pact-gold)] bg-[var(--pact-gold)]/35'
            : 'border-[var(--pact-gold)]/70 bg-[var(--pact-gold)]/25 hover:bg-[var(--pact-gold)]/35'
        } disabled:opacity-60`}
      >
        {content}
      </button>
    );
  }

  if (!canCheer) return null;

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={toggleCheer.isPending}
      aria-pressed={cheered}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60 ${className}`}
      style={{ background: cheered ? 'rgba(255,255,255,0.12)' : 'var(--navy)' }}
    >
      {icon('h-4 w-4')}
      {cheered ? 'Cheered' : 'Send a cheer'}
      {count > 0 && <span className="text-xs font-bold opacity-80">{count}</span>}
    </button>
  );
}
