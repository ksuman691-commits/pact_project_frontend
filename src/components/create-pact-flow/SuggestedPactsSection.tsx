'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSuggestedPacts } from '@/hooks/useFeedQueries';
import { pactService } from '@/services/api';
import type { VibeId } from '@/types/createPactFlow';
import UserAvatarLink from '@/components/UserAvatarLink';

interface SuggestedPactsSectionProps {
  justPickedVibeId: VibeId | null;
  justCreatedActivityLabel: string | null;
}

/**
 * "Suggested for you" tray on the Success screen — spec §9.
 * Backed by the real /api/feed discover endpoint (no dedicated ranking
 * endpoint exists yet, so this is a lightweight client-side pick rather
 * than the full §9.3 scoring algorithm). Joining calls the real
 * POST /api/pacts/:id/join endpoint.
 */
export default function SuggestedPactsSection({
  justPickedVibeId,
  justCreatedActivityLabel,
}: SuggestedPactsSectionProps) {
  const { data, isLoading } = useSuggestedPacts(3);
  const router = useRouter();
  const [joinedIds, setJoinedIds] = useState<Record<number, boolean>>({});
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const pool = Array.isArray(data?.data) ? data!.data : [];

  // Prefer pacts matching the vibe/activity just created, then fall back to
  // whatever discover returned, capped at 3 and excluding pacts already joined.
  const sameVibe = pool.filter((p: any) => p.vibe_id === justPickedVibeId && !p.is_joined_by_me);
  const rest = pool.filter((p: any) => !sameVibe.includes(p) && !p.is_joined_by_me);
  const suggestions = [...sameVibe, ...rest].slice(0, 3);

  if (isLoading || suggestions.length === 0) return null;

  const handleToggle = async (pact: any) => {
    if (joiningId !== null) return;
    const alreadyJoined = Boolean(joinedIds[pact.id]);

    if (alreadyJoined) {
      // No unjoin endpoint is wired here; just reset the local toggle.
      setJoinedIds((prev) => ({ ...prev, [pact.id]: false }));
      return;
    }

    setJoiningId(pact.id);
    try {
      await pactService.join(pact.id);
      setJoinedIds((prev) => ({ ...prev, [pact.id]: true }));
      toast.success('Joined pact');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to join pact');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="mt-10 w-full">
      <h3 className="pact-mono text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--pact-gold)' }}>
        Suggested for you
      </h3>
      <div className="mt-3 flex flex-col gap-3">
        {suggestions.map((pact: any) => (
          <SuggestedPactCard
            key={pact.id}
            pact={pact}
            joined={Boolean(joinedIds[pact.id])}
            joining={joiningId === pact.id}
            onToggle={() => handleToggle(pact)}
            onOpen={() => router.push(`/pacts/${pact.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function getSocialProofLine(pact: any): string {
  const supportCount = Number(pact?.support_count ?? 0);
  if (supportCount > 0) {
    return `${supportCount} ${supportCount === 1 ? 'person' : 'people'} believe in this`;
  }
  return 'Just created — be the first to join';
}

function SuggestedPactCard({
  pact,
  joined,
  joining,
  onToggle,
  onOpen,
}: {
  pact: any;
  joined: boolean;
  joining: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="pact-surface flex items-center gap-3 rounded-2xl p-4">
      {/* A Link can't legally nest inside a <button> (used for the rest of
          the row's onOpen tap target), so the avatar gets its own div
          rather than reusing that button like the other fields below. */}
      <div className="shrink-0">
        <UserAvatarLink
          name={pact?.creator || pact?.creator_username}
          avatarUrl={pact.creatorAvatarUrl}
          username={pact?.creator_username || null}
          size={40}
        />
      </div>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-[var(--pact-text)]">{pact.title}</p>
        <p className="pact-mono mt-0.5 text-xs text-[var(--pact-text-muted)]">
          {getSocialProofLine(pact)}
        </p>
      </button>
      <button
        type="button"
        onClick={onToggle}
        disabled={joining}
        aria-pressed={joined}
        className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
        style={
          joined
            ? { background: 'transparent', border: '1px solid var(--pact-hairline)', color: 'var(--pact-text-muted)' }
            : { background: 'var(--pact-violet)', color: 'var(--pact-text)' }
        }
      >
        {joining ? '...' : joined ? 'Undo' : 'Join'}
      </button>
    </div>
  );
}
