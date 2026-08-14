'use client';

import React from 'react';
import CreatePactFlow from './CreatePactFlow';

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* key resets CreatePactFlowProvider's internal state each time it opens */}
      <CreatePactFlow key={isOpen ? 'open' : 'closed'} onExit={onClose} />
    </div>
  );
}
