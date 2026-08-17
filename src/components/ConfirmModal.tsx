'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button as a destructive (red) action instead of the default pink/violet gradient. */
  destructive?: boolean;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="rounded-[24px] max-w-sm w-full shadow-xl"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-3">
          <h2 className="text-lg font-bold text-[var(--pact-text)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--pact-text-faint)] hover:text-[var(--pact-text)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {description && <p className="text-sm leading-relaxed text-[var(--pact-text-dim)]">{description}</p>}

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-[28px] font-medium text-sm transition disabled:opacity-50"
              style={{
                background: 'var(--pact-surface-2)',
                border: '1px solid var(--pact-hairline)',
                color: 'var(--pact-text-dim)',
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-[28px] font-semibold text-sm text-white transition disabled:opacity-50"
              style={{
                background: destructive ? '#E5484D' : 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))',
              }}
            >
              {loading ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
