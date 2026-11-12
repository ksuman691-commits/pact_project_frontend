'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Plus, X } from 'lucide-react';
import ConsoleFrame, { RolePill, ROLE_LABEL, useConsoleMember } from '@/components/console/ConsoleFrame';
import { consoleApi, errorText, type TeamMember, type TeamRole } from '@/lib/console/api';

const ROLES: { id: Exclude<TeamRole, 'owner'>; blurb: string }[] = [
  { id: 'creator', blurb: "Writes dare drafts. Can't approve or publish." },
  { id: 'moderator', blurb: 'Reports and looking people up.' },
  { id: 'staff', blurb: 'Dashboard, approve drafts, schedule the dare of the day.' },
];

const ABOUT: { role: TeamRole; text: string }[] = [
  { role: 'owner', text: 'Everything, plus inviting and removing people and reading the activity log.' },
  { role: 'staff', text: 'Watch the dashboard, approve drafts, schedule and end the dare of the day.' },
  { role: 'moderator', text: 'Handle reports, look people up, and later suspend accounts.' },
  { role: 'creator', text: "Write dare drafts and see how they did. Can't approve or publish." },
];

function when(iso: string | null): string {
  if (!iso) return '–';
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const today = new Date();
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** A link to hand over once: shown so the owner can send it on chat when email isn't set up. */
function LinkNote({ link, emailed, name, onClose }: { link: string; emailed: boolean; name: string; onClose: () => void }) {
  return (
    <div className="mt-4 rounded-[18px] border-[1.5px] border-[var(--ink)] bg-[var(--card)] p-4" role="status">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14.5px] leading-[1.45]">
          {emailed ? <>We emailed {name} their setup link. You can also send it yourself:</> : <>Email isn&apos;t set up, so send {name} this link yourself. It works once, for 24 hours:</>}
        </p>
        <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted)]">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-[10px] bg-white px-3 py-2 text-[13px]">{link}</code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              toast.success('Link copied');
            } catch {
              toast.error("Couldn't copy. Select the link instead.");
            }
          }}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--ink)] px-3.5 text-[13px] font-bold text-white"
        >
          <Copy className="size-3.5" aria-hidden="true" />
          Copy
        </button>
      </div>
    </div>
  );
}

function Team() {
  const me = useConsoleMember();
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<TeamRole, 'owner'>>('creator');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ link: string; emailed: boolean; name: string } | null>(null);
  const [managing, setManaging] = useState<TeamMember | null>(null);

  const load = () => consoleApi.team().then(setMembers).catch((err) => toast.error(errorText(err)));
  useEffect(() => {
    void load();
  }, []);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const made = await consoleApi.invite({ name: name.trim(), email: email.trim(), role });
      setLink({ link: made.invite_link, emailed: made.emailed, name: made.member.name });
      setInviting(false);
      setName('');
      setEmail('');
      setRole('creator');
      void load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      const result = (await fn()) as { invite_link?: string; emailed?: boolean; member?: TeamMember } | undefined;
      if (result?.invite_link && result.member) setLink({ link: result.invite_link, emailed: !!result.emailed, name: result.member.name });
      toast.success(done);
      setManaging(null);
      void load();
    } catch (err) {
      const detail = errorText(err, '');
      if (detail) toast.error(detail);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.04em]">Team</h1>
          <p className="mt-2 text-[14.5px] text-[var(--muted)]">Who can sign in to the console, and what each person can do.</p>
        </div>
        <button type="button" onClick={() => setInviting(true)} className="flex h-11 items-center gap-1.5 rounded-full bg-[var(--ink)] px-[18px] text-[15px] font-bold text-white">
          <Plus className="size-4" strokeWidth={2.6} aria-hidden="true" />
          Invite someone
        </button>
      </div>

      {link && <LinkNote {...link} onClose={() => setLink(null)} />}

      <div className="mt-5 overflow-x-auto rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
        <table className="w-full min-w-[680px] border-collapse text-[14.5px]">
          <thead>
            <tr className="text-left text-[13px] text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold">Person</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Two-step</th>
              <th className="px-4 py-3 font-semibold">Last signed in</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!members
              ? [0, 1, 2].map((i) => (
                  <tr key={i} className="border-t border-[var(--hairline)]">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="pact-shimmer h-9 rounded-[10px]" />
                    </td>
                  </tr>
                ))
              : members.map((m) => (
                  <tr key={m.id} className="border-t border-[var(--hairline)]">
                    <td className="px-4 py-3">
                      <b>{m.name}</b>
                      <div className="text-[13px] text-[var(--muted)]">{m.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <RolePill role={m.role} />
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: m.two_step ? 'var(--success)' : '#8A5A00' }}>
                      {m.two_step ? (m.backup_codes_left <= 2 ? `On · ${m.backup_codes_left} backup codes left` : 'On') : 'Not set up'}
                    </td>
                    <td className="px-4 py-3" style={{ color: m.status === 'invited' ? 'var(--muted)' : undefined }}>
                      {m.status === 'invited' ? `Invite sent ${when(m.created_at).toLowerCase()}` : when(m.last_sign_in_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.id === me?.id ? (
                        <span className="text-[13px] text-[var(--muted)]">You</span>
                      ) : m.status === 'invited' ? (
                        <span className="inline-flex gap-1.5">
                          <button type="button" disabled={busy} onClick={() => void act(() => consoleApi.resend(m.id), 'New link sent')} className="h-[34px] rounded-full border border-[var(--hairline)] px-3 text-[13px] font-semibold">
                            Resend
                          </button>
                          <button type="button" disabled={busy} onClick={() => setManaging(m)} className="h-[34px] rounded-full border border-[var(--hairline)] px-3 text-[13px] font-semibold">
                            Manage
                          </button>
                        </span>
                      ) : (
                        <button type="button" onClick={() => setManaging(m)} className="h-[34px] rounded-full border border-[var(--hairline)] px-3 text-[13px] font-semibold">
                          Manage
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2.5 mt-7 text-[18px] font-bold">What each role can do</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
        {ABOUT.map((item) => (
          <div key={item.role} className="rounded-[16px] border border-[var(--hairline)] bg-[var(--card)] p-3.5">
            <b>{ROLE_LABEL[item.role]}</b>
            <p className="mt-1.5 text-[13.5px] leading-[1.45] text-[var(--muted)]">{item.text}</p>
          </div>
        ))}
      </div>

      {inviting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title">
          <form onSubmit={sendInvite} className="w-full max-w-[520px] rounded-[24px] bg-[var(--card)] p-6">
            <h2 id="invite-title" className="text-[24px] font-bold tracking-[-0.03em]">Invite someone</h2>
            <p className="mt-1.5 text-[14px] leading-[1.45] text-[var(--muted)]">They get a one-time link to set a password and connect an authenticator. It expires in 24 hours.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-[13.5px] font-bold">
                Name
                <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 block h-[46px] w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 text-[15px] font-normal outline-none focus:border-[var(--ink)]" />
              </label>
              <label className="text-[13.5px] font-bold">
                Work email
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 block h-[46px] w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 text-[15px] font-normal outline-none focus:border-[var(--ink)]" />
              </label>
            </div>
            <div className="mt-4 text-[13.5px] font-bold" id="role-label">Role</div>
            <div role="radiogroup" aria-labelledby="role-label" className="mt-1.5 flex flex-col gap-1.5">
              {ROLES.map((r) => {
                const picked = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    onClick={() => setRole(r.id)}
                    className="flex min-h-[52px] items-center gap-3 rounded-[14px] border px-3.5 py-2 text-left"
                    style={picked ? { background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' } : { background: '#fff', borderColor: 'var(--hairline)' }}
                  >
                    <span className="flex-1">
                      <span className="block text-[15px] font-bold">{ROLE_LABEL[r.id]}</span>
                      <span className="block text-[12.5px]" style={{ color: picked ? '#C9C8CF' : 'var(--muted)' }}>{r.blurb}</span>
                    </span>
                    <span className="size-5 rounded-full" style={picked ? { border: '6px solid var(--dare)' } : { border: '1.5px solid #B9B1A0' }} />
                  </button>
                );
              })}
            </div>
            {error && <p className="mt-3 text-[13.5px] font-semibold text-[#B3261E]" role="alert">{error}</p>}
            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={() => { setInviting(false); setError(null); }} className="h-[46px] rounded-full border border-[var(--hairline)] px-[18px] text-[15px] font-bold">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="h-[46px] rounded-full bg-[var(--ink)] px-5 text-[15px] font-bold text-white disabled:opacity-50">
                {busy ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {managing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="manage-title">
          <div className="w-full max-w-[480px] rounded-[24px] bg-[var(--card)] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="manage-title" className="text-[22px] font-bold tracking-[-0.03em]">{managing.name}</h2>
                <p className="text-[13.5px] text-[var(--muted)]">{managing.email}</p>
              </div>
              <button type="button" onClick={() => setManaging(null)} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-[var(--muted)]">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {managing.status === 'active' && (
              <>
                <div className="mt-4 text-[13.5px] font-bold">Role</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      disabled={busy || managing.role === r.id}
                      onClick={() => void act(() => consoleApi.changeRole(managing.id, r.id), `${managing.name} is now ${ROLE_LABEL[r.id]}`)}
                      className="h-10 rounded-full px-4 text-[14px] font-bold disabled:cursor-default"
                      style={managing.role === r.id ? { background: 'var(--ink)', color: '#fff' } : { border: '1px solid var(--hairline)' }}
                    >
                      {ROLE_LABEL[r.id]}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[12.5px] text-[var(--muted)]">You&apos;ll be asked for your code.</p>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(() => consoleApi.resetAccess(managing.id), 'Signed out and sent a new setup link')}
                  className="mt-5 flex w-full flex-col items-start rounded-[14px] border border-[var(--hairline)] px-3.5 py-2.5 text-left"
                >
                  <span className="text-[15px] font-bold">Reset password and authenticator</span>
                  <span className="text-[12.5px] text-[var(--muted)]">For a lost phone or a forgotten password. Signs them out and sends a new setup link.</span>
                </button>
              </>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => void act(() => consoleApi.remove(managing.id), `${managing.name} was removed`)}
              className="mt-3 flex w-full flex-col items-start rounded-[14px] border border-[#E9B8B2] px-3.5 py-2.5 text-left"
            >
              <span className="text-[15px] font-bold text-[#B3261E]">{managing.status === 'invited' ? 'Cancel invite' : 'Remove from the team'}</span>
              <span className="text-[12.5px] text-[var(--muted)]">Signs them out everywhere at once. Their past actions stay in the activity log.</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ConsoleTeam() {
  return (
    <ConsoleFrame ownerOnly>
      <Team />
    </ConsoleFrame>
  );
}
