import { publicApi } from './publicApi';

export type CirclePublicWallPact = {
  id: number;
  title: string;
  category: string;
  progress_percent: number;
  start_date: string;
  end_date: string;
  participant_count: number;
};

/** A proof a member chose to make public. Only present once the backend returns `proofs`. */
export type CirclePublicWallProof = {
  id: number;
  pact_id: number;
  pact_title: string;
  image_url: string;
  member_name: string;
  submitted_at: string;
};

export type CirclePublicWallSummary = {
  id: number;
  name: string;
  icon_emoji: string | null;
  photo_url: string | null;
  pacts: CirclePublicWallPact[];
  /** null when the endpoint does not report it. */
  description: string | null;
  member_count: number | null;
  /** null when the endpoint does not return proofs at all (as opposed to an empty list). */
  proofs: CirclePublicWallProof[] | null;
};

/**
 * Public, no-login Circle Wall, matching the deployed backend contract:
 *
 *   GET /api/circles/{id}/wall
 *     -> { id, name, photo_url, icon_emoji, pacts: [...] }
 *
 * `description`, `member_count` and `proofs` are not returned yet (see
 * BACKEND_SPEC_PUBLIC_WALL_PROOFS.md). They are parsed when present and are
 * null otherwise, so the page can say nothing instead of guessing.
 */
export const circlePublicWallService = {
  getWall: async (circleId: number): Promise<CirclePublicWallSummary | null> => {
    try {
      const response = await publicApi.get(`/api/circles/${circleId}/wall`);
      const raw = response.data;
      if (!raw || typeof raw !== 'object') return null;
      const pacts: CirclePublicWallPact[] = Array.isArray(raw.pacts)
        ? raw.pacts.map((p: any) => ({
            id: Number(p?.id),
            title: String(p?.title ?? ''),
            category: String(p?.category ?? ''),
            progress_percent: Number(p?.progress_percent ?? 0),
            start_date: String(p?.start_date ?? ''),
            end_date: String(p?.end_date ?? ''),
            participant_count: Number(p?.participant_count ?? 0),
          }))
        : [];
      const proofs: CirclePublicWallProof[] | null = Array.isArray(raw.proofs)
        ? raw.proofs
            .filter((p: any) => typeof p?.image_url === 'string' && p.image_url)
            .map((p: any) => ({
              id: Number(p.id),
              pact_id: Number(p.pact_id),
              pact_title: String(p.pact_title ?? ''),
              image_url: String(p.image_url),
              member_name: String(p.member_name ?? ''),
              submitted_at: String(p.submitted_at ?? ''),
            }))
        : null;
      return {
        id: Number(raw.id ?? circleId),
        name: String(raw.name ?? ''),
        icon_emoji: raw.icon_emoji ?? null,
        photo_url: raw.photo_url ?? null,
        pacts,
        description: typeof raw.description === 'string' && raw.description.trim() ? raw.description : null,
        member_count: typeof raw.member_count === 'number' ? raw.member_count : null,
        proofs,
      };
    } catch {
      return null;
    }
  },
};
