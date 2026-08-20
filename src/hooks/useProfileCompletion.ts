'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { useUserStats } from '@/hooks/useUserQueries';

export type ProfileChecklistItemId = 'account' | 'photo' | 'circle' | 'pact';

export interface ProfileChecklistItem {
  id: ProfileChecklistItemId;
  label: string;
  done: boolean;
}

const NEW_USER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Drives both profile-completion nudge variants on the Feed page.
 *
 * "New user" vs "returning user" is decided purely by account age
 * (created_at within the last 7 days) — no new backend field needed.
 *
 * circles_count and pacts_joined_count are live UserStatsResponse fields
 * (see BACKEND_SPEC_PROFILE_NUDGE_AND_CIRCLE_PHOTO.md for the contract).
 */
export function useProfileCompletion() {
  const { user } = useAuthStore();
  const userId = user?.id || 0;

  const statsQuery = useUserStats(userId);
  const stats = statsQuery.data?.data;

  const isLoading = !!userId && statsQuery.isLoading;

  const hasPhoto = Boolean(user?.avatar_url);
  const hasCircle = (stats?.circles_count ?? 0) > 0;
  // Checklist item is specifically "Create your first Pact" — pacts_created
  // only. pacts_joined_count tracks a different signal (participating in
  // someone else's pact) and isn't what this item is asking about.
  const hasCreatedPact = (stats?.pacts_created ?? 0) > 0;

  const checklist: ProfileChecklistItem[] = useMemo(
    () => [
      { id: 'account', label: 'Account created', done: true },
      { id: 'photo', label: 'Add a profile photo', done: hasPhoto },
      { id: 'circle', label: 'Join your first Circle', done: hasCircle },
      { id: 'pact', label: 'Create your first Pact', done: hasCreatedPact },
    ],
    [hasPhoto, hasCircle, hasCreatedPact],
  );

  const completedCount = checklist.filter((item) => item.done).length;
  const percent = Math.round((completedCount / checklist.length) * 100);
  const isComplete = percent >= 100;

  const accountAgeMs = user?.created_at ? Date.now() - new Date(user.created_at).getTime() : 0;
  const isNewAccount = Boolean(user?.created_at) && accountAgeMs >= 0 && accountAgeMs < NEW_USER_WINDOW_MS;

  // First missing item in priority order — drives the single nudge copy for
  // returning users. Photo first since it's the fastest, one-tap fix.
  const missingItem = checklist.find((item) => item.id !== 'account' && !item.done) ?? null;

  return {
    isLoading,
    isReady: !!user,
    checklist,
    percent,
    isComplete,
    // New user → show the full checklist card. Returning/inactive user with
    // something missing → show the single quiet nudge instead.
    showChecklist: !isComplete && isNewAccount,
    showSingleNudge: !isComplete && !isNewAccount && !!missingItem,
    missingItem,
  };
}
