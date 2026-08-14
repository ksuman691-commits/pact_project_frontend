'use client';

import React from 'react';
import CreateDareFlow from '@/components/create-dare-flow/CreateDareFlow';

interface CreateDareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen overlay wrapper so CreateDareFlow can drop into the same
 * isOpen/onClose call sites the old grouped-step modal used (Dares page),
 * while rendering the flow's own immersive dark theme edge-to-edge — same
 * pattern as CreatePactFlowModal. The flow itself (title → description →
 * timing → visibility → recipients? → verification → review → success)
 * shares its chrome (FlowShell, ProgressDots, LiveTitleStrip) with Create
 * Pact and Create Circle so all three "create" experiences feel like one
 * product.
 */
export default function CreateDareModal({ isOpen, onClose }: CreateDareModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* key resets CreateDareFlowProvider's internal state each time it opens */}
      <CreateDareFlow key={isOpen ? 'open' : 'closed'} onExit={onClose} />
    </div>
  );
}
