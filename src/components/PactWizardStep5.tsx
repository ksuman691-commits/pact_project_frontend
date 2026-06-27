'use client';

import React from 'react';
import { usePactWizard } from '@/context/PactWizardContext';
import { Check, DollarSign, Users, Calendar, Eye, Lock } from 'lucide-react';

export default function PactWizardStep5() {
  const { data } = usePactWizard();

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const visibilityLabel = {
    public: 'Public - Anyone can join',
    private: 'Private - Only you',
    'circle-specific': 'Circle Only',
  }[data.visibility];

  const verificationLabel = {
    video: 'Video Proof',
    photo: 'Photo Proof',
    checklist: 'Daily Checklist',
  }[data.verificationType];

  const frequencyLabel = {
    daily: 'Daily',
    'every-3-days': 'Every 3 days',
    weekly: 'Weekly',
  }[data.verificationFrequency];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Pact</h3>
        <p className="text-gray-600">Make sure everything looks good before creating</p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-start gap-4">
            <div className="text-3xl">{data.categoryEmoji}</div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg">{data.title}</h4>
              <p className="text-gray-600 mt-2">{data.description}</p>
            </div>
          </div>
        </div>

        {/* Duration & Stakes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Duration
            </div>
            <p className="font-bold text-gray-900 text-lg">{daysRemaining} days</p>
            <p className="text-xs text-gray-500 mt-1">
              {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
            </p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Your Stake
            </div>
            <p className="font-bold text-gray-900 text-lg">₹{data.stakeAmount}</p>
            <p className="text-xs text-gray-500 mt-1">Will be locked until verification</p>
          </div>
        </div>

        {/* Participants */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
            <Users className="w-4 h-4" />
            Participants
          </div>
          <p className="font-bold text-gray-900">
            {data.minParticipants} - {data.maxParticipants} people
          </p>
        </div>

        {/* Verification */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
            <Check className="w-4 h-4" />
            Verification Method
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Type:</span>
              <span className="font-semibold text-gray-900">{verificationLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Frequency:</span>
              <span className="font-semibold text-gray-900">{frequencyLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Proofs:</span>
              <span className="font-semibold text-gray-900">{data.maxProofUploads}</span>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
            {data.visibility === 'public' ? (
              <Eye className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Visibility
          </div>
          <p className="font-bold text-gray-900">{visibilityLabel}</p>
        </div>
      </div>

      {/* Terms Agreement */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
        <p className="text-sm font-semibold text-blue-900">By creating this pact, you agree to:</p>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex gap-2">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Stake ₹{data.stakeAmount} that will be locked for the duration</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Submit {data.maxProofUploads} proofs of completion</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Accept verification votes from circle members (75% approval needed)</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Forfeit stake if pact is not completed</span>
          </li>
        </ul>
      </div>

      {/* Ready to Create */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
        <p className="text-sm text-emerald-800">
          You're ready to create your pact! Click the create button below to get started.
        </p>
      </div>
    </div>
  );
}
