'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, MessageCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';
import { shortAgo } from '@/components/CommentSection';
import { circleWallService, pactService, type WallPerson, type WallPost } from '@/services/api';
import { cleanTitle } from '@/lib/titleCase';

const INK = '#17181D';
const MUTED = '#5B5E6B';
const NAVY = '#1F3A93';

export const personName = (p?: WallPerson | null) => String(p?.full_name || p?.username || 'Someone');
export const firstOf = (p?: WallPerson | null) => personName(p).trim().split(/\s+/)[0] || 'Someone';

const KIND_LABEL: Record<string, string> = { sprint: 'Sprint call', shoutout: 'Shout-out', ask: 'Question', note: '' };

/** The row of day dots on a finished pact: posted, rest, missed. */
function DayDots({ posted, rest, total }: { posted: number; rest: number; total: number }) {
  if (!total || total > 60) return null;
  return (
    <div className="mt-2 flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="h-1.5 flex-1 rounded-[2px]" style={{ background: i < posted ? '#FF5A6E' : i < posted + rest ? '#F6C445' : 'rgba(255,255,255,0.25)' }} />
      ))}
    </div>
  );
}

/**
 * One item on a circle's Wall. The app's own updates (a pact kept, a new pact,
 * a missed day) and members' posts look different, but every one can be talked about.
 */
export default function WallPostCard({
  post,
  circleId,
  me,
  onOpen,
  onChanged,
  footer,
}: {
  post: WallPost;
  circleId: number;
  me?: number;
  onOpen: () => void;
  onChanged: (next: WallPost | null) => void;
  /** Extra actions under a finished pact (Say congrats lives here). */
  footer?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [nudged, setNudged] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ago = shortAgo(post.created_at);
  const comments = post.comment_count;
  const subjectIsMe = me != null && post.subject?.id === me;

  const talk = (
    <button type="button" onClick={onOpen} className="-my-1 flex min-h-11 items-center gap-1.5 text-[13.5px] font-extrabold" style={{ color: 'inherit' }}>
      <MessageCircle className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      {comments > 0 ? `${comments} ${comments === 1 ? 'comment' : 'comments'}` : 'Comment'}
    </button>
  );

  if (post.kind === 'pact_kept' || post.kind === 'pact_ended') {
    const kept = post.kind === 'pact_kept';
    const d = post.data || {};
    const who = subjectIsMe ? 'You' : firstOf(post.subject);
    return (
      <article className="rounded-[18px] p-4" style={kept ? { background: NAVY, color: '#FFFFFF' } : { background: '#FBF8F1', border: '1px solid #DCD3C1', color: INK }}>
        <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-[0.04em]" style={{ color: kept ? '#C9D4F2' : MUTED }}>
          {kept && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
          {kept ? 'Pact kept' : 'Pact ended'} · {ago}
        </p>
        <button type="button" onClick={onOpen} className="mt-1.5 block text-left text-[17px] font-extrabold leading-[1.25]">
          {kept ? `${who} kept` : `${who} got through ${d.days_posted ?? 0} of ${d.total_days ?? 0} days of`} &ldquo;{cleanTitle(post.pact?.title || 'a pact')}&rdquo;
        </button>
        {kept && <DayDots posted={Number(d.days_posted ?? 0)} rest={Number(d.rest_days ?? 0)} total={Number(d.total_days ?? 0)} />}
        <p className="mt-1.5 text-[13px] font-semibold" style={{ color: kept ? '#DCE3F7' : MUTED }}>
          {d.days_posted ?? 0} of {d.total_days ?? 0} days{Number(d.rest_days ?? 0) > 0 ? ` · ${d.rest_days} rest ${Number(d.rest_days) === 1 ? 'day' : 'days'}` : ''}
        </p>
        {footer && <div className="mt-3">{footer}</div>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ color: kept ? '#DCE3F7' : MUTED }}>
          {talk}
        </div>
      </article>
    );
  }

  if (post.kind === 'new_pact' || post.kind === 'missed') {
    const missed = post.kind === 'missed';
    const canNudge = missed && !subjectIsMe && post.pact && post.subject;
    const nudge = async () => {
      if (!post.pact || !post.subject) return;
      setNudged(true);
      try {
        await pactService.nudge(post.pact.id, post.subject.id);
      } catch (error: any) {
        setNudged(false);
        toast.error(error?.response?.data?.detail || "Couldn't send the nudge. Try again.");
      }
    };
    return (
      <article className="flex items-center gap-3 rounded-[18px] px-3.5 py-3" style={{ background: '#FBF8F1', border: '1px solid #DCD3C1', color: INK }}>
        <Avatar name={personName(post.subject)} avatarUrl={post.subject?.avatar_url} size={34} />
        <div className="min-w-0 flex-1 text-[14px] leading-[1.35]">
          <span className="font-extrabold">{subjectIsMe ? 'You' : firstOf(post.subject)}</span>{' '}
          {missed ? 'missed yesterday on ' : 'started '}
          {post.pact ? (
            <Link href={`/pacts/${post.pact.id}`} className="font-bold underline-offset-2 hover:underline">{cleanTitle(post.pact.title)}</Link>
          ) : 'a pact'}
          {!missed && post.data?.total_days ? ` · ${post.data.total_days} days` : ''}
          <span style={{ color: MUTED }}> · {ago}</span>
          <button type="button" onClick={onOpen} className="ml-2 text-[12.5px] font-extrabold" style={{ color: MUTED }}>
            {comments > 0 ? `${comments} ${comments === 1 ? 'comment' : 'comments'}` : 'Comment'}
          </button>
        </div>
        {canNudge && (
          <button type="button" onClick={() => void nudge()} disabled={nudged} className="h-9 shrink-0 rounded-full px-3.5 text-[13px] font-extrabold disabled:font-semibold" style={nudged ? { color: MUTED } : { border: `1.5px solid ${NAVY}`, color: NAVY }}>
            {nudged ? 'Nudged' : 'Nudge'}
          </button>
        )}
      </article>
    );
  }

  // Written by a member.
  const mine = me != null && post.author?.id === me;
  const join = async () => {
    setBusy(true);
    try {
      onChanged(post.joined_by_me ? await circleWallService.leave(circleId, post.id) : await circleWallService.join(circleId, post.id));
    } catch {
      toast.error("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    try {
      await circleWallService.remove(circleId, post.id);
      onChanged(null);
    } catch {
      toast.error("Couldn't delete that. Try again.");
      setBusy(false);
    }
  };
  return (
    <article className="rounded-[18px] px-3.5 py-3" style={{ background: '#FBF8F1', border: '1px solid #DCD3C1', color: INK }}>
      <div className="flex items-center gap-2">
        <Avatar name={personName(post.author)} avatarUrl={post.author?.avatar_url} size={30} />
        <p className="min-w-0 flex-1 truncate text-[13px]">
          <span className="font-extrabold">{mine ? 'You' : personName(post.author)}</span>
          <span style={{ color: MUTED }}>{KIND_LABEL[post.kind] ? ` · ${KIND_LABEL[post.kind]}` : ''} · {ago}</span>
        </p>
        {post.can_delete && (
          <button type="button" onClick={() => void remove()} disabled={busy} aria-label={confirmDelete ? 'Tap again to delete' : 'Delete post'} className="flex min-h-9 items-center gap-1 px-1 text-[12.5px] font-extrabold" style={{ color: confirmDelete ? '#B3261E' : MUTED }}>
            <Trash2 className="size-4" aria-hidden="true" />
            {confirmDelete && 'Delete?'}
          </button>
        )}
      </div>
      <button type="button" onClick={onOpen} className="mt-1.5 block w-full whitespace-pre-wrap break-words text-left text-[15px] font-semibold leading-[1.35]">
        {post.body}
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ color: '#3E4150' }}>
        {post.kind === 'sprint' && (
          <>
            <button
              type="button"
              onClick={() => void join()}
              disabled={busy}
              aria-pressed={post.joined_by_me}
              className="h-10 rounded-full px-4 text-[13.5px] font-extrabold disabled:opacity-60"
              style={post.joined_by_me ? { background: '#DCFCE7', color: '#166534' } : { background: INK, color: '#FFFFFF' }}
            >
              {post.joined_by_me ? "You're in" : "I'm in"}
            </button>
            {post.join_count > 0 && <span className="text-[13px] font-bold">{post.join_count} in so far</span>}
          </>
        )}
        {talk}
      </div>
    </article>
  );
}
