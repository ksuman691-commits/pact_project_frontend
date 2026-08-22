'use client';

import Avatar from '@/components/Avatar';

type Invitee = {
  user_id: number;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

export default function InviteConfirmation({
  invitees,
  onConfirm,
  onCancel,
}: {
  invitees: Invitee[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col px-5 pb-10 pt-10">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pact-violet)]">Circle invite</p>
        <h1 className="mt-3 text-balance text-3xl font-black tracking-tight text-[var(--pact-text)]">Start a circle with them?</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--pact-text-dim)]">
          You&apos;re about to invite these people to a new accountability circle.
        </p>

        <div className="mt-8 rounded-3xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)] p-3">
          <div className="divide-y divide-[var(--pact-hairline)]">
            {invitees.map((invitee) => (
              <div key={invitee.user_id} className="flex items-center gap-3 px-2 py-3">
                <Avatar name={invitee.full_name || invitee.username || 'Member'} avatarUrl={invitee.avatar_url} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-[var(--pact-text)]">{invitee.full_name || invitee.username || 'Circle member'}</p>
                  {invitee.username && invitee.full_name && <p className="truncate text-xs text-[var(--pact-text-faint)]">@{invitee.username}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <button type="button" onClick={onConfirm} className="w-full rounded-full bg-[var(--pact-violet)] px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90">
            Continue to circle setup
          </button>
          <button type="button" onClick={onCancel} className="w-full rounded-full border border-[var(--pact-hairline)] px-5 py-3.5 text-sm font-bold text-[var(--pact-text)] transition hover:bg-[var(--pact-surface)]">
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
