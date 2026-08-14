'use client';

import React from 'react';
import Image from 'next/image';
import { Edit2, UserPlus, MessageCircle } from 'lucide-react';
import StreakAvatarRing from '@/components/StreakAvatarRing';

interface ProfileHeroProps {
  user: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    reputationScore: number;
    badges: string[];
  };
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  customActions?: React.ReactNode;
  /** Current streak in days — only rendered as a ring when isOwnProfile is true. */
  streak?: number;
  /** Pulses the ring amber-red to signal an approaching deadline with no proof yet. */
  atRisk?: boolean;
}

export default function ProfileHero({
  user,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onMessage,
  onEdit,
  customActions,
  streak,
  atRisk = false,
}: ProfileHeroProps) {
  const avatarContent = (
    <div
      className="w-20 h-20 rounded-full p-0.5"
      style={{ background: 'var(--pact-surface-2)' }}
    >
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={user.name}
          width={80}
          height={80}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))',
            color: 'var(--pact-text)',
          }}
        >
          {user.name.charAt(0)}
        </div>
      )}
    </div>
  );

  return (
    <div className="pact-card rounded-3xl p-5 mb-6">
      {/* Compact Header */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          onClick={isOwnProfile ? onEdit : undefined}
        >
          {isOwnProfile && typeof streak === 'number' ? (
            <StreakAvatarRing streak={streak} atRisk={atRisk}>
              {avatarContent}
            </StreakAvatarRing>
          ) : (
            avatarContent
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-2xl font-bold text-[var(--pact-text)]">{user.name}</h1>
          <p className="text-sm text-[var(--pact-text-faint)]">@{user.username}</p>
          {user.bio && <p className="mt-1.5 text-sm text-[var(--pact-text-dim)] line-clamp-2">{user.bio}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {customActions ? (
          customActions
        ) : (
          <>
            {isOwnProfile ? (
              <button
                onClick={onEdit}
                className="pact-btn-glow flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={onFollow}
                  className="pact-btn-glow flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full transition"
                  style={
                    isFollowing
                      ? { background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }
                      : {
                          background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))',
                          color: 'var(--pact-text)',
                        }
                  }
                >
                  <UserPlus className="w-4 h-4" />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={onMessage}
                  className="pact-btn-glow flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full transition"
                  style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
