'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';
import NotYours from '@/components/console/NotYours';
import { consoleApi, errorText, type Grievance, type GrievanceChannel, type GrievanceKind } from '@/lib/console/api';

const RED = '#B3261E';
const AMBER = '#8A5A00';
const GREEN = '#1E7A3D';
type Status = 'open' | 'resolved' | 'all';

const KINDS: [GrievanceKind, string][] = [
  ['complaint', 'Complaint'],
  ['access', 'See my data'],
  ['correction', 'Correct my data'],
  ['erasure', 'Erase my data'],
  ['consent', 'Consent'],
  ['nominee', 'Nominee'],
  ['other', 'Other'],
];
const CHANNELS: [GrievanceChannel, string][] = [
  ['email', 'Email'],
  ['in_app', 'In the app'],
  ['post', 'Post'],
  ['phone', 'Phone'],
  ['other', 'Other'],
];

const utc = (iso: string) => new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
const when = (iso: string | null) =>
  iso ? utc(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

/** "in 5h", "in 3 days", "2 days late". */
function clock(dueIso: string, doneIso: string | null): { text: string; colour: string } {
  const due = utc(dueIso).getTime();
  if (doneIso) {
    const late = utc(doneIso).getTime() > due;
    return { text: late ? 'Done late' : 'Done on time', colour: late ? RED : GREEN };
  }
  const diff = due - Date.now();
  const hours = Math.round(Math.abs(diff) / 3_600_000);
  const span = hours < 48 ? `${hours}h` : `${Math.round(hours / 24)} days`;
  if (diff < 0) return { text: `${span} late`, colour: RED };
  return { text: `in ${span}`, colour: hours < 24 ? AMBER : 'var(--muted)' };
}

function LogForm({ onDone }: { onDone: () => void }) {
  const [kind, setKind] = useState<GrievanceKind>('complaint');
  const [channel, setChannel] = useState<GrievanceChannel>('email');
  const [receivedAt, setReceivedAt] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [username, setUsername] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const field = 'h-10 w-full rounded-[10px] border border-[var(--hairline)] bg-white px-3 text-[14px]';
  const save = async () => {
    setBusy(true);
    try {
      await consoleApi.logGrievance({
        kind,
        channel,
        summary: summary.trim(),
        ...(receivedAt ? { received_at: new Date(receivedAt).toISOString() } : {}),
        ...(fromName.trim() ? { from_name: fromName.trim() } : {}),
        ...(fromEmail.trim() ? { from_email: fromEmail.trim() } : {}),
        ...(username.trim() ? { username: username.trim() } : {}),
      });
      toast.success('Logged. The clocks have started.');
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-4 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] p-[18px]">
      <h2 className="text-[17px] font-bold">Log a grievance or request</h2>
      <p className="mt-0.5 text-[13px] text-[var(--muted)]">Log it as soon as it comes in. &ldquo;Came in&rdquo; is when they sent it, not when you saw it.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-[12.5px] font-semibold text-[var(--muted)]">
          What it is
          <select value={kind} onChange={(e) => setKind(e.target.value as GrievanceKind)} className={`${field} mt-1 text-[var(--ink)]`}>
            {KINDS.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <label className="text-[12.5px] font-semibold text-[var(--muted)]">
          How it came in
          <select value={channel} onChange={(e) => setChannel(e.target.value as GrievanceChannel)} className={`${field} mt-1 text-[var(--ink)]`}>
            {CHANNELS.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <label className="text-[12.5px] font-semibold text-[var(--muted)]">
          Came in (leave empty for now)
          <input type="datetime-local" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} className={`${field} mt-1 text-[var(--ink)]`} />
        </label>
        <label className="text-[12.5px] font-semibold text-[var(--muted)]">
          Their name
          <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={`${field} mt-1 text-[var(--ink)]`} />
        </label>
        <label className="text-[12.5px] font-semibold text-[var(--muted)]">
          Their email
          <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className={`${field} mt-1 text-[var(--ink)]`} />
        </label>
        <label className="text-[12.5px] font-semibold text-[var(--muted)]">
          CirclePact username (if they gave it)
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" className={`${field} mt-1 text-[var(--ink)]`} />
        </label>
      </div>
      <label className="mt-3 block text-[12.5px] font-semibold text-[var(--muted)]">
        What they asked or complained about
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="mt-1 w-full rounded-[10px] border border-[var(--hairline)] bg-white px-3 py-2 text-[14px] text-[var(--ink)]" />
      </label>
      <button type="button" disabled={busy || summary.trim().length < 3} onClick={() => void save()} className="mt-3 h-10 rounded-full bg-[var(--ink)] px-5 text-[14px] font-bold text-white disabled:opacity-40">
        {busy ? 'Logging…' : 'Log it'}
      </button>
    </div>
  );
}

function Detail({ g, onDone }: { g: Grievance; onDone: () => void }) {
  const [outcome, setOutcome] = useState(g.outcome ?? '');
  const [notes, setNotes] = useState(g.notes ?? '');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setOutcome(g.outcome ?? '');
    setNotes(g.notes ?? '');
  }, [g.id, g.outcome, g.notes]);
  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(done);
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const ack = clock(g.ack_due, g.acknowledged_at);
  const res = clock(g.resolve_due, g.resolved_at);
  return (
    <aside className="w-full rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] p-[18px] lg:w-[380px] lg:shrink-0">
      <div className="text-[12.5px] text-[var(--muted)]">
        #{g.id} · {g.kind_label} · {CHANNELS.find(([k]) => k === g.channel)?.[1]} · came in {when(g.received_at)}
      </div>
      <div className="mt-1 text-[15px] font-bold">
        {g.from_name || g.from_email || 'Unknown sender'}
        {g.username && <span className="font-normal text-[var(--muted)]"> · @{g.username}{g.user_id ? '' : ' (no account found)'}</span>}
      </div>
      {g.from_email && g.from_name && <div className="text-[13px] text-[var(--muted)]">{g.from_email}</div>}
      <p className="mt-2 whitespace-pre-wrap rounded-[12px] bg-white p-3 text-[14px] leading-[1.5]">{g.summary}</p>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13.5px]">
        <dt className="text-[var(--muted)]">Acknowledge</dt>
        <dd style={{ color: ack.colour }} className="font-semibold">{g.acknowledged_at ? `${ack.text}, ${when(g.acknowledged_at)}` : `${ack.text} (by ${when(g.ack_due)})`}</dd>
        <dt className="text-[var(--muted)]">Resolve</dt>
        <dd style={{ color: res.colour }} className="font-semibold">{g.resolved_at ? `${res.text}, ${when(g.resolved_at)}` : `${res.text} (by ${when(g.resolve_due)})`}</dd>
        <dt className="text-[var(--muted)]">Legal limit</dt>
        <dd style={{ color: g.past_cap ? RED : undefined }}>{when(g.legal_cap)}{g.past_cap ? ' · past it' : ''}</dd>
      </dl>

      {!g.acknowledged_at && (
        <button type="button" disabled={busy} onClick={() => void run(() => consoleApi.acknowledgeGrievance(g.id), 'Marked acknowledged')} className="mt-3 h-10 w-full rounded-full border border-[var(--ink)] bg-white text-[14px] font-bold disabled:opacity-40">
          I&apos;ve replied to say we got it
        </button>
      )}

      {g.resolved_at ? (
        <>
          <div className="mt-3 text-[12.5px] font-semibold text-[var(--muted)]">What we did</div>
          <p className="mt-1 whitespace-pre-wrap text-[14px]">{g.outcome}</p>
          <button type="button" disabled={busy} onClick={() => void run(() => consoleApi.reopenGrievance(g.id), 'Reopened')} className="mt-3 h-9 rounded-full border border-[var(--hairline)] bg-white px-4 text-[13.5px] font-bold disabled:opacity-40">
            Reopen
          </button>
        </>
      ) : (
        <>
          <label className="mt-3 block text-[12.5px] font-semibold text-[var(--muted)]">
            What we did (sent to them, kept as the record)
            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3} className="mt-1 w-full rounded-[10px] border border-[var(--hairline)] bg-white px-3 py-2 text-[14px] text-[var(--ink)]" />
          </label>
          <button
            type="button"
            disabled={busy || outcome.trim().length < 3}
            onClick={() => void run(() => consoleApi.resolveGrievance(g.id, outcome.trim()), 'Resolved')}
            className="mt-2 h-10 w-full rounded-full bg-[var(--ink)] text-[14px] font-bold text-white disabled:opacity-40"
          >
            Mark resolved
          </button>
        </>
      )}

      <label className="mt-4 block text-[12.5px] font-semibold text-[var(--muted)]">
        Team notes (not sent)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-[10px] border border-[var(--hairline)] bg-white px-3 py-2 text-[14px] text-[var(--ink)]" />
      </label>
      {notes !== (g.notes ?? '') && (
        <button type="button" disabled={busy} onClick={() => void run(() => consoleApi.grievanceNotes(g.id, notes), 'Notes saved')} className="mt-1.5 h-9 rounded-full border border-[var(--hairline)] bg-white px-4 text-[13.5px] font-bold disabled:opacity-40">
          Save notes
        </button>
      )}
    </aside>
  );
}

function Grievances() {
  const member = useConsoleMember();
  const allowed = member?.role === 'staff' || member?.role === 'owner';
  const [status, setStatus] = useState<Status>('open');
  const [items, setItems] = useState<Grievance[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      const rows = await consoleApi.grievances(status);
      setItems(rows);
      setSelected((current) => (rows.some((r) => r.id === current) ? current : (rows[0]?.id ?? null)));
    } catch (error) {
      toast.error(errorText(error, "Couldn't load grievances. Try again."));
    }
  }, [status, allowed]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  const download = async () => {
    try {
      const blob = await consoleApi.grievancesCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `circlepact-grievances-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(errorText(error));
    }
  };

  if (!member) return null;
  if (!allowed) return <NotYours />;
  const g = items?.find((r) => r.id === selected) ?? null;
  const late = (items ?? []).filter((r) => !r.resolved_at && (r.resolve_late || (!r.acknowledged_at && r.ack_late))).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold tracking-[-0.04em]">Grievances</h1>
          <p className="mt-1 max-w-[640px] text-[14.5px] text-[var(--muted)]">
            Every complaint and privacy request people send us. Acknowledge within 24 hours. Resolve complaints within 15 days and rights requests within 30. Never past 90 days.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void download()} className="h-10 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14px] font-bold">
            Download the log
          </button>
          <button type="button" onClick={() => setLogging((v) => !v)} className="h-10 rounded-full bg-[var(--ink)] px-4 text-[14px] font-bold text-white">
            {logging ? 'Close' : 'Log one'}
          </button>
        </div>
      </div>

      {logging && (
        <LogForm
          onDone={() => {
            setLogging(false);
            setStatus('open');
            void load();
          }}
        />
      )}

      <div role="tablist" className="mt-4 flex flex-wrap items-center gap-1.5">
        {(['open', 'resolved', 'all'] as Status[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={status === s}
            type="button"
            onClick={() => setStatus(s)}
            className={`flex h-[34px] items-center rounded-full px-3.5 text-[13.5px] font-bold capitalize ${status === s ? 'bg-[var(--ink)] text-white' : 'border border-[var(--hairline)] bg-white'}`}
          >
            {s}
            {s === 'open' && items && status === 'open' ? ` · ${items.length}` : ''}
          </button>
        ))}
        {status === 'open' && late > 0 && <span className="ml-1 text-[13.5px] font-bold" style={{ color: RED }}>{late} late</span>}
      </div>

      {items === null ? (
        <div className="mt-4 h-[240px] animate-pulse rounded-[18px] bg-[var(--card)]" aria-busy="true" />
      ) : items.length === 0 ? (
        <div className="mt-3.5 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] px-5 py-8 text-center text-[14.5px] text-[var(--muted)]">
          {status === 'open' ? 'Nothing waiting. Log each one as soon as it comes in.' : 'Nothing here yet.'}
        </div>
      ) : (
        <div className="mt-3.5 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 overflow-hidden rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#F6F1E6] text-left text-[12px] font-semibold text-[var(--muted)]">
                  <th className="px-3.5 py-2.5">From</th>
                  <th className="px-3.5 py-2.5">What</th>
                  <th className="px-3.5 py-2.5">Acknowledge</th>
                  <th className="px-3.5 py-2.5">Resolve</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const ack = clock(r.ack_due, r.acknowledged_at);
                  const res = clock(r.resolve_due, r.resolved_at);
                  return (
                    <tr key={r.id} onClick={() => setSelected(r.id)} className={`cursor-pointer border-t border-[#E6DFD0] ${r.id === selected ? 'bg-[#FFF6D6]' : 'hover:bg-[#F6F1E6]'}`}>
                      <td className="px-3.5 py-3">
                        <button type="button" className="text-left" onClick={() => setSelected(r.id)}>
                          <b>{r.from_name || r.from_email || 'Unknown'}</b>
                          <span className="block text-[12.5px] text-[var(--muted)]">#{r.id} · came in {when(r.received_at)}</span>
                        </button>
                      </td>
                      <td className="px-3.5 py-3">{r.kind_label}</td>
                      <td className="px-3.5 py-3 font-semibold" style={{ color: ack.colour }}>{ack.text}</td>
                      <td className="px-3.5 py-3 font-semibold" style={{ color: res.colour }}>{res.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {g && <Detail g={g} onDone={() => void load()} />}
        </div>
      )}
    </>
  );
}

export default function GrievancesPage() {
  return (
    <ConsoleFrame>
      <Grievances />
    </ConsoleFrame>
  );
}
