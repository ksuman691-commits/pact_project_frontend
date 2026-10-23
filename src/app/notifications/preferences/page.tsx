'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import DetailPageHeader from '@/components/DetailPageHeader';
import { pushService, type PushPreferences } from '@/services/api';
import {
  disablePushOnThisDevice,
  enablePushOnThisDevice,
  isSubscribedHere,
  notificationPermission,
  PushNotReadyError,
  pushSupport,
} from '@/lib/push';

const HOURS: { hour: 9 | 13 | 19; label: string }[] = [
  { hour: 9, label: '9 am' },
  { hour: 13, label: '1 pm' },
  { hour: 19, label: '7 pm' },
];

const DEFAULTS: PushPreferences = { daily_reminder: true, reminder_hour: 19, last_call: true, circle_nudges: true, devices: 0 };

type DeviceState = 'loading' | 'on' | 'off' | 'blocked' | 'needs-install' | 'unsupported' | 'server-off';

function Switch({ on, label, onChange, disabled }: { on: boolean; label: string; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className="flex h-[30px] w-[50px] shrink-0 rounded-full p-[3px] transition-colors disabled:opacity-50"
      style={{ background: on ? 'var(--navy)' : '#CFC6B3', justifyContent: on ? 'flex-end' : 'flex-start' }}
    >
      <span className="h-6 w-6 rounded-full bg-white shadow-sm" />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<PushPreferences>(DEFAULTS);
  const [device, setDevice] = useState<DeviceState>('loading');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const readDevice = useCallback(async () => {
    const support = pushSupport();
    if (support !== 'supported') return setDevice(support === 'needs-install' ? 'needs-install' : 'unsupported');
    if (notificationPermission() === 'denied') return setDevice('blocked');
    try {
      const { data } = await pushService.vapidKey();
      if (!data?.enabled) return setDevice('server-off');
    } catch {
      return setDevice('server-off');
    }
    setDevice((await isSubscribedHere()) ? 'on' : 'off');
  }, []);

  useEffect(() => {
    void readDevice();
    pushService
      .getPreferences()
      .then(({ data }) => data && setPrefs({ ...DEFAULTS, ...data }))
      .catch(() => {});
  }, [readDevice]);

  const save = async (patch: Partial<Omit<PushPreferences, 'devices'>>) => {
    const previous = prefs;
    setPrefs({ ...prefs, ...patch });
    try {
      const { data } = await pushService.updatePreferences(patch);
      if (data) setPrefs({ ...DEFAULTS, ...data });
    } catch {
      setPrefs(previous);
      toast.error("Couldn't save that. Try again.");
    }
  };

  const turnOn = async () => {
    setBusy(true);
    try {
      const ok = await enablePushOnThisDevice();
      if (!ok) toast.error('Notifications are blocked for CirclePact in your phone settings.');
    } catch (error) {
      toast.error(error instanceof PushNotReadyError ? error.message : "Couldn't turn on notifications. Try again.");
    } finally {
      setBusy(false);
      void readDevice();
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await disablePushOnThisDevice();
    } catch {
      toast.error("Couldn't turn them off. Try again.");
    } finally {
      setBusy(false);
      void readDevice();
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const { data } = await pushService.sendTest();
      toast.success(data?.sent ? 'Sent. It should arrive in a few seconds.' : 'No phone took it. Try turning notifications off and on.');
    } catch {
      toast.error("Couldn't send a test right now.");
    } finally {
      setTesting(false);
    }
  };

  const banner = (() => {
    switch (device) {
      case 'loading':
        return <div className="pact-shimmer h-[60px] rounded-2xl" aria-hidden="true" />;
      case 'on':
        return (
          <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5" style={{ background: '#E8F2EC', color: '#1F5E3A' }}>
            <Check className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} aria-hidden="true" />
            <span className="flex-1 text-[13.5px] font-bold">On for this phone</span>
            <button type="button" onClick={() => void sendTest()} disabled={testing} className="h-9 rounded-full border px-3 text-[13px] font-extrabold disabled:opacity-60" style={{ borderColor: '#9CC7AE' }}>
              {testing ? 'Sending…' : 'Send a test'}
            </button>
            <button type="button" onClick={() => void turnOff()} disabled={busy} className="h-9 px-1.5 text-[13px] font-bold underline-offset-2 hover:underline disabled:opacity-60">
              Turn off
            </button>
          </div>
        );
      case 'off':
        return (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--card)] px-3.5 py-3">
            <span className="flex-1 text-[13.5px] leading-snug text-[var(--ink)]">
              <span className="font-bold">Off for this phone.</span> Turn on to get the reminders below.
            </span>
            <button type="button" onClick={() => void turnOn()} disabled={busy} className="h-10 shrink-0 rounded-full bg-[var(--navy)] px-4 text-[13.5px] font-extrabold text-white disabled:opacity-60">
              {busy ? 'Turning on…' : 'Turn on'}
            </button>
          </div>
        );
      case 'blocked':
        return (
          <p className="rounded-2xl border border-[var(--hairline)] bg-[var(--card)] px-3.5 py-3 text-[13.5px] leading-snug">
            <span className="font-bold">Blocked on this phone.</span> Allow notifications for CirclePact in your browser or phone settings, then come back here.
          </p>
        );
      case 'needs-install':
        return (
          <p className="rounded-2xl border border-[var(--hairline)] bg-[var(--card)] px-3.5 py-3 text-[13.5px] leading-snug">
            <span className="font-bold">On iPhone, add CirclePact to your Home Screen first.</span> In Safari tap Share, then Add to Home Screen, open it from there and turn reminders on.
          </p>
        );
      case 'server-off':
        return (
          <p className="rounded-2xl border border-[var(--hairline)] bg-[var(--card)] px-3.5 py-3 text-[13.5px] leading-snug text-[var(--muted)]">
            Phone notifications are being set up. Your choices below are saved and apply as soon as they&apos;re live.
          </p>
        );
      default:
        return (
          <p className="rounded-2xl border border-[var(--hairline)] bg-[var(--card)] px-3.5 py-3 text-[13.5px] leading-snug text-[var(--muted)]">
            This browser can&apos;t show notifications. Open CirclePact in Chrome, or install it to your Home Screen.
          </p>
        );
    }
  })();

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <DetailPageHeader title="Notifications" fallbackHref="/notifications" />

      <div className="mx-auto flex max-w-md flex-col gap-3.5 px-4 pt-2">
        {banner}

        <h2 className="px-0.5 pt-1 text-[12px] font-extrabold tracking-[0.08em] text-[var(--muted)]">CHECK-IN REMINDERS</h2>
        <section className="mb-0 flex flex-col rounded-[20px] border border-[var(--hairline)] bg-[var(--card)]" aria-label="Check-in reminders">
          <div className="flex items-center gap-3 p-3.5">
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-extrabold">Daily reminder</span>
              <span className="text-[13px] leading-snug text-[var(--muted)]">Only when a pact is still waiting for today&apos;s moment.</span>
            </span>
            <Switch on={prefs.daily_reminder} label="Daily reminder" onChange={() => void save({ daily_reminder: !prefs.daily_reminder })} />
          </div>
          {prefs.daily_reminder && (
            <div className="flex flex-col gap-1.5 px-3.5 pb-3.5">
              <span id="remind-at-label" className="text-[13px] font-bold text-[var(--muted)]">
                Remind me at
              </span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="remind-at-label">
                {HOURS.map((option) => {
                  const on = prefs.reminder_hour === option.hour;
                  return (
                    <button
                      key={option.hour}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => !on && void save({ reminder_hour: option.hour })}
                      className={`h-11 rounded-full text-[14px] ${on ? 'border-[1.5px] border-[var(--navy)] bg-[#E8ECF7] font-extrabold text-[var(--navy)]' : 'border border-[var(--hairline)] bg-white font-bold text-[var(--ink)]'}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mx-3.5 h-px bg-[#E6E1D6]" />
          <div className="flex items-center gap-3 p-3.5">
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-extrabold">Last call at 9 pm</span>
              <span className="text-[13px] leading-snug text-[var(--muted)]">Only when missing today would end the pact or leave no days to spare.</span>
            </span>
            <Switch on={prefs.last_call} label="Last call" onChange={() => void save({ last_call: !prefs.last_call })} />
          </div>
        </section>

        <h2 className="px-0.5 pt-1 text-[12px] font-extrabold tracking-[0.08em] text-[var(--muted)]">FROM YOUR CIRCLES</h2>
        <section className="mb-0 rounded-[20px] border border-[var(--hairline)] bg-[var(--card)]" aria-label="From your circles">
          <div className="flex items-center gap-3 p-3.5">
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-extrabold">Nudges</span>
              <span className="text-[13px] leading-snug text-[var(--muted)]">When someone in a circle nudges you.</span>
            </span>
            <Switch on={prefs.circle_nudges} label="Nudges" onChange={() => void save({ circle_nudges: !prefs.circle_nudges })} />
          </div>
        </section>

        <p className="px-1 text-[12.5px] leading-[1.45] text-[var(--muted)]">
          At most 2 reminders a day, never between 10 pm and 8 am, in your phone&apos;s time zone.
        </p>
      </div>
    </div>
  );
}
