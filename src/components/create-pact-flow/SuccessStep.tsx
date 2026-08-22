'use client';

import { useRouter } from 'next/navigation';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { useCircle } from '@/hooks/useCircles';
import SuggestedPactsSection from './SuggestedPactsSection';
import SponsoredCard from '@/components/SponsoredCard';
import { useSponsor } from '@/hooks/useSponsor';

const VIBE_TO_CATEGORY: Record<string, string> = {
  glowup: 'fitness',
  money: 'startup',
  dare: 'habits',
  adventure: 'social',
  love: 'social',
  social: 'social',
  create: 'creator',
  build: 'startup',
  levelup: 'study',
  wellbeing: 'fitness',
};

const AUDIENCE_COPY: Record<string, string> = {
  'Just me': 'Only you can see this pact.',
  'My Circle': 'Your circle can see this pact.',
  Everyone: 'Anyone can see and join this pact.',
};

export default function SuccessStep() {
  const { createdPact, reset } = useCreatePactFlow();
  const router = useRouter();
  const { data: circle } = useCircle(createdPact?.circleId ?? 0);
  const sponsorCategory = (createdPact as (typeof createdPact & { category?: string }) | null)?.category || (createdPact?.vibeId ? VIBE_TO_CATEGORY[createdPact.vibeId] : null);
  const sponsor = useSponsor(sponsorCategory);

  if (!createdPact) return null;

  return (
    <div className="pact-step-enter flex flex-1 flex-col items-center pt-4 text-center">
      {/* Decorative stamp — spins via conic-gradient ring, respects prefers-reduced-motion (pop-in always plays) */}
      <div className="pact-stamp-ring relative flex h-24 w-24 items-center justify-center rounded-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, var(--pact-pink), var(--pact-gold), var(--pact-violet), var(--pact-pink))',
          }}
        />
        <div
          className="absolute inset-[6px] flex items-center justify-center rounded-full text-3xl"
          style={{ background: 'var(--pact-bg)' }}
        >
          🔥
        </div>
      </div>

      <h1 className="mt-6 text-2xl font-bold">You just made a pact.</h1>
      <p className="mt-2 text-base font-medium" style={{ color: 'var(--pact-text)' }}>
        {createdPact.title}
      </p>
      <p className="mt-1 text-sm">
        {AUDIENCE_COPY[createdPact.audience] ?? 'Your pact is live.'}
      </p>

      {sponsor && (
        <div className="mt-6 w-full text-left">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pact-text-faint)]">Tools that might help</p>
          <SponsoredCard sponsor={sponsor} />
        </div>
      )}

      <div className="mt-8 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push(`/feed?created=${createdPact.id}`)}
          className="w-full rounded-full px-6 py-3.5 text-sm font-semibold text-[var(--pact-bg)]"
          style={{ background: 'var(--pact-pink)' }}
        >
          Back to Feed
        </button>
        {createdPact.circleId && circle?.name && (
          <button
            type="button"
            onClick={() => router.push(`/circles/${createdPact.circleId}`)}
            className="w-full rounded-full border px-6 py-3.5 text-sm font-semibold"
            style={{ borderColor: 'var(--pact-hairline)', color: 'var(--pact-text)' }}
          >
            Go to {circle.name}
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-full border px-6 py-3.5 text-sm font-semibold"
          style={{ borderColor: 'var(--pact-hairline)', color: 'var(--pact-text)' }}
        >
          Create another
        </button>
      </div>

      <SuggestedPactsSection
        justPickedVibeId={createdPact.vibeId}
        justCreatedActivityLabel={createdPact.activityLabel}
      />
    </div>
  );
}
