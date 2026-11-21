'use client';

import React from 'react';
import CreateDareFlow from '@/components/create-dare-flow/CreateDareFlow';

interface CreateDareModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** "Dare [Name]" from a profile: that person is already picked, so it's What → Send. */
  recipientId?: number | null;
}

/**
 * Full-screen overlay for the dare flow: What → Who → Send, in the same
 * yellow top as the Dares page, then the "Dare sent." screen.
 */
export default function CreateDareModal({ isOpen, onClose, recipientId = null }: CreateDareModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* key resets CreateDareFlowProvider's internal state each time it opens */}
      <CreateDareFlow key={isOpen ? 'open' : 'closed'} onExit={onClose} initialRecipientId={recipientId} />
    </div>
  );
}
