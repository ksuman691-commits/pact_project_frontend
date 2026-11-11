'use client';

import React from 'react';
import { Link2, Send, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import LogoMark from '@/components/LogoMark';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { copyText } from '@/lib/circleInvite';

/** The dare is out: a full yellow screen, the dare as a ticket, and ways to tell them. */
export default function SuccessStep({ onDone }: { onDone: () => void }) {
  const { createdDare, draft, reset } = useCreateDareFlow();
  const router = useRouter();
  const who = draft.recipients[0];
  const sentTo = createdDare?.sentTo?.length ? createdDare.sentTo : [(who?.full_name || who?.username || 'them').replace(/^@/, '').split(' ')[0]];
  const failedFor = createdDare?.failedFor ?? [];
  const circle = createdDare?.circle;
  const many = sentTo.length > 1 || !!circle;
  const first = many ? 'them' : sentTo[0];
  const youOrCircle = circle ? `everyone in ${circle.name}` : 'you';
  const list = sentTo.length > 2 ? `${sentTo.slice(0, -1).join(', ')} and ${sentTo[sentTo.length - 1]}` : sentTo.join(' and ');
  const title = createdDare?.title || draft.title;
  const hours = `${draft.respondByHours} ${draft.respondByHours === 1 ? 'hour' : 'hours'}`;

  // They only know about the dare once they open the app, so make it one tap to tell them.
  const reward = draft.rewardAmount;
  const message = `I dared ${youOrCircle} on CirclePact: "${title}".${reward ? ` Do it and I'll pay you ₹${reward}.` : ''} You have ${hours} to say yes.`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const tell = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'A dare for you', text: message, url: origin });
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${origin}`)}`, '_blank', 'noopener');
  };
  const copy = async () => {
    if (await copyText(`${message} ${origin}`)) toast.success('Copied. Paste it in your chat.');
  };
  const seeSent = () => {
    onDone();
    router.push(`/dares?tab=sent${createdDare?.id ? `&created=${createdDare.id}` : ''}`);
  };

  return (
    <div className="pact-spring-pop fixed inset-0 z-10 flex flex-col overflow-y-auto bg-[var(--dare)] px-5 pb-8 pt-4 text-[var(--ink)]">
      <div className="flex items-center justify-between">
        <LogoMark size={20} />
        <button type="button" onClick={onDone} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-white">
          <X className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-7 flex flex-col items-center text-center">
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--ink)]">
          <Zap className="h-9 w-9 text-[var(--dare)]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-[48px] font-bold leading-none tracking-[-0.05em]">{many ? 'Dares sent.' : 'Dare sent.'}</h1>
        <p className="mt-2.5 max-w-[310px] text-[17px] font-medium leading-[1.4]">
          {circle ? `Everyone in ${circle.name} has ` : many ? `${list} each have ` : `${first} has `}
          <b>{hours}</b> to say yes. We&apos;ll tell you the moment they do.
        </p>
        {failedFor.length > 0 && <p className="mt-2 max-w-xs text-[14px] font-bold text-[#8E1B14]">Couldn&apos;t send to {failedFor.join(', ')}. Try them again.</p>}
      </div>

      <section className="mt-6 rounded-[22px] bg-[var(--ink)] px-4 py-3.5 text-white" aria-label="The dare you sent">
        <p className="flex items-center justify-between text-[13px] font-bold text-[var(--dare)]">
          I dare you
          {reward ? <span className="rounded-full bg-[var(--dare)] px-2.5 py-0.5 text-[var(--ink)]">for ₹{reward}</span> : null}
        </p>
        <p className="mt-1 text-[20px] font-bold leading-[1.15] tracking-[-0.02em]">{title}</p>
        <div className="my-3 h-px" style={{ background: 'repeating-linear-gradient(90deg, #46454D 0 6px, transparent 6px 12px)' }} />
        <ul className="space-y-2">
          {circle && (
            <li className="flex items-center gap-2.5">
              <Avatar name={circle.name} size={30} />
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{circle.name}</span>
              <span className="text-[13px] font-semibold" style={{ color: '#C9C8CF' }}>{circle.sent} {circle.sent === 1 ? 'dare' : 'dares'} sent</span>
            </li>
          )}
          {(draft.recipients.length ? draft.recipients : []).map((r) => {
            const name = (r.full_name || r.username).split(' ')[0];
            const failed = failedFor.includes(name);
            return (
              <li key={r.id} className="flex items-center gap-2.5">
                <Avatar name={r.full_name || r.username} avatarUrl={r.avatar_url} size={30} />
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{name}</span>
                <span className="text-[13px] font-semibold" style={{ color: failed ? '#FF8A80' : '#C9C8CF' }}>{failed ? 'Not sent' : 'Waiting for a yes'}</span>
              </li>
            );
          })}
        </ul>
        {reward ? <p className="mt-3 text-[12.5px] leading-[1.4]" style={{ color: '#C9C8CF' }}>You pay ₹{reward}{many ? ' to each person who does it' : ''} over UPI, only after you mark it done.</p> : null}
      </section>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <button type="button" onClick={() => void tell()} className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] text-[16px] font-bold text-white">
          <Send className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Tell {first}
        </button>
        <button type="button" onClick={() => void copy()} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--ink)] text-[16px] font-bold">
          <Link2 className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Copy message
        </button>
        <div className="flex justify-center gap-5 pt-1">
          <button type="button" onClick={seeSent} className="h-11 text-[15px] font-bold underline underline-offset-4">
            See it in Sent
          </button>
          <button type="button" onClick={reset} className="h-11 text-[15px] font-bold underline underline-offset-4">
            Dare someone else
          </button>
        </div>
      </div>
    </div>
  );
}
