'use client';

import { createPortal } from 'react-dom';
import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from '@/components/Avatar';
import { shortAgo } from '@/components/CommentSection';
import { circleWallService, type WallComment, type WallPost } from '@/services/api';
import { useBackToClose } from '@/hooks/useBackToClose';
import { useAuthStore } from '@/store/auth';
import WallPostCard, { firstOf, personName } from './WallPostCard';

const INK = '#17181D';
const MUTED = '#5B5E6B';
const NAVY = '#1F3A93';
const LINE = '#DCD3C1';

/** One tap starts a comment that fits the post; people can add to it before posting. */
const QUICK: Record<string, string[]> = {
  pact_kept: ['Congrats!', "What's next?", 'How did you stay on it?'],
  pact_ended: ['Proud of you', 'Go again?', 'You showed up'],
  sprint: ["What time?", 'Count me in next time', 'Love this'],
  missed: ['You got this', 'Back at it today?'],
  new_pact: ["Let's go", 'Can I join?'],
  ask: ['Good question', 'Same here'],
};

export const wallKey = (circleId: number) => ['circle-wall', circleId];

/** A Wall post opened: the post, its comments (one level of replies), and a box to answer. */
export default function WallPostSheet({
  circleId,
  post,
  onClose,
  onChanged,
  footer,
}: {
  circleId: number;
  post: WallPost | null;
  onClose: () => void;
  onChanged: (next: WallPost | null) => void;
  footer?: (post: WallPost) => React.ReactNode;
}) {
  const open = Boolean(post);
  useBackToClose(open, onClose);
  const { user } = useAuthStore();
  const me = user?.id != null ? Number(user.id) : undefined;
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<WallComment | null>(null);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const key = [...wallKey(circleId), 'comments', post?.id ?? 0];
  const comments = useQuery({
    queryKey: key,
    queryFn: () => circleWallService.comments(circleId, post!.id),
    enabled: open,
    staleTime: 1000 * 15,
  });
  const threads = useMemo(() => {
    const rows = comments.data ?? [];
    const top = rows.filter((c) => !c.parent_id);
    return top.map((c) => ({ comment: c, replies: rows.filter((r) => r.parent_id === c.id) }));
  }, [comments.data]);

  if (typeof document === 'undefined') return null;

  const startReply = (c: WallComment) => {
    setReplyTo(c);
    const mention = c.user?.id === me ? '' : `@${firstOf(c.user)} `;
    setText(mention);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!post || !body || posting || (replyTo && /^@\S+$/.test(body))) return;
    setPosting(true);
    try {
      await circleWallService.comment(circleId, post.id, body, replyTo?.id ?? null);
      setText('');
      setReplyTo(null);
      onChanged({ ...post, comment_count: post.comment_count + 1 });
      await queryClient.invalidateQueries({ queryKey: key });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Couldn't post that. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (c: WallComment, replies: number) => {
    if (!post) return;
    try {
      await circleWallService.deleteComment(circleId, post.id, c.id);
      onChanged({ ...post, comment_count: Math.max(0, post.comment_count - 1 - replies) });
      await queryClient.invalidateQueries({ queryKey: key });
    } catch {
      toast.error("Couldn't delete that. Try again.");
    }
  };

  const row = (c: WallComment, small: boolean, replies = 0) => (
    <div key={c.id} className="flex items-start gap-2.5 py-1.5">
      <Avatar name={personName(c.user)} avatarUrl={c.user?.avatar_url} size={small ? 26 : 32} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px]">
          <span className="font-extrabold" style={{ color: INK }}>{c.user?.id === me ? 'You' : personName(c.user)}</span>
          <span style={{ color: MUTED }}> · {shortAgo(c.created_at)}</span>
        </p>
        <p className="whitespace-pre-wrap break-words text-[14.5px] leading-[1.4]" style={{ color: INK }}>{c.text}</p>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => startReply(c)} className="-my-1.5 min-h-10 text-[12.5px] font-extrabold" style={{ color: MUTED }}>Reply</button>
          {c.can_delete && (
            <button type="button" onClick={() => void remove(c, replies)} aria-label="Delete comment" className="-my-1.5 flex min-h-10 items-center" style={{ color: MUTED }}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const chips = post ? QUICK[post.kind] ?? ['Love this', 'Same here'] : [];

  return createPortal(
    <AnimatePresence>
      {post && (
        <>
          <motion.button type="button" aria-label="Close" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] cursor-default bg-black/55" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[61] mx-auto flex h-[88dvh] max-w-md flex-col overflow-hidden rounded-t-[24px]"
            style={{ background: '#F4EFE4', color: INK }}
            role="dialog"
            aria-label="Post and comments"
          >
            <div className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full" style={{ background: '#D9D2C2' }} />
            <div className="flex shrink-0 items-center pl-5 pr-2 pt-1">
              <p className="flex-1 text-[17px] font-extrabold">{post.comment_count > 0 ? `${post.comment_count} ${post.comment_count === 1 ? 'comment' : 'comments'}` : 'Comments'}</p>
              <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center"><X className="size-[22px]" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              <WallPostCard post={post} circleId={circleId} me={me} onOpen={() => inputRef.current?.focus()} onChanged={onChanged} footer={footer?.(post)} />
              <div className="px-1 pt-3">
                {comments.isLoading ? (
                  <p className="py-6 text-center text-[14px]" style={{ color: MUTED }}>Loading…</p>
                ) : threads.length === 0 ? (
                  <p className="py-6 text-center text-[14px]" style={{ color: MUTED }}>Be the first to say something.</p>
                ) : (
                  threads.map(({ comment, replies }) => (
                    <div key={comment.id}>
                      {row(comment, false, replies.length)}
                      {replies.length > 0 && <div className="ml-10 border-l pl-2" style={{ borderColor: LINE }}>{replies.map((r) => row(r, true))}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="shrink-0 border-t" style={{ borderColor: LINE, background: '#FBF8F1' }}>
              {replyTo ? (
                <div className="flex items-center gap-2 px-5 pt-2">
                  <p className="min-w-0 flex-1 truncate text-[12px] font-extrabold tracking-[0.06em]" style={{ color: MUTED }}>REPLYING TO {firstOf(replyTo.user).toUpperCase()}</p>
                  <button type="button" onClick={() => { setReplyTo(null); setText(''); }} aria-label="Cancel reply" className="flex size-10 items-center justify-center" style={{ color: MUTED }}><X className="size-4" /></button>
                </div>
              ) : !text ? (
                <div className="flex gap-2 overflow-x-auto px-4 pt-2.5 [scrollbar-width:none]">
                  {chips.map((line) => (
                    <button key={line} type="button" onClick={() => { setText(`${line} `); window.setTimeout(() => inputRef.current?.focus(), 30); }} className="h-[34px] shrink-0 rounded-full px-3 text-[13px] font-bold" style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, color: INK }}>
                      {line}
                    </button>
                  ))}
                </div>
              ) : null}
              <form onSubmit={submit} className="flex items-center gap-2.5 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={post.subject && post.subject.id !== me ? `Say something to ${firstOf(post.subject)}…` : post.author && post.author.id !== me ? `Reply to ${firstOf(post.author)}…` : 'Add a comment…'}
                  aria-label="Add a comment"
                  maxLength={1000}
                  disabled={posting}
                  className="h-11 min-w-0 flex-1 rounded-full px-4 text-[15px] focus:outline-none"
                  style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, color: INK }}
                />
                <button type="submit" disabled={posting || !text.trim()} className="flex min-h-11 min-w-11 items-center justify-center text-[15px] font-extrabold disabled:opacity-40" style={{ color: NAVY }}>
                  {posting ? <Loader className="size-4 animate-spin" /> : 'Post'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
