'use client';

import Link from 'next/link';

export const RED = '#B3261E';

export function Pill({ children, bg, fg = '#fff' }: { children: React.ReactNode; bg: string; fg?: string }) {
  return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12px] font-bold" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[30px] font-bold tracking-[-0.04em]">{title}</h1>
        <p className="mt-1 text-[14.5px] text-[var(--muted)]">{sub}</p>
      </div>
      {right}
    </div>
  );
}

export function Tile({ label, value, sub, href, warn }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string; warn?: boolean }) {
  const body = (
    <>
      <div className="text-[12.5px] font-semibold text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 text-[28px] font-bold tracking-[-0.03em] tabular-nums" style={warn ? { color: RED } : undefined}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[12.5px] text-[var(--muted)]">{sub}</div>}
    </>
  );
  const cls = `block rounded-[16px] border bg-[var(--card)] px-4 py-3.5 ${warn ? 'border-[#EBC3BF]' : 'border-[var(--hairline)]'}`;
  return href ? (
    <Link href={href} className={`${cls} transition hover:border-[var(--ink)]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** A small line chart of daily counts, oldest to newest. */
export function Spark({ values, color = 'var(--navy)', label }: { values: number[]; color?: string; label: string }) {
  const w = 280;
  const h = 56;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 4 - (v / max) * (h - 10)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none" role="img" aria-label={label}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return '–';
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '–';
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso.endsWith('Z') ? iso : `${iso}Z`);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
