/**
 * When a moderator pauses an account, signing in answers 403 with
 * { code: 'account_suspended', until, reason }. The sign-in screens hand that
 * to /auth/paused through sessionStorage, so the reason never sits in a URL.
 */
export const SUPPORT_EMAIL = 'support@circlepact.com';
const KEY = 'cp_paused';

export interface PausedInfo {
  until: string | null;
  reason: string | null;
}

export function pausedFrom(error: unknown): PausedInfo | null {
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } })?.response;
  const detail = response?.data?.detail as { code?: string; until?: string | null; reason?: string | null } | undefined;
  if (response?.status !== 403 || detail?.code !== 'account_suspended') return null;
  return { until: detail.until ?? null, reason: detail.reason ?? null };
}

export function rememberPaused(info: PausedInfo) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    /* the page falls back to a general message */
  }
}

export function readPaused(): PausedInfo | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PausedInfo) : null;
  } catch {
    return null;
  }
}
