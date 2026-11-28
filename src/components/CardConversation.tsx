'use client';

import { Heart } from 'lucide-react';
import { type MomentQuestion } from '@/services/api';
import { useAuthStore } from '@/store/auth';
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
 * creator's reply, "View all N comments" and when the photo went up. Commenting happens in the sheet.
 */
export default function CardConversation({
  pactId,
  creatorName,
  creatorId,
  question,
  topComment,
  commentCount,
  onOpenComments,
  postedAgo,
}: {
  pactId: number;
  creatorName: string;
  creatorId?: number | null;
  question?: MomentQuestion | null;
  topComment?: CardTopComment | null;
  commentCount: number;
  onOpenComments: () => void;
  /** "1 hour ago": when the photo on screen went up, as the card's last line. */
  postedAgo?: string | null;
}) {
  const { user } = useAuthStore();
  const isCreator = user?.id != null && creatorId != null && Number(user.id) === Number(creatorId);
  const creatorFirst = creatorName.split(/\s+/)[0] || 'them';

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
      {commentCount > (topComment ? 1 : 0) && (
        <button type="button" onClick={onOpenComments} className="-my-1 flex min-h-9 items-center px-1 text-[13px] font-bold" style={{ color: MUTED }}>
          View all {commentCount} comments
        </button>
      )}

      {postedAgo && (
        <div className="px-1 pb-1 pt-1 text-[11.5px] font-medium" style={{ color: MUTED }}>
          {postedAgo}
        </div>
      )}
    </div>
  );
}
