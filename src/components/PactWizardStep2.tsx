'use client';

import React, { useState } from 'react';
import { usePactWizard } from '@/context/PactWizardContext';
import { AlertCircle, CalendarDays } from 'lucide-react';

const DURATION_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function PactWizardStep2() {
  const { data, updateData } = usePactWizard();
  const [selectedDays, setSelectedDays] = useState<number | 'custom'>(() => {
    if (!data.endDate || !data.startDate) return 30;
    const diff = Math.round(
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const preset = DURATION_OPTIONS.find((o) => o.days === diff);
    return preset ? diff : 'custom';
  });

  const handleDurationSelect = (days: number) => {
    setSelectedDays(days);
    updateData({ endDate: addDays(data.startDate, days) });
  };

  const handleCustom = () => {
    setSelectedDays('custom');
    // keep existing endDate if already set, else clear so user must pick
    if (!data.endDate) updateData({ endDate: '' });
  };

  const handleStartDateChange = (val: string) => {
    updateData({ startDate: val });
    // re-compute end date if a preset is active
    if (typeof selectedDays === 'number') {
      updateData({ endDate: addDays(val, selectedDays) });
    }
  };

  const maxValid = data.maxParticipants > data.minParticipants;
  const isValid = !!data.endDate && data.minParticipants <= data.maxParticipants;

  return (
    <div className="space-y-6">
      {/* Start Date */}
      <div>
        <label className="block text-sm font-semibold text-[#14121F] mb-2">
          Start Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={data.startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className="w-full px-4 py-3 border border-[rgba(20,18,31,0.12)] rounded-[28px] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] bg-[#FAF9FE] text-[#14121F]"
        />
      </div>

      {/* Duration Chips */}
      <div>
        <label className="block text-sm font-semibold text-[#14121F] mb-3">
          Duration <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => {
            const active = selectedDays === opt.days;
            return (
              <button
                key={opt.days}
                type="button"
                onClick={() => handleDurationSelect(opt.days)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#A78BFA] text-white shadow-[0_4px_12px_rgba(167,139,250,0.3)]'
                    : 'bg-[#FAF9FE] text-[#6B7280] border border-[rgba(20,18,31,0.08)] hover:border-[#A78BFA] hover:text-[#A78BFA]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          {/* Custom chip */}
          <button
            type="button"
            onClick={handleCustom}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedDays === 'custom'
                ? 'bg-[#A78BFA] text-white shadow-[0_4px_12px_rgba(167,139,250,0.3)]'
                : 'bg-[#FAF9FE] text-[#6B7280] border border-[rgba(20,18,31,0.08)] hover:border-[#A78BFA] hover:text-[#A78BFA]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        {/* Custom end-date picker — only shown when Custom is selected */}
        {selectedDays === 'custom' && (
          <div className="mt-3">
            <input
              type="date"
              value={data.endDate}
              min={data.startDate}
              onChange={(e) => updateData({ endDate: e.target.value })}
              className="w-full px-4 py-3 border border-[rgba(20,18,31,0.12)] rounded-[28px] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] bg-[#FAF9FE] text-[#14121F]"
            />
          </div>
        )}

        {/* Computed end date summary */}
        {data.endDate && (
          <p className="text-xs text-[#6B7280] mt-2 pl-1">
            Ends on{' '}
            <span className="font-semibold text-[#14121F]">
              {new Date(data.endDate).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </p>
        )}
      </div>

      {/* Participants */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#14121F] mb-2">
            Min Participants <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.minParticipants}
            onChange={(e) =>
              updateData({ minParticipants: Math.max(1, parseInt(e.target.value) || 1) })
            }
            min="1"
            className="w-full px-4 py-3 border border-[rgba(20,18,31,0.12)] rounded-[28px] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] bg-[#FAF9FE] text-[#14121F]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14121F] mb-2">
            Max Participants <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.maxParticipants}
            onChange={(e) =>
              updateData({ maxParticipants: Math.max(1, parseInt(e.target.value) || 1) })
            }
            min="1"
            className={`w-full px-4 py-3 border rounded-[28px] focus:outline-none focus:ring-2 bg-[#FAF9FE] text-[#14121F] transition-colors ${
              maxValid
                ? 'border-emerald-400 focus:ring-emerald-400'
                : 'border-[rgba(20,18,31,0.12)] focus:ring-[#A78BFA]'
            }`}
          />
        </div>
      </div>

      {/* Validation Messages */}
      {data.minParticipants > data.maxParticipants && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-[28px]">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">Min participants cannot exceed max participants</p>
        </div>
      )}

      {!isValid && (
        <div className="flex gap-3 p-4 bg-[#EDE9FE] border border-[#C4B5FD] rounded-[28px]">
          <AlertCircle className="w-5 h-5 text-[#A78BFA] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#14121F]">Complete all required fields to continue</p>
        </div>
      )}
    </div>
  );
}
