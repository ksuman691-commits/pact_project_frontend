'use client';

import React from 'react';
import { usePactWizard } from '@/context/PactWizardContext';
import { AlertCircle } from 'lucide-react';

export default function PactWizardStep2() {
  const { data, updateData } = usePactWizard();

  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const isValid = data.endDate && data.stakeAmount > 0 && data.minParticipants <= data.maxParticipants;

  const quickAmounts = [100, 250, 500, 1000, 2500, 5000];

  return (
    <div className="space-y-6">
      {/* Start Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Start Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={data.startDate}
          onChange={(e) => updateData({ startDate: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          End Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={data.endDate}
          onChange={(e) => updateData({ endDate: e.target.value })}
          min={data.startDate}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {daysRemaining > 0 && (
          <p className="text-sm text-gray-600 mt-2">Duration: {daysRemaining} days</p>
        )}
      </div>

      {/* Stake Amount */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your Stake Amount (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={data.stakeAmount}
          onChange={(e) => updateData({ stakeAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
          min="0"
          step="50"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-xs text-gray-500 mt-1">This amount will be locked until verification ends</p>

        {/* Quick Amount Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => updateData({ stakeAmount: amount })}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                data.stakeAmount === amount
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ₹{amount}
            </button>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Min Participants <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.minParticipants}
            onChange={(e) => updateData({ minParticipants: Math.max(1, parseInt(e.target.value) || 1) })}
            min="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Max Participants <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.maxParticipants}
            onChange={(e) => updateData({ maxParticipants: Math.max(1, parseInt(e.target.value) || 1) })}
            min="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Validation Messages */}
      {data.minParticipants > data.maxParticipants && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">Min participants cannot exceed max participants</p>
        </div>
      )}

      {!isValid && (
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Complete all required fields to continue</p>
        </div>
      )}
    </div>
  );
}
