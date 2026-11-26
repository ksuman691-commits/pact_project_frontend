'use client';

import { useState } from 'react';
import { Heart, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { socialService, type MomentQuestion } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import UserAvatarLink from '@/components/UserAvatarLink';
import MomentQuestionCard from '@/components/MomentQuestionCard';

const INK = '#17181D';
const MUTED = '#5B5E6B';

type Person = { user_id: number; username: string; full_name?: string | null; avatar_url?: string | null };
export type CardTopComment = Person & {
  id: number;
  text: string;
  like_count?: number;
  is_creator?: boolean;
  creator_reply?: (Person & { id: number; text: string }) | null;
};

const first = (p: { full_name?: string | null; username?: string | null }) =>
  String(p.full_name || p.username || 'Someone').trim().split(/\s+/)[0];

/**
 * Under the photo on a feed card: the poster's question, the top comment with the
 * creator's reply, "View all N comments", and a box to comment without opening anything.
 */
export default function CardConversation({
  pactId,
  creatorName,
  creatorId,
  question,
  topComment,
  commentCount,
  onOpenComments,
  onCommented,
}: {
  pactId: number;
  creatorName: string;
  creatorId?: number | null;
  question?: MomentQuestion | null;
  topComment?: CardTopComment | null;
  commentCount: number;
  onOpenComments: () => void;
  onCommented: () => void;
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [mine, setMine] = useState<string[]>([]);
  const isCreator = user?.id != null && creatorId != null && Number(user.id) === Number(creatorId);
  const creatorFirst = creatorName.split(/\s+/)[0] || 'them';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      await socialService.addComment(pactId, body);
      setMine((prev) => [...prev, body]);
      setText('');
      onCommented();
      void queryClient.invalidateQueries({ queryKey: queryKeys.pacts.comments(pactId) });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Couldn't post that. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const reply = topComment?.creator_reply ?? null;

  return (
    <div className="px-3 pt-2.5" onClick={(event) => event.stopPropagation()}>
      {question && <MomentQuestionCard pactId={pactId} question={question} askerName={isCreator ? 'You' : creatorFirst} compact />}

      {topComment && (
        <div className="px-1 pt-2.5 text-[14px] leading-[1.35]" style={{ color: INK }}>
          <span className="font-extrabold">{Number(user?.id) === topComment.user_id ? 'You' : first(topComment)}</span>{' '}
          <span className="break-words">{topComment.text}</span>
          {Number(topComment.like_count ?? 0) > 0 && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-[12px] font-bold" style={{ color: MUTED }}>
              <Heart className="size-3" fill="#FF3B5C" color="#FF3B5C" aria-hidden="true" />
              {topComment.like_count}
            </span>
          )}
        </div>
      )}
      {reply && (
        <div className="px-1 pt-0.5 text-[13.5px] leading-[1.35]" style={{ color: '#3E4150' }}>
          <span className="font-extrabold" style={{ color: INK }}>{isCreator ? 'You' : first(reply)}</span>{' '}
          <span className="mr-1 inline-block rounded-[6px] bg-[#DCFCE7] px-1.5 text-[10.5px] font-extrabold text-[#166534] align-middle">Creator</span>
          <span className="break-words">{reply.text}</span>
        </div>
      )}
      {mine.map((line, index) => (
        <div key={index} className="px-1 pt-0.5 text-[14px] leading-[1.35]" style={{ color: INK }}>
          <span className="font-extrabold">You</span> <span className="break-words">{line}</span>
        </div>
      ))}
      {commentCount > (topComment ? 1 : 0) + mine.length && (
        <button type="button" onClick={onOpenComments} className="-my-1 flex min-h-9 items-center px-1 text-[13px] font-bold" style={{ color: MUTED }}>
          View all {commentCount} comments
        </button>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 pb-1 pt-2">
        <UserAvatarLink name={user?.full_name || user?.username} avatarUrl={user?.avatar_url} size={28} />
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={isCreator ? 'Reply to your circle…' : `Add a comment for ${creatorFirst}…`}
          aria-label="Add a comment"
          maxLength={1000}
          disabled={posting}
          className="h-10 min-w-0 flex-1 rounded-full px-3.5 text-[14px] focus:outline-none"
          style={{ background: '#FFFFFF', border: '1px solid rgba(23,24,29,0.14)', color: INK }}
        />
        {text.trim() && (
          <button type="submit" disabled={posting} className="flex min-h-10 min-w-11 items-center justify-center text-[14px] font-extrabold disabled:opacity-50" style={{ color: '#1F3A93' }}>
            {posting ? <Loader className="size-4 animate-spin" /> : 'Post'}
          </button>
        )}
      </form>
    </div>
  );
}
