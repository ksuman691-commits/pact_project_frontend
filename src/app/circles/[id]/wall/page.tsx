'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  circlePublicWallService,
  type CirclePublicWallSummary,
  type CirclePublicWallPact,
  type CirclePublicWallProof,
} from '@/services/circlePublicWallService';
import { circleService } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import LogoMark from '@/components/LogoMark';
import LogoSpinner from '@/components/LogoSpinner';

/**
 * Public, no-login wall for a circle. Reachable by scanning the circle's QR
 * code. Deliberately does not use useRequireAuth: it must render for a
 * signed-out visitor. The wall endpoint only returns what the backend has
 * already restricted to public items.
 */
export default function CirclePublicWallPage() {
  const params = useParams();
  const circleId = Number(params.id);
  const user = useAuthStore((s) => s.user);

  const [circle, setCircle] = useState<CirclePublicWallSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await circlePublicWallService.getWall(circleId);
      if (!active) return;
      setCircle(result);
      setNotFound(!result);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [circleId]);

  useEffect(() => {
    if (!user) {
      setIsMember(false);
      return;
    }
    let active = true;
    circleService
      .getById(circleId)
      .then((res) => {
        if (active) setIsMember(!!res.data?.is_member);
      })
      .catch(() => {
        if (active) setIsMember(false);
      });
    return () => {
      active = false;
    };
  }, [user, circleId]);

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <TopBar signedIn={!!user} />
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <LogoSpinner size={32} />
        </div>
      ) : notFound || !circle ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-[20px] font-bold tracking-[-0.025em]">Circle not found</p>
          <p className="mt-2 max-w-sm text-[14px] text-[var(--muted)]">This wall could not be loaded, or the link is no longer valid.</p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-md px-6 pb-24 pt-6">
          <WallHeader circle={circle} isMember={isMember} signedIn={!!user} />
          {circle.proofs ? <ProofGallery proofs={circle.proofs} /> : <PublicPactList pacts={circle.pacts} />}
          <p className="mt-10 text-[13px] text-[var(--muted)]">
            Only proofs a member chose to make public appear here. Nothing is added automatically.
          </p>
        </div>
      )}
    </main>
  );
}

function TopBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-4">
      <LogoMark size={18} />
      {!signedIn && (
        <Link href="/auth/login" className="text-[14px] font-semibold text-[var(--navy)]">
          Sign in
        </Link>
      )}
    </header>
  );
}

function monogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function MiniRing({ name }: { name: string }) {
  return (
    <div className="relative h-[72px] w-[72px] shrink-0" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--hairline)" strokeWidth="1.6" />
      </svg>
      <div className="absolute inset-[16%] flex items-center justify-center rounded-full bg-[var(--card)] text-[16px] font-bold text-[var(--navy)]">
        {monogram(name)}
      </div>
    </div>
  );
}

function WallHeader({ circle, isMember, signedIn }: { circle: CirclePublicWallSummary; isMember: boolean; signedIn: boolean }) {
  const subtitle = circle.member_count != null ? `${circle.member_count} ${circle.member_count === 1 ? 'member' : 'members'} · open to join` : null;
  const joinHref = signedIn ? `/circles/${circle.id}` : `/auth/login?next=${encodeURIComponent(`/circles/${circle.id}`)}`;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <MiniRing name={circle.name} />
        <div className="min-w-0">
          <h1 className="text-[30px] font-bold leading-[1.05] tracking-[-0.035em]">{circle.name}</h1>
          {subtitle && <p className="mt-1 text-[13px] text-[var(--muted)]">{subtitle}</p>}
        </div>
      </div>
      <p className="text-[15px] text-[var(--ink-soft)]">
        {circle.description ? `${circle.description} ` : ''}These are proofs members chose to make public.
      </p>
      <Link
        href={joinHref}
        className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--navy)] px-6 text-[16px] font-semibold text-[var(--card)] transition-colors hover:bg-[var(--navy-hover)]"
      >
        {isMember ? 'Open circle' : 'Ask to join'}
      </Link>
    </section>
  );
}

function startOfWeek(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  return copy;
}

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
}

function ProofGallery({ proofs }: { proofs: CirclePublicWallProof[] }) {
  const groups = useMemo(() => {
    const thisWeek = startOfWeek(new Date()).getTime();
    const sorted = [...proofs].sort((a, b) => +new Date(b.submitted_at) - +new Date(a.submitted_at));
    return {
      recent: sorted.filter((p) => startOfWeek(new Date(p.submitted_at)).getTime() >= thisWeek),
      earlier: sorted.filter((p) => startOfWeek(new Date(p.submitted_at)).getTime() < thisWeek),
    };
  }, [proofs]);

  if (proofs.length === 0) {
    return <p className="mt-10 text-[14px] text-[var(--muted)]">No public proofs yet.</p>;
  }
  return (
    <div className="mt-10 flex flex-col gap-10">
      {groups.recent.length > 0 && <Columns title="This week" proofs={groups.recent} />}
      {groups.earlier.length > 0 && <Columns title="Earlier" proofs={groups.earlier} />}
    </div>
  );
}

function Columns({ title, proofs }: { title: string; proofs: CirclePublicWallProof[] }) {
  const left = proofs.filter((_, i) => i % 2 === 0);
  const right = proofs.filter((_, i) => i % 2 === 1);
  return (
    <section>
      <h2 className="text-[20px] font-bold tracking-[-0.025em]">{title}</h2>
      <div className="mt-4 flex gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-[18px]">{left.map((p) => <Tile key={p.id} proof={p} />)}</div>
        <div className="flex min-w-0 flex-1 flex-col gap-[18px] pt-7">{right.map((p) => <Tile key={p.id} proof={p} />)}</div>
      </div>
    </section>
  );
}

function Tile({ proof }: { proof: CirclePublicWallProof }) {
  return (
    <figure>
      {/* Natural aspect ratio on purpose: no fixed height, no crop. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={proof.image_url} alt={`Proof for ${proof.pact_title}`} loading="lazy" className="block h-auto w-full rounded-[3px] bg-[var(--tan)]" />
      <figcaption className="mt-2">
        <p className="text-[14px] font-semibold leading-tight">{proof.pact_title}</p>
        <p className="mt-0.5 text-[12px] text-[var(--muted)]">
          {[proof.member_name, formatDay(proof.submitted_at)].filter(Boolean).join(' · ')}
        </p>
      </figcaption>
    </figure>
  );
}

/**
 * Fallback while the wall endpoint does not return proof images: list the
 * public pacts as plain rows. No photos are invented.
 */
function PublicPactList({ pacts }: { pacts: CirclePublicWallPact[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-[20px] font-bold tracking-[-0.025em]">Public pacts</h2>
      {pacts.length === 0 ? (
        <p className="mt-3 text-[14px] text-[var(--muted)]">No public proofs yet.</p>
      ) : (
        <ul className="mt-3">
          {pacts.map((pact) => (
            <li key={pact.id} className="border-t border-[var(--hairline-soft)] py-3 first:border-t-0">
              <p className="text-[15px] font-semibold">{pact.title}</p>
              <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                {pact.participant_count} {pact.participant_count === 1 ? 'person' : 'people'} · ends {formatDay(pact.end_date)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
