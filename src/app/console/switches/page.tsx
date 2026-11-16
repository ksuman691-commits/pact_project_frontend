'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';
import NotYours from '@/components/console/NotYours';
import { PageHeader, RED, shortDate } from '@/components/console/ui';
import { consoleApi, errorText, type SwitchRow, type Switches } from '@/lib/console/api';

const GREEN = '#2E8B57';

type Pending = { key: string; label: string; enabled: boolean; text?: string };

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="relative inline-block h-7 w-[46px] shrink-0 rounded-full transition"
      style={{ background: on ? GREEN : '#C9C3B6' }}
    >
      <span className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all" style={{ left: on ? 21 : 3 }} />
    </button>
  );
}

function SwitchesPage() {
  const member = useConsoleMember();
  const owner = member?.role === 'owner';
  const [data, setData] = useState<Switches | null>(null);
  const [banner, setBanner] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!owner) return;
    consoleApi
      .switches()
      .then((d) => {
        setData(d);
        setBanner(d.banner.text ?? '');
      })
      .catch((error) => toast.error(errorText(error, "Couldn't load switches.")));
  }, [owner]);

  if (!member) return null;
  if (!owner) return <NotYours />;

  const off = data?.switches.filter((s) => !s.enabled) ?? [];

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const next = await consoleApi.setSwitch(pending.key, pending.enabled, reason.trim(), pending.text);
      setData(next);
      setBanner(next.banner.text ?? '');
      toast.success(pending.key === 'banner' ? (pending.enabled ? 'Banner is showing' : 'Banner taken down') : `${pending.label} turned ${pending.enabled ? 'on' : 'off'}`);
      setPending(null);
      setReason('');
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const ask = (row: SwitchRow) => {
    setReason('');
    setPending({ key: row.key, label: row.label, enabled: !row.enabled });
  };

  return (
    <>
      <PageHeader title="Switches" sub="Turn part of the app off at once, without a new release." />
      {data && (
        <div className={`mt-3.5 rounded-[14px] border px-3.5 py-3 text-[14px] ${off.length ? 'border-[#F0DC8E] bg-[#FFF6D6]' : 'border-[var(--hairline)] bg-[var(--card)]'}`}>
          <b>{off.length ? `${off.length} ${off.length === 1 ? 'switch is' : 'switches are'} off.` : 'Everything is on.'}</b> When something is off, people see a short “paused for a bit” note instead of the button, and the server refuses it too.
        </div>
      )}
      {data === null ? (
        <div className="mt-4 h-[360px] animate-pulse rounded-[18px] bg-[var(--card)]" aria-busy="true" />
      ) : (
        <>
          <div className="mt-3.5 overflow-hidden rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
            {data.switches.map((row, i) => (
              <div key={row.key} className={`flex items-center gap-4 px-3.5 py-3 ${i ? 'border-t border-[#E6DFD0]' : ''}`}>
                <div className="min-w-0 flex-1">
                  <b className="text-[14px]">{row.label}</b>
                  <span className="block text-[12.5px] text-[var(--muted)]">{row.about}</span>
                  {!row.enabled && (
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: RED }}>
                      Off since {shortDate(row.changed_at)}
                      {row.changed_by ? ` by ${row.changed_by}` : ''}
                      {row.reason ? `: “${row.reason}”` : ''}
                    </span>
                  )}
                </div>
                <Toggle on={row.enabled} label={row.label} onClick={() => ask(row)} />
              </div>
            ))}
          </div>

          <div className="mt-3.5 rounded-[16px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3.5">
            <b className="text-[14px]">Banner for everyone</b>
            <div className="mt-0.5 text-[13px] text-[var(--muted)]">A one-line note at the top of the app, e.g. planned maintenance.</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <input
                value={banner}
                onChange={(e) => setBanner(e.target.value.slice(0, 160))}
                placeholder="Nothing showing"
                aria-label="Banner text"
                className="h-[42px] min-w-[220px] flex-1 rounded-[12px] border border-[var(--hairline)] bg-white px-3 text-[14px] outline-none focus:border-[var(--ink)]"
              />
              <button
                type="button"
                disabled={!banner.trim() || banner.trim() === (data.banner.text ?? '')}
                onClick={() => {
                  setReason('');
                  setPending({ key: 'banner', label: 'Banner', enabled: true, text: banner.trim() });
                }}
                className="h-[42px] rounded-full border border-[var(--hairline)] bg-white px-4 text-[14px] font-bold disabled:opacity-40"
              >
                {data.banner.text ? 'Update banner' : 'Show banner'}
              </button>
              {data.banner.text && (
                <button
                  type="button"
                  onClick={() => {
                    setReason('');
                    setPending({ key: 'banner', label: 'Banner', enabled: false, text: '' });
                  }}
                  className="h-[42px] rounded-full px-4 text-[14px] font-bold"
                  style={{ color: RED }}
                >
                  Take down
                </button>
              )}
            </div>
            {data.banner.text && <div className="mt-2 text-[12.5px] text-[var(--muted)]">Showing now{data.banner.changed_by ? `, set by ${data.banner.changed_by}` : ''}.</div>}
          </div>
          <p className="mt-2.5 text-[12.5px] text-[var(--muted)]">Owner only. Every change asks for your code and needs a reason, which goes in the activity log.</p>
        </>
      )}

      {pending && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(23,24,29,.45)] p-4" role="dialog" aria-modal="true" aria-labelledby="switch-title">
          <div className="w-full max-w-[460px] rounded-[22px] bg-[var(--paper)] p-6">
            <h2 id="switch-title" className="text-[22px] font-bold tracking-[-0.03em]">
              {pending.key === 'banner' ? (pending.enabled ? 'Show this banner?' : 'Take the banner down?') : `Turn ${pending.label.toLowerCase()} ${pending.enabled ? 'on' : 'off'}?`}
            </h2>
            <p className="mt-1 text-[14px] leading-[1.45] text-[var(--muted)]">
              {pending.key === 'banner'
                ? pending.enabled
                  ? `Everyone sees “${pending.text}” at the top of the app.`
                  : 'It disappears for everyone.'
                : pending.enabled
                  ? 'People can use it again straight away.'
                  : 'It stops for everyone straight away. People see a short “paused for a bit” note.'}
            </p>
            <label className="mt-4 block">
              <span className="text-[13px] font-bold">Why (for the activity log)</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 300))}
                autoFocus
                placeholder={pending.enabled ? 'e.g. Fixed' : 'e.g. Checking a scam pattern'}
                className="mt-1.5 h-[44px] w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 text-[14.5px] outline-none focus:border-[var(--ink)]"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)} className="h-11 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14.5px] font-bold">
                Cancel
              </button>
              <button
                type="button"
                disabled={reason.trim().length < 3 || busy}
                onClick={() => void confirm()}
                className="h-11 rounded-full px-4 text-[14.5px] font-bold text-white disabled:opacity-40"
                style={{ background: pending.enabled ? 'var(--ink)' : RED }}
              >
                {busy ? 'Saving…' : pending.key === 'banner' ? (pending.enabled ? 'Show banner' : 'Take down') : pending.enabled ? 'Turn on' : 'Turn off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Page() {
  return (
    <ConsoleFrame>
      <SwitchesPage />
    </ConsoleFrame>
  );
}
