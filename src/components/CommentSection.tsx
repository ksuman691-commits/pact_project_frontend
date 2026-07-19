'use client';

import React, { useMemo, useState } from 'react';
import { Loader, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { usePactComments } from '@/hooks/useFeedQueries';
import { useAddComment, useDeleteComment } from '@/hooks/usePactMutations';

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
    <div className="hover:bg-gray-50 p-4 rounded-xl transition border border-gray-100 hover:border-gray-200">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span>{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            {isOwnComment && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                className="text-gray-400 transition hover:text-gray-700"
                aria-label="Delete comment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 break-words">{comment.text}</p>
          <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
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
      <form onSubmit={handleAddComment} className="border border-gray-200 rounded-2xl p-4 w-full">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
              disabled={addCommentMutation.isPending}
            />
          </div>
          <button
            type="submit"
            disabled={addCommentMutation.isPending || !newComment.trim()}
            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition flex-shrink-0"
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
          <p className="text-sm text-gray-500 text-center py-8">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment: Comment) => (
            <CommentRow key={comment.id} comment={comment} pactId={pactId} currentUserId={user?.id} />
          ))
        )}
      </div>
    </div>
  );
}
