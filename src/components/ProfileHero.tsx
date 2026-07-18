'use client';

import React from 'react';
import Image from 'next/image';
import { Star, Trophy, Flame, Edit2, UserPlus, MessageCircle } from 'lucide-react';

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
}

const badgeConfig: Record<string, { icon: any; color: string; label: string }> = {
  trusted: { icon: Trophy, color: 'bg-yellow-100 text-yellow-700', label: 'Trusted' },
  onfire: { icon: Flame, color: 'bg-red-100 text-red-700', label: 'On Fire' },
  consistent: { icon: Star, color: 'bg-blue-100 text-blue-700', label: 'Consistent' },
};

export default function ProfileHero({
  user,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onMessage,
  onEdit,
  customActions,
}: ProfileHeroProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-12 rounded-2xl mb-8 text-white">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-white p-1">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={96}
                height={96}
                unoptimized
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-300 to-blue-300 rounded-xl flex items-center justify-center text-3xl font-bold">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-emerald-100 text-lg mb-3">@{user.username}</p>
          {user.bio && <p className="text-emerald-50 mb-4 max-w-2xl">{user.bio}</p>}

          {/* Reputation */}
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
            <span className="font-bold text-lg">{user.reputationScore.toFixed(1)}</span>
            <span className="text-emerald-100">reputation</span>
          </div>

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge) => {
                const config = badgeConfig[badge];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div
                    key={badge}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          {customActions ? (
            customActions
          ) : (
            <>
          {isOwnProfile ? (
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={onFollow}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  isFollowing
                    ? 'bg-white/20 text-white border border-white/50 hover:bg-white/30'
                    : 'bg-white text-emerald-600 hover:bg-gray-50'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={onMessage}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/50 rounded-lg font-medium hover:bg-white/30 transition"
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
    </div>
  );
}
