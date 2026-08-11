'use client';

import React from 'react';
import Image from 'next/image';
import { Edit2, UserPlus, MessageCircle } from 'lucide-react';

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
    <div className="mb-6">
      {/* Compact Header */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          onClick={isOwnProfile ? onEdit : undefined}
        >
          <div className="w-20 h-20 rounded-full bg-[#EDE9FE] p-0.5">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={80}
                height={80}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-400 to-[#A78BFA] rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-2xl font-bold text-[#14121F]">{user.name}</h1>
          <p className="text-sm text-[#9CA3AF]">@{user.username}</p>
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
                className="flex items-center gap-2 px-3 py-1.5 bg-[#EDE9FE] text-[#A78BFA] rounded-[28px] text-sm font-medium hover:bg-emerald-100 transition"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={onFollow}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-[28px] transition ${
                    isFollowing
                      ? 'bg-[#EDE9FE] text-[#A78BFA] hover:bg-emerald-100'
                      : 'bg-[#A78BFA] text-white hover:bg-emerald-700'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={onMessage}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-[#EDE9FE] text-[#A78BFA] rounded-[28px] hover:bg-emerald-100 transition"
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
