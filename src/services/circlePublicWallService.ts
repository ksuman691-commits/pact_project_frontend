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

export type CirclePublicWallSummary = {
  id: number;
  name: string;
  icon_emoji: string | null;
  photo_url: string | null;
  pacts: CirclePublicWallPact[];
};

export type CircleQrProgress = {
  qr_seed: string;
  /** Always normalized to a 0-100 scale, regardless of the backend's raw units. */
  reveal_progress: number;
};

/**
 * Public, no-login Circle Wall + QR data, matching the ACTUAL deployed
 * backend contract (verified live on 2026-08-31 against
 * https://pact-project-backend-v2.onrender.com/openapi.json):
 *
 *   GET /api/circles/{id}/wall
 *     -> { id, name, photo_url, icon_emoji, pacts: [{ id, title, category,
 *          progress_percent, start_date, end_date, participant_count }] }
 *     No auth required at runtime (OpenAPI lists an optional bearer scheme
 *     but the route does not enforce it - verified with an unauthenticated
 *     curl returning 200). The pact list has NO visibility field - the
 *     backend is expected to have already restricted it server-side to
 *     public (+ completed) pacts only, per BACKEND_SPEC_CIRCLE_WALL.md.
 *
 *   GET /api/circles/{id}/qr-progress
 *     -> { qr_seed, reveal_progress }
 *     Confirmed public (no security scheme in OpenAPI). qr_seed is a
 *     stable per-circle random string (not a lookup token - no endpoint
 *     accepts it as a parameter), used here only to seed a cosmetic
 *     rotation of the QR reveal start offset so circles don't all reveal
 *     in the exact same visual pattern.
 *
 * This is a DIFFERENT, leaner shape than the original
 * BACKEND_SPEC_CIRCLE_WALL.md draft (which specced /public-wall and
 * /public-wall/pacts) - the backend team implemented their own contract.
 * Frontend now follows what was actually shipped.
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
      return {
        id: Number(raw.id ?? circleId),
        name: String(raw.name ?? ''),
        icon_emoji: raw.icon_emoji ?? null,
        photo_url: raw.photo_url ?? null,
        pacts,
      };
    } catch {
      return null;
    }
  },
  getQrProgress: async (circleId: number): Promise<CircleQrProgress | null> => {
    try {
      const response = await publicApi.get(`/api/circles/${circleId}/qr-progress`);
      const raw = response.data;
      if (!raw || typeof raw?.qr_seed !== 'string') return null;
      const rawProgress = Number(raw.reveal_progress ?? 0);
      // Backend units are unconfirmed (could be a 0-1 fraction or 0-100).
      // Normalize defensively: anything <= 1 is treated as a fraction.
      const normalized = rawProgress <= 1 ? rawProgress * 100 : rawProgress;
      return { qr_seed: raw.qr_seed, reveal_progress: Math.max(0, Math.min(100, normalized)) };
    } catch {
      return null;
    }
  },
};
