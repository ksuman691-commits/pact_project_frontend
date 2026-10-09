// Resolved step list + validation — circlepact_create_pact_spec.md §1, §6.

import type { Activity, FlowStep, PactDraft } from '@/types/createPactFlow';

/**
 * Two question screens plus checkout. Per-question skips (preset goal row,
 * preset audience, milestone target) happen inside the screens, driven by
 * the draft — see WhatScreen / WhenScreen.
 */
export function resolveSteps(_draft?: PactDraft, _activity?: Activity | null): FlowStep[] {
  return ['what', 'when', 'review', 'success'];
}

/** Days the user must show up on to complete a daily pact: ceil(75%). */
export function requiredDays(totalDays: number): number {
  return Math.ceil(totalDays * 0.75);
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
