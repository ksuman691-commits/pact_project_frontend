'use client';

import React from 'react';
import { usePactWizard } from '@/context/PactWizardContext';
import { Globe, Lock, Users } from 'lucide-react';
import { useCircles } from '@/hooks/useCircles';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

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
    description: 'Visible to you and your accepted followers',
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
  const router = useRouter();
  const { data, updateData } = usePactWizard();
  const { user } = useAuthStore();
  const { data: circles } = useCircles();

  const ownedCircles = (circles || []).filter((circle: any) => {
    const ownerIdMatches = typeof user?.id === 'number' && circle.owner_id === user.id;
    const ownerUsernameMatches =
      typeof user?.username === 'string' &&
      typeof circle.owner_username === 'string' &&
      circle.owner_username.trim().toLowerCase() === user.username.trim().toLowerCase();
    return ownerIdMatches || ownerUsernameMatches;
  });
  const hasOwnedCircles = ownedCircles.length > 0;

  const handleVisibilitySelect = (visibility: 'public' | 'private' | 'circle-specific') => {
    if (visibility === 'circle-specific' && !hasOwnedCircles) {
      return;
    }

    updateData({ visibility, selectedCircleId: visibility === 'circle-specific' ? data.selectedCircleId : undefined });
  };

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
            const isCircleOnly = option.id === 'circle-specific';
            const isDisabled = isCircleOnly && !hasOwnedCircles;
            return (
              <button
                key={option.id}
                onClick={() => handleVisibilitySelect(option.id as any)}
                disabled={isDisabled}
                className={`w-full p-4 border-2 rounded-lg transition text-left ${
                  data.visibility === option.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
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
        {!hasOwnedCircles && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Create a circle first to make circle-only pacts.
          </p>
        )}
      </div>

      {data.visibility === 'circle-specific' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Owned Circle <span className="text-red-500">*</span>
          </label>

          {!hasOwnedCircles ? (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg space-y-3">
              <p className="text-sm text-amber-800">
                Create a circle first to make circle-only pacts.
              </p>
              <button
                onClick={() => router.push('/circles/create')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Create Circle
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {ownedCircles.map((circle: any) => (
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
                      <p className="font-semibold text-gray-900">{circle.name}</p>
                      <p className="text-sm text-gray-600">
                        {circle.member_count ?? circle.memberCount ?? circle.members?.length ?? 0} members
                      </p>
                    </div>
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {circle.icon_emoji || '◌'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
            Only you and your accepted followers can see and join this pact.
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
