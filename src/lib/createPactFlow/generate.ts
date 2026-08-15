// Title & description generation — circlepact_create_pact_spec.md §5.
// Generate from draft only; never accept a separately-typed title.

import type { Activity, PactDraft } from '@/types/createPactFlow';
import { VIBE_DESCRIPTIONS } from './content';

export function daysBetween(from: Date, toIso: string): number {
  const to = new Date(toIso);
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function formatTarget(target: number, unit: string): string {
  if (unit === '₹') return '₹' + target.toLocaleString('en-IN');
  return `${target.toLocaleString('en-IN')} ${unit}`;
}

export function resolveActivityLabel(draft: PactDraft, activity: Activity | null): string {
  if (activity?.custom) return draft.customActivityLabel?.trim() || activity.label;
  return activity?.label ?? '';
}

export function resolveDurationDays(draft: PactDraft): number {
  if (draft.durationDays != null) return draft.durationDays;
  if (draft.customEndDate) return daysBetween(new Date(), draft.customEndDate);
  return 0;
}

export function generateTitle(draft: PactDraft, activity: Activity | null): string {
  if (!activity) return '';
  const label = resolveActivityLabel(draft, activity);
  let title = `${activity.emoji} ${label}`;
  if (!activity.milestone && draft.target != null && activity.unit) {
    title += ' ' + formatTarget(draft.target, activity.unit);
  }
  const days = resolveDurationDays(draft);
  if (days > 0) {
    title += ` in ${days} Days`;
  }
  return title;
}

export function generateDescription(draft: PactDraft): string {
  if (draft.descriptionOverride?.trim()) return draft.descriptionOverride.trim();
  return draft.vibeId ? VIBE_DESCRIPTIONS[draft.vibeId] : '';
}

/** Live title strip placeholder shown before any taps have happened. */
export const LIVE_TITLE_PLACEHOLDER = "Let's build your pact ⚡";
