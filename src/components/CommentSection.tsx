'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Heart, Loader, RotateCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { usePactComments } from '@/hooks/useFeedQueries';
import { queryKeys } from '@/lib/queryKeys';
import { socialService } from '@/services/api';
import UserAvatarLink from '@/components/UserAvatarLink';
import { parseApiDate } from '@/lib/dareCountdown';
import WatcherReportSheet from '@/components/WatcherReportSheet';

const INK = '#17181D';
const MUTED = '#5A5C63';
const NAVY = '#1F3A93';
const LIKE_RED = '#E11D48';
const LINE = '#DCD3C1';

export interface PactComment {
  id: number;
  user_id: number;
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  text: string;
  created_at?: string;
  parent_id?: number | null;
  like_count?: number;
  liked_by_me?: boolean;
  reply_count?: number;
  is_creator?: boolean;
  /** Creator only: this commenter paid to watch, so they can be reported. */
  reportable_watcher?: boolean;
  watcher_report_count?: number;
  can_report_again_at?: string | null;
  liked_by_preview?: { user_id: number; username: string; full_name?: string | null; avatar_url?: string | null } | null;
}

type Sort = 'top' | 'newest';
type ReplyTarget = { id: number; name: string; text: string };

/** "now", "5m", "3h", "2d", "3w": the short form people expect next to a comment. */
export function shortAgo(raw?: string): string {
  const at = parseApiDate(raw);
  if (!at) return '';
  const seconds = Math.max(0, (Date.now() - at.getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / (86400 * 7))}w`;
}

const nameOf = (c: Pick<PactComment, 'full_name' | 'username'>) => c.full_name || c.username || 'Someone';
const firstName = (value: string) => String(value || '').trim().split(/\s+/)[0] || 'them';

/** A leading @Name reads as a mention. */
function CommentText({ text }: { text: string }) {
  const match = text.match(/^(@\S+)(\s[\s\S]*)?$/);
  return (
    <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-[1.4]" style={{ color: INK }}>
      {match ? (
        <>
          <span className="font-extrabold" style={{ color: NAVY }}>{match[1]}</span>
          {match[2] ?? ''}
        </>
      ) : (
        text
      )}
    </p>
  );
}

function CommentRow({
  comment,
  pactId,
  me,
  small = false,
  highlighted,
  onReply,
  onChanged,
  onDeleted,
  likeOverride,
  onLike,
}: {
  comment: PactComment;
  pactId: number;
  me?: number;
  small?: boolean;
  highlighted: boolean;
  onReply: (comment: PactComment) => void;
  onChanged: () => void;
  onDeleted: (comment: PactComment) => void;
  likeOverride?: { liked: boolean; count: number };
  onLike: (comment: PactComment, next: boolean) => void;
}) {
  const own = me != null && comment.user_id === me;
  const name = own ? 'You' : nameOf(comment);
  const liked = likeOverride ? likeOverride.liked : Boolean(comment.liked_by_me);
  const count = likeOverride ? likeOverride.count : Number(comment.like_count ?? 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 3500);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    setDeleting(true);
    try {
      await socialService.deleteComment(pactId, comment.id);
      onDeleted(comment);
      onChanged();
    } catch {
      toast.error("Couldn't delete that. Try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const likedBy = own && comment.liked_by_preview ? comment.liked_by_preview : null;
  const [reportOpen, setReportOpen] = useState(false);
  const reportedAt = comment.watcher_report_count ?? 0;
  const againAt = comment.can_report_again_at ? parseApiDate(comment.can_report_again_at) : null;
  const reportLocked = reportedAt > 0 && againAt != null && againAt.getTime() > Date.now();

  return (
    <div
      id={`comment-${comment.id}`}
      className="flex items-start gap-3 rounded-[14px] px-2 py-2 transition-colors duration-700"
      style={{ background: highlighted ? '#E8ECF7' : 'transparent' }}
    >
      <div className="shrink-0 pt-0.5">
        <UserAvatarLink name={nameOf(comment)} avatarUrl={comment.avatar_url} username={comment.username} size={small ? 28 : 36} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-[14px] font-extrabold" style={{ color: INK }}>{name}</span>
          {comment.is_creator && (
            <span className="rounded-[6px] px-1.5 py-px text-[10.5px] font-extrabold tracking-[0.04em]" style={{ background: '#E8ECF7', color: NAVY }}>CREATOR</span>
          )}
          <span className="text-[13px]" style={{ color: MUTED }}>{shortAgo(comment.created_at)}</span>
        </div>
        <CommentText text={comment.text} />
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" onClick={() => onReply(comment)} className="-my-2 min-h-11 py-2 text-[13px] font-extrabold" style={{ color: MUTED }}>
            Reply
          </button>
          {own && (
            <button type="button" onClick={() => void remove()} disabled={deleting} className="-my-2 min-h-11 py-2 text-[13px] font-extrabold disabled:opacity-50" style={{ color: confirmDelete ? '#B3261E' : MUTED }}>
              {confirmDelete ? 'Tap again to delete' : 'Delete'}
            </button>
          )}
          {comment.reportable_watcher && !own && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              disabled={reportLocked}
              className="-my-2 min-h-11 py-2 text-[13px] font-extrabold disabled:opacity-60"
              style={{ color: reportLocked ? MUTED : '#B3261E' }}
            >
              {reportLocked ? 'Reported' : 'Report'}
            </button>
          )}
          {likedBy && (
            <span className="flex items-center gap-1.5 text-[13px]" style={{ color: MUTED }}>
              <UserAvatarLink name={nameOf(likedBy)} avatarUrl={likedBy.avatar_url} username={likedBy.username} size={16} />
              {firstName(nameOf(likedBy))} liked this
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onLike(comment, !liked)}
        aria-label={liked ? `Unlike, ${count}` : `Like, ${count}`}
        aria-pressed={liked}
        className="-mr-1 flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 transition active:scale-90"
      >
        <Heart className="size-[18px]" strokeWidth={2} fill={liked ? LIKE_RED : 'none'} style={{ color: liked ? LIKE_RED : MUTED }} />
        {count > 0 && <span className="text-[12px] font-extrabold" style={{ color: liked ? LIKE_RED : MUTED }}>{count}</span>}
      </button>
      {reportOpen && (
        <WatcherReportSheet
          pactId={pactId}
          watcherId={comment.user_id}
          watcherName={nameOf(comment)}
          isSecondReport={reportedAt > 0}
          onClose={() => setReportOpen(false)}
          onDone={onChanged}
        />
      )}
    </div>
  );
}

function Replies({
  pactId,
  parentId,
  me,
  highlightId,
  likeOverrides,
  onReply,
  onChanged,
  onDeleted,
  onLike,
}: {
  pactId: number;
  parentId: number;
  me?: number;
  highlightId: number | null;
  likeOverrides: Record<number, { liked: boolean; count: number }>;
  onReply: (comment: PactComment) => void;
  onChanged: () => void;
  onDeleted: (comment: PactComment) => void;
  onLike: (comment: PactComment, next: boolean) => void;
}) {
  const replies = useQuery({
    queryKey: [...queryKeys.pacts.comments(pactId), 'replies', parentId],
    queryFn: () => socialService.getReplies(pactId, parentId),
    staleTime: 1000 * 20,
  });
  if (replies.isLoading) return <p className="py-2 pl-14 text-[13px]" style={{ color: MUTED }}>Loading replies…</p>;
  if (replies.isError) {
    return (
      <button type="button" onClick={() => void replies.refetch()} className="py-2 pl-14 text-[13px] font-extrabold" style={{ color: NAVY }}>
        Couldn&apos;t load replies. Try again
      </button>
    );
  }
  return (
    <div className="ml-11 border-l pl-1" style={{ borderColor: LINE }}>
      {(replies.data?.rows ?? []).map((reply: PactComment) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          pactId={pactId}
          me={me}
          small
          highlighted={highlightId === reply.id}
          onReply={onReply}
          onChanged={onChanged}
          onDeleted={onDeleted}
          likeOverride={likeOverrides[reply.id]}
          onLike={onLike}
        />
      ))}
    </div>
  );
}

interface CommentSectionProps {
  pactId: number;
  /** What the pact says it has now. The section reports the new total as people add and delete. */
  initialCount: number;
  onCountChange?: (count: number) => void;
  /** A comment (or reply) to scroll to and highlight, from a notification. */
  focusCommentId?: number | null;
}

export default function CommentSection({ pactId, initialCount, onCountChange, focusCommentId = null }: CommentSectionProps) {
  const { user } = useAuthStore();
  const me = typeof user?.id === 'number' ? user.id : user?.id != null ? Number(user.id) : undefined;
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<Sort>('top');
  const query = usePactComments(pactId, sort);
  const startCount = useRef(initialCount);
  const net = useRef(0);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [likeOverrides, setLikeOverrides] = useState<Record<number, { liked: boolean; count: number }>>({});
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const comments = useMemo(
    () => (query.data?.pages ?? []).flatMap((page: any) => page.data ?? []) as PactComment[],
    [query.data],
  );
  const total = query.data?.pages?.[0]?.pagination?.total ?? comments.length;

  const report = useCallback(
    (delta: number) => {
      net.current += delta;
      onCountChange?.(Math.max(0, startCount.current + net.current));
    },
    [onCountChange],
  );
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.pacts.comments(pactId) });
  }, [queryClient, pactId]);

  // Land on the exact comment a notification was about. Runs once per link, not again when the sort changes.
  const focusStarted = useRef<number | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!focusCommentId || !query.isSuccess || focusStarted.current === focusCommentId) return;
    focusStarted.current = focusCommentId;
    (async () => {
      try {
        const target = (await socialService.getComment(pactId, focusCommentId)) as PactComment;
        if (!alive.current) return;
        if (target.parent_id) setExpanded((prev) => ({ ...prev, [target.parent_id as number]: true }));
        // Make sure the top-level comment holding it is on the page.
        const topId = target.parent_id ?? target.id;
        let result: typeof query.data | undefined = query.data;
        let more = query.hasNextPage;
        let guard = 0;
        while (guard++ < 15 && more && !(result?.pages ?? []).some((page: any) => (page.data ?? []).some((c: PactComment) => c.id === topId))) {
          const next = await query.fetchNextPage();
          result = next.data;
          more = next.hasNextPage;
          if (!alive.current) return;
        }
        setHighlightId(target.id);
      } catch {
        // The comment is gone; the list still opens.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCommentId, pactId, query.isSuccess]);

  // Scroll to the highlighted comment once it is on screen (a reply may still be loading), then fade the highlight.
  useEffect(() => {
    if (highlightId == null) return;
    let tries = 0;
    const poll = window.setInterval(() => {
      const el = document.getElementById(`comment-${highlightId}`);
      if (el || ++tries > 20) {
        window.clearInterval(poll);
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 150);
    const fade = window.setTimeout(() => setHighlightId(null), 3600);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(fade);
    };
  }, [highlightId]);

  const like = async (comment: PactComment, next: boolean) => {
    const previous = likeOverrides[comment.id] ?? { liked: Boolean(comment.liked_by_me), count: Number(comment.like_count ?? 0) };
    setLikeOverrides((prev) => ({ ...prev, [comment.id]: { liked: next, count: Math.max(0, previous.count + (next ? 1 : -1)) } }));
    try {
      const response = await (next ? socialService.likeComment(pactId, comment.id) : socialService.unlikeComment(pactId, comment.id));
      setLikeOverrides((prev) => ({ ...prev, [comment.id]: { liked: Boolean(response.data?.liked), count: Number(response.data?.like_count ?? 0) } }));
      await queryClient.invalidateQueries({ queryKey: queryKeys.pacts.comments(pactId) });
    } catch {
      setLikeOverrides((prev) => ({ ...prev, [comment.id]: previous }));
      toast.error("Couldn't save that like");
    } finally {
      setLikeOverrides((prev) => {
        const { [comment.id]: _gone, ...rest } = prev;
        return rest;
      });
    }
  };

  const startReply = (comment: PactComment) => {
    const name = comment.user_id === me ? 'You' : nameOf(comment);
    setReplyTo({ id: comment.id, name, text: comment.text });
    // Answering someone starts the message with their name, like the other apps.
    const mention = comment.user_id === me ? '' : `@${firstName(nameOf(comment))} `;
    setText(mention);
    window.setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(mention.length, mention.length);
    }, 50);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || posting) return;
    // A message that is only the @name is not a reply.
    if (replyTo && /^@\S+$/.test(body)) return;
    setPosting(true);
    try {
      const response = await socialService.addComment(pactId, body, replyTo?.id ?? null);
      const created = response.data as PactComment;
      report(1);
      setText('');
      const parent = created.parent_id ?? null;
      setReplyTo(null);
      if (parent) {
        setExpanded((prev) => ({ ...prev, [parent]: true }));
      } else if (sort === 'top') {
        // Your new comment goes first so you can see it.
        setSort('newest');
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.pacts.comments(pactId) });
      setHighlightId(created.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Couldn't post that. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const deleted = (comment: PactComment) => {
    // Taking a comment down takes its replies with it.
    report(-(1 + Number(comment.reply_count ?? 0)));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 px-5 pb-1 pt-1">
        {(['top', 'newest'] as Sort[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSort(value)}
            aria-pressed={sort === value}
            className="min-h-9 rounded-full px-3.5 text-[13px] font-extrabold"
            style={sort === value ? { background: INK, color: '#FFFFFF' } : { color: MUTED }}
          >
            {value === 'top' ? 'Top' : 'Newest'}
          </button>
        ))}
        <span className="ml-auto text-[13px] font-semibold" style={{ color: MUTED }}>
          {Math.max(0, startCount.current + net.current)} {Math.max(0, startCount.current + net.current) === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {query.isLoading ? (
          <p className="py-10 text-center text-[14px]" style={{ color: MUTED }}>Loading comments…</p>
        ) : query.isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="size-5" style={{ color: MUTED }} />
            <p className="text-[14px]" style={{ color: MUTED }}>Couldn&apos;t load the comments. Try again.</p>
            <button type="button" onClick={() => void query.refetch()} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-extrabold" style={{ border: `1px solid ${LINE}`, color: INK }}>
              <RotateCw className="size-3.5" /> Retry
            </button>
          </div>
        ) : comments.length === 0 ? (
          <p className="py-10 text-center text-[14px]" style={{ color: MUTED }}>No comments yet. Say something kind.</p>
        ) : (
          <>
            {comments.map((comment) => {
              const replies = Number(comment.reply_count ?? 0);
              const open = Boolean(expanded[comment.id]);
              return (
                <div key={comment.id}>
                  <CommentRow
                    comment={comment}
                    pactId={pactId}
                    me={me}
                    highlighted={highlightId === comment.id}
                    onReply={startReply}
                    onChanged={refresh}
                    onDeleted={deleted}
                    likeOverride={likeOverrides[comment.id]}
                    onLike={like}
                  />
                  {replies > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [comment.id]: !open }))}
                      className="ml-[60px] flex min-h-11 items-center gap-2 text-[13px] font-extrabold"
                      style={{ color: MUTED }}
                    >
                      <span className="h-px w-6" style={{ background: LINE }} aria-hidden="true" />
                      {open ? 'Hide replies' : `View ${replies} ${replies === 1 ? 'reply' : 'replies'}`}
                    </button>
                  )}
                  {open && (
                    <Replies
                      pactId={pactId}
                      parentId={comment.id}
                      me={me}
                      highlightId={highlightId}
                      likeOverrides={likeOverrides}
                      onReply={startReply}
                      onChanged={refresh}
                      onDeleted={deleted}
                      onLike={like}
                    />
                  )}
                </div>
              );
            })}
            {query.hasNextPage && (
              <button
                type="button"
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="mx-auto mt-2 flex min-h-11 items-center rounded-full px-4 text-[13px] font-extrabold disabled:opacity-60"
                style={{ border: `1px solid ${LINE}`, color: INK }}
              >
                {query.isFetchingNextPage ? 'Loading…' : `Show more · ${Math.max(0, total - comments.length)} left`}
              </button>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 border-t" style={{ borderColor: LINE, background: '#FBF8F1' }}>
        {replyTo && (
          <div className="flex items-center gap-3 px-5 pt-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-extrabold tracking-[0.08em]" style={{ color: MUTED }}>REPLYING TO {replyTo.name.toUpperCase()}</div>
              <div className="truncate text-[13.5px]" style={{ color: INK }}>{replyTo.text}</div>
            </div>
            <button type="button" onClick={() => { setReplyTo(null); setText(''); }} aria-label="Cancel reply" className="flex size-11 shrink-0 items-center justify-center" style={{ color: MUTED }}>
              <X className="size-[18px]" />
            </button>
          </div>
        )}
        <form onSubmit={submit} className="flex items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
          <UserAvatarLink name={user?.full_name || user?.username} avatarUrl={user?.avatar_url} size={34} />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={replyTo ? 'Add a reply' : 'Add a comment'}
            aria-label={replyTo ? 'Add a reply' : 'Add a comment'}
            maxLength={1000}
            className="h-11 min-w-0 flex-1 rounded-full px-4 text-[15px] focus:outline-none"
            style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, color: INK }}
            disabled={posting}
          />
          <button
            type="submit"
            disabled={posting || !text.trim() || Boolean(replyTo && /^@\S+$/.test(text.trim()))}
            className="flex min-h-11 min-w-11 items-center justify-center text-[15px] font-extrabold disabled:opacity-40"
            style={{ color: NAVY }}
          >
            {posting ? <Loader className="size-4 animate-spin" /> : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
