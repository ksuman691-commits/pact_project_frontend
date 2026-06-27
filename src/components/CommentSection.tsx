'use client';

import React, { useState } from 'react';
import { Heart, Send, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface Comment {
  id: number;
  user: string;
  avatar?: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

interface CommentSectionProps {
  pactId: number;
  comments?: Comment[];
  onAddComment?: (pactId: number, text: string) => void;
}

export default function CommentSection({
  pactId,
  comments = [],
  onAddComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const comment: Comment = {
        id: Date.now(),
        user: 'You',
        text: newComment,
        timestamp: 'now',
        likes: 0,
        isLiked: false,
      };

      setLocalComments([comment, ...localComments]);
      onAddComment?.(pactId, newComment);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = (commentId: number) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    setLocalComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              likes: comment.likes + (likedComments.has(commentId) ? -1 : 1),
              isLiked: !likedComments.has(commentId),
            }
          : comment
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleAddComment} className="border border-gray-200 rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            U
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition flex-shrink-0"
          >
            {isSubmitting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {localComments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No comments yet. Be the first!</p>
        ) : (
          localComments.map(comment => (
            <div key={comment.id} className="hover:bg-gray-50 p-3 rounded-xl transition">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {comment.user[0]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{comment.user}</p>
                  <p className="text-sm text-gray-700 break-words">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{comment.timestamp}</p>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition flex-shrink-0"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      likedComments.has(comment.id) ? 'fill-current text-red-500' : ''
                    }`}
                  />
                  <span className="text-xs font-medium">{comment.likes}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
