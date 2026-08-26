'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader, RotateCw, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { usePactComments } from '@/hooks/useFeedQueries';
import { useAddComment, useDeleteComment } from '@/hooks/usePactMutations';
import UserAvatarLink from '@/components/UserAvatarLink';
import { formatRelativeTime, parseApiDate } from '@/lib/dareCountdown';

interface Comment {
  id: number;
  user_id?: number;
  username?: string;
  avatar_url?: string | null;
  user?: string;
  avatar?: string;
  text: string;
  timestamp?: string;
  created_at?: string;
  likes?: number;
  isLiked?: boolean;
}

interface CommentSectionProps {
  pactId: number;
  /** Reports the real total (from this component's own paginated query)
   * back to the caller — the feed/detail list endpoints don't serialize a
   * live comment count yet, so this is the only accurate source until
   * BACKEND_SPEC_COMMENT_COUNT.md ships. */
  onCountChange?: (count: number) => void;
}

// Chat bubble row — same data/mutations as before, just presented like a
// lightweight group chat: own messages align right in a violet-tinted
// bubble, everyone else's align left in a neutral surface bubble, with the
// avatar + name sitting just outside the bubble on the leading side.
function CommentRow({ comment, pactId, currentUserId }: { comment: Comment; pactId: number; currentUserId?: number }) {
  const deleteMutation = useDeleteComment(pactId, comment.id);
  const isOwnComment = typeof currentUserId === 'number' && comment.user_id === currentUserId;
  const displayName = comment.username || comment.user || 'Someone';
  const avatarUrl = comment.avatar_url || comment.avatar || null;
  // Comments only ever have a raw ISO/API timestamp (there's no separate
  // pre-formatted `timestamp` field coming from the backend today, but the
  // type keeps it as a fallback) — rendering that raw string verbatim
  // showed something like "2026-08-25T13:04:11.912000" in the chat instead
  // of a normal "5m ago" label. Route it through the same relative-time +
  // UTC-safe parsing used for dare deadlines elsewhere in the app.
  const rawTimestamp = comment.created_at || comment.timestamp;
  const parsedTimestamp = parseApiDate(rawTimestamp);
  const timestamp = parsedTimestamp ? formatRelativeTime(rawTimestamp) : rawTimestamp || 'just now';

  return (
    <div className={`flex items-start gap-2 ${isOwnComment ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0 pt-0.5">
        <UserAvatarLink name={displayName} avatarUrl={avatarUrl} username={comment.username} size={28} />
      </div>
      <div className={`min-w-0 max-w-[80%] ${isOwnComment ? 'items-end text-right' : 'items-start text-left'} flex flex-col`}>
        <div className="flex items-center gap-2 px-1">
          <p className="text-xs font-semibold text-[var(--pact-text-muted)]">{displayName}</p>
          {isOwnComment && (
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              className="text-[var(--pact-text-faint)] transition hover:text-[var(--pact-text)]"
              aria-label="Delete message"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <div
          className={`mt-1 break-words rounded-[18px] px-3.5 py-2 text-sm ${
            isOwnComment
              ? 'rounded-tr-sm bg-[var(--pact-violet)] text-white'
              : 'rounded-tl-sm bg-[var(--pact-surface-2)] text-[var(--pact-text)]'
          }`}
        >
          {comment.text}
        </div>
        <p
          className="mt-1 px-1 text-[10px] text-[var(--pact-text-faint)]"
          title={parsedTimestamp ? parsedTimestamp.toLocaleString() : undefined}
        >
          {timestamp}
        </p>
      </div>
    </div>
  );
}

export default function CommentSection({
  pactId,
  onCountChange,
}: CommentSectionProps) {
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const commentsQuery = usePactComments(pactId);
  const addCommentMutation = useAddComment(pactId);

  const comments = useMemo(
    () => (commentsQuery.data?.pages ?? []).flatMap((page: any) => page.data ?? []),
    [commentsQuery.data]
  );

  // `pagination.total` on the first page is the authoritative live count;
  // fall back to the loaded comment count so an optimistic add/delete still
  // reflects instantly instead of waiting on a refetch.
  const liveTotal = commentsQuery.data?.pages?.[0]?.pagination?.total ?? comments.length;

  useEffect(() => {
    if (!commentsQuery.isLoading) {
      onCountChange?.(liveTotal);
    }
  }, [liveTotal, commentsQuery.isLoading, onCountChange]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCommentMutation.mutateAsync(newComment.trim());
      setNewComment('');
    } catch {
      toast.error('Failed to post comment');
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Chat message list — same usePactComments/useAddComment/useDeleteComment
          data and mutations as before, just rendered as bubbles. */}
      <div className="flex w-full flex-col gap-3">
        {commentsQuery.isLoading ? (
          <p className="text-sm text-[var(--pact-text-faint)] text-center py-8">Loading chat...</p>
        ) : commentsQuery.isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="h-5 w-5 text-[var(--pact-text-faint)]" />
            <p className="text-sm text-[var(--pact-text-faint)]">
              Couldn&apos;t load the chat right now. Please try again.
            </p>
            <button
              type="button"
              onClick={() => commentsQuery.refetch()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pact-hairline)] px-4 py-1.5 text-xs font-semibold text-[var(--pact-text)] transition hover:bg-white/5"
            >
              <RotateCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-[var(--pact-text-faint)] text-center py-8">No messages yet. Say hi!</p>
        ) : (
          comments.map((comment: Comment) => (
            <CommentRow key={comment.id} comment={comment} pactId={pactId} currentUserId={user?.id} />
          ))
        )}
      </div>

      {/* Chat composer — same submit handler/mutation as the previous
          "Add a comment" input, restyled as a rounded pill message bar. */}
      <form onSubmit={handleAddComment} className="flex items-center gap-2 rounded-full border border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] px-3 py-2 w-full">
        <div className="flex-shrink-0">
          <UserAvatarLink name={user?.username} avatarUrl={user?.avatar_url} size={28} />
        </div>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Message the circle..."
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--pact-text)] placeholder-[var(--pact-text-faint)] focus:outline-none"
          disabled={addCommentMutation.isPending}
        />
        <button
          type="submit"
          disabled={addCommentMutation.isPending || !newComment.trim()}
          aria-label="Send message"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--pact-violet)] text-white transition disabled:bg-[var(--pact-surface)] disabled:text-[var(--pact-text-faint)]"
        >
          {addCommentMutation.isPending ? (
            <Loader className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>
    </div>
  );
}
