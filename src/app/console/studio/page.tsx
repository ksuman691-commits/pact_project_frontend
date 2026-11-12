'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, X } from 'lucide-react';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';
import NotYours from '@/components/console/NotYours';
import { consoleApi, errorText, type Draft, type Proof, type ScheduleDay } from '@/lib/console/api';

const RED = '#B3261E';

type Tab = 'schedule' | 'drafts' | 'approved';

/** "Sat 14 Nov" (or "Sat 14" without the month). */
function shortDay(iso: string, month = true): string {
  const date = new Date(`${iso}T00:00:00`);
  const weekday = date.toLocaleDateString('en-IN', { weekday: 'short' });
  const mon = date.toLocaleDateString('en-IN', { month: 'short' });
  return month ? `${weekday} ${date.getDate()} ${mon}` : `${weekday} ${date.getDate()}`;
}

function dayLabel(day: ScheduleDay): string {
  return day.today ? `Today · ${shortDay(day.date)}` : shortDay(day.date);
}

function ago(iso: string): string {
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function Pill({ children, bg, fg = '#fff' }: { children: React.ReactNode; bg: string; fg?: string }) {
  return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12px] font-bold" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

const STATE_PILL: Record<ScheduleDay['state'], [string, string, string]> = {
  live: ['Live now', '#2E8B57', '#fff'],
  scheduled: ['Scheduled', '#1F3A93', '#fff'],
  empty: ['Empty', '#F3D9D6', RED],
  ended: ['Ended', '#D9D6CF', '#5A5C63'],
  ended_early: ['Ended early', '#D9D6CF', '#5A5C63'],
  none: ['No dare', '#E6E1D6', '#8A8C93'],
};

function Button({
  children,
  kind = 'ink',
  small,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'ink' | 'yellow' | 'ghost' | 'red' | 'link'; small?: boolean }) {
  const style: Record<string, string> = {
    ink: 'bg-[var(--ink)] text-white',
    yellow: 'bg-[var(--dare)] text-[var(--ink)]',
    ghost: 'border border-[var(--hairline)] bg-white text-[var(--ink)]',
    red: 'bg-[#B3261E] text-white',
    link: 'text-[var(--navy)]',
  };
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-bold transition active:scale-[0.98] disabled:opacity-40 ${small ? 'h-8 px-3 text-[13px]' : 'h-11 px-4 text-[14.5px]'} ${style[kind]} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  );
}

function TabBar({ tab, setTab, counts, creator }: { tab: Tab; setTab: (t: Tab) => void; counts: { review: number; approved: number; mine: number }; creator: boolean }) {
  const items: [Tab, string][] = creator
    ? [
        ['drafts', `My drafts · ${counts.mine}`],
        ['approved', `Approved · ${counts.approved}`],
      ]
    : [
        ['schedule', 'Schedule'],
        ['drafts', `Drafts · ${counts.review} to review`],
        ['approved', `Approved · ${counts.approved}`],
      ];
  return (
    <div role="tablist" className="mt-5 flex flex-wrap gap-1.5">
      {items.map(([id, label]) => (
        <button
          key={id}
          role="tab"
          aria-selected={tab === id}
          type="button"
          onClick={() => setTab(id)}
          className={`flex h-[34px] items-center rounded-full px-3.5 text-[13.5px] font-bold ${tab === id ? 'bg-[var(--ink)] text-white' : 'border border-[var(--hairline)] bg-white'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- schedule */

function Schedule({ days, onPick, onChanged }: { days: ScheduleDay[]; onPick: (day: ScheduleDay) => void; onChanged: () => void }) {
  const [busy, setBusy] = useState<number | null>(null);
  const shown = days.filter((d) => d.state !== 'none');
  const upcoming = shown.filter((d) => !d.today && d.state !== 'ended' && d.state !== 'ended_early');
  const empty = upcoming.filter((d) => d.state === 'empty');
  const order = [...shown.filter((d) => d.today), ...upcoming, ...shown.filter((d) => !d.today && (d.state === 'ended' || d.state === 'ended_early')).reverse()];
  const emptyWeek = empty.filter((d) => (new Date(`${d.date}T00:00:00`).getTime() - Date.now()) / 86_400_000 < 7);

  const act = async (day: ScheduleDay, what: 'clear' | 'end') => {
    if (!day.dare_id) return;
    setBusy(day.dare_id);
    try {
      if (what === 'clear') {
        await consoleApi.clearDay(day.dare_id);
        toast.success(`${shortDay(day.date)} is empty now`);
      } else {
        await consoleApi.endEarly(day.dare_id);
        toast.success('Ended early');
      }
      onChanged();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {emptyWeek.length > 0 && (
        <div className="mt-3.5 rounded-[14px] border border-[#EBC3BF] bg-[#FBEAE8] px-3.5 py-3 text-[14px]">
          <b style={{ color: RED }}>
            {emptyWeek.length} empty {emptyWeek.length === 1 ? 'day' : 'days'}
          </b>{' '}
          in the next week ({emptyWeek.map((d) => shortDay(d.date, false)).join(', ')}). Empty days show no dare in the app.
        </div>
      )}
      <div className="mt-3.5 overflow-x-auto rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="bg-[#F6F1E6] text-left text-[12px] font-semibold text-[var(--muted)]">
              <th className="px-3.5 py-2.5">Day</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Dare</th>
              <th className="px-3.5 py-2.5">How it went</th>
              <th className="px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {order.map((day) => {
              const [label, bg, fg] = STATE_PILL[day.state];
              const ran = day.state === 'live' || day.state === 'ended' || day.state === 'ended_early';
              return (
                <tr key={day.date} className="border-t border-[#E6DFD0]">
                  <td className="w-[150px] whitespace-nowrap px-3.5 py-3 font-bold">{dayLabel(day)}</td>
                  <td className="w-[110px] px-3.5 py-3">
                    <Pill bg={bg} fg={fg}>
                      {label}
                    </Pill>
                  </td>
                  <td className="px-3.5 py-3">{day.title ?? <span className="text-[#8A8C93]">Nothing scheduled. The app shows no dare of the day.</span>}</td>
                  <td className="whitespace-nowrap px-3.5 py-3 text-[13px] text-[var(--muted)]">{ran ? `${day.joined} in · ${day.took} took it` : ''}</td>
                  <td className="whitespace-nowrap px-3.5 py-3 text-right">
                    {day.state === 'live' && (
                      <Button kind="ghost" small disabled={busy === day.dare_id} onClick={() => void act(day, 'end')}>
                        End early
                      </Button>
                    )}
                    {day.state === 'scheduled' && (
                      <span className="inline-flex gap-1">
                        <Button kind="ghost" small onClick={() => onPick(day)}>
                          Swap
                        </Button>
                        <Button kind="link" small disabled={busy === day.dare_id} onClick={() => void act(day, 'clear')}>
                          Clear
                        </Button>
                      </span>
                    )}
                    {day.state === 'empty' && (
                      <Button kind="yellow" small onClick={() => onPick(day)}>
                        Pick a dare
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-[12.5px] text-[var(--muted)]">
        Each dare is live 6 am to 6 am India time. Ending a live dare early asks for your authenticator code; people who already took it keep their proof.
      </p>
    </>
  );
}

function PickDialog({ day, approved, onClose, onDone }: { day: ScheduleDay; approved: Draft[]; onClose: () => void; onDone: () => void }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [byHand, setByHand] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proof, setProof] = useState<Proof>((day.verification_method as Proof) || 'photo');
  const [busy, setBusy] = useState(false);
  const free = approved.filter((d) => !d.used_on && d.title.toLowerCase().includes(query.trim().toLowerCase()));
  const swapping = day.state === 'scheduled' && day.dare_id != null;
  const ready = byHand ? title.trim().length > 2 : picked != null;

  const save = async () => {
    setBusy(true);
    const body = byHand ? { title: title.trim(), description: description.trim(), verification_method: proof } : { curated_content_id: picked!, verification_method: proof };
    try {
      if (swapping) await consoleApi.swapDay(day.dare_id!, body);
      else await consoleApi.scheduleDay({ live_on: day.date, ...body });
      toast.success(`${shortDay(day.date)} is set`);
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="pick-title">
      <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[22px] bg-[var(--paper)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="pick-title" className="text-[22px] font-bold tracking-[-0.03em]">
              {swapping ? `Swap the dare for ${shortDay(day.date)}` : `Pick a dare for ${shortDay(day.date)}`}
            </h2>
            <p className="mt-1 text-[14px] text-[var(--muted)]">{byHand ? 'Write it the way it will appear in the app.' : 'Only approved dares are listed. Each one is used once.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--muted)]">
            <X className="size-5" />
          </button>
        </div>

        {byHand ? (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-[13px] font-bold">Dare</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="mt-1.5 h-11 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 text-[14.5px]" />
            </label>
            <label className="block">
              <span className="text-[13px] font-bold">What counts</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1.5 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 py-2.5 text-[14.5px]" />
            </label>
          </div>
        ) : (
          <>
            <label className="mt-4 flex h-11 items-center gap-2 rounded-[12px] border border-[var(--hairline)] bg-white px-3">
              <Search className="size-4 text-[#8A8C93]" aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search approved dares" className="h-full flex-1 bg-transparent text-[14px] outline-none" />
            </label>
            <div className="mt-2.5 max-h-[300px] overflow-y-auto rounded-[14px] border border-[var(--hairline)] bg-[var(--card)]">
              {free.length === 0 && <p className="px-4 py-5 text-[14px] text-[var(--muted)]">No approved dares left. Approve a draft, or write one by hand.</p>}
              {free.map((d) => (
                <label key={d.id} className={`flex cursor-pointer items-center gap-3 border-b border-[#E6DFD0] px-3.5 py-3 last:border-b-0 ${picked === d.id ? 'bg-[#FFF6D6]' : ''}`}>
                  <input type="radio" name="pick" checked={picked === d.id} onChange={() => setPicked(d.id)} className="size-4 accent-[var(--ink)]" />
                  <span className="min-w-0 flex-1">
                    <b className="block text-[14.5px]">{d.title}</b>
                    <span className="block text-[12.5px] capitalize text-[var(--muted)]">
                      {d.category}
                      {d.created_by_name ? ` · ${d.created_by_name}` : ''}
                    </span>
                  </span>
                  {d.source === 'ai_generated' && <Pill bg="#E8EDFA" fg="#1F3A93">AI suggestion</Pill>}
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mt-3 flex items-center gap-2 text-[13.5px] text-[var(--muted)]">
          Proof:
          {(['photo', 'video'] as Proof[]).map((p) => (
            <button key={p} type="button" onClick={() => setProof(p)} className={`h-8 rounded-full px-3 font-bold capitalize ${proof === p ? 'bg-[var(--ink)] text-white' : 'border border-[var(--hairline)] bg-white text-[var(--ink)]'}`}>
              {p}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button kind="link" onClick={() => setByHand(!byHand)}>
            {byHand ? 'Pick an approved dare' : 'Write one by hand'}
          </Button>
          <span className="flex gap-2">
            <Button kind="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!ready || busy} onClick={() => void save()}>
              {busy ? 'Saving…' : swapping ? `Swap for ${shortDay(day.date)}` : `Schedule for ${shortDay(day.date)}`}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ drafts */

function RejectDialog({ draft, onClose, onDone }: { draft: Draft; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await consoleApi.reject(draft.id, reason.trim());
      toast.success('Rejected. The writer sees your reason.');
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-title">
      <div className="w-full max-w-[460px] rounded-[22px] bg-[var(--paper)] p-6 shadow-2xl">
        <h2 id="reject-title" className="text-[22px] font-bold tracking-[-0.03em]">
          Reject “{draft.title}”
        </h2>
        <p className="mt-1 text-[14px] text-[var(--muted)]">One line on why. {draft.created_by_name ?? 'The writer'} sees it on their draft.</p>
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          placeholder="Too close to last week's dare."
          className="mt-4 h-11 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 text-[14.5px]"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="red" disabled={reason.trim().length < 3 || busy} onClick={() => void submit()}>
            {busy ? 'Rejecting…' : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = ['fitness', 'health', 'mind', 'people', 'kindness', 'life', 'fun'];

function DraftEditor({ draft, onClose, onDone }: { draft: Draft | null; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState(draft?.title ?? '');
  const [description, setDescription] = useState(draft?.description ?? '');
  const [category, setCategory] = useState(draft?.category ?? 'fitness');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      if (draft) await consoleApi.editDraft(draft.id, { title: title.trim(), description: description.trim(), category });
      else await consoleApi.writeDraft({ title: title.trim(), description: description.trim(), category });
      toast.success(draft ? 'Draft saved' : 'Sent for review');
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-labelledby="draft-title">
      <div className="flex h-full w-full max-w-[460px] flex-col border-l border-[var(--hairline)] bg-[var(--paper)] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="draft-title" className="text-[22px] font-bold tracking-[-0.03em]">
            {draft ? 'Edit draft' : 'New draft'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-[var(--muted)]">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-[13.5px] text-[var(--muted)]">Write it the way it will appear in the app.</p>
        <label className="mt-4 block">
          <span className="text-[13px] font-bold">Dare</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Plank for 2 minutes" className="mt-1.5 h-11 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 text-[14.5px]" />
        </label>
        <label className="mt-3.5 block">
          <span className="text-[13px] font-bold">What counts</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="One unbroken plank, any form. Show the timer in the photo or video."
            className="mt-1.5 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 py-2.5 text-[14.5px]"
          />
        </label>
        <label className="mt-3.5 block">
          <span className="text-[13px] font-bold">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 h-11 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 text-[14.5px] capitalize">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 rounded-[12px] border border-[#F0DC8E] bg-[#FFF6D6] px-3 py-2.5 text-[13px] leading-[1.45]">
          Before you send: nothing dangerous, no food or fasting challenges, no money, no real people or brands.
        </div>
        <div className="mt-auto flex justify-end gap-2 pt-6">
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={title.trim().length < 3 || busy} onClick={() => void save()}>
            {busy ? 'Saving…' : draft ? 'Save' : 'Send for review'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DraftTable({ drafts, creator, approvedTab, onChanged, onEdit }: { drafts: Draft[]; creator: boolean; approvedTab: boolean; onChanged: () => void; onEdit: (d: Draft) => void }) {
  const [busy, setBusy] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<Draft | null>(null);
  const approve = async (d: Draft) => {
    setBusy(d.id);
    try {
      await consoleApi.approve(d.id);
      toast.success('Approved. Pick a day for it on Schedule.');
      onChanged();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(null);
    }
  };
  if (drafts.length === 0) {
    return (
      <div className="mt-3.5 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] px-5 py-8 text-center text-[14.5px] text-[var(--muted)]">
        {approvedTab ? 'Nothing approved yet.' : creator ? 'No drafts yet. Write your first one.' : 'Nothing waiting for review.'}
      </div>
    );
  }
  return (
    <>
      <div className="mt-3.5 overflow-x-auto rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="bg-[#F6F1E6] text-left text-[12px] font-semibold text-[var(--muted)]">
              <th className="px-3.5 py-2.5">{approvedTab ? 'Dare' : 'Draft'}</th>
              {!creator && <th className="px-3.5 py-2.5">By</th>}
              <th className="px-3.5 py-2.5">{creator || approvedTab ? 'Status' : 'Source'}</th>
              <th className="px-3.5 py-2.5">Written</th>
              <th className="px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {drafts.map((d) => (
              <tr key={d.id} className="border-t border-[#E6DFD0]">
                <td className="px-3.5 py-3">
                  <b>{d.title}</b>
                  <span className="block text-[12.5px] capitalize text-[var(--muted)]">{d.category}</span>
                  {d.status === 'rejected' && d.review_note && (
                    <span className="block text-[12.5px]" style={{ color: RED }}>
                      Rejected{d.reviewed_by_name ? ` by ${d.reviewed_by_name}` : ''}: “{d.review_note}”
                    </span>
                  )}
                </td>
                {!creator && <td className="px-3.5 py-3">{d.created_by_name ?? 'CirclePact'}</td>}
                <td className="px-3.5 py-3">
                  {creator || approvedTab ? (
                    d.status === 'draft' ? (
                      <Pill bg="#E8EDFA" fg="#1F3A93">Waiting for review</Pill>
                    ) : d.status === 'rejected' ? (
                      <Pill bg="#FBEAE8" fg={RED}>Rejected</Pill>
                    ) : d.used_on ? (
                      <Pill bg="#E6E1D6" fg="#5A5C63">On {shortDay(d.used_on)}</Pill>
                    ) : (
                      <Pill bg="#2E8B57">Ready to schedule</Pill>
                    )
                  ) : d.source === 'ai_generated' ? (
                    <Pill bg="#E8EDFA" fg="#1F3A93">AI suggestion</Pill>
                  ) : (
                    <Pill bg="#EEE8DA" fg="var(--ink)">Hand-written</Pill>
                  )}
                </td>
                <td className="whitespace-nowrap px-3.5 py-3 text-[var(--muted)]">{ago(d.created_at)}</td>
                <td className="whitespace-nowrap px-3.5 py-3 text-right">
                  {d.status === 'draft' && !creator && !d.mine && (
                    <span className="inline-flex gap-1">
                      <Button small disabled={busy === d.id} onClick={() => void approve(d)}>
                        Approve
                      </Button>
                      <Button kind="ghost" small onClick={() => setRejecting(d)}>
                        Reject
                      </Button>
                    </span>
                  )}
                  {d.status === 'draft' && d.mine && (
                    <span className="inline-flex items-center gap-2">
                      {!creator && <span className="text-[12.5px] text-[#8A8C93]">Yours: someone else approves</span>}
                      <Button kind="ghost" small onClick={() => onEdit(d)}>
                        Edit
                      </Button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rejecting && (
        <RejectDialog
          draft={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => {
            setRejecting(null);
            onChanged();
          }}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------- page */


function Studio() {
  const member = useConsoleMember();
  const creator = member?.role === 'creator';
  const [tab, setTab] = useState<Tab>('schedule');
  const [days, setDays] = useState<ScheduleDay[] | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [picking, setPicking] = useState<ScheduleDay | null>(null);
  const [editing, setEditing] = useState<Draft | null | 'new'>(null);

  useEffect(() => {
    if (creator) setTab('drafts');
  }, [creator]);

  const load = useCallback(async () => {
    if (member?.role === 'moderator') return;
    try {
      const [d, s] = await Promise.all([consoleApi.drafts(), creator ? Promise.resolve(null) : consoleApi.schedule()]);
      setDrafts(d);
      if (s) setDays(s);
    } catch (error) {
      toast.error(errorText(error, "Couldn't load the studio. Try again."));
    }
  }, [creator, member?.role]);

  useEffect(() => {
    if (member) void load();
  }, [member, load]);

  const review = useMemo(() => (drafts ?? []).filter((d) => d.status === 'draft'), [drafts]);
  const approved = useMemo(() => (drafts ?? []).filter((d) => d.status === 'approved'), [drafts]);
  const mine = useMemo(() => (drafts ?? []).filter((d) => d.status !== 'approved'), [drafts]);

  if (!member) return null;
  if (member.role === 'moderator') return <NotYours />;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-[-0.04em]">Dare studio</h1>
          <p className="mt-1 text-[14.5px] text-[var(--muted)]">
            {creator
              ? 'Your drafts. Staff review them and pick days.'
              : tab === 'schedule'
                ? 'The dare of the day: one CirclePact dare a day, live from 6 am India time.'
                : 'Creators write drafts. Staff approve them. Nobody approves their own.'}
          </p>
        </div>
        <Button kind={creator ? 'ink' : 'ghost'} onClick={() => setEditing('new')}>
          <Plus className="size-4" strokeWidth={2.6} /> New draft
        </Button>
      </div>

      <TabBar tab={tab} setTab={setTab} creator={creator} counts={{ review: review.length, approved: approved.length, mine: mine.length }} />

      {drafts === null ? (
        <div className="mt-4 h-[320px] animate-pulse rounded-[18px] bg-[var(--card)]" aria-busy="true" />
      ) : tab === 'schedule' && !creator ? (
        days && <Schedule days={days} onPick={setPicking} onChanged={() => void load()} />
      ) : tab === 'approved' ? (
        <DraftTable drafts={approved} creator={creator} approvedTab onChanged={() => void load()} onEdit={setEditing} />
      ) : (
        <DraftTable drafts={creator ? mine : review} creator={creator} approvedTab={false} onChanged={() => void load()} onEdit={setEditing} />
      )}

      {picking && (
        <PickDialog
          day={picking}
          approved={approved}
          onClose={() => setPicking(null)}
          onDone={() => {
            setPicking(null);
            void load();
          }}
        />
      )}
      {editing && (
        <DraftEditor
          draft={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </>
  );
}

export default function StudioPage() {
  return (
    <ConsoleFrame>
      <Studio />
    </ConsoleFrame>
  );
}
