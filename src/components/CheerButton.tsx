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
}

/**
 * Fast, single-photo "cheer" action for non-creator pact members.
 * Tapping the button opens the photo picker directly and uploads immediately
 * on selection — no caption, no confirmation step.
 *
 * NOTE: `canCheer` only hides this control in the UI. The real membership /
 * non-creator authorization must happen server-side; see
 * BACKEND_HANDOFF_CHEER_DEDUP.md for the backend team, since this frontend
 * has no proxy layer capable of enforcing it.
 */
export default function CheerButton({ pactId, canCheer, hasCheered = false, className = '' }: CheerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const createCheer = useCreateCheer(pactId);

  if (!canCheer) return null;

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
