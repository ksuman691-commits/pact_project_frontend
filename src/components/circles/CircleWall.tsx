'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';
import { circleWallService, type WallPost } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import WallPostCard from './WallPostCard';
import WallPostSheet, { wallKey } from './WallPostSheet';
import CongratsBar from './CongratsBar';

const INK = '#17181D';
const MUTED = '#5B5E6B';
const NAVY = '#1F3A93';
const LINE = '#DCD3C1';
const PAGE = 20;

type WrittenKind = 'note' | 'sprint' | 'shoutout' | 'ask';
const KINDS: { kind: WrittenKind; label: string; placeholder: string }[] = [
  { kind: 'sprint', label: 'Start a sprint', placeholder: '7 days, no sugar, from Monday. Who’s in?' },
  { kind: 'shoutout', label: 'Shout-out', placeholder: 'Big up to Ananya for 30 days straight' },
  { kind: 'ask', label: 'Ask', placeholder: 'Anyone have a good 5 km route?' },
];

type Page = { rows: WallPost[]; total: number };

/**
 * A circle's Wall: a box to post (a note, a sprint call, a shout-out, a question),
 * then everything happening in the circle, newest first. The app adds its own
 * updates (a pact kept, a new pact, a missed day) so the Wall is never empty.
 */
export default function CircleWall({
  circleId,
  circleName,
  renderFooter: renderFooterProp,
}: {
  circleId: number;
  circleName: string;
  /** Extra actions under a finished pact's update (Say congrats). */
  renderFooter?: (post: WallPost, update: (next: WallPost) => void) => React.ReactNode;
}) {
  const { user } = useAuthStore();
  const me = user?.id != null ? Number(user.id) : undefined;
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<WrittenKind>('note');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [linkedPost, setLinkedPost] = useState<WallPost | null>(null);

  const query = useInfiniteQuery({
    queryKey: wallKey(circleId),
    queryFn: ({ pageParam = 0 }) => circleWallService.list(circleId, pageParam, PAGE),
    getNextPageParam: (last: Page, pages: Page[]) => (last.rows.length === PAGE ? pages.length * PAGE : undefined),
    initialPageParam: 0,
    staleTime: 1000 * 30,
  });
  const posts = (query.data?.pages ?? []).flatMap((p) => p.rows);
  // Say congrats under a kept pact, unless the page asked for something else.
  const renderFooter =
    renderFooterProp ??
    ((post: WallPost, change: (next: WallPost) => void) =>
      post.kind === 'pact_kept' ? <CongratsBar post={post} circleId={circleId} me={me} onChange={change} /> : null);

  // "3 people congratulated you" links to /circles/{id}?kept={pactId}: open that update once the Wall is in.
  const [keptPact, setKeptPact] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = Number(new URL(window.location.href).searchParams.get('kept'));
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  });
  if (keptPact && query.isSuccess) {
    const found = posts.find((p) => p.kind === 'pact_kept' && p.pact?.id === keptPact);
    setKeptPact(null);
    if (found) setOpenId(found.id);
  }
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('kept')) return;
    url.searchParams.delete('kept');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, []);
  const opened = posts.find((p) => p.id === openId) ?? (linkedPost?.id === openId ? linkedPost : null);

  // A notification links to /circles/{id}?post={postId}: open that post.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const raw = Number(url.searchParams.get('post'));
    if (!Number.isFinite(raw) || raw <= 0) return;
    url.searchParams.delete('post');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    circleWallService
      .get(circleId, raw)
      .then((post) => {
        setLinkedPost(post);
        setOpenId(post.id);
      })
      .catch(() => undefined);
  }, [circleId]);

  /** Put a changed post (or remove a deleted one) in the cached Wall. */
  const update = (id: number, next: WallPost | null) => {
    queryClient.setQueryData<InfiniteData<Page>>(wallKey(circleId), (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              rows: next ? page.rows.map((r) => (r.id === id ? next : r)) : page.rows.filter((r) => r.id !== id),
            })),
          }
        : data,
    );
    if (linkedPost?.id === id) setLinkedPost(next);
    if (!next && openId === id) setOpenId(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const created = await circleWallService.create(circleId, kind, body);
      queryClient.setQueryData<InfiniteData<Page>>(wallKey(circleId), (data) =>
        data ? { ...data, pages: data.pages.map((page, i) => (i === 0 ? { ...page, rows: [created, ...page.rows] } : page)) } : data,
      );
      setText('');
      setKind('note');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Couldn't post that. Try again.");
    } finally {
      setPosting(false);
    }
  };

  const active = KINDS.find((k) => k.kind === kind);

  return (
    <section aria-label={`${circleName} wall`} className="flex flex-col gap-2.5">
      <form onSubmit={submit} className="rounded-[18px] p-3" style={{ background: '#FBF8F1', border: `1px solid ${LINE}` }}>
        <div className="flex items-center gap-2.5">
          <Avatar name={user?.full_name || user?.username || 'You'} avatarUrl={user?.avatar_url} size={30} />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder={active ? active.placeholder : 'Say something to the circle…'}
            aria-label="Post to the circle"
            disabled={posting}
            className="h-10 min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none"
            style={{ color: INK }}
          />
          {text.trim() && (
            <button type="submit" disabled={posting} className="flex min-h-10 min-w-11 items-center justify-center text-[15px] font-extrabold" style={{ color: NAVY }}>
              {posting ? <Loader className="size-4 animate-spin" /> : 'Post'}
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {KINDS.map((k) => {
            const on = kind === k.kind;
            return (
              <button
                key={k.kind}
                type="button"
                aria-pressed={on}
                onClick={() => setKind(on ? 'note' : k.kind)}
                className="h-[34px] rounded-full px-3 text-[13px] font-bold"
                style={on ? { background: NAVY, color: '#FFFFFF' } : { background: '#FFFFFF', border: `1px solid ${LINE}`, color: INK }}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </form>

      {query.isLoading ? (
        <p className="py-6 text-center text-[14px]" style={{ color: MUTED }}>Loading the wall…</p>
      ) : query.isError ? (
        <button type="button" onClick={() => void query.refetch()} className="py-6 text-center text-[14px] font-extrabold" style={{ color: NAVY }}>
          Couldn&apos;t load the wall. Tap to try again
        </button>
      ) : posts.length === 0 ? (
        <p className="px-1 py-4 text-[14px]" style={{ color: MUTED }}>Nothing here yet. Start a sprint or give someone a shout-out.</p>
      ) : (
        posts.map((post) => (
          <WallPostCard
            key={post.id}
            post={post}
            circleId={circleId}
            me={me}
            onOpen={() => setOpenId(post.id)}
            onChanged={(next) => update(post.id, next)}
            footer={renderFooter?.(post, (next) => update(post.id, next))}
          />
        ))
      )}
      {query.hasNextPage && (
        <button type="button" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage} className="mx-auto flex min-h-11 items-center rounded-full px-4 text-[13px] font-extrabold" style={{ border: `1px solid ${LINE}`, color: INK }}>
          {query.isFetchingNextPage ? 'Loading…' : 'Show more'}
        </button>
      )}

      <WallPostSheet
        circleId={circleId}
        post={opened}
        onClose={() => setOpenId(null)}
        onChanged={(next) => opened && update(opened.id, next)}
        footer={renderFooter ? (post) => renderFooter(post, (next) => update(post.id, next)) : undefined}
      />
    </section>
  );
}
