'use client';

import { useState } from 'react';
import { Loader, Search, UserPlus, UserRoundPlus, X } from 'lucide-react';
import Avatar from '@/components/Avatar';
import DetailPageHeader from '@/components/DetailPageHeader';
import { useSearchUsers } from '@/hooks/useUserQueries';

type Invitee = {
  user_id: number;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

/**
 * Inline "add someone else" search — same search primitive as
 * InviteMembersModal's SearchInviteTab (useSearchUsers -> a real, deployed
 * GET /api/users/search), but there's no circle yet to invite into at this
 * point in the flow, so picking a result just appends them to the local
 * list in state instead of firing a mutation. Nothing is persisted until
 * "Set up the pact" is pressed.
 */
function AddSomeoneSearch({ excludeIds, onAdd }: { excludeIds: number[]; onAdd: (person: Invitee) => void }) {
  const [query, setQuery] = useState('');
  const { data: searchResults, isLoading } = useSearchUsers(query, 20);
  const allResults: any[] = searchResults?.data || [];
  const results = allResults.filter((person) => !excludeIds.includes(person.id));

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-2 rounded-full border border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] px-4 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[var(--pact-text-faint)]" />
        <input
          autoFocus
          type="text"
          placeholder="Search by name or username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[var(--pact-text)] outline-none"
        />
      </div>

      {query.length > 0 && (
        <div className="min-h-[60px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader className="h-4 w-4 animate-spin text-[var(--pact-violet)]" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--pact-text-faint)]">
              {allResults.length > 0 ? 'They\u2019re already on the list.' : 'No one matches that search.'}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((person: any) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() =>
                    onAdd({
                      user_id: person.id,
                      full_name: person.full_name,
                      username: person.username,
                      avatar_url: person.avatar_url,
                    })
                  }
                  className="flex items-center gap-3 rounded-2xl bg-[var(--pact-surface-2)] p-2.5 text-left transition hover:opacity-90"
                >
                  <Avatar name={person.full_name || person.username} avatarUrl={person.avatar_url} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--pact-text)]">{person.full_name || person.username}</p>
                    <p className="truncate text-xs text-[var(--pact-text-faint)]">@{person.username}</p>
                  </div>
                  <UserPlus className="h-4 w-4 shrink-0 text-[var(--pact-violet)]" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InviteConfirmation({
  invitees,
  onConfirm,
  onCancel,
}: {
  invitees: Invitee[];
  onConfirm: (invitees: Invitee[]) => void;
  onCancel: () => void;
}) {
  // Owns an editable copy locally — the incoming `invitees` prop is just
  // the initial goal-match list. onConfirm is called with whatever this
  // list looks like after any add/remove, so the caller can build the
  // circle with the final set of people rather than the original match.
  const [localInvitees, setLocalInvitees] = useState<Invitee[]>(invitees);
  const [addingSomeone, setAddingSomeone] = useState(false);
  const canRemove = localInvitees.length > 1;

  const removeInvitee = (userId: number) => {
    if (!canRemove) return;
    setLocalInvitees((prev) => prev.filter((invitee) => invitee.user_id !== userId));
  };

  const addInvitee = (person: Invitee) => {
    setLocalInvitees((prev) => [...prev, person]);
    setAddingSomeone(false);
  };

  return (
    <main className="flex min-h-dvh flex-col">
      {/* This screen previously had no way back at all — no header, and
          the bottom "Cancel" button reads as declining the invite rather
          than as navigation. Reusing DetailPageHeader (same treatment as
          every other detail page) gives it a real back chevron; wired to
          the same onCancel used below so both paths clear the pending
          sessionStorage match list and go back consistently. */}
      <DetailPageHeader title="Circle invite" showHomeLink={false} onBack={onCancel} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-6">
        {/* Was "Start a circle with them?" — technically accurate (a
            circle is created first) but led with the mechanism instead of
            the point: teaming up on the shared goal. The circle-then-pact
            sequencing underneath is unchanged, this is copy only. */}
        <h1 className="mt-3 text-balance text-3xl font-black tracking-tight text-[var(--pact-text)]">Pact together?</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--pact-text-dim)]">
          You&apos;re about to team up with these people on a shared goal. We&apos;ll set up your circle, then the pact.
        </p>

        <div className="mt-8 rounded-3xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)] p-3">
          <div className="divide-y divide-[var(--pact-hairline)]">
            {localInvitees.map((invitee) => (
              <div key={invitee.user_id} className="flex items-center gap-3 px-2 py-3">
                <Avatar name={invitee.full_name || invitee.username || 'Member'} avatarUrl={invitee.avatar_url} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[var(--pact-text)]">{invitee.full_name || invitee.username || 'Circle member'}</p>
                  {invitee.username && invitee.full_name && <p className="truncate text-xs text-[var(--pact-text-faint)]">@{invitee.username}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeInvitee(invitee.user_id)}
                  disabled={!canRemove}
                  aria-label={`Remove ${invitee.full_name || invitee.username || 'this person'}`}
                  title={canRemove ? undefined : 'You need at least one other person'}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--pact-text-faint)] transition hover:bg-[var(--pact-surface-2)] hover:text-[var(--pact-text)] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {addingSomeone ? (
            <div className="border-t border-[var(--pact-hairline)] px-2 pt-3">
              <AddSomeoneSearch excludeIds={localInvitees.map((i) => i.user_id)} onAdd={addInvitee} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSomeone(true)}
              className="mt-1 flex w-full items-center gap-2 rounded-2xl px-2 py-3 text-sm font-semibold text-[var(--pact-violet)] transition hover:bg-[var(--pact-surface-2)]"
            >
              <UserRoundPlus className="h-4 w-4" />
              Add someone else
            </button>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <button
            type="button"
            onClick={() => onConfirm(localInvitees)}
            className="w-full rounded-full bg-[var(--pact-violet)] px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Set up the pact
          </button>
          <button type="button" onClick={onCancel} className="w-full rounded-full border border-[var(--pact-hairline)] px-5 py-3.5 text-sm font-bold text-[var(--pact-text)] transition hover:bg-[var(--pact-surface)]">
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
