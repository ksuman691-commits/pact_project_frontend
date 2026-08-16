/**
 * Shared countdown formatting for Dares — used by both the list card and
 * the detail page so the "urgent vs comfortable" framing is identical
 * everywhere. Pending dares count down to respond_by (the recipient must
 * accept/decline in time); accepted dares count down to complete_by (the
 * recipient must submit proof in time).
 */

export type CountdownUrgency = 'urgent' | 'neutral' | 'expired';

export interface Countdown {
  label: string;
  urgency: CountdownUrgency;
}

/** Renders a countdown label + urgency tier for a target ISO date string. */
export function formatCountdown(targetDateRaw: string | null | undefined, verb: 'Respond' | 'Complete' = 'Complete'): Countdown {
  if (!targetDateRaw) return { label: 'No deadline', urgency: 'neutral' };

  const targetDate = new Date(targetDateRaw);
  if (Number.isNaN(targetDate.getTime())) return { label: 'No deadline', urgency: 'neutral' };

  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) return { label: `${verb === 'Respond' ? 'Response' : 'Deadline'} expired`, urgency: 'expired' };

  const hours = diffMs / (1000 * 60 * 60);
  const urgency: CountdownUrgency = hours < 2 ? 'urgent' : 'neutral';

  if (hours < 1) {
    const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return { label: `${minutes}m to ${verb.toLowerCase()}`, urgency };
  }
  if (hours < 24) {
    return { label: `${Math.round(hours)}h to ${verb.toLowerCase()}`, urgency };
  }
  const days = Math.round(hours / 24);
  return { label: `${days}d to ${verb.toLowerCase()}`, urgency };
}

/** CSS variable color for a countdown urgency tier — red/urgent, gold/neutral. */
export function urgencyColor(urgency: CountdownUrgency): string {
  if (urgency === 'urgent') return 'var(--pact-pink)';
  if (urgency === 'expired') return 'var(--pact-text-faint)';
  return 'var(--pact-gold)';
}

/**
 * Plain relative-time label for a timeline row (e.g. "Respond by" / "Complete
 * by" on the dare detail page) — unlike formatCountdown above, this has no
 * verb baked in and handles both future ("in 5h") and past ("5h ago") dates,
 * since a completed/expired dare's timeline rows still need a sensible label.
 * Raw absolute datetimes ("15/08/2026, 21:40:06") are hard to parse at a
 * glance for a time-boxed feature — this is the primary display; pair it
 * with a `title` attribute holding the exact datetime for hover/tap detail.
 */
export function formatRelativeTime(targetDateRaw: string | null | undefined): string {
  if (!targetDateRaw) return 'No deadline';

  const targetDate = new Date(targetDateRaw);
  if (Number.isNaN(targetDate.getTime())) return 'No deadline';

  const diffMs = targetDate.getTime() - Date.now();
  const future = diffMs > 0;
  const absMs = Math.abs(diffMs);
  const minutes = absMs / (1000 * 60);
  const hours = minutes / 60;
  const days = hours / 24;

  let amount: string;
  if (minutes < 1) {
    amount = future ? 'less than a minute' : 'just now';
    return future ? `in ${amount}` : amount;
  } else if (hours < 1) {
    amount = `${Math.round(minutes)}m`;
  } else if (hours < 24) {
    amount = `${Math.round(hours)}h`;
  } else {
    amount = `${Math.round(days)}d`;
  }

  return future ? `in ${amount}` : `${amount} ago`;
}
