'use client';

import React from 'react';
import NewPactFlow from '@/components/new-pact/NewPactFlow';

interface CreatePactFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen overlay wrapper so CreatePactFlow can drop into the same
 * isOpen/onClose call sites the old PactWizardModal used (Feed, Circles,
 * Profile entry points), while still rendering the flow's own immersive
 * dark theme edge-to-edge rather than as a boxed dialog.
 */
export default function CreatePactFlowModal({ isOpen, onClose }: CreatePactFlowModalProps) {
  if (!isOpen) return null;

  // The short flow (shoot Day 1, say it, pick who's in) replaced the old
  // six-step "What's the vibe?" wizard.
  return <NewPactFlow onExit={onClose} />;
}
