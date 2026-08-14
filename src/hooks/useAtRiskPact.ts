'use client';

import { useMemo } from 'react';
import { useUserJoinedPacts, useUserPacts } from './useFeedQueries';

const APPROACHING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

function getProofUploadDates(pact: any): Date[] {
  const clips = Array.isArray(pact?.proofClips) ? pact.proofClips : [];
  const dates: Date[] = [];

  for (const clip of clips) {
    const raw = clip?.uploaded_at || clip?.created_at;
    if (!raw) continue;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) dates.push(parsed);
  }

  if (dates.length === 0 && typeof pact?.proof_url === 'string' && pact.proof_url.trim().length > 0) {
    const raw = pact?.latest_proof_upload_date;
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) dates.push(parsed);
    }
  }

  return dates;
}

function hasProofUploadedToday(pact: any): boolean {
  const today = new Date().toDateString();
  return getProofUploadDates(pact).some((date) => date.toDateString() === today);
}

function isDeadlineApproaching(pact: any): boolean {
  const deadlineRaw = pact?.end_date || pact?.deadline;
  if (!deadlineRaw) return false;
  const deadline = new Date(deadlineRaw);
  if (Number.isNaN(deadline.getTime())) return false;
  const msRemaining = deadline.getTime() - Date.now();
  return msRemaining > 0 && msRemaining <= APPROACHING_WINDOW_MS;
}

/**
 * Best-effort "at risk" signal for the streak ring's urgency override.
 *
 * LIMITATION: there is no backend field for whether the CURRENT USER
 * specifically has submitted proof for the current period — pact records
 * only expose a shared `proofClips` / `proof_url` list with no reliable
 * per-participant attribution. This derives "no proof yet" from whether
 * ANY proof was uploaded to the pact today, which is an approximation
 * (a pact with a teammate's proof today would not flag as at-risk even if
 * the current user hasn't uploaded their own). A per-user
 * `has_submitted_proof_today` field on pact/participant records would make
 * this precise — flagging that as a follow-up rather than guessing further.
 */
export function useAtRiskPact(userId?: number) {
  const createdQuery = useUserPacts(userId || 0);
  const joinedQuery = useUserJoinedPacts(userId || 0);

  const createdPacts = useMemo(
    () => (createdQuery.data?.pages || []).flatMap((page: any) => page.data || []),
    [createdQuery.data]
  );
  const joinedPacts = useMemo(
    () => (joinedQuery.data?.pages || []).flatMap((page: any) => page.data || []),
    [joinedQuery.data]
  );

  return useMemo(() => {
    const allPacts = [...createdPacts, ...joinedPacts];
    return allPacts.some(
      (pact: any) => pact?.status === 'active' && isDeadlineApproaching(pact) && !hasProofUploadedToday(pact)
    );
  }, [createdPacts, joinedPacts]);
}
