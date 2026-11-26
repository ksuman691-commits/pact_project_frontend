'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import Avatar from '@/components/Avatar';
import { circleWallService, type WallPost } from '@/services/api';
import { useBackToClose } from '@/hooks/useBackToClose';
import { firstOf, personName } from './WallPostCard';
import { wallKey } from './WallPostSheet';

const NOTES = ['So proud of you', 'What’s next?', 'How did you stay on it?'];

/** "You, Priya, Karan and 9 others" */
function whoLine(post: WallPost, me?: number): string {
  const faces = post.congratulators ?? [];
  const names = faces.slice(0, 3).map((p) => (p.id === me ? 'You' : firstOf(p)));
  const others = Math.max(0, (post.congrats_count ?? 0) - names.length);
  if (others > 0) return `${names.join(', ')} and ${others} ${others === 1 ? 'other' : 'others'}`;
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** A short sheet: one-tap notes, or your own words. Notes are comments on the update. */
function NoteSheet({ post, circleId, onClose, onSent }: { post: WallPost; circleId: number; onClose: () => void; onSent: () => void }) {
  useBackToClose(true, onClose);
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const name = firstOf(post.subject);
  const send = async (body: string) => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await circleWallService.comment(circleId, post.id, body.trim());
      void queryClient.invalidateQueries({ queryKey: [...wallKey(circleId), 'comments', post.id] });
      onSent();
      toast.success(`Note sent to ${name}`);
      onClose();
    } catch {
      toast.error("Couldn't send that. Try again.");
      setSending(false);
    }
  };
  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/45">
      <button type="button" aria-label="Close" onClick={onClose} className="flex-1 cursor-default" />
      <div role="dialog" aria-label={`A note for ${name}`} className="mx-auto w-full max-w-md rounded-t-[24px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5" style={{ background: '#FBF8F1', color: '#17181D' }}>
        <div className="mx-auto h-[5px] w-10 rounded-full" style={{ background: '#D9D2C2' }} />
        <div className="mt-3 flex items-start">
          <div className="flex-1">
            <p className="text-[17px] font-extrabold">A note for {name}</p>
            <p className="text-[13px]" style={{ color: '#5B5E6B' }}>Tap one to send, or write your own.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 flex size-11 items-center justify-center"><X className="size-5" /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {NOTES.map((line) => (
            <button key={line} type="button" disabled={sending} onClick={() => void send(line)} className="h-10 rounded-full px-3.5 text-[14px] font-bold disabled:opacity-60" style={{ background: '#FFFFFF', border: '1px solid #DCD3C1' }}>
              {line}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void send(text); }} className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Write your own…" aria-label="Write your own note" className="h-11 min-w-0 flex-1 rounded-full px-4 text-[15px] focus:outline-none" style={{ background: '#FFFFFF', border: '1px solid #DCD3C1' }} />
          <button type="submit" disabled={sending || !text.trim()} className="flex h-11 min-w-[64px] items-center justify-center rounded-full px-4 text-[15px] font-extrabold text-white disabled:opacity-40" style={{ background: '#1F3A93' }}>
            {sending ? <Loader className="size-4 animate-spin" /> : 'Send'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Under a kept pact on the Wall. Congrats is one tap: your face joins the row and
 * the person gets one grouped notification. "Add a note" is optional. The person
 * who kept it sees "Thank everyone" instead, one tap.
 */
export default function CongratsBar({ post, circleId, me, onChange }: { post: WallPost; circleId: number; me?: number; onChange: (next: WallPost) => void }) {
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const isSubject = me != null && post.subject?.id === me;
  const count = post.congrats_count ?? 0;
  const faces = post.congratulators ?? [];

  const tap = async () => {
    if (busy) return;
    setBusy(true);
    // Show it straight away.
    const optimistic: WallPost = { ...post, congratulated_by_me: true, congrats_count: count + 1 };
    onChange(optimistic);
    try {
      const next = await circleWallService.congrats(circleId, post.id);
      onChange(next);
      toast(
        (t) => (
          <span className="flex items-center gap-3 text-[14px] font-bold">
            {firstOf(post.subject)} will see your congrats
            <button
              type="button"
              className="font-extrabold text-[#1F3A93]"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  onChange(await circleWallService.undoCongrats(circleId, post.id));
                } catch {
                  toast.error("Couldn't undo that.");
                }
              }}
            >
              Undo
            </button>
          </span>
        ),
        { duration: 4000 },
      );
    } catch (error: any) {
      onChange(post);
      toast.error(error?.response?.data?.detail || "Couldn't send that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const thank = async () => {
    setBusy(true);
    try {
      onChange(await circleWallService.thanks(circleId, post.id));
      toast.success(`Thanks sent to ${count} ${count === 1 ? 'person' : 'people'}`);
    } catch {
      toast.error("Couldn't send that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      {count > 0 && (
        <div className="flex items-center gap-2">
          <span className="flex">
            {faces.slice(0, 3).map((p, i) => (
              <span key={p.id} className="rounded-full" style={{ marginLeft: i ? -6 : 0, boxShadow: '0 0 0 2px #1F3A93' }}>
                <Avatar name={personName(p)} avatarUrl={p.avatar_url} size={24} />
              </span>
            ))}
          </span>
          <span className="text-[13px] font-bold" style={{ color: '#DCE3F7' }}>{whoLine(post, me)}</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        {isSubject ? (
          count > 0 &&
          (post.thanked ? (
            <span className="flex h-11 items-center gap-1.5 text-[14px] font-extrabold"><Check className="size-4" strokeWidth={3} aria-hidden="true" />You thanked everyone</span>
          ) : (
            <button type="button" onClick={() => void thank()} disabled={busy} className="h-11 rounded-full bg-white px-[18px] text-[14.5px] font-extrabold text-[#1F3A93] disabled:opacity-60">
              Thank everyone
            </button>
          ))
        ) : post.can_congrats && !post.congratulated_by_me ? (
          <button type="button" onClick={() => void tap()} disabled={busy} className="h-11 rounded-full bg-white px-[18px] text-[14.5px] font-extrabold text-[#1F3A93] transition active:scale-[0.96] disabled:opacity-60">
            Say congrats
          </button>
        ) : post.congratulated_by_me ? (
          <>
            <span className="flex h-11 items-center gap-1.5 rounded-full px-4 text-[14px] font-extrabold" style={{ background: 'rgba(255,255,255,0.16)' }}>
              <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              Congratulated
            </span>
            <button type="button" onClick={() => setNoteOpen(true)} className="h-11 px-1 text-[14px] font-bold underline underline-offset-[3px]">
              Add a note
            </button>
          </>
        ) : null}
      </div>
      {noteOpen && <NoteSheet post={post} circleId={circleId} onClose={() => setNoteOpen(false)} onSent={() => onChange({ ...post, comment_count: post.comment_count + 1 })} />}
    </div>
  );
}
