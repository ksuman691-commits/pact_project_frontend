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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="pact-card rounded-3xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--pact-hairline)' }}>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-[var(--pact-violet)]" />
            <h2 className="text-xl font-bold text-[var(--pact-text)]">{title}</h2>
            <span className="text-[var(--pact-text-faint)]">({users.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full transition hover:bg-[var(--pact-surface-2)]"
          >
            <X className="w-5 h-5 text-[var(--pact-text-faint)]" />
          </button>
        </div>

        {/* User List */}
        <div className="overflow-y-auto flex-1">
          {users.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-[var(--pact-text-faint)]">
              <p>No {type} yet</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl transition hover:bg-[var(--pact-surface-2)]"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
                    >
                      {user.avatar ? user.avatar : user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--pact-text)] truncate">{user.name}</p>
                      <p className="text-xs text-[var(--pact-text-faint)] truncate">@{user.username}</p>
                    </div>
                  </div>

                  {(type === 'following' || type === 'followers') && (
                    <button
                      onClick={() => handleFollowClick(user.id)}
                      className="px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap"
                      style={
                        followingState[user.id]
                          ? { background: 'var(--pact-surface-2)', color: 'var(--pact-text-dim)' }
                          : { background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }
                      }
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
          <div className="border-t p-4" style={{ borderColor: 'var(--pact-hairline)' }}>
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="w-full px-4 py-2 text-[var(--pact-violet)] font-medium rounded-full transition disabled:opacity-50 hover:bg-[var(--pact-surface-2)]"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
