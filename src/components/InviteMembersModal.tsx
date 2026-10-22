'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon, Search, Loader, UserPlus, MessageCircle } from 'lucide-react';
import { circleLink, copyText, shareCircle } from '@/lib/circleInvite';
import toast from 'react-hot-toast';
import { useSearchUsers } from '@/hooks/useUserQueries';
import { useInviteUserToCircle } from '@/hooks/useCircleMutations';
import Avatar from '@/components/Avatar';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: number;
  circleName: string;
  /** Member user_ids already in the circle, so they're excluded from search results. */
  existingMemberIds?: number[];
  /** Private circles: people with the link ask to join instead of joining. */
  isPrivate?: boolean;
}

/**
 * "Search for someone" tab — reuses the same search primitives as
 * MemberSearchModal (Feed's working user search: useSearchUsers ->
 * userService.search -> GET /api/users/search, a real, deployed
 * endpoint). Selecting a result calls useInviteUserToCircle, which posts
 * to POST /api/circles/{id}/invite; the person gets a notification and the
 * invite waits on their Circles page.
 */
function SearchInviteTab({ circleId, existingMemberIds }: { circleId: number; existingMemberIds: number[] }) {
  const [query, setQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<Record<number, boolean>>({});
  const { data: searchResults, isLoading } = useSearchUsers(query, 20);
  const inviteMutation = useInviteUserToCircle(circleId);

  const allResults: any[] = searchResults?.data || [];
  const results = allResults.filter((person) => !existingMemberIds.includes(person.id));

  const handleInvite = async (person: any) => {
    if (inviteMutation.isPending || invitedIds[person.id]) return;
    try {
      await inviteMutation.mutateAsync({ userId: person.id });
      setInvitedIds((prev) => ({ ...prev, [person.id]: true }));
    } catch {
      // Error toast already handled inside useInviteUserToCircle.
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-2 rounded-[28px] px-4 py-3"
        style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--pact-text-faint)' }} />
        <input
          autoFocus
          type="text"
          placeholder="Search by name or username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--pact-text)' }}
        />
      </div>

      <div className="min-h-[160px]">
        {query.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-center" style={{ color: 'var(--pact-text-faint)' }}>
            <p className="text-sm">Search by name or username to invite them directly.</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader className="h-5 w-5 animate-spin" style={{ color: 'var(--pact-violet)' }} />
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-center" style={{ color: 'var(--pact-text-faint)' }}>
            <p className="text-sm">
              {allResults.length > 0 && allResults.length !== results.length
                ? 'Everyone matching that search is already in this circle.'
                : 'No one matches that search.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((person: any) => {
              const invited = Boolean(invitedIds[person.id]);
              const inviting = inviteMutation.isPending && inviteMutation.variables?.userId === person.id;
              return (
                <div
                  key={person.id}
                  className="flex items-center gap-3 rounded-[28px] p-3"
                  style={{ background: 'var(--pact-surface-2)' }}
                >
                  <Avatar name={person.full_name || person.username} avatarUrl={person.avatar_url} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--pact-text)]">
                      {person.full_name || person.username}
                    </p>
                    <p className="truncate text-xs text-[var(--pact-text-faint)]">@{person.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInvite(person)}
                    disabled={inviting || invited}
                    className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition disabled:opacity-70"
                    style={
                      invited
                        ? { background: 'transparent', border: '1px solid var(--pact-hairline)', color: 'var(--pact-text-muted)' }
                        : { background: 'var(--navy)', color: '#fff' }
                    }
                  >
                    {inviting ? (
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                    ) : invited ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    {inviting ? 'Sending' : invited ? 'Sent' : 'Invite'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InviteMembersModal({ isOpen, onClose, circleId, circleName, existingMemberIds = [], isPrivate = false }: InviteMembersModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'link'>('search');
  const [copied, setCopied] = useState(false);
  // The circle's own page: open circles can Join there, private ones Ask to Join.
  const inviteLink = isOpen ? circleLink(circleId) : '';

  const copyLink = async () => {
    const ok = await copyText(inviteLink);
    if (!ok) {
      toast.error('Could not copy. Long-press the link to copy it.');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="rounded-[24px] max-w-md w-full shadow-xl max-h-[85vh] flex flex-col"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--pact-hairline)] flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--pact-text)]">Invite Members</h2>
          <button onClick={onClose} className="text-[var(--pact-text-faint)] hover:text-[var(--pact-text)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
            style={
              activeTab === 'search'
                ? { background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }
                : { background: 'transparent', color: 'var(--pact-text-faint)' }
            }
          >
            <Search className="w-4 h-4" />
            Search People
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
            style={
              activeTab === 'link'
                ? { background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }
                : { background: 'transparent', color: 'var(--pact-text-faint)' }
            }
          >
            <LinkIcon className="w-4 h-4" />
            Share a Link
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 overflow-y-auto flex-1">
          {activeTab === 'search' ? (
            <SearchInviteTab circleId={circleId} existingMemberIds={existingMemberIds} />
          ) : (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 rounded-[18px] px-4 py-3"
                style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
              >
                <LinkIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--pact-text-faint)' }} />
                <span className="min-w-0 flex-1 select-all truncate text-sm" style={{ color: 'var(--pact-text)' }}>{inviteLink}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void shareCircle('whatsapp', { id: circleId, name: circleName, isPrivate })}
                  className="flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold"
                  style={{ background: 'var(--navy)', color: '#fff' }}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold"
                  style={{ border: '1.5px solid var(--navy)', color: 'var(--navy)' }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
              <p className="px-1 text-xs leading-snug" style={{ color: 'var(--pact-text-faint)' }}>
                {isPrivate
                  ? 'Anyone with the link can ask to join. You approve each person.'
                  : 'Anyone with the link can join. People without the app sign up first, then land here.'}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2.5 rounded-[28px] font-medium transition"
            style={{
              background: 'var(--pact-surface-2)',
              border: '1px solid var(--pact-hairline)',
              color: 'var(--pact-text-dim)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
