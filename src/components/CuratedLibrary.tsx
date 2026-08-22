'use client';

import { useState } from 'react';
import { ArrowRight, Flame, Loader2, Sparkles, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCuratedContent } from '@/hooks/useCuratedContent';
import { useCircles } from '@/hooks/useCircles';
import { useDeployCuratedContent } from '@/hooks/useCuratedContent';
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
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 md:items-center md:p-4" onClick={onClose}>
    <div className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ready to deploy</p><h2 className="mt-1 text-xl font-bold">Send to a Circle</h2><p className="mt-1 text-sm text-muted-foreground">Choose where this {item.type} should live.</p></div><button onClick={onClose} className="text-2xl leading-none text-muted-foreground" aria-label="Close">×</button></div>
      <div className="flex flex-col gap-2">{circles.isLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div> : list.length ? list.map((circle: any) => <button key={circle.id} onClick={() => submit(circle.id)} disabled={deploy.isPending} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-left transition hover:border-primary/50"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-xl">{circle.icon_emoji || '◉'}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{circle.name}</span><span className="block text-xs text-muted-foreground">{circle.member_count ?? 0} members</span></span>{deploy.isPending ? <Loader2 className="animate-spin text-primary" /> : <ArrowRight className="text-muted-foreground" />}</button>) : <p className="py-8 text-center text-sm text-muted-foreground">Create a Circle first to send this ready {item.type}.</p>}</div>
    </div>
  </div>;
}

function TemplateCard({ item, onSend }: { item: CuratedContent; onSend: () => void }) {
  return <article className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{item.category}</span>{item.trending_until && new Date(item.trending_until) >= new Date() ? <span className="flex items-center gap-1 text-xs font-semibold text-orange-600"><Flame className="size-3.5" /> Trending</span> : null}</div><h2 className="mt-5 text-xl font-bold text-balance">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></div><div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4"><div className="text-xs text-muted-foreground">{item.duration_days ? `${item.duration_days} day${item.duration_days === 1 ? '' : 's'}` : 'Flexible'} · <span className="capitalize">{item.type}</span></div><button onClick={onSend} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Send to a Circle <ArrowRight className="size-4" /></button></div></article>;
}

export default function CuratedLibrary() {
  const [type, setType] = useState<'pact' | 'dare'>('pact');
  const [category, setCategory] = useState('all');
  const [trending, setTrending] = useState(false);
  const [selected, setSelected] = useState<CuratedContent | null>(null);
  const query = useCuratedContent({ type, category: category === 'all' ? undefined : category, trending: trending || undefined });
  const items = query.data?.items ?? [];
  return <main className="min-h-screen bg-background px-4 py-8 md:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-8"><header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" /> Ready for your next move</div><h1 className="mt-2 text-4xl font-bold tracking-tight text-balance">Curated Pacts</h1><p className="mt-2 max-w-xl text-muted-foreground">Ready-made challenges to help your Circle show up together.</p></div><div className="flex items-center gap-2 rounded-full border border-border bg-card p-1"><button onClick={() => setType('pact')} className={`rounded-full px-4 py-2 text-sm font-semibold ${type === 'pact' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Pacts</button><button onClick={() => setType('dare')} className={`rounded-full px-4 py-2 text-sm font-semibold ${type === 'dare' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Dares</button></div></header><div className="flex flex-wrap items-center gap-2"><div className="flex flex-wrap gap-2">{categories.map((value) => <button key={value} onClick={() => setCategory(value)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${category === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}>{value}</button>)}</div><button onClick={() => setTrending(!trending)} className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${trending ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-border bg-card text-muted-foreground'}`}><Flame className="size-3.5" /> Trending</button></div>{query.isLoading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary" /></div> : query.isError ? <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">Ready Pacts are taking a quick breather. Try again shortly.</div> : items.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <TemplateCard key={item.id} item={item} onSend={() => setSelected(item)} />)}</div> : <div className="rounded-3xl border border-dashed border-border p-12 text-center"><Users className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-bold">Nothing here yet</h2><p className="mt-1 text-sm text-muted-foreground">New ready-made challenges will appear here soon.</p></div>}{selected ? <SendToCircle item={selected} onClose={() => setSelected(null)} /> : null}</div></main>;
}
