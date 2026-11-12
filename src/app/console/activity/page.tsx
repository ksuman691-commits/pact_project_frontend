'use client';

import { useEffect, useState } from 'react';
import ConsoleFrame, { RolePill } from '@/components/console/ConsoleFrame';
import { consoleApi, errorText, type ActivityRow } from '@/lib/console/api';

const FILTERS: { id: string | undefined; label: string }[] = [
  { id: undefined, label: 'Everyone' },
  { id: 'sign_in', label: 'Sign-ins' },
  { id: 'team', label: 'Team changes' },
  { id: 'dares', label: 'Dares' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'reports', label: 'Reports' },
  { id: 'users', label: 'People' },
];
const RANGES = [1, 7, 30, 90];

function stamp(iso: string): string {
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Today ${time}`;
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return `Yesterday ${time}`;
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${time}`;
}

/** A short device description from the browser's user agent, e.g. "Chrome on Mac". */
function device(ua: string | null): string | null {
  if (!ua) return null;
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : null;
  return browser && os ? `${browser} on ${os}` : browser || os;
}

function Activity() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    consoleApi
      .activity({ category, days })
      .then(setRows)
      .catch((err) => setError(errorText(err)));
  }, [category, days]);

  return (
    <>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.04em]">Activity log</h1>
      <p className="mt-2 text-[14.5px] text-[var(--muted)]">Everything anyone did in the console. Nobody can edit or delete it, including you.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={category === f.id}
            onClick={() => setCategory(f.id)}
            className="h-9 rounded-full px-3 text-[13px] font-bold"
            style={category === f.id ? { background: 'var(--ink)', color: '#fff' } : { border: '1px solid var(--hairline)' }}
          >
            {f.label}
          </button>
        ))}
        <span className="flex-1" />
        <label className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="sr-only">Time range</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 rounded-full border border-[var(--hairline)] bg-[var(--card)] px-3 text-[13px] font-semibold">
            {RANGES.map((d) => (
              <option key={d} value={d}>
                {d === 1 ? 'Last 24 hours' : `Last ${d} days`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-4 text-[14px] font-semibold text-[#B3261E]">{error}</p>}
      <ol className="mt-4 overflow-hidden rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
        {!rows ? (
          [0, 1, 2, 3].map((i) => (
            <li key={i} className="border-t border-[#ECE6D8] px-4 py-3 first:border-t-0">
              <div className="pact-shimmer h-5 rounded-[8px]" />
            </li>
          ))
        ) : rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-[14.5px] text-[var(--muted)]">Nothing happened in this time.</li>
        ) : (
          rows.map((row) => {
            const where = [row.ip, device(row.user_agent)].filter(Boolean).join(' · ');
            return (
              <li key={row.id} className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-t border-[#ECE6D8] px-4 py-3 text-[14.5px] first:border-t-0">
                <span className="w-[112px] shrink-0 text-[13px] text-[var(--muted)]">{stamp(row.at)}</span>
                <span className="min-w-0 flex-1" style={{ color: row.ok ? undefined : '#B3261E' }}>
                  {row.summary}
                  {where && <span className="text-[var(--muted)]"> · {where}</span>}
                </span>
                {row.actor_role ? (
                  <RolePill role={row.actor_role} />
                ) : (
                  <span className="rounded-full bg-[#ECE6D8] px-2.5 py-[3px] text-[12.5px] font-bold text-[var(--muted)]">{row.category === 'sign_in' ? 'Sign-in' : 'System'}</span>
                )}
              </li>
            );
          })
        )}
      </ol>
    </>
  );
}

export default function ConsoleActivity() {
  return (
    <ConsoleFrame ownerOnly>
      <Activity />
    </ConsoleFrame>
  );
}
