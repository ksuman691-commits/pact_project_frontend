'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { queryKeys } from '@/lib/queryKeys';
import { dismissProfileNudge } from '@/lib/onboarding';
import type { ProfileChecklistItemId } from '@/hooks/useProfileCompletion';

interface ProfileNudgeCardProps {
  itemId: ProfileChecklistItemId;
  onDismiss: () => void;
}

const COPY: Record<ProfileChecklistItemId, { message: string; cta: string }> = {
  account: { message: '', cta: '' }, // never the missing item — always done
  photo: { message: 'Add a photo so your Circle knows it\u2019s really you.', cta: 'Add' },
  circle: { message: 'Join a Circle to start holding people (and yourself) accountable.', cta: 'Browse' },
  pact: { message: 'Create your first Pact to put a stake behind a goal.', cta: 'Create' },
};

/**
 * Returning/inactive-user variant of the profile-completion nudge — a single
 * quiet, dismissible card instead of the full checklist (see
 * useProfileCompletion for the new-vs-returning split). Dismissing suppresses
 * it for 7 days via localStorage (dismissProfileNudge), not permanently.
 */
export default function ProfileNudgeCard({ itemId, onDismiss }: ProfileNudgeCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const copy = COPY[itemId];

  const handleDismiss = () => {
    dismissProfileNudge();
    onDismiss();
  };

  const handleAction = () => {
    if (itemId === 'photo') {
      fileInputRef.current?.click();
      return;
    }
    if (itemId === 'circle') {
      router.push('/circles');
      return;
    }
    if (itemId === 'pact') {
      router.push('/pacts/create');
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const response = await authService.uploadAvatar(file);
      setUser(response.data);
      if (user?.id) queryClient.invalidateQueries({ queryKey: queryKeys.users.stats(user.id) });
      toast.success('Photo added!');
      onDismiss();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (!copy.message) return null;

  return (
    <div className="pact-card flex items-center gap-3 rounded-2xl px-4 py-3.5">
      <p className="flex-1 text-sm text-[var(--pact-text-dim)]">{copy.message}</p>

      <button
        type="button"
        onClick={handleAction}
        disabled={uploading}
        className="flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--pact-bg)] transition disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
      >
        {uploading ? 'Uploading\u2026' : copy.cta}
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[var(--pact-text-faint)] transition hover:bg-[var(--pact-surface-2)] hover:text-[var(--pact-text)]"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>

      {itemId === 'photo' && (
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
      )}
    </div>
  );
}
