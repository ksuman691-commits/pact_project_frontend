'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCreateCircleFlow } from '@/context/CreateCircleFlowContext';
import { useCreateCircle } from '@/hooks/useCircleMutations';
import { circleAdvancedService } from '@/services/api';
import { toCreateCircleApiPayload } from '@/lib/createCircleFlow/toApiPayload';
import CircleCard from './CircleCard';
import { useAuthStore } from '@/store/auth';
import { useFollowers } from '@/hooks/useFollows';

export default function ReviewStep() {
  const { draft, setIsSubmitting, isSubmitting, setCreatedCircle, advanceToSuccess } = useCreateCircleFlow();
  const createCircle = useCreateCircle();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const me = useAuthStore((state) => state.user);
  const followers = ((useFollowers(me?.id).data as any)?.data || []) as any[];
  const followerCount = followers.length;
  const [tellFollowers, setTellFollowers] = useState(true);
  const isPrivate = draft.privacy != null && draft.privacy !== 'open';

  const handleCreate = async () => {
    if (isSubmitting) return; // double-tap guard
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = { ...toCreateCircleApiPayload(draft), notify_followers: followerCount > 0 && tellFollowers };
      const response = await createCircle.mutateAsync(payload);
      const created = response?.data ?? payload;

      // Invites are sent as a best-effort follow-up — a failure here
      // shouldn't block the circle itself from being reported as created.
      if (draft.inviteUserIds.length > 0 && created?.id) {
        await Promise.allSettled(
          draft.inviteUserIds.map((userId) => circleAdvancedService.inviteUser(created.id, userId)),
        );
      }

      // Photo upload is best-effort and non-blocking: a failed upload (e.g.
      // transient network error) shouldn't stop the circle from being
      // reported as created — the emoji fallback still renders fine.
      let photoUrl: string | null = null;
      if (draft.photoFile && created?.id) {
        try {
          const photoResponse = await circleAdvancedService.uploadPhoto(created.id, draft.photoFile);
          photoUrl = photoResponse?.data?.photo_url ?? null;
        } catch {
          photoUrl = null;
          toast.error("Circle created, but your photo didn't upload. It's showing your emoji for now.");
        }
      }

      setCreatedCircle({
        id: created?.id ?? Date.now(),
        name: payload.name,
        emoji: draft.emoji,
        tagline: payload.description,
        vibeId: draft.vibeId,
        privacy: draft.privacy ?? 'open',
        memberCount: created?.memberCount ?? 1,
        photoUrl,
      });
      advanceToSuccess();
    } catch (error) {
      setSubmitError('Something went wrong creating your circle. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">Review your circle</h1>
      <p className="mt-1 text-sm">This is what it&apos;ll look like.</p>

      <div className="mt-6">
        <CircleCard />
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-[18px] p-3.5" style={{ background: '#FBF8F1', border: '1px solid #DCD3C1' }}>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[15px] font-bold" style={{ color: '#17181D' }}>
            Tell My Followers
          </div>
          <div className="text-[12.5px] leading-snug" style={{ color: '#5A5C63' }}>
            {followerCount === 0
              ? 'No followers yet. Invite people after it’s made.'
              : `${followerCount.toLocaleString('en-IN')} ${followerCount === 1 ? 'follower gets' : 'followers get'} one notification${isPrivate ? ' and can ask to join' : ' and can join'}.`}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={followerCount > 0 && tellFollowers}
          aria-label="Tell my followers"
          disabled={followerCount === 0}
          onClick={() => setTellFollowers((value) => !value)}
          className="relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:opacity-50"
          style={{ background: followerCount > 0 && tellFollowers ? '#1F3A93' : '#D4D5D9' }}
        >
          <span className="absolute top-1 h-6 w-6 rounded-full bg-white transition-all" style={{ left: followerCount > 0 && tellFollowers ? 24 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>

      {submitError && (
        <p role="alert" className="mt-4 text-sm" style={{ color: 'var(--flow-accent)' }}>
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={isSubmitting}
        className="mt-8 w-full rounded-full px-6 py-4 text-center text-base font-semibold text-[var(--pact-bg)] transition-opacity disabled:opacity-60"
        style={{ background: 'var(--navy)' }}
      >
        {isSubmitting ? 'Creating…' : '👯 Create Circle →'}
      </button>
    </div>
  );
}
