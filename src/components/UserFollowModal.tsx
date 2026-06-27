'use client';

import React, { useState } from 'react';
import { X, Users, Heart } from 'lucide-react';

interface User {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  isFollowing?: boolean;
}

interface UserFollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  users: User[];
  onFollowAction?: (userId: number, action: 'follow' | 'unfollow') => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function UserFollowModal({
  isOpen,
  onClose,
  type,
  users,
  onFollowAction,
  loading,
  hasMore,
  onLoadMore,
}: UserFollowModalProps) {
  const [followingState, setFollowingState] = useState<Record<number, boolean>>(
    users.reduce((acc, user) => ({ ...acc, [user.id]: user.isFollowing || false }), {})
  );

  if (!isOpen) return null;

  const title = type === 'followers' ? 'Followers' : 'Following';
  const icon = type === 'followers' ? Users : Heart;
  const Icon = icon;

  const handleFollowClick = (userId: number) => {
    const isCurrentlyFollowing = followingState[userId];
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';

    onFollowAction?.(userId, action);
    setFollowingState((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <span className="text-gray-600">({users.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User List */}
        <div className="overflow-y-auto flex-1">
          {users.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p>No {type} yet</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                      {user.avatar ? user.avatar : user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    </div>
                  </div>

                  {type === 'following' && (
                    <button
                      onClick={() => handleFollowClick(user.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                        followingState[user.id]
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {followingState[user.id] ? 'Unfollow' : 'Follow'}
                    </button>
                  )}

                  {type === 'followers' && (
                    <button
                      onClick={() => handleFollowClick(user.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                        followingState[user.id]
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {followingState[user.id] ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="border-t border-gray-100 p-4">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="w-full px-4 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
