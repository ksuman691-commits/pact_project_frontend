'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';
import NotYours from '@/components/console/NotYours';
import { consoleApi, errorText, type ReportItem } from '@/lib/console/api';

const RED = '#B3261E';
type Status = 'open' | 'dismissed' | 'removed';

const REASON: Record<string, string> = { unsafe: 'Unsafe', mean: 'Mean', spam: 'Spam', other: 'Other' };

function ago(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function reasons(item: ReportItem): string {
  return Object.entries(item.reasons)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${REASON[k] ?? k}${n > 1 ? ` ×${n}` : ''}`)
    .join(', ');
}

function sentTo(item: ReportItem): string {
  if (item.is_official) return 'The dare of the day';
  if (item.audience === 'individual') return 'to 1 person';
  if (item.audience === 'circle') return `to a circle (${item.recipients} people)`;
  if (item.audience === 'public') return 'to everyone';
  return `to ${item.recipients} people`;
}

function Detail({ item, status, onDone }: { item: ReportItem; status: Status; onDone: () => void }) {
  const [busy, setBusy] = useState<'dismiss' | 'remove' | null>(null);
  const act = async (what: 'dismiss' | 'remove') => {
    setBusy(what);
    try {
      if (what === 'dismiss') await consoleApi.dismissReports(item.dare_id);
      else await consoleApi.removeReported(item.dare_id);
      toast.success(what === 'dismiss' ? 'Reports dismissed. The dare shows again.' : 'Dare removed');
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  };
  const kinds = Object.keys(item.reasons);
  return (
    <aside className="w-full rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] p-[18px] lg:w-[340px] lg:shrink-0">
      <div className="rounded-[14px] bg-[var(--ink)] p-3.5 text-white">
        <span className="text-[12px] opacity-70">
          Dare · sent {ago(item.created_at)}
          {item.creator_username && !item.is_official ? ` by @${item.creator_username}` : ''}
        </span>
        <div className="mt-1 text-[20px] font-bold leading-tight tracking-[-0.02em]">{item.title}</div>
        {item.description && <p className="mt-1 text-[13px] opacity-80">{item.description}</p>}
        <div className="mt-1.5 text-[12.5px] opacity-75">
          {sentTo(item)}
          {item.reward_amount ? ` · ₹${item.reward_amount} reward` : ''} · {item.accepted} accepted
          {item.hidden ? ' · hidden for now' : ''}
        </div>
      </div>
      <div className="mt-3 text-[13.5px] leading-[1.55]">
        <b>
          {item.open_reports} {item.open_reports === 1 ? 'report' : 'reports'}
          {kinds.length === 1 ? `, ${item.open_reports > 1 ? 'all ' : ''}“${REASON[kinds[0]] ?? kinds[0]}”` : `: ${reasons(item)}`}
        </b>
        {item.notes.length > 0 && <p className="mt-0.5">{item.notes.map((n) => `“${n}”`).join(' · ')}</p>}
      </div>
      {status === 'open' ? (
        <>
          <p className="mt-3 text-[12.5px] leading-[1.5] text-[var(--muted)]">
            Remove takes it out of the app for everyone, tells the sender why, and cancels the reward. Dismiss keeps it and closes these reports.
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" disabled={busy != null} onClick={() => void act('dismiss')} className="h-11 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14.5px] font-bold disabled:opacity-40">
              {busy === 'dismiss' ? 'Dismissing…' : 'Dismiss'}
            </button>
            <button type="button" disabled={busy != null} onClick={() => void act('remove')} className="h-11 rounded-full px-4 text-[14.5px] font-bold text-white disabled:opacity-40" style={{ background: RED }}>
              {busy === 'remove' ? 'Removing…' : 'Remove dare'}
            </button>
          </div>
          <p className="mt-2 text-[12px] text-[#8A8C93]">Remove asks for your authenticator code.</p>
        </>
      ) : (
        <p className="mt-3 text-[13px] text-[var(--muted)]">
          {status === 'removed' ? 'Removed' : 'Dismissed'} {ago(item.resolved_at)}.
        </p>
      )}
    </aside>
  );
}

function Reports() {
  const member = useConsoleMember();
  const [status, setStatus] = useState<Status>('open');
  const [items, setItems] = useState<ReportItem[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const allowed = member?.role === 'moderator' || member?.role === 'owner';

  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      const rows = await consoleApi.reports(status);
      setItems(rows);
      setSelected((current) => (rows.some((r) => r.dare_id === current) ? current : (rows[0]?.dare_id ?? null)));
    } catch (error) {
      toast.error(errorText(error, "Couldn't load reports. Try again."));
    }
  }, [status, allowed]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  if (!member) return null;
  if (!allowed) return <NotYours />;
  const item = items?.find((r) => r.dare_id === selected) ?? null;

  return (
    <>
      <h1 className="text-[30px] font-bold tracking-[-0.04em]">Reports</h1>
      <p className="mt-1 text-[14.5px] text-[var(--muted)]">Dares people reported in the app. Most reported first.</p>
      <div role="tablist" className="mt-5 flex flex-wrap gap-1.5">
        {(['open', 'dismissed', 'removed'] as Status[]).map((s) => (
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
      </div>

      {items === null ? (
        <div className="mt-4 h-[240px] animate-pulse rounded-[18px] bg-[var(--card)]" aria-busy="true" />
      ) : items.length === 0 ? (
        <div className="mt-3.5 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] px-5 py-8 text-center text-[14.5px] text-[var(--muted)]">
          {status === 'open' ? 'Nothing reported right now.' : `Nothing ${status} yet.`}
        </div>
      ) : (
        <div className="mt-3.5 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 overflow-hidden rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#F6F1E6] text-left text-[12px] font-semibold text-[var(--muted)]">
                  <th className="px-3.5 py-2.5">Dare</th>
                  <th className="px-3.5 py-2.5">Reports</th>
                  <th className="px-3.5 py-2.5">Why</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr
                    key={r.dare_id}
                    onClick={() => setSelected(r.dare_id)}
                    className={`cursor-pointer border-t border-[#E6DFD0] ${r.dare_id === selected ? 'bg-[#FFF6D6]' : 'hover:bg-[#F6F1E6]'}`}
                  >
                    <td className="px-3.5 py-3">
                      <button type="button" className="text-left" onClick={() => setSelected(r.dare_id)}>
                        <b>{r.title}</b>
                        <span className="block text-[12.5px] text-[var(--muted)]">
                          {r.is_official ? 'CirclePact' : r.creator_username ? `by @${r.creator_username}` : ''} · {sentTo(r)}
                        </span>
                      </button>
                    </td>
                    <td className="px-3.5 py-3 font-bold">{r.open_reports}</td>
                    <td className="px-3.5 py-3">{reasons(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {item && <Detail item={item} status={status} onDone={() => void load()} />}
        </div>
      )}
    </>
  );
}

export default function ReportsPage() {
  return (
    <ConsoleFrame>
      <Reports />
    </ConsoleFrame>
  );
}
