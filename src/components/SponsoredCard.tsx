'use client';

import { ExternalLink } from 'lucide-react';

type SponsoredCardProps = {
  sponsor: {
    name: string;
    logo_url?: string | null;
    headline: string;
    subtext?: string | null;
    cta_label: string;
    affiliate_link: string;
  };
};

export default function SponsoredCard({ sponsor }: SponsoredCardProps) {
  const openSponsor = () => {
    window.open(sponsor.affiliate_link, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="rounded-2xl border border-[var(--pact-violet)]/45 bg-[var(--pact-surface-2)] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.2)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10">
          {sponsor.logo_url ? (
            <img src={sponsor.logo_url} alt={`${sponsor.name} logo`} className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="text-lg font-black text-[var(--pact-violet)]" aria-hidden="true">
              {sponsor.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pact-violet)]">Sponsored</p>
          <p className="mt-1 text-sm font-bold text-[var(--pact-text)]">{sponsor.headline}</p>
          {sponsor.subtext && <p className="mt-1 text-xs leading-relaxed text-[var(--pact-text-dim)]">{sponsor.subtext}</p>}
          <p className="mt-2 text-[11px] font-semibold text-[var(--pact-text-faint)]">{sponsor.name}</p>
        </div>
        <button
          type="button"
          onClick={openSponsor}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--pact-violet)]/50 px-3 py-2 text-xs font-bold text-[var(--pact-text)] transition hover:bg-[var(--pact-violet)]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pact-violet)]"
        >
          {sponsor.cta_label}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export type { SponsoredCardProps };
