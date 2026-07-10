'use client';

import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ProofDisplay from './ProofDisplay';

interface ProofData {
  id: string;
  type: 'image' | 'video' | 'checklist';
  url?: string;
  description?: string;
  timestamp: string;
  items?: Array<{ id: string; label: string; completed: boolean }>;
}

interface VerificationAnswer {
  q1_answer: 'yes' | 'no' | '';
  q2_answer: 'yes' | 'no' | '';
  q3_answer: 'yes' | 'no' | '';
  q4_answer: 'yes' | 'no' | '';
}

interface VerificationReasons {
  q1_reason: string;
  q2_reason: string;
  q3_reason: string;
  q4_reason: string;
}

interface ProofVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pactId: number;
  proof: ProofData;
  onSubmit?: () => void;
}

const QUESTIONS = [
  {
    id: 'q1',
    label: 'Completion',
    question: 'Was the outcome achieved?',
  },
  {
    id: 'q2',
    label: 'Authenticity',
    question: 'Is the proof genuine?',
  },
  {
    id: 'q3',
    label: 'Rule Adherence',
    question: "Were the pact's rules followed?",
  },
  {
    id: 'q4',
    label: 'Reputation Confidence',
    question: 'Would you stake your reputation on this being true?',
  },
];

export default function ProofVerificationModal({
  isOpen,
  onClose,
  pactId,
  proof,
  onSubmit,
}: ProofVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<VerificationAnswer>({
    q1_answer: '',
    q2_answer: '',
    q3_answer: '',
    q4_answer: '',
  });
  const [reasons, setReasons] = useState<VerificationReasons>({
    q1_reason: '',
    q2_reason: '',
    q3_reason: '',
    q4_reason: '',
  });

  const handleAnswerChange = (qId: string, value: 'yes' | 'no') => {
    setAnswers(prev => ({
      ...prev,
      [qId + '_answer']: value,
    }));
  };

  const handleReasonChange = (qId: string, value: string) => {
    setReasons(prev => ({
      ...prev,
      [qId + '_reason']: value,
    }));
  };

  const validateForm = (): string | null => {
    // All answers must be provided
    if (!answers.q1_answer || !answers.q2_answer || !answers.q3_answer || !answers.q4_answer) {
      return 'Please answer all questions';
    }

    // Validate: reason is required when answer is "no"
    if (answers.q1_answer === 'no' && !reasons.q1_reason.trim()) {
      return 'Please provide a reason for Q1 answer';
    }
    if (answers.q2_answer === 'no' && !reasons.q2_reason.trim()) {
      return 'Please provide a reason for Q2 answer';
    }
    if (answers.q3_answer === 'no' && !reasons.q3_reason.trim()) {
      return 'Please provide a reason for Q3 answer';
    }
    if (answers.q4_answer === 'no' && !reasons.q4_reason.trim()) {
      return 'Please provide a reason for Q4 answer';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        q1_answer: answers.q1_answer,
        q2_answer: answers.q2_answer,
        q3_answer: answers.q3_answer,
        q4_answer: answers.q4_answer,
        q1_reason: reasons.q1_reason.trim() || undefined,
        q2_reason: reasons.q2_reason.trim() || undefined,
        q3_reason: reasons.q3_reason.trim() || undefined,
        q4_reason: reasons.q4_reason.trim() || undefined,
      };

      const response = await fetch(`/api/verifications/${pactId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit verification');
      }

      toast.success('Verification submitted successfully!');
      onSubmit?.();
      onClose();

      // Reset form
      setAnswers({ q1_answer: '', q2_answer: '', q3_answer: '', q4_answer: '' });
      setReasons({ q1_reason: '', q2_reason: '', q3_reason: '', q4_reason: '' });
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] rounded-t-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Verify Proof</h2>
            <p className="text-sm text-slate-600 font-medium mt-1">Review and answer 4 verification questions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-slate-600" strokeWidth={2} />
          </button>
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6 pb-24">
            {/* Proof Preview */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Proof Being Verified</h3>
              <ProofDisplay proof={proof} />
            </div>

            {/* Questions */}
            <div className="space-y-6 border-t border-slate-100 pt-6">
              {QUESTIONS.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{q.label}</p>
                      <p className="text-sm text-slate-600 mt-1">{q.question}</p>
                    </div>
                  </div>

                  {/* Yes/No Toggle Buttons */}
                  <div className="flex gap-3 ml-11">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(q.id, 'yes')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        answers[q.id + '_answer' as keyof VerificationAnswer] === 'yes'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(q.id, 'no')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        answers[q.id + '_answer' as keyof VerificationAnswer] === 'no'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      No
                    </button>
                  </div>

                  {/* Reason field - shown when answer is selected */}
                  {answers[q.id + '_answer' as keyof VerificationAnswer] && (
                    <div className="ml-11 space-y-2">
                      <label className="text-sm font-medium text-slate-900">
                        {answers[q.id + '_answer' as keyof VerificationAnswer] === 'no'
                          ? 'Reason (required)'
                          : 'Additional notes (optional)'}
                      </label>
                      <textarea
                        value={reasons[q.id + '_reason' as keyof VerificationReasons]}
                        onChange={(e) => handleReasonChange(q.id, e.target.value)}
                        placeholder={
                          answers[q.id + '_answer' as keyof VerificationAnswer] === 'no'
                            ? 'Explain why...'
                            : 'Any additional context...'
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                        rows={3}
                      />
                      {answers[q.id + '_answer' as keyof VerificationAnswer] === 'no' && !reasons[q.id + '_reason' as keyof VerificationReasons].trim() && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          This field is required when answering &quot;No&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer - Submit Button */}
        <div className="border-t border-slate-100 px-6 py-4 flex gap-3 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Verification'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
