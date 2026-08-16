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
