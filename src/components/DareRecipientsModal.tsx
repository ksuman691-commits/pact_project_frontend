'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { DareRecipient } from '@/types';
import DareRecipientsList from '@/components/DareRecipientsList';

interface DareRecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: DareRecipient[];
  isLoading?: boolean;
}

/**
 * Wraps the existing (already violet-themed) DareRecipientsList in the
 * app's standard modal chrome — same overlay/panel pattern as
 * DareVerificationModal — so tapping the recipient count on the detail
 * page opens a real "who was dared" list instead of requiring a separate
 * page or leaving the count as dead, unclickable text.
 */
export default function DareRecipientsModal({ isOpen, onClose, recipients, isLoading }: DareRecipientsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="pact-flow fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="pact-card w-full max-w-md rounded-[28px] overflow-hidden"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--pact-hairline)] p-4">
          <h2 className="text-lg font-bold text-[var(--pact-text)]">Dared</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 transition hover:bg-[var(--pact-surface-2)]"
          >
            <X className="h-5 w-5 text-[var(--pact-text-dim)]" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <DareRecipientsList recipients={recipients} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
