'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Award, Users, Heart, Circle, Plus } from 'lucide-react';
import PactCard from './PactCard';

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
export function PactsTab({
  pacts,
  joinedPacts,
  votedPacts,
}: {
  pacts: any[];
  joinedPacts: any[];
  votedPacts: any[];
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'created' | 'joined' | 'voted'>('created');

  const sections = [
    { id: 'created' as const, label: 'Created by Me', count: pacts.length },
    { id: 'joined' as const, label: 'Joined Pacts', count: joinedPacts.length },
    { id: 'voted' as const, label: 'Voted Pacts', count: votedPacts.length },
  ];

  const renderEmptyState = (sectionId: 'created' | 'joined' | 'voted') => {
    if (sectionId === 'created') {
      return (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/70 px-6 py-10 text-center">
          <p className="text-base font-semibold text-slate-900">You haven&apos;t created any pacts yet</p>
          <p className="mt-2 text-sm text-slate-600">Create a pact to start tracking progress with your circles.</p>
          <button
            onClick={() => router.push('/pacts/create')}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Create Pact
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="text-base font-semibold text-slate-900">Nothing here yet</p>
        <p className="mt-2 text-sm text-slate-600">
          {sectionId === 'joined'
            ? 'You have not joined any pacts yet.'
            : 'You have not voted on any pacts yet.'}
        </p>
      </div>
    );
  };

  const currentPacts =
    activeSection === 'created' ? pacts : activeSection === 'joined' ? joinedPacts : votedPacts;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{section.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>
                {section.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4">
        {currentPacts.length > 0 ? (
          currentPacts.map((pact) => (
            <PactCard
              key={pact.id}
              pact={pact}
              userVote={pact.userVote}
            />
          ))
        ) : (
          renderEmptyState(activeSection)
        )}
      </div>
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
