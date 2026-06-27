'use client';

import React from 'react';
import { usePactWizard } from '@/context/PactWizardContext';
import { AlertCircle } from 'lucide-react';

const categories = [
  { id: 'fitness', emoji: '💪', label: 'Fitness' },
  { id: 'learning', emoji: '📚', label: 'Learning' },
  { id: 'productivity', emoji: '⚡', label: 'Productivity' },
  { id: 'career', emoji: '🎯', label: 'Career' },
  { id: 'finance', emoji: '💰', label: 'Finance' },
  { id: 'wellness', emoji: '🧘', label: 'Wellness' },
  { id: 'social', emoji: '👥', label: 'Social' },
  { id: 'creative', emoji: '🎨', label: 'Creative' },
  { id: 'other', emoji: '🌟', label: 'Other' },
];

export default function PactWizardStep1() {
  const { data, updateData } = usePactWizard();

  const selectedCategory = categories.find((c) => c.id === data.category) || categories[0];

  const isValid = data.title.trim().length > 0 && data.description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pact Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
          placeholder="e.g., Learn React in 30 days"
          maxLength={100}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-xs text-gray-500 mt-1">{data.title.length}/100 characters</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Describe your pact goal, motivation, and expected outcomes..."
          maxLength={500}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{data.description.length}/500 characters</p>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => updateData({ category: category.id, categoryEmoji: category.emoji })}
              className={`p-4 rounded-lg border-2 transition flex flex-col items-center justify-center gap-2 ${
                data.category === category.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
            >
              <span className="text-2xl">{category.emoji}</span>
              <span className="text-xs font-medium text-gray-700 text-center">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      {!isValid && (
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Fill in title and description to continue</p>
        </div>
      )}
    </div>
  );
}
