'use client';

import React from 'react';
import { usePactWizard } from '@/context/PactWizardContext';
import { Globe, Lock, Users } from 'lucide-react';
import { useCircles } from '@/hooks/useCircles';

const visibilityOptions = [
  {
    id: 'public',
    name: 'Public',
    description: 'Anyone can join and see your pact',
    icon: Globe,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'private',
    name: 'Private',
    description: 'Only you, your score visible to others',
    icon: Lock,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    id: 'circle-specific',
    name: 'Circle Only',
    description: 'Only members of selected circle can join',
    icon: Users,
    color: 'text-purple-600 bg-purple-50',
  },
];

export default function PactWizardStep4() {
  const { data, updateData } = usePactWizard();
  const { data: circles } = useCircles();

  const selectedVisibility = visibilityOptions.find((v) => v.id === data.visibility);

  // Mock circles data if none available
  const mockCircles = [
    { id: 1, name: 'Startup Builders', memberCount: 234 },
    { id: 2, name: 'Fitness Crew', memberCount: 456 },
    { id: 3, name: 'Tech Learners', memberCount: 189 },
  ];

  const circleList = circles && circles.length > 0 ? circles : mockCircles;

  return (
    <div className="space-y-6">
      {/* Visibility Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Pact Visibility <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {visibilityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => updateData({ visibility: option.id as any })}
                className={`w-full p-4 border-2 rounded-lg transition text-left ${
                  data.visibility === option.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-6 h-6 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{option.name}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Circle Selection for circle-specific pacts */}
      {data.visibility === 'circle-specific' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Circle <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {circleList.map((circle: any) => (
              <button
                key={circle.id}
                onClick={() => updateData({ selectedCircleId: circle.id })}
                className={`w-full p-4 border-2 rounded-lg transition text-left ${
                  data.selectedCircleId === circle.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{circle.name || circle.name}</p>
                    <p className="text-sm text-gray-600">
                      {circle.memberCount || circle.members?.length || 0} members
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {circle.memberCount || circle.members?.length || 0}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900 mb-2">Visibility Info:</p>
        {data.visibility === 'public' && (
          <p className="text-sm text-blue-800">
            Your pact will be visible to everyone. This is great for community accountability!
          </p>
        )}
        {data.visibility === 'private' && (
          <p className="text-sm text-blue-800">
            Your pact details are private, but your completion status and rewards are public.
          </p>
        )}
        {data.visibility === 'circle-specific' && (
          <p className="text-sm text-blue-800">
            Only members of your selected circle can see and join this pact.
          </p>
        )}
      </div>
    </div>
  );
}
