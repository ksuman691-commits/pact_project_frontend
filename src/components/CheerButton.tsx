'use client';

import { useRef, useState } from 'react';
import { PartyPopper, Loader2, Check } from 'lucide-react';
import { useCreateCheer } from '@/hooks/usePactMutations';

interface CheerButtonProps {
  pactId: number;
  /** Frontend gate: only members who are not the creator may post a cheer. */
  canCheer: boolean;
  /**
   * Frontend gate: true once the current user already has a cheer on this
   * pact (derived from the cheer list). Disables the button to stop honest
   * double-taps.
   *
   * NOTE: this is a UI convenience only, not the fix. The backend has no
   * uniqueness constraint on (pact_id, sender_id) for cheers today, so a
   * second device, a replayed request, or a modified client can still post
   * unlimited duplicate cheers. See BACKEND_HANDOFF_CHEER_DEDUP.md for the
   * required server-side fix (unique constraint + a delete-cheer endpoint
   * so cheers can be undone/re-sent, matching the product decision that
   * cheers are not permanent).
   */
  hasCheered?: boolean;
  className?: string;
  /**
   * 'pill' (default) is the full labeled CTA used in the "cheer this pact
   * on" panel. 'icon' is a compact circular button for action rails (e.g.
   * the pact detail carousel's Overview panel) — gold-accented since cheer
   * is the highest-value engagement action there, distinct in weight from
   * neighboring Message/Share icons. In 'icon' mode, viewers who can't
   * cheer (creator, non-participants) still get a clickable "view cheers"
   * affordance via onViewCheers instead of the control disappearing.
   */
  variant?: 'pill' | 'icon';
  cheerCount?: number;
  onViewCheers?: () => void;
}

/**
 * Fast, single-photo "cheer" action for non-creator pact members.
 * Tapping the button opens the photo picker directly and uploads immediately
 * on selection — no caption, no confirmation step.
 *
 * NOTE: `canCheer` only hides the upload affordance in the UI. The real
 * membership / non-creator authorization must happen server-side; see
 * BACKEND_HANDOFF_CHEER_DEDUP.md for the backend team, since this frontend
 * has no proxy layer capable of enforcing it.
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const createCheer = useCreateCheer(pactId);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      await createCheer.mutateAsync(file);
    } finally {
      setIsUploading(false);
    }
  };

  if (variant === 'icon') {
    // Viewers who can't cheer themselves (creator, non-participants) still
    // get a gold-accented "view cheers" affordance rather than a dead icon.
    if (!canCheer || hasCheered) {
      return (
        <button
          type="button"
          onClick={onViewCheers}
          disabled={!onViewCheers}
          title={hasCheered ? "You've already cheered this pact" : 'View cheers'}
          className={`flex w-12 flex-col items-center gap-1 rounded-full border border-[var(--pact-gold)]/50 bg-[var(--pact-gold)]/15 px-2 py-3 text-[var(--pact-gold)] backdrop-blur-md transition hover:bg-[var(--pact-gold)]/25 disabled:cursor-default disabled:opacity-70 ${className}`}
        >
          {hasCheered ? <Check className="h-4 w-4" /> : <PartyPopper className="h-4 w-4" />}
          <span className="text-[10px] font-semibold">{cheerCount}</span>
        </button>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          title="Send a cheer"
          className={`flex w-12 flex-col items-center gap-1 rounded-full border border-[var(--pact-gold)]/70 bg-[var(--pact-gold)]/25 px-2 py-3 text-[var(--pact-gold)] backdrop-blur-md transition hover:bg-[var(--pact-gold)]/35 disabled:opacity-60 ${className}`}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PartyPopper className="h-4 w-4" />}
          <span className="text-[10px] font-semibold">{cheerCount}</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />
      </>
    );
  }

  if (!canCheer) return null;

  if (hasCheered) {
    return (
      <button
        type="button"
        disabled
        title="You've already cheered this pact. Undoing/re-sending a cheer isn't supported yet — see BACKEND_HANDOFF_CHEER_DEDUP.md."
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/70 ${className}`}
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <Check className="h-4 w-4" />
        Cheered
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${className}`}
        style={{ background: 'linear-gradient(135deg, var(--pact-gold), #f59e0b)' }}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PartyPopper className="h-4 w-4" />
        )}
        {isUploading ? 'Posting cheer...' : 'Send a cheer'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
