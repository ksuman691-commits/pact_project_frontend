// Resolved step list + validation — circlepact_create_pact_spec.md §1, §6.

import type { Activity, FlowStep, PactDraft } from '@/types/createPactFlow';

/**
 * Recomputed from draft on every relevant change — never hardcoded.
 * Target is skipped for milestone activities; Frequency is folded into the
 * Proof screen itself (not a separate step) and simply doesn't render when
 * proofMethod is "Activity data".
 */
export function resolveSteps(draft: PactDraft, activity: Activity | null): FlowStep[] {
  const steps: FlowStep[] = ['vibe', 'activity'];
  if (!activity?.milestone) steps.push('target');
  steps.push('duration', 'proof');
  // Audience is pre-set (and the question skipped) when the flow was
  // launched from a Circle's "Start a Pact for this Circle" CTA.
  if (!draft.audiencePreset) steps.push('audience');
  steps.push('review', 'success');
  return steps;
}

export function isMilestoneActivity(activity: Activity | null): boolean {
  return Boolean(activity?.milestone);
}

const MAX_SANE_TARGET = 1_000_000;

export function validateCustomTarget(value: number): { valid: boolean; warning?: string; error?: string } {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return { valid: false, error: 'Enter a whole number greater than 0.' };
  }
  if (value > MAX_SANE_TARGET) {
    return { valid: true, warning: "That's a big number — double check it." };
  }
  return { valid: true };
}

export function validateCustomEndDate(iso: string): { valid: boolean; error?: string } {
  const chosen = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  chosen.setHours(0, 0, 0, 0);
  if (Number.isNaN(chosen.getTime()) || chosen.getTime() <= today.getTime()) {
    return { valid: false, error: 'Pick a date after today.' };
  }
  return { valid: true };
}

export function validateCustomActivityLabel(label: string): { valid: boolean; error?: string } {
  const trimmed = label.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    return { valid: false, error: 'Use 2-40 characters.' };
  }
  // Block emoji-only submissions: require at least one letter or digit.
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return { valid: false, error: 'Add some text, not just emoji.' };
  }
  return { valid: true };
}
