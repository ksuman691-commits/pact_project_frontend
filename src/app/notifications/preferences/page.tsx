'use client';

import { useEffect, useState } from 'react';
import { Bell, Flame, Users, Trophy, Calendar } from 'lucide-react';
import DetailPageHeader from '@/components/DetailPageHeader';
import { pushService } from '@/services/api';

type PreferenceKey = 'daily_reminder' | 'streak_warning' | 'circle_nudges' | 'milestones' | 'weekly_recap';

interface PreferenceRow {
  key: PreferenceKey;
  icon: typeof Bell;
  title: string;
  description: string;
}

const ROWS: PreferenceRow[] = [
  {
    key: 'daily_reminder',
    icon: Bell,
    title: 'Daily reminder',
    description: "An evening nudge if you haven't posted proof yet today.",
  },
  {
    key: 'streak_warning',
    icon: Flame,
    title: 'Streak-loss warning',
    description: 'A more urgent alert when a streak of 3+ days is about to break.',
  },
  {
    key: 'circle_nudges',
    icon: Users,
    title: 'Circle nudges',
    description: 'When someone in your circle nudges you to check in.',
  },
  {
    key: 'milestones',
    icon: Trophy,
    title: 'Milestone celebrations',
    description: 'Callouts when a streak crosses 7, 14, or 30 days.',
  },
  {
    key: 'weekly_recap',
    icon: Calendar,
    title: 'Weekly recap',
    description: 'A Sunday summary of your week and how your circle did.',
  },
];

// Every type defaults on until the user turns it off — matches the
// "default-on" contract in BACKEND_SPEC_PUSH_NOTIFICATIONS.md.
const DEFAULT_PREFERENCES: Record<PreferenceKey, boolean> = {
  daily_reminder: true,
  streak_warning: true,
  circle_nudges: true,
  milestones: true,
  weekly_recap: true,
};

const LOCAL_STORAGE_KEY = 'circlepact_notification_preferences';

function readLocalPreferences(): Record<PreferenceKey, boolean> {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writeLocalPreferences(preferences: Record<PreferenceKey, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore — worst case toggles reset to default next visit.
  }
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Record<PreferenceKey, boolean>>(DEFAULT_PREFERENCES);
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    // Local storage is the immediate source of truth on this device — the
    // real cross-device persistence (GET /api/push/preferences) isn't live
    // yet, so this is a best-effort hydration attempt only. See
    // BACKEND_SPEC_PUSH_NOTIFICATIONS.md.
    setPreferences(readLocalPreferences());
    pushService
      .getPreferences()
      .then((response) => {
        if (response?.data) {
          setPreferences((prev) => ({ ...prev, ...response.data }));
        }
      })
      .catch(() => {
        // Not deployed yet — local defaults/localStorage already applied above.
      });
  }, []);

  const handleToggle = async (key: PreferenceKey) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    writeLocalPreferences(next);

    setSavingKey(key);
    try {
      await pushService.updatePreferences(next);
    } catch (error: any) {
      // Best-effort — the endpoint isn't live yet, so a failure here is
      // expected and shouldn't roll back the toggle the user just set.
      console.log('[v0] pushService.updatePreferences not available yet:', error?.response?.status);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--pact-bg)', color: 'var(--pact-text)' }}>
      <DetailPageHeader title="Notification Preferences" fallbackHref="/notifications" maxWidthClassName="max-w-2xl" />

      <div className="mx-auto max-w-2xl px-5 pt-6">
        <p className="text-sm" style={{ color: 'var(--pact-text-dim)' }}>
          Choose which push notifications you want to receive. You can change these anytime.
        </p>

        <div className="mt-6 space-y-3">
          {ROWS.map((row) => {
            const Icon = row.icon;
            const isOn = preferences[row.key];
            return (
              <div
                key={row.key}
                className="flex items-start gap-3 rounded-3xl border p-4"
                style={{ borderColor: 'var(--pact-hairline)', background: 'var(--pact-surface-2)' }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--pact-bg)' }}
                >
                  <Icon className="h-5 w-5" style={{ color: 'var(--pact-pink)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{row.title}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--pact-text-dim)' }}>
                    {row.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={row.title}
                  onClick={() => handleToggle(row.key)}
                  disabled={savingKey === row.key}
                  className="relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60"
                  style={{ background: isOn ? 'var(--pact-pink)' : 'var(--pact-hairline)' }}
                >
                  <span
                    className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
                    style={{ left: isOn ? '1.5rem' : '0.25rem' }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
