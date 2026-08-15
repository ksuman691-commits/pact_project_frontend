'use client';

import React, { useState } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchUsers } from '@/hooks/useUserQueries';
import Avatar from '@/components/Avatar';

interface MemberSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberSearchModal({ isOpen, onClose }: MemberSearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading } = useSearchUsers(searchQuery, 20);
  const results = searchResults?.data || [];

  const handleSelectMember = (username: string) => {
    router.push(`/profile/${encodeURIComponent(username)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
        <div
          className="rounded-[24px] w-full max-w-md shadow-lg mx-4 max-h-96 flex flex-col"
          style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--pact-hairline)]">
            <Search className="w-5 h-5" style={{ color: 'var(--pact-text-faint)' }} />
            <input
              autoFocus
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent"
              style={{ color: 'var(--pact-text)' }}
            />
            <button
              onClick={onClose}
              className="p-1 rounded-[28px] transition"
              style={{ background: 'var(--pact-surface-2)' }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--pact-text-dim)' }} />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && searchQuery ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 animate-spin" style={{ color: 'var(--pact-violet)' }} />
              </div>
            ) : searchQuery.length === 0 ? (
              <div className="flex items-center justify-center py-8" style={{ color: 'var(--pact-text-faint)' }}>
                <p className="text-sm">Search by name or username</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center py-8" style={{ color: 'var(--pact-text-faint)' }}>
                <p className="text-sm">No members match your search</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--pact-hairline)' }}>
                {results.map((member: any) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMember(member.username)}
                    className="pact-list-item w-full flex items-center gap-3 p-3 transition text-left"
                  >
                    {/* Avatar */}
                <Avatar name={member.full_name} avatarUrl={member.avatar_url} size={40} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--pact-text)] text-sm truncate">{member.full_name}</p>
                      <p className="text-xs text-[var(--pact-text-faint)] truncate">@{member.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
