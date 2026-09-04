// Shared translation layer for turning backend `detail` strings into safe,
// user-facing toast copy. Previously usePactMutations.ts, usePactActions.ts,
// and useDareMutations.ts each carried their own byte-for-byte identical
// `toErrorMessage` — and all three passed the raw `detail` straight through
// whenever it was a plain string. Most backend `detail` strings ARE already
// written for humans ("Pact not found", "You cannot join this pact"), so
// this keeps that pass-through default rather than rewriting everything.
// But a handful of validation messages are literally the backend's internal
// field language (snake_case identifiers, e.g. "circle_id is required for
// circle-only pacts") — those are developer-facing, not user-facing, and
// must never reach a toast as-is.
//
// KNOWN_MESSAGE_MAP curates the exact offenders seen so far into plain,
// actionable copy. SNAKE_CASE_DETECTOR is the safety net for any future
// backend message written in the same technical style that isn't in the
// map yet — it falls back to the caller's generic message instead of
// leaking a raw field name to a user.
const KNOWN_MESSAGE_MAP: Record<string, string> = {
  'circle_id is required for circle-only pacts': 'Pick a circle before creating a private pact.',
  'recipient_user_ids is required for individual dares': 'Add at least one person to dare before continuing.',
  'invalid proof_type': "That proof type isn't supported — try a photo, video, or check-in instead.",
  'respond_by must be before complete_by': 'The response deadline needs to be before the completion deadline.',
};

// Any message containing a raw snake_case identifier (e.g. "circle_id",
// "user_ids") reads as an internal API detail rather than something a user
// should see — treat it as unsafe even if it isn't in the map above yet.
const SNAKE_CASE_DETECTOR = /\b[a-z]+_[a-z][a-z_]*\b/;

function humanize(rawMessage: string, fallback: string): string {
  const trimmed = rawMessage.trim();
  if (!trimmed) return fallback;
  const known = KNOWN_MESSAGE_MAP[trimmed.toLowerCase()];
  if (known) return known;
  if (SNAKE_CASE_DETECTOR.test(trimmed)) return fallback;
  return trimmed;
}

/**
 * Extracts a safe, human-readable message from an axios/fetch-style error
 * for display in a toast. Prefer this over reading `error.response.data.detail`
 * directly in a new mutation hook.
 */
export function toErrorMessage(error: any, fallback: string): string {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return humanize(detail, fallback);
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.msg === 'string') return item.msg;
        return null;
      })
      .filter((item): item is string => Boolean(item));

    if (messages.length > 0) {
      return messages.map((msg) => humanize(msg, fallback)).join(', ');
    }
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.msg === 'string') return humanize(detail.msg, fallback);
    return fallback;
  }

  // error.message is axios/JS-level ("Network Error", "Request failed with
  // status code 500", etc.) — never backend-authored copy for end users, so
  // unlike `detail` it should not pass through by default. The one
  // well-known exception is being offline, which is worth surfacing
  // specifically rather than as a generic failure.
  if (typeof error?.message === 'string' && /network error/i.test(error.message)) {
    return "Can't reach the server — check your connection and try again.";
  }

  return fallback;
}
