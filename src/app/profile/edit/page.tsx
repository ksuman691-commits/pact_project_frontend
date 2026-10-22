'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { authService } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useSmartBack } from '@/hooks/useSmartBack';

const INK = '#17181D';
const MUTED = '#5A5C63';
const NAVY = '#1F3A93';
const LINE = '#DCD3C1';
const BIO_MAX = 160;

export default function EditProfilePage() {
  const goBack = useSmartBack('/profile');
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  useEffect(() => setAvatarBroken(false), [user?.avatar_url]);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  // /profile/edit#bio (from "Add a bio" on the profile) lands with the bio focused.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#bio') bioRef.current?.focus();
  }, []);

  if (!user) return null;

  const changed = name.trim() !== (user.full_name || '') || bio.trim() !== (user.bio || '');

  const save = async () => {
    if (!name.trim()) {
      toast.error("Your name can't be empty");
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch('/api/users/me', { full_name: name.trim(), bio: bio.trim() });
      setUser({ ...user, full_name: response.data.full_name, bio: response.data.bio ?? '' });
      toast.success('Profile saved');
      goBack();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvatarUploading(true);
    try {
      const response = await authService.uploadAvatar(file);
      setUser(response.data);
      toast.success('Photo updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not upload that photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const field = 'mt-2 w-full rounded-[14px] px-4 text-[16px] outline-none';

  return (
    <main className="min-h-screen pb-28" style={{ background: 'var(--paper)', color: INK }}>
      <header className="sticky top-0 z-30 flex h-14 items-center px-2" style={{ background: 'rgba(244,239,228,0.94)', backdropFilter: 'blur(12px)' }}>
        <button type="button" onClick={goBack} aria-label="Go back" className="flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex-1 text-center text-[16px] font-bold" style={{ color: INK }}>Edit profile</div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!changed || saving}
          className="h-11 px-3 text-[15px] font-extrabold disabled:opacity-40"
          style={{ color: NAVY }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div className="mx-auto max-w-md px-4">
        <div className="flex flex-col items-center pt-4">
          <label className="relative cursor-pointer">
            <span className="relative flex size-24 items-center justify-center overflow-hidden rounded-full text-[30px] font-extrabold" style={{ background: INK, color: '#FFFFFF' }}>
              {user.avatar_url && !avatarBroken ? <Image src={user.avatar_url} alt="" fill sizes="96px" unoptimized onError={() => setAvatarBroken(true)} className="object-cover" /> : name.charAt(0).toUpperCase() || '?'}
            </span>
            <span className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full" style={{ background: NAVY, color: '#FFFFFF', border: '3px solid var(--paper)' }}>
              <Camera className="size-4" />
            </span>
            <input type="file" accept="image/*" onChange={(e) => void uploadAvatar(e)} disabled={avatarUploading} className="sr-only" />
          </label>
          <div className="mt-2 text-[13px] font-semibold" style={{ color: avatarUploading ? MUTED : NAVY }}>{avatarUploading ? 'Uploading…' : 'Change photo'}</div>
        </div>

        <label className="mt-6 block">
          <span className="text-[13px] font-bold" style={{ color: INK }}>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={`${field} h-12`} style={{ border: `1.5px solid ${LINE}`, background: '#FFFFFF', color: INK }} />
        </label>

        <label className="mt-4 block" id="bio">
          <span className="flex items-baseline justify-between">
            <span className="text-[13px] font-bold" style={{ color: INK }}>Bio</span>
            <span className="text-[12px]" style={{ color: bio.length > BIO_MAX - 20 ? NAVY : MUTED }}>{bio.length}/{BIO_MAX}</span>
          </span>
          <textarea
            ref={bioRef}
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            rows={3}
            placeholder="What are you working on? e.g. Gym at 6. Writing the rest of the day."
            className={`${field} resize-none py-3 leading-snug`}
            style={{ border: `1.5px solid ${LINE}`, background: '#FFFFFF', color: INK }}
          />
        </label>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <span className="text-[13px] font-bold" style={{ color: INK }}>Username</span>
            <div className="mt-2 flex h-12 items-center rounded-[14px] px-4 text-[16px]" style={{ background: 'var(--card-muted)', color: MUTED }}>@{user.username}</div>
          </div>
          <div>
            <span className="text-[13px] font-bold" style={{ color: INK }}>Email</span>
            <div className="mt-2 flex h-12 items-center truncate rounded-[14px] px-4 text-[16px]" style={{ background: 'var(--card-muted)', color: MUTED }}>{user.email}</div>
            <div className="mt-1 text-[12px]" style={{ color: MUTED }}>Only you can see your email.</div>
          </div>
        </div>

        <Link href="/profile/tips" className="mt-6 flex min-h-14 items-center gap-3 rounded-[18px] px-4" style={{ background: 'var(--card)', border: `1px solid ${LINE}` }}>
          <span className="flex size-9 items-center justify-center rounded-full" style={{ background: NAVY, color: '#FFFFFF' }}>
            <IndianRupee className="size-4" strokeWidth={2.4} />
          </span>
          <span className="flex-1 text-[15px] font-bold" style={{ color: INK }}>Tips</span>
          <ChevronRight className="size-5" style={{ color: MUTED }} />
        </Link>
      </div>
    </main>
  );
}
