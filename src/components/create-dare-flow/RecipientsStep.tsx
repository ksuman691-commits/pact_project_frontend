'use client';

import LogoSpinner from '@/components/LogoSpinner';
import React, { useEffect, useState } from 'react';
import { Check, Users, X } from 'lucide-react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { useSearchUsers } from '@/hooks/useUserQueries';
import { useCircles } from '@/hooks/useCircles';
import { MAX_DARE_RECIPIENTS, type DareRecipientPick } from '@/types/createDareFlow';
import Avatar from '@/components/Avatar';

export default function RecipientsStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // People or a whole circle: a circle dare gives every other member their own dare.
  const [mode, setMode] = useState<'people' | 'circle'>(draft.circle ? 'circle' : 'people');
  const circlesQuery = useCircles(mode === 'circle');
  const circles: any[] = (circlesQuery.data?.data || circlesQuery.data || []) as any[];
  const pickMode = (next: 'people' | 'circle') => {
    setMode(next);
    if (next === 'people') updateDraft({ circle: null });
  };
  const pickCircle = (circle: any) => {
    const others = Math.max(0, (circle.member_count ?? 1) - 1);
    updateDraft({ circle: draft.circle?.id === circle.id ? null : { id: circle.id, name: circle.name, others }, recipients: [] });
  };

  const { data: results, isLoading } = useSearchUsers(debouncedQuery, 8);
  const searchResults = (results?.data || []).filter(
    (candidate: any) => !draft.recipients.some((selected) => selected.id === candidate.id)
  );

  // Each person picked gets their own dare, up to a handful.
  const full = draft.recipients.length >= MAX_DARE_RECIPIENTS;
  const addRecipient = (candidate: DareRecipientPick) => {
    if (full) return;
    updateDraft({ recipients: [...draft.recipients, candidate] });
    setQuery('');
    setDebouncedQuery('');
  };

  const removeRecipient = (id: number) => {
    updateDraft({ recipients: draft.recipients.filter((r) => r.id !== id) });
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-[32px] font-extrabold leading-[1.04] tracking-[-0.035em] text-[var(--pact-text)] text-balance">Who&apos;s brave enough?</h1>
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full p-1" style={{ background: 'var(--pact-surface-2)' }} role="group" aria-label="Who to dare">
        {(['people', 'circle'] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={mode === item}
            onClick={() => pickMode(item)}
            className={`h-10 rounded-full text-[14px] font-bold transition ${mode === item ? 'bg-[var(--ink)] text-[var(--dare)]' : 'text-[var(--pact-text)]'}`}
          >
            {item === 'people' ? 'People' : 'A whole circle'}
          </button>
        ))}
      </div>

      {mode === 'circle' ? (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-sm text-[var(--pact-text-dim)]">Everyone else in the circle gets their own dare to accept or pass.</p>
          {circlesQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <LogoSpinner size={28} />
            </div>
          ) : circles.length === 0 ? (
            <p className="rounded-[20px] px-4 py-3 text-sm text-[var(--pact-text-dim)]" style={{ background: 'var(--pact-surface-2)' }}>
              You&apos;re not in a circle yet. Pick people instead.
            </p>
          ) : (
            circles.map((circle) => {
              const picked = draft.circle?.id === circle.id;
              const others = Math.max(0, (circle.member_count ?? 1) - 1);
              return (
                <button
                  key={circle.id}
                  type="button"
                  disabled={others === 0}
                  aria-pressed={picked}
                  onClick={() => pickCircle(circle)}
                  className="flex min-h-[60px] items-center gap-3 rounded-[18px] border px-3.5 text-left transition active:scale-[0.99] disabled:opacity-50"
                  style={picked ? { background: 'var(--ink)', borderColor: 'var(--ink)', color: 'white', boxShadow: '0 0 0 2px var(--dare)' } : { background: 'var(--pact-surface)', borderColor: 'var(--pact-hairline)' }}
                >
                  <Avatar name={circle.name} avatarUrl={circle.photo_url || circle.avatar_url} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{circle.name}</span>
                    <span className="block text-[12.5px]" style={{ color: picked ? '#C9C8CF' : 'var(--pact-text-dim)' }}>
                      {others === 0 ? 'Just you so far' : `${others} ${others === 1 ? 'person' : 'people'} will be dared`}
                    </span>
                  </span>
                  {picked && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--dare)] text-[var(--ink)]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      ) : (
      <>
      <p className="mt-2 flex items-center gap-2 text-sm text-[var(--pact-text-dim)]">
        <Users className="h-4 w-4" aria-hidden="true" />
        {draft.recipients.length > 1 ? `${draft.recipients.length} people. Each gets their own dare.` : `Pick up to ${MAX_DARE_RECIPIENTS}. Each gets their own dare.`}
      </p>

      {draft.recipients.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {draft.recipients.map((recipient) => (
            <div key={recipient.id} className="flex items-center gap-2 rounded-full bg-[var(--ink)] py-1 pl-1 pr-1.5 text-white">
              <span className="flex rounded-full" style={{ boxShadow: '0 0 0 2px var(--dare)' }}>
                <Avatar name={recipient.full_name || recipient.username} avatarUrl={recipient.avatar_url} size={28} />
              </span>
              <span className="text-[14px] font-semibold">{(recipient.full_name || recipient.username).split(' ')[0]}</span>
              <button type="button" onClick={() => removeRecipient(recipient.id)} aria-label={`Remove ${recipient.full_name || recipient.username}`} className="cp-hit relative flex h-7 w-7 items-center justify-center rounded-full text-[var(--dare)]">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative mt-4">
        {full ? (
          <p className="rounded-[20px] px-4 py-3 text-sm text-[var(--pact-text-dim)]" style={{ background: 'var(--pact-surface-2)' }}>
            That&apos;s {MAX_DARE_RECIPIENTS}. Remove someone to add another.
          </p>
        ) : (
        <input
          autoFocus={draft.recipients.length === 0}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={draft.recipients.length ? 'Add another person' : 'Search by name or username'}
          className="w-full rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] px-4 py-2.5 text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--ink)]"
        />
        )}

        {query.trim().length > 0 && (
          <div
            className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-[20px]"
            style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)', boxShadow: '0 12px 28px var(--pact-shadow-violet)' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <LogoSpinner size={28} />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-[var(--pact-text-faint)]">
                <p className="text-[var(--muted)] text-sm">No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--pact-hairline)]">
                {searchResults.map((candidate: any) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() =>
                      addRecipient({
                        id: candidate.id,
                        username: candidate.username,
                        full_name: candidate.full_name,
                        avatar_url: candidate.avatar_url,
                      })
                    }
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-[var(--pact-surface-2)]"
                  >
                <Avatar name={candidate.full_name || candidate.username} avatarUrl={candidate.avatar_url} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--pact-text)]">{candidate.full_name || candidate.username}</p>
                      <p className="truncate text-xs text-[var(--pact-text-faint)]">@{candidate.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      </>
      )}

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={goNext}
          disabled={draft.recipients.length === 0 && !draft.circle}
          className="h-[52px] w-full rounded-full bg-[var(--ink)] text-[16px] font-bold text-[var(--dare)] disabled:opacity-40"
        >
          {draft.circle ? `Dare ${draft.circle.name}` : draft.recipients.length === 0 ? 'Continue' : draft.recipients.length === 1 ? `Dare ${(draft.recipients[0].full_name || draft.recipients[0].username).split(' ')[0]}` : `Dare ${draft.recipients.length} people`}
        </button>
      </div>
    </div>
  );
}
