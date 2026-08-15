// Lightweight keyword heuristic — NOT exhaustive NLP. Dares are meant to be
// single-day (respond within up to 24h, complete within up to 48h — see
// TimingStep.tsx), but the free-text title/description fields accept
// arbitrary text with zero constraint. This flags language that suggests the
// user is actually describing a multi-day/recurring commitment (a Pact),
// so the UI can nudge them — not block them, since phrases like "practice
// guitar every day this week" can still be a fine single-day reminder-style
// Dare for some users.
const MULTI_DAY_PATTERNS: RegExp[] = [
  /every\s*day/i,
  /each\s*day/i,
  /per\s*day/i,
  /daily/i,
  /\bdaily\b/i,
  /for\s*\d+\s*days?/i,
  /\bthis\s*week\b/i,
  /\bnext\s*week\b/i,
  /\bevery\s*week\b/i,
  /\bweekly\b/i,
  /for\s*a\s*week/i,
  /for\s*\d+\s*weeks?/i,
  /over\s*the\s*next\s*\d+\s*days?/i,
  /\bmultiple\s*days\b/i,
  /\bfor\s*a\s*month\b/i,
  /\d+\s*(day|week)\s*(streak|challenge)/i,
];

export function detectsMultiDayLanguage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return MULTI_DAY_PATTERNS.some((pattern) => pattern.test(trimmed));
}
