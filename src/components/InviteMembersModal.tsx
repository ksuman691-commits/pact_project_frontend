'use client';

import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Search, Loader, Link as LinkIcon, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';
import { useSearchUsers } from '@/hooks/useUserQueries';
import { useCircleMembers } from '@/hooks/useCircles';
import { useInviteUserToCircle } from '@/hooks/useCircleMutations';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: number;
  circleName: string;
}

export default function InviteMembersModal({ isOpen, onClose, circleId, circleName }: InviteMembersModalProps) {
  const [tab, setTab] = useState<'search' | 'link'>('search');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<Record<number, boolean>>({});
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: searchData, isLoading } = useSearchUsers(debouncedQuery, 15);
  const { data: existingMembers } = useCircleMembers(circleId);
  const inviteMutation = useInviteUserToCircle(circleId);

  const existingMemberIds = new Set((existingMembers || []).map((m: any) => m.user_id));
  const results = (searchData?.data || []).filter((candidate: any) => !existingMemberIds.has(candidate.id));

  const handleInvite = (person: any) => {
    if (invitedIds[person.id] || inviteMutation.isPending) return;
    inviteMutation.mutate(
      { userId: person.id },
      {
        onSuccess: () => setInvitedIds((prev) => ({ ...prev, [person.id]: true })),
      }
    );
  };

  const generateInviteLink = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteLink(`${window.location.origin}/circles/join/${code}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard!');
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

        {/* Tabs — Search is the default/primary invite path since the
            people being invited already have real accounts on this
            social app. Link stays as the secondary path for reaching
            people outside the app who aren't searchable yet. The old
            email-textarea tab has been removed rather than demoted:
            Link already covers "invite someone without an account here",
            so keeping Email too would just leave a redundant, weaker
            version of the same problem this change is meant to fix. */}
        <div className="flex border-b border-[var(--pact-hairline)] flex-shrink-0">
          <button
            onClick={() => setTab('search')}
            className="flex-1 px-4 py-3 font-medium text-sm border-b-2 transition"
            style={
              tab === 'search'
                ? { color: 'var(--pact-violet)', borderColor: 'var(--pact-violet)' }
                : { color: 'var(--pact-text-faint)', borderColor: 'transparent' }
            }
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search people
          </button>
          <button
            onClick={() => setTab('link')}
            className="flex-1 px-4 py-3 font-medium text-sm border-b-2 transition"
            style={
              tab === 'link'
                ? { color: 'var(--pact-violet)', borderColor: 'var(--pact-violet)' }
                : { color: 'var(--pact-text-faint)', borderColor: 'transparent' }
            }
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Link
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'search' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--pact-text-faint)' }}
                />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or username"
                  className="w-full pl-11 pr-4 py-3 rounded-[28px] outline-none focus:ring-2 transition"
                  style={{
                    background: 'var(--pact-surface-2)',
                    border: '1px solid var(--pact-hairline)',
                    color: 'var(--pact-text)',
                  }}
                />
              </div>

              <div className="min-h-[120px]">
                {query.trim().length === 0 ? (
                  <p className="text-center text-sm py-6" style={{ color: 'var(--pact-text-faint)' }}>
                    Search for someone to invite to {circleName}
                  </p>
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader className="w-5 h-5 animate-spin" style={{ color: 'var(--pact-violet)' }} />
                  </div>
                ) : results.length === 0 ? (
                  <p className="text-center text-sm py-6" style={{ color: 'var(--pact-text-faint)' }}>
                    No matching people found
                  </p>
                ) : (
                  <div className="space-y-1">
                    {results.map((person: any) => {
                      const invited = Boolean(invitedIds[person.id]);
                      return (
                        <div
                          key={person.id}
                          className="flex items-center gap-3 p-2.5 rounded-[20px]"
                          style={{ background: 'var(--pact-surface-2)' }}
                        >
                          <Avatar name={person.full_name || person.username} avatarUrl={person.avatar_url} size={40} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--pact-text)]">
                              {person.full_name || person.username}
                            </p>
                            <p className="truncate text-xs text-[var(--pact-text-faint)]">@{person.username}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInvite(person)}
                            disabled={invited || inviteMutation.isPending}
                            className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-60"
                            style={
                              invited
                                ? { background: 'transparent', border: '1px solid var(--pact-hairline)', color: 'var(--pact-text-muted)' }
                                : { background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'white' }
                            }
                          >
                            {invited ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Invited
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" /> Invite
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--pact-text-dim)] mb-2">Invite Link</label>
                {!inviteLink ? (
                  <button
                    onClick={generateInviteLink}
                    className="w-full px-4 py-3 rounded-[28px] font-medium transition"
                    style={{
                      background: 'var(--pact-surface-2)',
                      border: '1px dashed var(--pact-violet)',
                      color: 'var(--pact-violet)',
                    }}
                  >
                    Generate Invite Link
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-[28px]"
                      style={{
                        background: 'var(--pact-surface-2)',
                        border: '1px solid var(--pact-hairline)',
                        color: 'var(--pact-text-dim)',
                      }}
                    />
                    <button
                      onClick={copyLink}
                      className="px-4 py-3 rounded-[28px] text-white transition"
                      style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>

              <div
                className="rounded-[28px] p-3 space-y-2"
                style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
              >
                <p className="text-xs text-[var(--pact-text)] font-medium">How it works:</p>
                <ul className="text-xs text-[var(--pact-text-faint)] space-y-1">
                  <li>• Share the link with anyone, even outside the app</li>
                  <li>• They can join without requiring approval</li>
                  <li>• Link is valid for 30 days</li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-[28px] font-medium transition"
                style={{
                  background: 'var(--pact-surface-2)',
                  border: '1px solid var(--pact-hairline)',
                  color: 'var(--pact-text-dim)',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
