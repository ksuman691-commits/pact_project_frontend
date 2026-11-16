'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { consoleApi, errorText, type ContentItem, type ContentReason } from '@/lib/console/api';
import { ago, RED } from '@/components/console/ui';

type Status = 'open' | 'dismissed' | 'taken_down';

const REASON: Record<string, string> = {
  fake_or_ai: 'AI or fake',
  spam: 'Spam',
  offensive: 'Offensive',
  harmful: 'Harmful',
  scam: 'Scam',
  other: 'Other',
};

const TAKE_DOWN_REASONS: { key: ContentReason; label: string }[] = [
  { key: 'fake_or_ai', label: 'Fake or AI proof' },
  { key: 'spam', label: 'Spam or selling' },
  { key: 'offensive', label: 'Offensive' },
  { key: 'harmful', label: 'Harmful or dangerous' },
  { key: 'scam', label: 'Scam or fraud' },
  { key: 'other', label: 'Other' },
];

function reasons(item: ContentItem): string {
  const list = Object.entries(item.reasons)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${REASON[k] ?? k}${n > 1 ? ` ×${n}` : ''}`);
  return list.join(', ') || '–';
}

function byline(item: ContentItem): string {
  const who = item.owner_username ? `@${item.owner_username}` : 'someone';
  if (item.kind === 'pact') return `pact by ${who} · ${item.where}`;
  return `moment by ${who}${item.pact_title ? ` · in “${item.pact_title}”` : ''}`;
}

const key = (item: ContentItem) => `${item.kind}-${item.id}`;

function TakeDownDialog({ item, onClose, onDone }: { item: ContentItem; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState<ContentReason | null>(() => {
    const top = Object.entries(item.reasons).sort((a, b) => b[1] - a[1])[0]?.[0];
    return (TAKE_DOWN_REASONS.find((r) => r.key === top)?.key ?? null) as ContentReason | null;
  });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const what = item.kind === 'pact' ? 'pact' : 'moment';

  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await consoleApi.takeDown(item.kind, item.id, reason, note);
      toast.success(item.kind === 'pact' ? 'Pact taken down' : 'Moment taken down');
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(23,24,29,.45)] p-4" role="dialog" aria-modal="true" aria-labelledby="takedown-title">
      <div className="w-full max-w-[520px] rounded-[22px] bg-[var(--paper)] p-6 shadow-[0_20px_60px_rgba(0,0,0,.3)]">
        <h2 id="takedown-title" className="text-[22px] font-bold leading-tight tracking-[-0.03em]">
          Take down {item.kind === 'pact' ? `“${item.title}”` : 'this moment'}
        </h2>
        <p className="mt-1 text-[14px] leading-[1.45] text-[var(--muted)]">
          It disappears for everyone{item.kind === 'pact' ? ', including people watching' : ''}.{' '}
          {item.owner_username ? `@${item.owner_username}` : 'The owner'} can still see it, marked “Taken down”.
        </p>
        <div className="mt-4 text-[13px] font-bold">Why</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TAKE_DOWN_REASONS.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={reason === r.key}
              onClick={() => setReason(r.key)}
              className={`h-9 rounded-full px-3.5 text-[13.5px] font-bold ${reason === r.key ? 'bg-[var(--ink)] text-white' : 'border border-[var(--hairline)] bg-white'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-[13px] font-bold">Note to them (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 300))}
            rows={2}
            placeholder="What they did, in one line"
            className="mt-2 w-full resize-none rounded-[12px] border border-[var(--hairline)] bg-white px-3 py-2.5 text-[14.5px] outline-none focus:border-[var(--ink)]"
          />
        </label>
        <p className="mt-3 rounded-[12px] border border-[var(--hairline)] bg-white px-3 py-2.5 text-[13px] leading-[1.5] text-[var(--muted)]">
          They get a notification with the reason. Nothing is deleted, and you can restore it from <b className="text-[var(--ink)]">Taken down</b>.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <span className="mr-auto text-[12px] text-[#8A8C93]">Asks for your code.</span>
          <button type="button" onClick={onClose} className="h-11 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14.5px] font-bold">
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason || busy}
            onClick={() => void submit()}
            className="h-11 rounded-full px-4 text-[14.5px] font-bold text-white disabled:opacity-40"
            style={{ background: RED }}
          >
            {busy ? 'Taking down…' : `Take down ${what}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ item, status, onDone }: { item: ContentItem; status: Status; onDone: () => void }) {
  const [busy, setBusy] = useState<'dismiss' | 'restore' | null>(null);
  const [confirming, setConfirming] = useState(false);

  const act = async (what: 'dismiss' | 'restore') => {
    setBusy(what);
    try {
      if (what === 'dismiss') await consoleApi.dismissContent(item.kind, item.id);
      else await consoleApi.restore(item.kind, item.id);
      toast.success(what === 'dismiss' ? 'Reports dismissed' : 'Restored. Everyone can see it again.');
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const facts =
    item.kind === 'pact'
      ? [item.where === 'everyone' ? 'Everyone' : item.where, item.duration_days ? `${item.duration_days} days` : null, `${item.moments ?? 0} moments`]
      : [item.proof_type === 'video' ? 'Video' : 'Photo', item.posted_at ? `posted ${ago(item.posted_at)}` : null, item.where];

  return (
    <aside className="w-full rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] p-[18px] lg:w-[340px] lg:shrink-0">
      <div className="rounded-[14px] bg-[var(--navy)] p-3.5 text-white">
        <span className="text-[12px] opacity-75">
          {item.kind === 'pact' ? 'Pact' : 'Moment'}
          {item.owner_username ? ` by @${item.owner_username}` : ''}
        </span>
        <div className="mt-1 text-[20px] font-bold leading-tight tracking-[-0.02em]">{item.title}</div>
        {item.kind === 'moment' && item.pact_title && <div className="mt-0.5 text-[12.5px] opacity-80">In “{item.pact_title}”</div>}
        <div className="mt-1 text-[12.5px] opacity-80">{facts.filter(Boolean).join(' · ')}</div>
      </div>
      {item.photos.length > 0 && (
        <div className="mt-2.5 flex gap-1.5">
          {item.photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className={`${item.kind === 'moment' ? 'h-[180px] w-full' : 'h-[78px] w-[62px]'} rounded-[10px] bg-[#9AA3B8] object-cover`} />
          ))}
        </div>
      )}
      {item.reports > 0 && (
        <div className="mt-3 text-[13.5px] leading-[1.55]">
          <b>
            {item.reports} {item.reports === 1 ? 'report' : 'reports'}: {reasons(item)}
          </b>
          {item.notes.length > 0 && <p className="mt-0.5">{item.notes.map((n) => `“${n}”`).join(' · ')}</p>}
        </div>
      )}

      {status === 'open' && (
        <>
          <div className="mt-4 flex gap-2">
            <button type="button" disabled={busy != null} onClick={() => void act('dismiss')} className="h-11 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14.5px] font-bold disabled:opacity-40">
              {busy === 'dismiss' ? 'Dismissing…' : 'Dismiss'}
            </button>
            <button type="button" disabled={busy != null} onClick={() => setConfirming(true)} className="h-11 rounded-full px-4 text-[14.5px] font-bold text-white disabled:opacity-40" style={{ background: RED }}>
              Take down…
            </button>
          </div>
          <p className="mt-2 text-[12px] text-[#8A8C93]">Dismiss keeps it up and closes these reports.</p>
        </>
      )}
      {status === 'taken_down' && item.taken_down && (
        <>
          <div className="mt-3 rounded-[12px] border border-[#EBC3BF] bg-white px-3 py-2.5 text-[13.5px] leading-[1.5]">
            <b>Taken down {ago(item.taken_down.at)}</b>: {item.taken_down.reason_label}
            {item.taken_down.note && <span className="block text-[var(--muted)]">“{item.taken_down.note}”</span>}
          </div>
          <button type="button" disabled={busy != null} onClick={() => void act('restore')} className="mt-3 h-11 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14.5px] font-bold disabled:opacity-40">
            {busy === 'restore' ? 'Restoring…' : 'Restore'}
          </button>
          <p className="mt-2 text-[12px] text-[#8A8C93]">Restore asks for your code. They aren’t notified.</p>
        </>
      )}
      {status === 'dismissed' && <p className="mt-3 text-[13px] text-[var(--muted)]">Dismissed {ago(item.resolved_at)}.</p>}
      {confirming && (
        <TakeDownDialog
          item={item}
          onClose={() => setConfirming(false)}
          onDone={() => {
            setConfirming(false);
            onDone();
          }}
        />
      )}
    </aside>
  );
}

export default function ContentReports({ onCount }: { onCount?: (n: number) => void }) {
  const [status, setStatus] = useState<Status>('open');
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await consoleApi.contentReports(status);
      setItems(rows);
      if (status === 'open') onCount?.(rows.length);
      setSelected((current) => (rows.some((r) => key(r) === current) ? current : rows[0] ? key(rows[0]) : null));
    } catch (error) {
      toast.error(errorText(error, "Couldn't load reports. Try again."));
    }
  }, [status, onCount]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  const item = items?.find((r) => key(r) === selected) ?? null;
  const labels: Record<Status, string> = { open: 'Open', dismissed: 'Dismissed', taken_down: 'Taken down' };

  return (
    <>
      <div role="tablist" className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(labels) as Status[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={status === s}
            type="button"
            onClick={() => setStatus(s)}
            className={`flex h-[34px] items-center rounded-full px-3.5 text-[13.5px] font-bold ${status === s ? 'bg-[var(--ink)] text-white' : 'border border-[var(--hairline)] bg-white'}`}
          >
            {labels[s]}
            {s === 'open' && items && status === 'open' ? ` · ${items.length}` : ''}
          </button>
        ))}
      </div>
      {items === null ? (
        <div className="mt-4 h-[240px] animate-pulse rounded-[18px] bg-[var(--card)]" aria-busy="true" />
      ) : items.length === 0 ? (
        <div className="mt-3.5 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] px-5 py-8 text-center text-[14.5px] text-[var(--muted)]">
          {status === 'open' ? 'No pacts or moments reported right now.' : status === 'taken_down' ? 'Nothing taken down.' : 'Nothing dismissed yet.'}
        </div>
      ) : (
        <div className="mt-3.5 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
            <table className="w-full min-w-[440px] border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#F6F1E6] text-left text-[12px] font-semibold text-[var(--muted)]">
                  <th className="px-3.5 py-2.5">What</th>
                  <th className="px-3.5 py-2.5">Reports</th>
                  <th className="px-3.5 py-2.5">{status === 'taken_down' ? 'Taken down for' : 'Why'}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={key(r)} onClick={() => setSelected(key(r))} className={`cursor-pointer border-t border-[#E6DFD0] ${key(r) === selected ? 'bg-[#FFF6D6]' : 'hover:bg-[#F6F1E6]'}`}>
                    <td className="px-3.5 py-3">
                      <button type="button" className="text-left" onClick={() => setSelected(key(r))}>
                        <b>{r.title}</b>
                        <span className="block text-[12.5px] text-[var(--muted)]">{byline(r)}</span>
                      </button>
                    </td>
                    <td className="px-3.5 py-3 font-bold">{r.reports}</td>
                    <td className="px-3.5 py-3">{status === 'taken_down' ? r.taken_down?.reason_label : reasons(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {item && <Detail key={key(item)} item={item} status={status} onDone={() => void load()} />}
        </div>
      )}
    </>
  );
}
