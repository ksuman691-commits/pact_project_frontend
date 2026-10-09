import type { Pact } from '@/types';

export type PactCompletionViewState = 'completed' | 'partial' | 'empty' | 'provisional_completed' | 'provisional_not_completed';

function localDateInTimezone(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
}

export function resolvePactCompletionViewState(
  pact: Partial<Pact>,
  now = new Date(),
  fallbackDaysCompleted = 0,
): PactCompletionViewState | null {
  if (pact.status === 'cancelled') return null;

  const daysCompleted = Number(pact.days_completed ?? fallbackDaysCompleted);
  if (pact.outcome === 'completed' || (pact.outcome == null && pact.status === 'completed')) {
    return 'completed';
  }
  if (pact.outcome === 'not_completed' || (pact.outcome == null && pact.status === 'failed')) {
    return daysCompleted > 0 ? 'partial' : 'empty';
  }

  if (pact.status !== 'active' || pact.completion_rule !== 'moments_75') return null;
  if (!pact.start_date || !pact.duration_days || !pact.days_required) return null;

  const timezone = pact.timezone || 'Asia/Kolkata';
  let today: string;
  try {
    today = localDateInTimezone(now, timezone);
  } catch {
    return null;
  }
  const lastPactDate = addDays(pact.start_date, pact.duration_days - 1);
  if (today <= lastPactDate) return null;

  return daysCompleted >= pact.days_required ? 'provisional_completed' : 'provisional_not_completed';
}

export function pactLocalToday(pact: Pick<Pact, 'timezone'>, now = new Date()): string {
  return localDateInTimezone(now, pact.timezone || 'Asia/Kolkata');
}
