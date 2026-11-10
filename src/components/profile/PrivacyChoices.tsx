'use client';

import React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/services/api';

const INK = '#17181D';
const MUTED = '#5A5C63';
const LINE = '#DCD3C1';
const NAVY = '#1F3A93';

type Choices = { ads_sharing: boolean; ai_training: boolean };

function Switch({ on }: { on: boolean }) {
  return (
    <span className="relative h-7 w-12 shrink-0 rounded-full transition-colors" style={{ background: on ? NAVY : '#CFC7B6' }}>
      <span className="absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left]" style={{ left: on ? 22 : 2 }} />
    </span>
  );
}

/** Edit profile → Privacy choices. Both are opt-in and off by default. */
export default function PrivacyChoices() {
  const qc = useQueryClient();
  const { data } = useQuery<Choices>({
    queryKey: ['me', 'privacy'],
    queryFn: async () => (await api.get('/api/users/me/privacy')).data,
  });
  const save = useMutation({
    mutationFn: async (patch: Partial<Choices>) => (await api.put('/api/users/me/privacy', patch)).data as Choices,
    onMutate: async (patch) => {
      const before = qc.getQueryData<Choices>(['me', 'privacy']);
      if (before) qc.setQueryData(['me', 'privacy'], { ...before, ...patch });
      return { before };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.before) qc.setQueryData(['me', 'privacy'], ctx.before);
      toast.error('Could not save. Try again.');
    },
    onSuccess: (fresh) => qc.setQueryData(['me', 'privacy'], fresh),
  });

  const rows: { key: keyof Choices; title: string; on: string; off: string }[] = [
    {
      key: 'ads_sharing',
      title: 'Share my data with advertising partners',
      on: 'On: partners may use your profile and activity to show you ads.',
      off: 'Off: nothing is shared with advertisers.',
    },
    {
      key: 'ai_training',
      title: 'Use my posts to improve AI',
      on: 'On: your posts may help train AI that improves CirclePact.',
      off: 'Off: your posts won’t be used to train AI from now on.',
    },
  ];

  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Privacy choices</h2>
      <div className="overflow-hidden rounded-[18px]" style={{ background: 'var(--card)', border: `1px solid ${LINE}` }}>
        {rows.map((row, i) => {
          const value = data?.[row.key];
          return (
            <button
              key={row.key}
              type="button"
              role="switch"
              aria-checked={!!value}
              disabled={value === undefined || save.isPending}
              onClick={() => save.mutate({ [row.key]: !value })}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:opacity-60"
              style={i ? { borderTop: `1px solid ${LINE}` } : undefined}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold" style={{ color: INK }}>{row.title}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: MUTED }}>
                  {value === undefined ? ' ' : value ? row.on : row.off}
                </span>
              </span>
              <Switch on={!!value} />
            </button>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-[12px]" style={{ color: MUTED }}>
        Details in our <Link href="/privacy" className="font-semibold underline">Privacy Policy</Link>.
      </p>
    </section>
  );
}
