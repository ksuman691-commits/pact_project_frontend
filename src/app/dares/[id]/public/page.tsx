'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCheck, Zap } from 'lucide-react';
import { darePublicShareService, type DarePublicShare } from '@/services/darePublicShareService';
import LogoMark from '@/components/LogoMark';
import LogoSpinner from '@/components/LogoSpinner';
import { formatRelativeTime } from '@/lib/dareCountdown';

/**
 * Public, no-login landing page for a shared dare proof — reachable via the
 * "Share" action on the dare detail page (see DareShareSheet). Mirrors
 * CirclePublicWallPage's shape exactly: no useRequireAuth/DetailPageHeader
 * (this must render fully for a signed-out visitor, never redirect), all
 * data through the unauthenticated darePublicShareService hitting
 * GET /api/dares/{id}/public — see BACKEND_SPEC_DARE_PUBLIC_SHARE.md.
 */
export default function DarePublicSharePage() {
  const params = useParams();
  const dareId = Number(params.id);

  const [share, setShare] = useState<DarePublicShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await darePublicShareService.getPublicShare(dareId);
      if (!active) return;
      setShare(result);
      setNotFound(!result);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [dareId]);

  return (
    <main className="min-h-screen bg-[var(--pact-bg)] text-[var(--pact-text)]">
      <TopBar />

      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <LogoSpinner size={32} color="var(--pact-violet)" />
        </div>
      ) : notFound ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
          <Zap className="h-10 w-10 text-[var(--pact-text-faint)]" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-4 text-lg font-bold">Dare not found</p>
          <p className="mt-2 max-w-sm text-sm text-[var(--pact-text-muted)]">
            This dare hasn&apos;t been completed yet, or the link is no longer valid.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl px-5 pb-20 pt-8">
          <ProofHero share={share!} />
          <CreatorRow share={share!} />
          <BottomCta />
        </div>
      )}
    </main>
  );
}

function TopBar() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--pact-hairline)]"
      style={{ background: 'var(--pact-bg)' }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoMark size={30} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold lowercase tracking-[-0.03em]">pact</p>
            <p className="hidden truncate text-[0.68rem] text-[var(--pact-text-faint)] sm:block">
              Real goals. Real proof. Real people.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/auth/login"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--pact-text-muted)] transition hover:text-[var(--pact-text)]"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full px-4 py-2 text-sm font-bold text-white transition"
            style={{ background: 'var(--pact-violet)' }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProofHero({ share }: { share: DarePublicShare }) {
  const hasPhoto = Boolean(share.proof_url) && share.proof_type !== 'video';
  return (
    <header className="pb-6">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--pact-violet)]">Dare completed</p>
      <h1 className="mt-2 text-balance text-3xl font-black tracking-[-0.05em] text-[var(--pact-text)]">{share.title}</h1>
      {share.description && (
        <p className="mt-2 text-pretty text-sm leading-relaxed text-[var(--pact-text-muted)]">{share.description}</p>
      )}

      {hasPhoto ? (
        <div className="relative mt-5 aspect-[4/5] w-full overflow-hidden rounded-[28px] sm:aspect-[16/9]">
          <Image
            src={share.proof_url as string}
            alt={`Proof for ${share.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            crossOrigin="anonymous"
          />
          <span
            className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: 'var(--pact-mint)' }}
          >
            <CheckCheck className="h-2.5 w-2.5" />
            Completed
          </span>
        </div>
      ) : (
        <div
          className="mt-5 flex aspect-[16/9] w-full items-center justify-center rounded-[28px]"
          style={{ background: 'var(--pact-surface)' }}
        >
          <Zap className="h-10 w-10 text-[var(--pact-text-faint)]" strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}

      {share.caption && (
        <p className="mt-4 text-pretty text-sm italic text-[var(--pact-text-dim)]">&ldquo;{share.caption}&rdquo;</p>
      )}
    </header>
  );
}

function CreatorRow({ share }: { share: DarePublicShare }) {
  // No auth context exists on this page (signed-out visitors land here
  // directly), so there's no "You" case to special-case the way
  // getDisplayName does elsewhere — a plain name fallback is correct here.
  const name = share.creator_full_name || share.creator_username || 'Someone';
  return (
    <section className="flex items-center gap-3 border-t border-[var(--pact-hairline)] py-5">
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
        style={{ background: 'var(--navy)' }}
      >
        {share.creator_avatar_url ? (
          <Image src={share.creator_avatar_url} alt="" fill sizes="40px" className="object-cover" crossOrigin="anonymous" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--pact-text)]">Dared by {name}</p>
        {share.completed_at && (
          <p className="text-xs text-[var(--pact-text-faint)]">Completed {formatRelativeTime(share.completed_at)}</p>
        )}
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <section className="mt-4 rounded-3xl border border-[var(--pact-hairline)] px-6 py-8 text-center" style={{ background: 'var(--pact-surface)' }}>
      <p className="text-lg font-bold text-[var(--pact-text)]">Think you can do better?</p>
      <p className="mt-1.5 text-sm text-[var(--pact-text-muted)]">
        Join CirclePact to send and take on dares with your own circle.
      </p>
      <Link
        href="/auth/register"
        className="mt-5 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white"
        style={{ background: 'var(--pact-violet)' }}
      >
        Join CirclePact
      </Link>
    </section>
  );
}
