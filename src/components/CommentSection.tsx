'use client';

import React, { useMemo, useState } from 'react';
import { Loader, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { usePactComments } from '@/hooks/useFeedQueries';
import { useAddComment, useDeleteComment } from '@/hooks/usePactMutations';
import UserAvatarLink from '@/components/UserAvatarLink';

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
}

function CommentRow({ comment, pactId, currentUserId }: { comment: Comment; pactId: number; currentUserId?: number }) {
  const deleteMutation = useDeleteComment(pactId, comment.id);
  const isOwnComment = typeof currentUserId === 'number' && comment.user_id === currentUserId;
  const displayName = comment.username || comment.user || 'Someone';
  const avatarUrl = comment.avatar_url || comment.avatar || null;
  const timestamp = comment.timestamp || comment.created_at || 'just now';

  return (
    <div className="rounded-[24px] border border-white/5 p-4 transition hover:border-[var(--pact-hairline)] hover:bg-white/5">
      <div className="flex gap-3">
          <div className="flex-shrink-0">
            <UserAvatarLink name={displayName} avatarUrl={avatarUrl} username={comment.username} size={32} />
          </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--pact-text)]">{displayName}</p>
            {isOwnComment && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                className="text-[var(--pact-text-faint)] transition hover:text-[var(--pact-text)]"
                aria-label="Delete comment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-[var(--pact-text-dim)] break-words">{comment.text}</p>
          <p className="text-xs text-[var(--pact-text-faint)] mt-1">{timestamp}</p>
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({
  pactId,
}: CommentSectionProps) {
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const commentsQuery = usePactComments(pactId);
  const addCommentMutation = useAddComment(pactId);

  const comments = useMemo(
    () => (commentsQuery.data?.pages ?? []).flatMap((page: any) => page.data ?? []),
    [commentsQuery.data]
  );

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
    <div className="space-y-4 w-full">
      {/* Comment Input */}
      <form onSubmit={handleAddComment} className="border border-[var(--pact-hairline)] rounded-[24px] p-4 w-full">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <UserAvatarLink name={user?.username} avatarUrl={user?.avatar_url} size={32} />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent text-sm text-[var(--pact-text)] placeholder-[var(--pact-text-faint)] focus:outline-none"
              disabled={addCommentMutation.isPending}
            />
          </div>
          <button
            type="submit"
            disabled={addCommentMutation.isPending || !newComment.trim()}
            className="text-[var(--pact-violet)] hover:text-[var(--pact-pink)] disabled:text-[var(--pact-text-faint)] transition flex-shrink-0"
          >
            {addCommentMutation.isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 w-full">
        {commentsQuery.isLoading ? (
          <p className="text-sm text-[var(--pact-text-faint)] text-center py-8">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-[var(--pact-text-faint)] text-center py-8">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment: Comment) => (
            <CommentRow key={comment.id} comment={comment} pactId={pactId} currentUserId={user?.id} />
          ))
        )}
      </div>
    </div>
  );
}
