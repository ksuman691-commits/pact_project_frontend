'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { APP_STATUS_KEY, useAppStatus } from '@/lib/appStatus';

const DISMISSED = 'cp-banner-dismissed';

/** The team's one-line note for everyone (set from the console), e.g. planned maintenance. */
export default function AppBanner() {
  const { data } = useAppStatus();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISSED));
    } catch {
      /* private mode */
    }
    // The API client fires this when the server refuses a paused feature.
    const refresh = () => void queryClient.invalidateQueries({ queryKey: APP_STATUS_KEY });
    window.addEventListener('cp:feature-paused', refresh);
    return () => window.removeEventListener('cp:feature-paused', refresh);
  }, [queryClient]);

  const text = data?.banner;
  if (!text || dismissed === text) return null;
  return (
    <div role="status" className="relative z-[60] bg-[var(--ink)] px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-[13px] leading-[1.4] text-white">
      <div className="mx-auto flex max-w-md items-start gap-2">
        <span className="min-w-0 flex-1">{text}</span>
        <button
          type="button"
          aria-label="Hide this note"
          onClick={() => {
            setDismissed(text);
            try {
              sessionStorage.setItem(DISMISSED, text);
            } catch {
              /* private mode */
            }
          }}
          className="-my-2 -mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-[#C9C8CF]"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
