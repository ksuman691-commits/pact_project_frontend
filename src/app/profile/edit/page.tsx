'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/api';
import { Upload, ArrowLeft } from 'lucide-react';
import LogoMark from '@/components/LogoMark';
import { useSmartBack } from '@/hooks/useSmartBack';
import toast from 'react-hot-toast';

const inputClass =
  'w-full px-4 py-3 rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-bg)] text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]';
const inputDisabledClass =
  'w-full px-4 py-3 rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] text-[var(--pact-text-faint)] focus:outline-none';
const labelClass = 'pact-mono block text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2';

export default function EditProfilePage() {
  const router = useRouter();
  const goBack = useSmartBack('/feed');
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    username: user?.username || '',
    bio: '',
    email: user?.email || '',
  });

  if (!user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mock API call
      toast.success('Profile updated successfully!');
      router.push('/profile');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setAvatarUploading(true);
    try {
      const response = await authService.uploadAvatar(file);
      setUser(response.data);
      setAvatarPreview(response.data.avatar_url || null);
      toast.success('Avatar uploaded successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="pact-flow pact-page-enter min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: 'rgba(20,9,31,0.85)', borderColor: 'var(--pact-hairline)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={goBack}
            className="p-2 rounded-full transition hover:bg-[var(--pact-surface-2)]"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--pact-text-dim)]" />
          </button>
          <h1 className="text-xl font-bold text-[var(--pact-text)]">Edit Profile</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="pact-card rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className={labelClass}>Profile Picture</label>
              <div className="flex items-center gap-4">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-3xl"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
                >
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-3xl object-cover"
                    />
                  ) : (
                    <LogoMark size={40} />
                  )}
                </div>
                <div>
                  <label className="pact-btn-glow inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium transition cursor-pointer" style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}>
                    <Upload className="w-4 h-4" />
                    {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-[var(--pact-text-faint)] mt-2">JPG, PNG or GIF (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Your full name"
              />
            </div>

            {/* Username */}
            <div>
              <label className={labelClass}>Username</label>
              <div className="flex items-center">
                <span className="px-4 py-3 rounded-l-[28px] border border-r-0 border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] text-[var(--pact-text-faint)] font-medium">
                  @
                </span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled
                  className="flex-1 px-4 py-3 rounded-r-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] text-[var(--pact-text-faint)] focus:outline-none"
                  placeholder="username"
                />
              </div>
              <p className="text-xs text-[var(--pact-text-faint)] mt-1">Username cannot be changed</p>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className={inputDisabledClass}
                placeholder="your@email.com"
              />
              <p className="text-xs text-[var(--pact-text-faint)] mt-1">Email cannot be changed</p>
            </div>

            {/* Bio */}
            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                maxLength={160}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-[var(--pact-text-faint)] mt-1">{formData.bio.length}/160 characters</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t" style={{ borderColor: 'var(--pact-hairline)' }}>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 rounded-full font-medium transition border"
                style={{ borderColor: 'var(--pact-hairline)', color: 'var(--pact-text-dim)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="pact-btn-glow flex-1 px-6 py-3 rounded-full font-medium transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 rounded-3xl p-8 border" style={{ background: 'rgba(255,79,135,0.08)', borderColor: 'var(--pact-pink)' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--pact-pink)' }}>Danger Zone</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--pact-text-dim)' }}>These actions cannot be undone</p>
          <button
            className="px-4 py-2 rounded-full font-medium transition"
            style={{ background: 'var(--pact-pink)', color: 'var(--pact-text)' }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
