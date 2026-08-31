'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  circlePublicWallService,
  type CirclePublicWallSummary,
  type CirclePublicWallPact,
} from '@/services/circlePublicWallService';
import LogoMark from '@/components/LogoMark';
import LogoSpinner from '@/components/LogoSpinner';
import { Users, CheckCircle2 } from 'lucide-react';

/**
 * Public, no-login "storefront" for a Circle — reachable by scanning that
 * circle's progressively-revealed QR code (see CircleQRTeaser). Deliberately
 * does NOT use useRequireAuth or DetailPageHeader (its Home link points at
 * /feed, which requires auth) — this page must render fully and never
 * redirect for a signed-out visitor. All data comes through the
 * unauthenticated circlePublicWallService hitting the real, deployed
 * GET /api/circles/{id}/wall endpoint, which returns only the pacts the
 * backend has already restricted server-side to public (+ completed)
 * visibility — this response has no visibility field to re-check client
 * side, so the privacy boundary is enforced entirely by the backend query.
 */
export default function CirclePublicWallPage() {
  const params = useParams();
  const circleId = Number(params.id);

  const [circle, setCircle] = useState<CirclePublicWallSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const circleResult = await circlePublicWallService.getWall(circleId);
      if (!active) return;
      setCircle(circleResult);
      setNotFound(!circleResult);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [circleId]);

  return (
    <main className="min-h-screen bg-[var(--pact-bg)] text-[var(--pact-text)]">
      <TopBar />

      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <LogoSpinner size={32} color="var(--pact-violet)" />
        </div>
      ) : notFound ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
          <p className="text-lg font-bold">Circle not found</p>
          <p className="mt-2 max-w-sm text-sm text-[var(--pact-text-muted)]">
            This circle&apos;s wall could not be loaded, or the link is no longer valid.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl px-5 pb-20 pt-8">
          <CircleHero circle={circle!} />
          <PactList pacts={circle!.pacts} />
          <BottomCta />
        </div>
      )}
    </main>
  );
}

/**
 * Sticky brand bar: logo/wordmark + tagline so a cold visitor immediately
 * understands what app this is, plus a Sign Up / Log In CTA that stays
 * visible without scrolling — the primary conversion path for anyone who
 * lands here from a scanned QR code or shared link.
 */
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

function CircleHero({ circle }: { circle: CirclePublicWallSummary }) {
  const completedCount = circle.pacts.filter((p) => p.progress_percent >= 100).length;
  return (
    <header className="border-b border-[var(--pact-hairline)] pb-8">
      <div className="flex items-start gap-4">
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-3xl"
          style={{ background: 'linear-gradient(135deg,var(--pact-pink),var(--pact-violet))' }}
        >
          {circle.photo_url ? (
            <Image src={circle.photo_url} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            circle.icon_emoji || circle.name?.charAt(0) || '◌'
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--pact-violet)]">Circle Wall</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-[var(--pact-text)]">{circle.name}</h1>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--pact-text-muted)]">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" aria-hidden="true" />
          {circle.pacts.length} public pact{circle.pacts.length === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {completedCount} completed
        </span>
      </div>
    </header>
  );
}

function PactList({ pacts }: { pacts: CirclePublicWallPact[] }) {
  if (!pacts.length) {
    return (
      <section className="py-10 text-center">
        <p className="text-sm text-[var(--pact-text-muted)]">
          This circle doesn&apos;t have any public pacts yet.
        </p>
      </section>
    );
  }

  return (
    <section className="py-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--pact-violet)]">Public pacts</h2>
      <div className="mt-4">
        {pacts.map((pact) => {
          const isCompleted = pact.progress_percent >= 100;
          return (
            <Link
              key={pact.id}
              href={`/pacts/${pact.id}`}
              className="flex items-center gap-4 border-t border-[var(--pact-hairline)] py-4 transition hover:border-[var(--pact-violet)]"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
                style={{ borderColor: 'var(--pact-violet)', color: 'var(--pact-violet)' }}
              >
                {Math.round(pact.progress_percent)}%
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[var(--pact-text)]">{pact.title}</p>
                <p className="mt-1 truncate text-sm text-[var(--pact-text-muted)]">
                  {isCompleted ? 'Completed' : pact.category}
                  {' · '}
                  {pact.participant_count} participant{pact.participant_count === 1 ? '' : 's'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Secondary conversion moment, placed after the visitor has actually seen
 * real proof/content — often stronger than the top-of-page CTA alone.
 */
function BottomCta() {
  return (
    <section className="mt-4 rounded-3xl border border-[var(--pact-hairline)] px-6 py-8 text-center" style={{ background: 'var(--pact-surface)' }}>
      <p className="text-lg font-bold text-[var(--pact-text)]">Want to start your own pact?</p>
      <p className="mt-1.5 text-sm text-[var(--pact-text-muted)]">
        Join CirclePact and turn your goals into pacts your circle can see, cheer, and hold you to.
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
