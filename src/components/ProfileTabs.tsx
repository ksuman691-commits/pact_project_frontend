'use client';

import React, { useState } from 'react';
import { Target, Award, Users, Heart, Circle } from 'lucide-react';

interface ProfileTabsProps {
  children: React.ReactNode;
  onTabChange?: (tab: string) => void;
}

export default function ProfileTabs({ children, onTabChange }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('pacts');

  const tabs = [
    { id: 'pacts', label: 'Pacts', icon: Target },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'following', label: 'Following', icon: Heart },
    { id: 'circles', label: 'Circles', icon: Circle },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="mb-8">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content">{children}</div>
    </div>
  );
}

// Individual tab components for content rendering
export function PactsTab({ pacts }: { pacts: any[] }) {
  return (
    <div className="grid gap-4">
      {pacts && pacts.length > 0 ? (
        pacts.map((pact) => (
          <div key={pact.id} className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-lg">{pact.title}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                pact.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : pact.status === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {pact.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{pact.description}</p>
            <div className="flex justify-between mt-3 text-xs text-gray-500">
              <span>{pact.daysRemaining} days remaining</span>
              <span>{pact.participantCount} participants</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-gray-500">No pacts yet</div>
      )}
    </div>
  );
}

export function AchievementsTab({ achievements }: { achievements: any[] }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
      {achievements && achievements.length > 0 ? (
        achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 rounded-lg border-2 text-center transition ${
              achievement.unlocked
                ? 'bg-white border-emerald-200 hover:shadow-md'
                : 'bg-gray-50 border-gray-200 opacity-50'
            }`}
          >
            <div className="text-3xl mb-2">{achievement.icon}</div>
            <p className="text-xs font-medium text-gray-700">{achievement.name}</p>
            {!achievement.unlocked && <p className="text-xs text-gray-500 mt-1">{achievement.progress}%</p>}
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-12 text-gray-500">No achievements yet</div>
      )}
    </div>
  );
}

export function FollowersTab({ followers }: { followers: any[] }) {
  return (
    <div className="space-y-3">
      {followers && followers.length > 0 ? (
        followers.map((follower) => (
          <div key={follower.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold">
                {follower.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{follower.name}</p>
                <p className="text-xs text-gray-500">@{follower.username}</p>
              </div>
            </div>
            <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition">
              Follow
            </button>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-gray-500">No followers yet</div>
      )}
    </div>
  );
}
