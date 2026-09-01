'use client';

import { useQuery } from '@tanstack/react-query';
import { feedService, userService } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { queryKeys } from '@/lib/queryKeys';

export interface CategoryMatchPerson {
  id: number;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  /** True if the current user already follows this person (a "known" match). */
  known: boolean;
}

export interface CategoryMatchesResult {
  category: string;
  /** Unique people (deduped by creator) found chasing this category, within the fetched sample. */
  totalCount: number;
  knownCount: number;
  /** Known matches first, capped for display. */
  people: CategoryMatchPerson[];
}

const SAMPLE_SIZE = 40;
const DISPLAY_CAP = 12;

const emptyResult = (category: string): CategoryMatchesResult => ({ category, totalCount: 0, knownCount: 0, people: [] });

/**
 * "Who else is chasing this goal category" — a category-scoped stand-in
 * for the pact-scoped mutual-goal-matching endpoint (GET
 * /api/pacts/{id}/matches, see BACKEND_SPEC_MUTUAL_GOAL_MATCHING.md),
 * which is NOT YET LIVE on the backend and requires an existing pact_id
 * besides. The category-selection screen and the standalone "Connect me
 * with similar folks" surface both need this signal *before* a pact
 * exists, so there's no pact_id to call that endpoint with even once it
 * ships. This derives the same "real people, real numbers" signal from
 * data that IS live today: public feed pacts in the category
 * (feedService.getPersonalized), deduped by creator, cross-referenced
 * against who the current user already follows (userService.getFollowing)
 * to split "people you know" from "the wider platform." Degrades to an
 * empty result on any failure — same convention as useGoalMatches.
 */
export function useCategoryMatches(category: string | null | undefined, options?: { enabled?: boolean }) {
  const myUserId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...queryKeys.feed.categoryMatches(category || ''), myUserId ?? 'anon'],
    queryFn: async (): Promise<CategoryMatchesResult> => {
      if (!category) return emptyResult('');
      try {
        const [feedRes, followingRes] = await Promise.all([
          feedService.getPersonalized(0, SAMPLE_SIZE, category),
          myUserId ? userService.getFollowing(myUserId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);

        const pacts = (feedRes.data ?? []) as any[];
        const followingIds = new Set(
          ((followingRes.data ?? []) as any[]).map((person) => person?.id ?? person?.user_id).filter(Boolean),
        );

        const seen = new Set<number>();
        const people: CategoryMatchPerson[] = [];
        for (const pact of pacts) {
          const creatorId = pact?.creator_id;
          if (!creatorId || creatorId === myUserId || seen.has(creatorId)) continue;
          seen.add(creatorId);
          people.push({
            id: creatorId,
            username: pact?.creator_username ?? '',
            fullName: pact?.creator_full_name ?? null,
            avatarUrl: pact?.creator_avatar_url ?? null,
            known: followingIds.has(creatorId),
          });
        }

        // Known matches lead — they're the more compelling, more
        // actionable signal ("12 people you know" beats a stranger count).
        people.sort((a, b) => Number(b.known) - Number(a.known));

        return {
          category,
          totalCount: people.length,
          knownCount: people.filter((person) => person.known).length,
          people: people.slice(0, DISPLAY_CAP),
        };
      } catch {
        return emptyResult(category);
      }
    },
    enabled: Boolean(category) && (options?.enabled ?? true),
    retry: false,
    staleTime: 1000 * 60 * 2,
  });
}
