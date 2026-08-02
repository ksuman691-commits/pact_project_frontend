'use client';

import React, { useState } from 'react';
import { X, Check, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useVerifyDare } from '@/hooks/useDareMutations';

interface DareVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dareId: number;
  questions?: string[];
}

const DEFAULT_QUESTIONS = [
  'Did they attempt the challenge with genuine effort?',
  'Did they complete it according to the dare rules?',
  'Is the proof authentic and not fake?',
  'Do you believe they deserve credit?',
];

interface VerificationResponse {
  q1: 'yes' | 'no' | null;
  q2: 'yes' | 'no' | null;
  q3: 'yes' | 'no' | null;
  q4: 'yes' | 'no' | null;
  q1_reason?: string;
  q2_reason?: string;
  q3_reason?: string;
  q4_reason?: string;
}

export default function DareVerificationModal({
  isOpen,
  onClose,
  dareId,
  questions = DEFAULT_QUESTIONS,
}: DareVerificationModalProps) {
  const verifyMutation = useVerifyDare(dareId);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<VerificationResponse>({
    q1: null,
    q2: null,
    q3: null,
    q4: null,
  });
  const [showReasons, setShowReasons] = useState<Record<number, boolean>>({});
  const [reasons, setReasons] = useState<Record<number, string>>({});

  const handleAnswer = (answer: 'yes' | 'no') => {
    const questionKey = (`q${currentQuestion + 1}` as unknown) as keyof VerificationResponse;
    setResponses({
      ...responses,
      [questionKey]: answer,
    });

    // If answer is "no", prompt for reason
    if (answer === 'no') {
      setShowReasons({ ...showReasons, [currentQuestion]: true });
    }
  };

  const handleReasonChange = (reason: string) => {
    setReasons({ ...reasons, [currentQuestion]: reason });
  };

  const canProceed = () => {
    const questionKey = (`q${currentQuestion + 1}` as unknown) as keyof VerificationResponse;
    const hasAnswer = responses[questionKey] !== null;
    const isNo = responses[questionKey] === 'no';
    const hasReason = reasons[currentQuestion]?.trim() || false;

    return hasAnswer && (!isNo || hasReason);
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error('Please answer the question');
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error('Please answer all questions');
      return;
    }

    const payload: any = {
      q1_answer: responses.q1,
      q2_answer: responses.q2,
      q3_answer: responses.q3,
      q4_answer: responses.q4,
    };

    if (reasons[0]) payload.q1_reason = reasons[0];
    if (reasons[1]) payload.q2_reason = reasons[1];
    if (reasons[2]) payload.q3_reason = reasons[2];
    if (reasons[3]) payload.q4_reason = reasons[3];

    verifyMutation.mutate(payload, {
      onSuccess: () => {
        setCurrentQuestion(0);
        setResponses({ q1: null, q2: null, q3: null, q4: null });
        setShowReasons({});
        setReasons({});
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!verifyMutation.isPending) {
      setCurrentQuestion(0);
      setResponses({ q1: null, q2: null, q3: null, q4: null });
      setShowReasons({});
      setReasons({});
      onClose();
    }
  };

  if (!isOpen) return null;

  const questionKey = (`q${currentQuestion + 1}` as unknown) as keyof VerificationResponse;
  const currentAnswer = responses[questionKey];
  const currentReason = reasons[currentQuestion] || '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Verify Dare Completion</h2>
          <button onClick={handleClose} disabled={verifyMutation.isPending} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Indicators */}
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition ${
                  idx < currentQuestion ||
                  (idx === currentQuestion && responses[(`q${idx + 1}` as unknown) as keyof VerificationResponse] !== null)
                    ? 'bg-emerald-600'
                    : idx === currentQuestion
                      ? 'bg-emerald-300'
                      : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Question */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
              Question {currentQuestion + 1} of {questions.length}
            </p>
            <p className="text-lg font-bold text-slate-900 leading-snug">{questions[currentQuestion]}</p>
          </div>

          {/* Answer Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer('yes')}
              disabled={verifyMutation.isPending}
              className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                currentAnswer === 'yes'
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Check className="w-6 h-6 text-emerald-600" />
              <span className="font-semibold text-slate-900">Yes</span>
            </button>
            <button
              onClick={() => handleAnswer('no')}
              disabled={verifyMutation.isPending}
              className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                currentAnswer === 'no' ? 'border-red-600 bg-red-50' : 'border-slate-200 hover:border-slate-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <XIcon className="w-6 h-6 text-red-600" />
              <span className="font-semibold text-slate-900">No</span>
            </button>
          </div>

          {/* Optional Reason for "No" */}
          {showReasons[currentQuestion] && currentAnswer === 'no' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Why not? (optional)</label>
              <textarea
                value={currentReason}
                onChange={(e) => handleReasonChange(e.target.value)}
                disabled={verifyMutation.isPending}
                placeholder="Explain your reasoning..."
                rows={3}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm disabled:opacity-50"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || verifyMutation.isPending}
            className="flex-1 px-4 py-2.5 text-slate-900 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={currentQuestion === questions.length - 1 ? handleSubmit : handleNext}
            disabled={verifyMutation.isPending || !canProceed()}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifyMutation.isPending
              ? 'Submitting...'
              : currentQuestion === questions.length - 1
                ? 'Submit Verification'
                : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
