'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Award, Users, Heart, Circle, Plus } from 'lucide-react';
import PactCard from './PactCard';
import AnimatedTabs from '@/components/pact-ui/AnimatedTabs';

interface ProfileTabsProps {
  children: React.ReactNode;
  onTabChange?: (tab: string) => void;
}

export default function ProfileTabs({ children, onTabChange }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('pacts');

  const tabs = [
    { id: 'pacts', label: 'Pacts', icon: Target },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'circles', label: 'Circles', icon: Circle },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'following', label: 'Following', icon: Heart },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="mb-8">
      {/* Tab Navigation */}
      <div className="mb-6 pb-2">
        <AnimatedTabs
          tabs={tabs}
          activeId={activeTab}
          onChange={handleTabChange}
          layoutId="profile-tabs-indicator"
        />
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
  allowJoinedUploads = false,
}: {
  pacts: any[];
  joinedPacts: any[];
  votedPacts: any[];
  allowJoinedUploads?: boolean;
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
        <div className="pact-card rounded-3xl border border-dashed px-6 py-10 text-center" style={{ borderColor: 'var(--pact-hairline)' }}>
          <p className="text-base font-semibold text-[var(--pact-text)]">You haven&apos;t created any pacts yet</p>
          <p className="mt-2 text-sm text-[var(--pact-text-dim)]">Create a pact to start tracking progress with your circles.</p>
          <button
            onClick={() => router.push('/pacts/create')}
            className="pact-btn-glow mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
          >
            <Plus className="h-4 w-4" />
            Create Pact
          </button>
        </div>
      );
    }

    return (
      <div className="pact-card rounded-3xl border border-dashed px-6 py-10 text-center" style={{ borderColor: 'var(--pact-hairline)' }}>
        <p className="text-base font-semibold text-[var(--pact-text)]">Nothing here yet</p>
        <p className="mt-2 text-sm text-[var(--pact-text-dim)]">
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
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                isActive ? 'pact-btn-glow' : 'pact-card'
              }`}
              style={
                isActive
                  ? { background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }
                  : { color: 'var(--pact-text-dim)' }
              }
            >
              <span>{section.label}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={isActive ? { background: 'rgba(255,255,255,0.2)' } : { background: 'var(--pact-surface-2)', color: 'var(--pact-text-faint)' }}
              >
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
              canUploadProof={activeSection === 'joined' ? allowJoinedUploads : undefined}
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
            className={`pact-card rounded-3xl p-4 text-center transition ${
              !achievement.unlocked ? 'opacity-50' : ''
            }`}
          >
            <div className="text-3xl mb-2">{achievement.icon}</div>
            <p className="text-xs font-medium text-[var(--pact-text-dim)]">{achievement.name}</p>
            {!achievement.unlocked && <p className="text-xs text-[var(--pact-text-faint)] mt-1">{achievement.progress}%</p>}
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-12 text-[var(--pact-text-faint)]">No achievements yet</div>
      )}
    </div>
  );
}

export function FollowersTab({ followers }: { followers: any[] }) {
  return (
    <div className="space-y-3">
      {followers && followers.length > 0 ? (
        followers.map((follower) => (
          <div key={follower.id} className="pact-card flex items-center justify-between p-3 rounded-3xl">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-text)' }}
              >
                {follower.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-[var(--pact-text)]">{follower.name}</p>
                <p className="text-xs text-[var(--pact-text-faint)]">@{follower.username}</p>
              </div>
            </div>
            <button className="px-3 py-1 text-sm font-medium text-[var(--pact-text-dim)] hover:text-[var(--pact-text)] rounded transition">
              Follow
            </button>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-[var(--pact-text-faint)]">No followers yet</div>
      )}
    </div>
  );
}
