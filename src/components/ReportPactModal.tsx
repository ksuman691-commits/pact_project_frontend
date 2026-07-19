'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Zap, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useReportPact } from '@/hooks/useReportingMutations';

interface ReportPactModalProps {
  isOpen: boolean;
  onClose: () => void;
  pactId: number;
  pactTitle?: string;
}

const REPORT_REASONS = [
  {
    id: 'fake_or_ai',
    label: 'Fake or AI Generated',
    description: 'This pact appears to be fake or uses AI-generated content',
    icon: Zap,
  },
  {
    id: 'spam',
    label: 'Spam',
    description: 'This is spam or promotional content',
    icon: MessageSquare,
  },
  {
    id: 'offensive',
    label: 'Offensive Content',
    description: 'This content is offensive, abusive, or inappropriate',
    icon: AlertCircle,
  },
];

export default function ReportPactModal({
  isOpen,
  onClose,
  pactId,
  pactTitle,
}: ReportPactModalProps) {
  const [selectedReason, setSelectedReason] = useState<'fake_or_ai' | 'spam' | 'offensive' | null>(null);
  const [loading, setLoading] = useState(false);
  const reportMutation = useReportPact();

  if (!isOpen) return null;

  const handleReport = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    setLoading(true);
    try {
      await reportMutation.mutateAsync({ pactId, reason: selectedReason });
      setSelectedReason(null);
      onClose();
    } catch (error) {
      console.error('[v0] Report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Report Pact</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        {pactTitle && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Reporting:</span> {pactTitle}
            </p>
          </div>
        )}

        {/* Reason Selection */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-900 mb-4">Why are you reporting this pact?</p>
          <div className="space-y-3">
            {REPORT_REASONS.map((reason) => {
              const Icon = reason.icon;
              const isSelected = selectedReason === reason.id;
              return (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id as any)}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-start gap-3 text-left ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {reason.label}
                    </p>
                    <p className={`text-xs mt-1 ${isSelected ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {reason.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Message */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            Thank you for helping keep our community safe. All reports are reviewed by our team. If this pact receives multiple reports, it will be automatically hidden.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-300 text-slate-900 font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReport}
            disabled={!selectedReason || loading}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
              !selectedReason || loading
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {loading ? 'Reporting...' : 'Report Pact'}
          </button>
        </div>
      </div>
    </div>
  );
}
