'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';
import NotYours from '@/components/console/NotYours';
import { PageHeader, shortDate } from '@/components/console/ui';
import { consoleApi, errorText, type Announcement, type AnnouncementLink, type Audience, type AudienceSize } from '@/lib/console/api';

const LINKS: { key: AnnouncementLink; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'dares', label: 'Dares' },
  { key: 'discover', label: 'Discover' },
  { key: 'today', label: 'Today’s check-ins' },
  { key: 'circles', label: 'Circles' },
  { key: 'new_pact', label: 'Start a pact' },
];

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: 'everyone', label: 'Everyone' },
  { key: 'active_30', label: 'Active in the last 30 days' },
  { key: 'city', label: 'In a city' },
];

const fmt = (n: number) => n.toLocaleString('en-IN');

function audienceLine(a: Announcement): string {
  if (a.audience === 'city') return `People in ${a.city}`;
  return a.audience === 'everyone' ? 'Everyone' : 'People active in 30 days';
}

function PushPreview({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-[260px] rounded-[30px] bg-[#17181D] p-3.5">
      <div className="text-center text-[11px] text-[#C9C8CF]">9:41</div>
      <div className="mt-3.5 flex gap-2.5 rounded-[16px] bg-white/90 px-3 py-2.5">
        <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden className="shrink-0">
          <path fill="#E5363B" d="M256 256L300.45 3.89A256 256 0 1 0 465.7 109.16Z" />
        </svg>
        <div className="min-w-0 text-[12px] leading-[1.35] text-[var(--ink)]">
          <b>CirclePact</b> · now
          <br />
          <b className="break-words">{title || 'Title'}</b>
          <br />
          <span className="break-words">{message || 'Your message'}</span>
        </div>
      </div>
      <div className="mt-2.5 text-center text-[11px] text-[#8A8C93]">Push preview</div>
    </div>
  );
}

function Announcements() {
  const member = useConsoleMember();
  const allowed = member?.role === 'staff' || member?.role === 'owner';
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState<AnnouncementLink>('home');
  const [audience, setAudience] = useState<Audience>('active_30');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<{ city: string; people: number }[]>([]);
  const [size, setSize] = useState<AudienceSize | null>(null);
  const [history, setHistory] = useState<Announcement[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await consoleApi.announcements());
    } catch (error) {
      toast.error(errorText(error, "Couldn't load announcements."));
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    void loadHistory();
    consoleApi.cities().then(setCities).catch(() => setCities([]));
  }, [allowed, loadHistory]);

  useEffect(() => {
    if (!allowed) return;
    if (audience === 'city' && !city) {
      setSize(null);
      return;
    }
    let live = true;
    consoleApi
      .audienceSize(audience, audience === 'city' ? city : undefined)
      .then((s) => live && setSize(s))
      .catch(() => live && setSize(null));
    return () => {
      live = false;
    };
  }, [allowed, audience, city]);

  if (!member) return null;
  if (!allowed) return <NotYours />;

  const ready = title.trim().length >= 3 && message.trim().length >= 3 && (audience !== 'city' || !!city) && (size?.in_app ?? 0) > 0;

  const send = async () => {
    setBusy(true);
    try {
      const sent = await consoleApi.sendAnnouncement({ title: title.trim(), message: message.trim(), link, audience, ...(audience === 'city' ? { city } : {}) });
      toast.success(`Sent to ${fmt(sent.in_app)} people`);
      setTitle('');
      setMessage('');
      setConfirming(false);
      void loadHistory();
      consoleApi.audienceSize(audience, audience === 'city' ? city : undefined).then(setSize).catch(() => undefined);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const input = 'mt-1.5 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 py-2.5 text-[14.5px] outline-none focus:border-[var(--ink)]';

  return (
    <>
      <PageHeader title="Announcements" sub="Tell people something in the app and, if they allow it, as a push notification." />
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] p-[18px]">
          <label className="block">
            <span className="text-[13px] font-bold">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="Dare of the day is back at 6 am" className={input} />
          </label>
          <label className="mt-3 block">
            <span className="text-[13px] font-bold">Message</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 240))} rows={2} placeholder="One or two short lines" className={`${input} resize-none`} />
            <span className="mt-0.5 block text-right text-[11.5px] text-[#8A8C93]">{message.length}/240</span>
          </label>
          <label className="mt-1 block">
            <span className="text-[13px] font-bold">Opens</span>
            <select value={link} onChange={(e) => setLink(e.target.value as AnnouncementLink)} className={input}>
              {LINKS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="mt-3.5">
            <legend className="text-[13px] font-bold">Who gets it</legend>
            {AUDIENCES.map((a) => (
              <label key={a.key} className={`mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-[12px] bg-white px-3 py-2.5 ${audience === a.key ? 'border-2 border-[var(--ink)]' : 'border border-[var(--hairline)]'}`}>
                <input type="radio" name="audience" checked={audience === a.key} onChange={() => setAudience(a.key)} className="accent-[var(--ink)]" />
                <b className="flex-1 text-[14px]">{a.label}</b>
                {audience === a.key && size && <span className="text-[12.5px] text-[var(--muted)]">{fmt(size.people)} people</span>}
              </label>
            ))}
            {audience === 'city' && (
              <select value={city} onChange={(e) => setCity(e.target.value)} className={input} aria-label="City">
                <option value="">Pick a city</option>
                {cities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city} ({fmt(c.people)})
                  </option>
                ))}
              </select>
            )}
          </fieldset>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12.5px] text-[var(--muted)]">
              {size
                ? `In-app for ${fmt(size.in_app)} · push for the ${fmt(size.push)} who allow it${size.skipped ? ` · ${fmt(size.skipped)} already had one today` : ''}`
                : audience === 'city' && !city
                  ? 'Pick a city to see how many people get it.'
                  : '…'}
            </span>
            <button type="button" disabled={!ready} onClick={() => setConfirming(true)} className="h-11 rounded-full bg-[var(--ink)] px-4 text-[14.5px] font-bold text-white disabled:opacity-40">
              Send to {fmt(size?.in_app ?? 0)} people…
            </button>
          </div>
        </div>
        <div className="flex justify-center lg:block">
          <PushPreview title={title} message={message} />
        </div>
      </div>

      <div className="mt-6 text-[13px] font-bold text-[var(--muted)]">Sent before</div>
      {history === null ? (
        <div className="mt-2 h-[120px] animate-pulse rounded-[18px] bg-[var(--card)]" />
      ) : history.length === 0 ? (
        <div className="mt-2 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] px-5 py-6 text-center text-[14px] text-[var(--muted)]">Nothing sent yet.</div>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
          <table className="w-full min-w-[520px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-[#F6F1E6] text-left text-[12px] font-semibold text-[var(--muted)]">
                <th className="px-3.5 py-2.5">Announcement</th>
                <th className="px-3.5 py-2.5">Sent</th>
                <th className="px-3.5 py-2.5">Reach</th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => (
                <tr key={a.id} className="border-t border-[#E6DFD0]">
                  <td className="px-3.5 py-3">
                    <b>{a.title}</b>
                    <span className="block text-[12.5px] text-[var(--muted)]">
                      {audienceLine(a)} · by {a.sent_by}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-[var(--muted)]">{shortDate(a.created_at)}</td>
                  <td className="px-3.5 py-3 text-[13px] text-[var(--muted)]">
                    {fmt(a.in_app)} sent · {fmt(a.pushed)} pushed · {fmt(a.opened)} opened
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2.5 text-[12.5px] text-[var(--muted)]">
        Sending asks for your authenticator code. At most one announcement a day reaches the same person, so pushes never pile up.
      </p>

      {confirming && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(23,24,29,.45)] p-4" role="dialog" aria-modal="true" aria-labelledby="send-title">
          <div className="w-full max-w-[440px] rounded-[22px] bg-[var(--paper)] p-6">
            <h2 id="send-title" className="text-[22px] font-bold tracking-[-0.03em]">
              Send to {fmt(size?.in_app ?? 0)} people?
            </h2>
            <p className="mt-1 text-[14px] leading-[1.45] text-[var(--muted)]">
              “{title.trim()}” goes to their notifications now, and as a push to the {fmt(size?.push ?? 0)} who allow it. It can’t be taken back.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="h-11 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14.5px] font-bold">
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={() => void send()} className="h-11 rounded-full bg-[var(--ink)] px-4 text-[14.5px] font-bold text-white disabled:opacity-40">
                {busy ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AnnouncementsPage() {
  return (
    <ConsoleFrame>
      <Announcements />
    </ConsoleFrame>
  );
}
