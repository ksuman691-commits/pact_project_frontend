'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader, Users, X } from 'lucide-react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { useSearchUsers } from '@/hooks/useUserQueries';
import type { DareRecipientPick } from '@/types/createDareFlow';

export default function RecipientsStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data: results, isLoading } = useSearchUsers(debouncedQuery, 8);
  const searchResults = (results?.data || []).filter(
    (candidate: any) => !draft.recipients.some((selected) => selected.id === candidate.id)
  );

  const addRecipient = (candidate: DareRecipientPick) => {
    updateDraft({ recipients: [...draft.recipients, candidate] });
    setQuery('');
    setDebouncedQuery('');
  };

  const removeRecipient = (id: number) => {
    updateDraft({ recipients: draft.recipients.filter((r) => r.id !== id) });
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">Add recipients</h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-[var(--pact-text-dim)]">
        <Users className="h-4 w-4" />
        Search by name or username
      </p>

      {draft.recipients.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {draft.recipients.map((recipient) => (
            <div key={recipient.id} className="flex items-center gap-2 rounded-full pl-1.5 pr-2 py-1.5" style={{ background: 'var(--pact-surface-2)' }}>
              <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[var(--pact-violet)] to-[var(--pact-pink)]">
                {recipient.avatar_url ? (
                  <Image src={recipient.avatar_url} alt={recipient.username} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                    {(recipient.full_name || recipient.username)?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <span className="text-sm text-[var(--pact-text-dim)]">@{recipient.username}</span>
              <button type="button" onClick={() => removeRecipient(recipient.id)} aria-label={`Remove @${recipient.username}`} className="text-[var(--pact-text-faint)] hover:text-[var(--pact-pink)]">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative mt-4">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username"
          className="w-full rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] px-4 py-2.5 text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]"
        />

        {query.trim().length > 0 && (
          <div
            className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-[20px]"
            style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)', boxShadow: '0 12px 28px var(--pact-shadow-violet)' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader className="h-5 w-5 animate-spin text-[var(--pact-violet)]" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-[var(--pact-text-faint)]">
                <p className="text-sm">No users found</p>
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
                    <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[var(--pact-violet)] to-[var(--pact-pink)]">
                      {candidate.avatar_url ? (
                        <Image src={candidate.avatar_url} alt={candidate.full_name || candidate.username} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                          {(candidate.full_name || candidate.username)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
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

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={goNext}
          disabled={draft.recipients.length === 0}
          className="pact-btn-glow w-full rounded-full py-3 font-bold disabled:opacity-40"
          style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
