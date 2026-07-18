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
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div 
          className="relative cursor-pointer hover:opacity-80 transition"
          onClick={isOwnProfile ? onEdit : undefined}
        >
          <div className="w-20 h-20 rounded-xl bg-emerald-100 p-0.5 flex-shrink-0">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={80}
                height={80}
                unoptimized
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Info & Actions */}
        <div className="flex-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500">@{user.username}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {customActions ? (
              customActions
            ) : (
              <>
                {isOwnProfile ? (
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onFollow}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        isFollowing
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={onMessage}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"
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
    </div>
  );
}
