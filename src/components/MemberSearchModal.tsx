'use client';

import React, { useState } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchUsers } from '@/hooks/useUserQueries';
import Image from 'next/image';

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
        <div className="bg-white rounded-2xl w-full max-w-md shadow-lg border border-gray-200 mx-4 max-h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && searchQuery ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 text-emerald-600 animate-spin" />
              </div>
            ) : searchQuery.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <p className="text-sm">Start typing to search members</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <p className="text-sm">No members found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.map((member: any) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMember(member.username)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-300 to-blue-300 flex-shrink-0 overflow-hidden">
                      {member.avatar_url ? (
                        <Image
                          src={member.avatar_url}
                          alt={member.full_name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                          {member.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{member.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">@{member.username}</p>
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
