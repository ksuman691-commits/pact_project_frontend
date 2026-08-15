'use client';

import { useRef, useState } from 'react';
import { PartyPopper, Loader2 } from 'lucide-react';
import { useCreateCheer } from '@/hooks/usePactMutations';

interface CheerButtonProps {
  pactId: number;
  /** Frontend gate: only members who are not the creator may post a cheer. */
  canCheer: boolean;
  className?: string;
}

/**
 * Fast, single-photo "cheer" action for non-creator pact members.
 * Tapping the button opens the photo picker directly and uploads immediately
 * on selection — no caption, no confirmation step.
 *
 * NOTE: `canCheer` only hides this control in the UI. The real membership /
 * non-creator authorization must happen server-side; see the handoff spec in
 * the project notes for the backend team, since this frontend has no proxy
 * layer capable of enforcing it.
 */
export default function CheerButton({ pactId, canCheer, className = '' }: CheerButtonProps) {
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
