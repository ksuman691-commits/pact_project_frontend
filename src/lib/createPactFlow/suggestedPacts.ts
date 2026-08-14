// Mock "Suggested Pacts" data + client-side ranking stub — spec §9.
// No real backend ranking endpoint for v1; this simulates the scoring/diversity
// selection described in §9.3 against a small mock pool so the Success screen
// isn't hardcoded to a fixed 3 cards regardless of the vibe just picked.

import type { SuggestedPact, VibeId } from '@/types/createPactFlow';

const MOCK_POOL: SuggestedPact[] = [
  {
    pactId: 'sp-1',
    creator: { id: 'u-1', displayName: 'Priya', avatarEmoji: '🌟', isInMyCircle: true },
    title: '🏃 Run 100 km in 30 Days',
    vibeId: 'glowup',
    memberCount: 42,
    mutualCount: 3,
    trending: false,
    audience: 'My Circle',
  },
  {
    pactId: 'sp-2',
    creator: { id: 'u-2', displayName: 'Arjun', avatarEmoji: '🐯', isInMyCircle: false },
    title: '💰 Save ₹50,000 in 60 Days',
    vibeId: 'money',
    memberCount: 128,
    mutualCount: 0,
    trending: true,
    audience: 'Everyone',
  },
  {
    pactId: 'sp-3',
    creator: { id: 'u-3', displayName: 'Meera', avatarEmoji: '🦋', isInMyCircle: true },
    title: '📓 Journal 20 entries in 30 Days',
    vibeId: 'wellbeing',
    memberCount: 19,
    mutualCount: 2,
    trending: false,
    audience: 'My Circle',
  },
  {
    pactId: 'sp-4',
    creator: { id: 'u-4', displayName: 'Rohan', avatarEmoji: '🚀', isInMyCircle: false },
    title: '🚀 Launch my project',
    vibeId: 'build',
    memberCount: 64,
    mutualCount: 0,
    trending: true,
    audience: 'Everyone',
  },
  {
    pactId: 'sp-5',
    creator: { id: 'u-5', displayName: 'Divya', avatarEmoji: '🌻', isInMyCircle: true },
    title: '🧘 Meditate 20 sessions in 30 Days',
    vibeId: 'glowup',
    memberCount: 33,
    mutualCount: 1,
    trending: false,
    audience: 'My Circle',
  },
  {
    pactId: 'sp-6',
    creator: { id: 'u-6', displayName: 'Karan', avatarEmoji: '🎨', isInMyCircle: false },
    title: '🎨 Draw / paint 10 pieces in 60 Days',
    vibeId: 'create',
    memberCount: 8,
    mutualCount: 0,
    trending: false,
    audience: 'Everyone',
  },
  {
    pactId: 'sp-7',
    creator: { id: 'u-7', displayName: 'Ananya', avatarEmoji: '📚', isInMyCircle: false },
    title: '📚 Read books 5 books in 90 Days',
    vibeId: 'levelup',
    memberCount: 51,
    mutualCount: 0,
    trending: true,
    audience: 'Everyone',
  },
  {
    pactId: 'sp-8',
    creator: { id: 'u-8', displayName: 'Vikram', avatarEmoji: '🥶', isInMyCircle: true },
    title: '🥶 Cold shower 7 days in 7 Days',
    vibeId: 'dare',
    memberCount: 27,
    mutualCount: 4,
    trending: false,
    audience: 'My Circle',
  },
];

interface ScoredPact {
  pact: SuggestedPact;
  score: number;
}

/**
 * Simplified client-side stand-in for the §9.3 ranking algorithm.
 * Weights mutual overlap and vibe/activity affinity the heaviest, then
 * trending and popularity, applying the same diversity constraints
 * (no duplicate creator, limited duplicate vibes, guarantee a mutual slot).
 */
export function getSuggestedPacts(
  justPickedVibeId: VibeId | null,
  justCreatedActivityLabel: string | null,
  limit = 3,
): SuggestedPact[] {
  const scored: ScoredPact[] = MOCK_POOL.map((pact) => {
    const mutualOverlap = pact.mutualCount > 0 ? Math.min(1, pact.mutualCount / 5) : 0;
    const vibeAffinity = justPickedVibeId && pact.vibeId === justPickedVibeId ? 1 : 0;
    const sameActivityBonus =
      justCreatedActivityLabel && pact.title.includes(justCreatedActivityLabel) ? 1 : 0;
    const trendingScore = pact.trending ? 1 : 0;
    const popularityPrior = Math.log(1 + pact.memberCount) * 0.15;

    const score =
      3.0 * mutualOverlap +
      2.0 * vibeAffinity +
      1.5 * sameActivityBonus +
      1.2 * trendingScore +
      0.5 * popularityPrior;

    return { pact, score };
  }).sort((a, b) => b.score - a.score);

  const selected: SuggestedPact[] = [];
  const usedCreators = new Set<string>();
  const usedVibes = new Set<VibeId>();
  const distinctVibesAvailable = new Set(scored.map((s) => s.pact.vibeId)).size;

  // Reserve a mutual-overlap slot first if one clears a minimum score floor.
  const bestMutual = scored.find((s) => s.pact.mutualCount > 0 && s.score >= 1.0);
  if (bestMutual) {
    selected.push(bestMutual.pact);
    usedCreators.add(bestMutual.pact.creator.id);
    usedVibes.add(bestMutual.pact.vibeId);
  }

  for (const { pact } of scored) {
    if (selected.length >= limit) break;
    if (selected.some((p) => p.pactId === pact.pactId)) continue;
    if (usedCreators.has(pact.creator.id)) continue;
    if (distinctVibesAvailable >= limit && usedVibes.has(pact.vibeId)) continue;

    selected.push(pact);
    usedCreators.add(pact.creator.id);
    usedVibes.add(pact.vibeId);
  }

  // Backfill (cold start / floor not cleared): never show an empty tray.
  if (selected.length < limit) {
    for (const { pact } of scored) {
      if (selected.length >= limit) break;
      if (selected.some((p) => p.pactId === pact.pactId)) continue;
      selected.push(pact);
    }
  }

  return selected.slice(0, limit);
}

/** Priority-ordered social proof line per §9.2. */
export function getSocialProofLine(pact: SuggestedPact): string {
  if (pact.mutualCount > 0) {
    return `${pact.mutualCount} ${pact.mutualCount === 1 ? 'person' : 'people'} you know are in this`;
  }
  if (pact.trending) return '🔥 Trending';
  return `${pact.memberCount} people in this pact`;
}
