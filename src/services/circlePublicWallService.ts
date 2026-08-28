import { publicApi } from './publicApi';
import { mapPact } from './api';

export type CirclePublicWallSummary = {
  id: number;
  name: string;
  description: string;
  icon_emoji: string | null;
  photo_url: string | null;
  member_count: number;
  public_pact_count: number;
  public_pact_completed_count: number;
};

/**
 * Public, no-login Circle Wall data. Both calls hit the unauthenticated
 * endpoints spec'd in BACKEND_SPEC_CIRCLE_WALL.md
 * (GET /api/circles/{id}/public-wall and .../public-wall/pacts), which are
 * NOT YET IMPLEMENTED on the backend. Every failure here is treated as
 * best-effort — the wall page renders a friendly empty state instead of
 * crashing, matching the existing circleAdvancedService.inviteUser
 * 404-degrades-to-toast pattern — so the page works today and starts
 * showing real data automatically once the backend ships those routes.
 */
export const circlePublicWallService = {
  getCircle: async (circleId: number): Promise<CirclePublicWallSummary | null> => {
    try {
      const response = await publicApi.get(`/api/circles/${circleId}/public-wall`);
      const raw = response.data;
      return {
        id: raw?.id ?? circleId,
        name: raw?.name ?? '',
        description: raw?.description ?? '',
        icon_emoji: raw?.icon_emoji ?? null,
        photo_url: raw?.photo_url ?? null,
        member_count: Number(raw?.member_count ?? 0),
        public_pact_count: Number(raw?.public_pact_count ?? 0),
        public_pact_completed_count: Number(raw?.public_pact_completed_count ?? 0),
      };
    } catch {
      return null;
    }
  },
  getPacts: async (circleId: number): Promise<any[]> => {
    try {
      const response = await publicApi.get(`/api/circles/${circleId}/public-wall/pacts`);
      const rows = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      // Defense in depth: even though the backend spec requires
      // visibility === 'public' filtering server-side, never trust a
      // single layer for the privacy boundary — re-check here too so a
      // future backend regression can't leak a private/circle_only pact
      // onto this public, no-login page.
      return rows.filter((p: any) => p?.visibility === 'public').map(mapPact);
    } catch {
      return [];
    }
  },
};

