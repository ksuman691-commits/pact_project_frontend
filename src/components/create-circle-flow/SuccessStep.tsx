'use client';

import { useRouter } from 'next/navigation';
import { useCreateCircleFlow } from '@/context/CreateCircleFlowContext';
import SuggestedPeopleSection from './SuggestedPeopleSection';

export default function SuccessStep() {
  const { createdCircle, draft, reset } = useCreateCircleFlow();
  const router = useRouter();

  if (!createdCircle) return null;

  return (
    <div className="pact-step-enter flex flex-1 flex-col items-center pt-4 text-center">
      {/* Decorative stamp — same ring motion as the Pact flow's success
          stamp, but recolored to Circle's violet→mint accent so it reads
          as a distinct flow even on this terminal screen. */}
      <div className="pact-stamp-ring relative flex h-24 w-24 items-center justify-center rounded-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, var(--flow-accent), var(--pact-gold), var(--flow-accent-2), var(--flow-accent))',
          }}
        />
        <div
          className="absolute inset-[6px] flex items-center justify-center rounded-full text-3xl"
          style={{ background: 'var(--pact-bg)' }}
        >
          {createdCircle.emoji}
        </div>
      </div>

      <h1 className="mt-6 text-2xl font-bold">Your circle is live.</h1>
      <p className="mt-2 text-base font-medium" style={{ color: 'var(--pact-text)' }}>
        {createdCircle.name}
      </p>
      <p className="mt-1 text-sm">Now get someone to make a pact in it.</p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push(`/pacts/create?circleId=${createdCircle.id}`)}
          className="w-full rounded-full px-6 py-3.5 text-sm font-semibold text-[var(--pact-bg)]"
          style={{ background: 'linear-gradient(135deg, var(--flow-accent), var(--flow-accent-2))' }}
        >
          🔥 Start a Pact for this Circle
        </button>
        <button
          type="button"
          onClick={() => router.push(`/circles/${createdCircle.id}`)}
          className="w-full rounded-full border px-6 py-3.5 text-sm font-semibold"
          style={{ borderColor: 'var(--pact-hairline)', color: 'var(--pact-text)' }}
        >
          View circle
        </button>
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-full px-6 py-2 text-center text-xs font-semibold"
          style={{ color: 'var(--pact-text-muted)' }}
        >
          Create another
        </button>
      </div>

      <SuggestedPeopleSection circleId={createdCircle.id} alreadyInvitedIds={draft.inviteUserIds} />
    </div>
  );
}
