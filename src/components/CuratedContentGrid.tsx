'use client';

// Embeddable curated-content browser — the type ('pact' or 'dare') is fixed
// by whichever Discover tab renders this, unlike the old standalone
// /curated-pacts page which let the user toggle between both. That page and
// its Pact/Dare toggle are gone; this is the one place curated templates now
// live, folded into the Pacts and Dares pages' own Discover tabs instead of
// a separate bottom-nav destination.

import { useState } from 'react';
import { ArrowRight, Flame, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCuratedContent, useDeployCuratedContent } from '@/hooks/useCuratedContent';
import { useCircles } from '@/hooks/useCircles';
import type { CuratedContent } from '@/types';
import toast from 'react-hot-toast';

const categories = ['all', 'fitness', 'startup', 'habits', 'social', 'creator', 'study'];

function SendToCircle({ item, onClose }: { item: CuratedContent; onClose: () => void }) {
  const circles = useCircles();
  const deploy = useDeployCuratedContent();
  const router = useRouter();
  const list = circles.data ?? [];
  const submit = async (circleId: number) => {
    try {
      const result = await deploy.mutateAsync({ id: item.id, circleId });
      const createdId = result.data?.id ?? result.data?.resource?.id;
      toast.success(`${item.type === 'pact' ? 'Pact' : 'Dare'} sent to your circle`);
      onClose();
      if (createdId) router.push(`/${item.type}s/${createdId}`);
    } catch {
      toast.error('Could not send this to the circle yet. Please try again.');
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 md:items-center md:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ready to deploy</p>
            <h2 className="mt-1 text-xl font-bold">Send to a Circle</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose where this {item.type} should live.</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-muted-foreground" aria-label="Close">×</button>
        </div>
        <div className="flex flex-col gap-2">
          {circles.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : list.length ? (
            list.map((circle: any) => (
              <button
                key={circle.id}
                onClick={() => submit(circle.id)}
                disabled={deploy.isPending}
                className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-left transition hover:border-primary/50"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-xl">{circle.icon_emoji || '◉'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{circle.name}</span>
                  <span className="block text-xs text-muted-foreground">{circle.member_count ?? 0} members</span>
                </span>
                {deploy.isPending ? <Loader2 className="animate-spin text-primary" /> : <ArrowRight className="text-muted-foreground" />}
              </button>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Create a Circle first to send this ready {item.type}.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ item, onSend }: { item: CuratedContent; onSend: () => void }) {
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{item.category}</span>
          {item.trending_until && new Date(item.trending_until) >= new Date() ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-600"><Flame className="size-3.5" /> Trending</span>
          ) : null}
        </div>
        <h3 className="mt-5 text-xl font-bold text-balance">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-xs text-muted-foreground">
          {item.duration_days ? `${item.duration_days} day${item.duration_days === 1 ? '' : 's'}` : 'Flexible'}
        </div>
        <button
          onClick={onSend}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Send to a Circle <ArrowRight className="size-4" />
        </button>
      </div>
    </article>
  );
}

export default function CuratedContentGrid({ type }: { type: 'pact' | 'dare' }) {
  const [category, setCategory] = useState('all');
  const [trending, setTrending] = useState(false);
  const [selected, setSelected] = useState<CuratedContent | null>(null);
  const query = useCuratedContent({ type, category: category === 'all' ? undefined : category, trending: trending || undefined });
  const items = query.data?.items ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--pact-violet)' }}>
        <Sparkles className="size-4" /> Ready-made {type === 'pact' ? 'Pacts' : 'Dares'} for your Circle
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {categories.map((value) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${category === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          onClick={() => setTrending(!trending)}
          className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${trending ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-border bg-card text-muted-foreground'}`}
        >
          <Flame className="size-3.5" /> Trending
        </button>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
      ) : query.isError ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Couldn&apos;t load curated {type === 'pact' ? 'pacts' : 'dares'} right now. Please try again shortly.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No curated {type === 'pact' ? 'pacts' : 'dares'} available yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <TemplateCard key={item.id} item={item} onSend={() => setSelected(item)} />
          ))}
        </div>
      )}

      {selected && <SendToCircle item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
