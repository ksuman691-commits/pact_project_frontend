'use client';

import LogoSpinner from '@/components/LogoSpinner';
import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Link as LinkIcon, Search, Loader, MessageCircle, Users } from 'lucide-react';
import { circleLink, copyText, shareCircle } from '@/lib/circleInvite';
import toast from 'react-hot-toast';
import { useSearchUsers } from '@/hooks/useUserQueries';
import { useInviteUserToCircle, usePendingCircleInvites } from '@/hooks/useCircleMutations';
import { useBackToClose } from '@/hooks/useBackToClose';
import Avatar from '@/components/Avatar';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: number;
  circleName: string;
  /** Member user_ids already in the circle: they show "In circle" instead of Invite. */
  existingMemberIds?: number[];
  /** Private circles: people with the link ask to join instead of joining. */
  isPrivate?: boolean;
}

type Person = { id: number; username: string; full_name?: string | null; avatar_url?: string | null };

/**
 * Search tab. Search goes through GET /api/users/search; Invite posts to
 * POST /api/circles/{id}/invite (the server sends one invite per person, however
 * often it's asked). Pending invites come from GET /api/circles/{id}/invites, so
 * someone already asked shows "Invited" every time this opens, not just until it closes.
 */
function SearchInviteTab({ circleId, existingMemberIds }: { circleId: number; existingMemberIds: number[] }) {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const { data: searchResults, isLoading } = useSearchUsers(trimmed, 20);
  const { data: invitedIds = [] } = usePendingCircleInvites(circleId);
  const inviteMutation = useInviteUserToCircle(circleId);

  const results: Person[] = searchResults?.data || [];

  const handleInvite = (person: Person) => {
    if (inviteMutation.isPending || invitedIds.includes(person.id) || existingMemberIds.includes(person.id)) return;
    // Errors get their toast inside useInviteUserToCircle.
    inviteMutation.mutate({ userId: person.id });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5">
        <label className="flex h-12 items-center gap-2.5 rounded-full border border-[var(--hairline)] bg-[var(--paper)] px-4 focus-within:border-[var(--navy)]">
          <Search className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" aria-hidden="true" />
          <span className="sr-only">Search people</span>
          <input
            autoFocus
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="Name or @username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)]">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </label>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {trimmed.length === 0 ? (
          <EmptyState icon={<Search className="h-5 w-5" aria-hidden="true" />} title="Find people to invite" body="Search by name or username. They get a notification to join." />
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <LogoSpinner size={28} />
          </div>
        ) : results.length === 0 ? (
          <EmptyState icon={<Users className="h-5 w-5" aria-hidden="true" />} title="No one found" body={`No one matches "${trimmed}". Try another name, or share a link instead.`} />
        ) : (
          <ul className="px-5 pb-2">
            {results.map((person) => {
              const isMember = existingMemberIds.includes(person.id);
              const invited = invitedIds.includes(person.id);
              const inviting = inviteMutation.isPending && inviteMutation.variables?.userId === person.id;
              const name = person.full_name || person.username;
              return (
                <li key={person.id} className="flex items-center gap-3 border-b border-[var(--hairline)]/70 py-3 last:border-b-0">
                  <Avatar name={name} avatarUrl={person.avatar_url} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-[var(--ink)]">{name}</p>
                    <p className="truncate text-[13px] text-[var(--muted)]">@{person.username}</p>
                  </div>
                  {isMember ? (
                    <span className="shrink-0 text-[13px] font-semibold text-[var(--muted)]">In circle</span>
                  ) : invited ? (
                    <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--card-muted)] px-3.5 text-[13px] font-bold text-[var(--muted)]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                      Invited
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInvite(person)}
                      disabled={inviteMutation.isPending}
                      aria-label={`Invite ${name}`}
                      className="flex h-9 min-w-[84px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--navy)] px-4 text-[13px] font-bold text-white transition active:scale-95 disabled:opacity-60"
                    >
                      {inviting ? <Loader className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                      {inviting ? 'Sending' : 'Invite'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--card-muted)] text-[var(--muted)]">{icon}</span>
      <p className="mt-3 text-[15px] font-bold text-[var(--ink)]">{title}</p>
      <p className="mt-1 text-[13.5px] leading-snug text-[var(--muted)]">{body}</p>
    </div>
  );
}

function LinkTab({ circleId, circleName, isPrivate }: { circleId: number; circleName: string; isPrivate: boolean }) {
  const [copied, setCopied] = useState(false);
  // The circle's own page: open circles can Join there, private ones Ask to join.
  const inviteLink = circleLink(circleId);

  const copyLink = async () => {
    const ok = await copyText(inviteLink);
    if (!ok) {
      toast.error('Could not copy. Long-press the link to copy it.');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-5">
      <div className="flex h-12 items-center gap-2.5 rounded-full border border-[var(--hairline)] bg-[var(--paper)] px-4">
        <LinkIcon className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 select-all truncate text-[14px] text-[var(--ink)]">{inviteLink}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => void shareCircle('whatsapp', { id: circleId, name: circleName, isPrivate })}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--navy)] text-[14px] font-bold text-white transition active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] text-[14px] font-bold text-[var(--navy)] transition active:scale-[0.98]"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <p className="mt-3 px-1 text-[13px] leading-snug text-[var(--muted)]">
        {isPrivate
          ? 'Anyone with the link can ask to join. You approve each person.'
          : 'Anyone with the link can join. People without the app sign up first, then land here.'}
      </p>
    </div>
  );
}

export default function InviteMembersModal({ isOpen, onClose, circleId, circleName, existingMemberIds = [], isPrivate = false }: InviteMembersModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'link'>('search');
  useBackToClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'search' as const, label: 'Search people', icon: Search },
    { id: 'link' as const, label: 'Share link', icon: LinkIcon },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 md:items-center md:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-members-title"
        onClick={(e) => e.stopPropagation()}
        className="cp-sheet-rise flex h-[min(640px,88dvh)] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-[var(--card)] shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)] md:rounded-[28px]"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[var(--hairline)] md:hidden" aria-hidden="true" />

        <div className="flex shrink-0 items-start gap-3 px-5 pb-4 pt-3">
          <div className="min-w-0 flex-1">
            <h2 id="invite-members-title" className="truncate text-[20px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
              Invite to {circleName}
            </h2>
            <p className="mt-0.5 text-[13.5px] text-[var(--muted)]">{isPrivate ? 'Private circle' : 'Open circle'} · invite by name or share a link</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--card-muted)] text-[var(--ink)] transition active:scale-95"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" aria-label="How to invite" className="mx-5 mb-4 grid shrink-0 grid-cols-2 gap-1 rounded-full bg-[var(--card-muted)] p-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(id)}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-full text-[14px] font-bold transition ${
                  active ? 'bg-[var(--card)] text-[var(--ink)] shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-[var(--muted)]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        {activeTab === 'search' ? (
          <SearchInviteTab circleId={circleId} existingMemberIds={existingMemberIds} />
        ) : (
          <LinkTab circleId={circleId} circleName={circleName} isPrivate={isPrivate} />
        )}

        <div className="shrink-0 border-t border-[var(--hairline)] px-5 pt-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-full bg-[var(--ink)] text-[15px] font-bold text-white transition active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
