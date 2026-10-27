'use client';

import React from 'react';
import { Send, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import SparkRing from '@/components/dares/SparkRing';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { copyText } from '@/lib/circleInvite';

export default function SuccessStep({ onDone }: { onDone: () => void }) {
  const { createdDare, draft, reset } = useCreateDareFlow();
  const router = useRouter();
  const who = draft.recipients[0];
  const first = (who?.full_name || who?.username || 'them').replace(/^@/, '').split(' ')[0];
  const title = createdDare?.title || draft.title;

  // The other person only knows about the dare once they open the app, so
  // make it one tap to tell them.
  const tell = async () => {
    const text = `I dared you on CirclePact: "${title}". You have ${draft.respondByHours} hours to say yes.`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'A dare for you', text, url });
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
    if (await copyText(`${text} ${url}`)) toast.success('Copied. Paste it in your chat.');
  };

  return (
    <div className="pact-spring-pop flex flex-1 flex-col items-center justify-center text-center">
      <SparkRing size={196} tone="light" bolts={3} duration="22s" burst>
        <span className="flex size-full items-center justify-center rounded-full" style={{ background: '#17181D' }}>
          <Zap className="size-14" strokeWidth={2.2} fill="#FFD84D" color="#FFD84D" aria-hidden="true" />
        </span>
      </SparkRing>

      <h1 className="mt-8 text-[40px] font-extrabold leading-[1] tracking-[-0.045em] text-[var(--pact-text)] text-balance">Dare sent.</h1>
      <p className="mt-3 max-w-xs text-[16px] leading-[1.4] text-[var(--pact-text-dim)]">
        {first} has {draft.respondByHours} hours to say yes. Give them a nudge so they open it.
      </p>

      <div className="mt-10 flex w-full flex-col gap-3">
        <button type="button" onClick={() => void tell()} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--navy)] text-[16px] font-extrabold text-white">
          <Send className="size-4" strokeWidth={2.4} aria-hidden="true" />
          Tell {first}
        </button>
        <button
          type="button"
          onClick={() => {
            onDone();
            router.push(`/dares?tab=sent${createdDare?.id ? `&created=${createdDare.id}` : ''}`);
          }}
          className="h-[52px] w-full rounded-full border-[1.5px] border-[var(--pact-hairline)] text-[16px] font-extrabold text-[var(--pact-text)]"
        >
          See it in Sent
        </button>
        <button type="button" onClick={reset} className="h-11 text-[14px] font-semibold text-[var(--pact-text-dim)] underline underline-offset-4">
          Dare someone else
        </button>
      </div>
    </div>
  );
}
