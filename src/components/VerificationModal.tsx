'use client';

import React, { useState } from 'react';
import { X, Loader, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pactId: number;
  proofUrl?: string;
  proofDescription?: string;
  pactTitle?: string;
  onVerify?: (pactId: number, verdict: 'believe' | 'doubt', confidence: number) => void;
}

const VERIFICATION_CRITERIA = [
  { id: 1, label: 'Is the proof legitimate?', hint: 'Does the evidence clearly show commitment?' },
  { id: 2, label: 'Is the scope reasonable?', hint: 'Is the goal achievable within the timeframe?' },
  { id: 3, label: 'Is the effort genuine?', hint: 'Does this show real progress toward the goal?' },
  { id: 4, label: 'Is the timeline feasible?', hint: 'Can they complete this by the deadline?' },
];

export default function VerificationModal({
  isOpen,
  onClose,
  pactId,
  proofUrl,
  proofDescription,
  pactTitle,
  onVerify,
}: VerificationModalProps) {
  const [step, setStep] = useState<'vote' | 'criteria' | 'confirm'>('vote');
  const [verdict, setVerdict] = useState<'believe' | 'doubt' | null>(null);
  const [criteria, setCriteria] = useState<Record<number, boolean>>({});
  const [confidence, setConfidence] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleVoteClick = (v: 'believe' | 'doubt') => {
    setVerdict(v);
    setStep('criteria');
  };

  const handleCriteriaToggle = (id: number) => {
    setCriteria(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Verification submitted as "${verdict}"`);
      onVerify?.(pactId, verdict as 'believe' | 'doubt', confidence);
      
      // Reset and close
      setStep('vote');
      setVerdict(null);
      setCriteria({});
      setConfidence(50);
      onClose();
    } catch (error) {
      toast.error('Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Verify Proof</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Vote Step */}
        {step === 'vote' && (
          <div className="space-y-4">
            {proofDescription && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-semibold mb-1">Proof Description:</p>
                <p className="text-sm text-gray-900">{proofDescription}</p>
              </div>
            )}

            <p className="text-sm text-gray-600">Do you believe this pact will be completed?</p>

            <div className="space-y-3">
              <button
                onClick={() => handleVoteClick('believe')}
                className="w-full p-4 border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 rounded-xl transition flex items-center gap-3"
              >
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <div className="text-left">
                  <p className="font-bold text-gray-900">Believe</p>
                  <p className="text-xs text-gray-600">They will complete this</p>
                </div>
              </button>

              <button
                onClick={() => handleVoteClick('doubt')}
                className="w-full p-4 border-2 border-red-200 bg-red-50 hover:border-red-400 hover:bg-red-100 rounded-xl transition flex items-center gap-3"
              >
                <XCircle className="w-6 h-6 text-red-600" />
                <div className="text-left">
                  <p className="font-bold text-gray-900">Doubt</p>
                  <p className="text-xs text-gray-600">They might not complete</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Criteria Step */}
        {step === 'criteria' && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-900">Check criteria:</p>

            <div className="space-y-3">
              {VERIFICATION_CRITERIA.map(item => (
                <label key={item.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteria[item.id] || false}
                    onChange={() => handleCriteriaToggle(item.id)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-600">{item.hint}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Confidence Slider */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">Confidence Level</label>
                <span className="text-lg font-bold text-blue-600">{confidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not sure</span>
                <span>Certain</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setStep('vote');
                  setVerdict(null);
                  setCriteria({});
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl text-center ${
              verdict === 'believe' ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              <p className={`text-sm font-bold ${
                verdict === 'believe' ? 'text-emerald-900' : 'text-red-900'
              }`}>
                You&apos;re voting to {verdict}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Confidence: {confidence}%
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500 font-semibold mb-2">Criteria met:</p>
              <p className="text-sm text-gray-900">
                {Object.values(criteria).filter(Boolean).length} of {VERIFICATION_CRITERIA.length} checks passed
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep('criteria')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit Verification'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
