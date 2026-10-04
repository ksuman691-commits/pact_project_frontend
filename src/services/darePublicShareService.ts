import { publicApi } from './publicApi';

export type DarePublicShare = {
  id: number;
  title: string;
  description: string;
  creator_username: string | null;
  creator_full_name: string | null;
  creator_avatar_url: string | null;
  proof_url: string | null;
  proof_type: 'photo' | 'video' | 'checklist';
  caption: string | null;
  completed_at: string;
};

/**
 * Public, no-login dare-proof share data, hitting the backend contract
 * specced in BACKEND_SPEC_DARE_PUBLIC_SHARE.md — NOT YET LIVE (the backend
 * was suspended at the infra level while this was built, so the route could
 * not be verified against a real deployment; see that spec's "Verification
 * status" section). Wired as if it already exists, same pattern as
 * circlePublicWallService/useCategoryMatches: a 404 or network failure here
 * degrades to the public page's "not found" state rather than crashing.
 *
 * Deliberately queries DareProof server-side rather than depending on
 * `dare.proof_url` (a separate, pre-existing field that isn't actually on
 * the live DareResponse yet) — see the spec doc for why.
 */
export const darePublicShareService = {
  getPublicShare: async (dareId: number): Promise<DarePublicShare | null> => {
    try {
      const response = await publicApi.get(`/api/dares/${dareId}/public`);
      const raw = response.data;
      if (!raw || typeof raw !== 'object') return null;
      return {
        id: Number(raw.id ?? dareId),
        title: String(raw.title ?? ''),
        description: String(raw.description ?? ''),
        creator_username: raw.creator_username ?? null,
        creator_full_name: raw.creator_full_name ?? null,
        creator_avatar_url: raw.creator_avatar_url ?? null,
        proof_url: raw.proof_url ?? null,
        proof_type: (raw.proof_type as DarePublicShare['proof_type']) ?? 'photo',
        caption: raw.caption ?? null,
        completed_at: String(raw.completed_at ?? ''),
      };
    } catch {
      return null;
    }
  },
};

/** Plain, readable share link — not a token, since nothing here is
 * sensitive once a dare's proof is shareable at all (matches the Circle
 * Wall link's non-tokenized convention). */
export function dareShareUrl(dareId: number): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/dares/${dareId}/public`;
}
