'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { dismissPushPrompt, isPushPromptDismissed } from '@/lib/onboarding';

/**
 * "Turn on reminders" prompt shown on the pact-creation success screen —
 * see create-pact-flow/SuccessStep.tsx. Placement rationale: asking on
 * every page load (or during onboarding, before the user has any pact to
 * be reminded about) is a well-known pattern for permission-prompt fatigue
 * and instant denial. Right after committing to a pact is the moment the
 * value of a reminder ("don't lose your streak") is most concrete, so the
 * ask is contextual rather than a cold, unexplained OS dialog. It's shown
 * after any pact creation (not gated to strictly the first), since the
 * same "help me not miss a day" motivation applies every time — dismissal
 * suppresses it for 30 days either way.
 */
export default function PushNotificationPrompt() {
  const { permission, isSubscribing, enablePush } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isPushPromptDismissed());
  }, []);

  if (permission !== 'default' || dismissed) return null;

  return (
    <div
      className="mt-6 w-full rounded-3xl border p-5 text-left"
      style={{ borderColor: 'var(--pact-hairline)', background: 'var(--pact-surface-2)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--pact-pink)' }}
        >
          <Bell className="h-5 w-5" style={{ color: 'var(--pact-bg)' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--pact-text)' }}>
            Turn on reminders
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--pact-text-dim)' }}>
            Get a nudge before you miss a day so this streak sticks.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => enablePush()}
              disabled={isSubscribing}
              className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60"
              style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
            >
              {isSubscribing ? 'Turning on...' : 'Turn on reminders'}
            </button>
            <button
              type="button"
              onClick={() => {
                dismissPushPrompt();
                setDismissed(true);
              }}
              className="rounded-full border px-4 py-2 text-xs font-semibold"
              style={{ borderColor: 'var(--pact-hairline)', color: 'var(--pact-text-dim)' }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
