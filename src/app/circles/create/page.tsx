'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Navbar from '@/components/Navbar';
import { useCreateCircle } from '@/hooks/useCircleMutations';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const iconChoices = ['🚀', '💪', '💻', '📚', '⚡', '👥', '🎯', '🔥', '🌱', '🧠'];

export default function CreateCirclePage() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const createCircleMutation = useCreateCircle();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_emoji: '🚀',
  });

  if (!isInitialized) {
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--pact-pink)]" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Circle name is required');
      return;
    }

    setLoading(true);
    try {
      const createdCircleResponse = await createCircleMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim(),
        visibility: 'public',
        icon_emoji: formData.icon_emoji,
      });
      router.push(`/circles/${createdCircleResponse.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create circle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="pact-flow pact-page-enter min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--pact-violet)] hover:text-[var(--pact-pink)] transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Form Card */}
          <div className="pact-card rounded-[28px] p-6">
            <h1 className="text-3xl font-bold text-[var(--pact-text)] mb-8">Create a New Circle</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Circle Name */}
              <div>
                <label className="pact-mono block text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2">
                  Circle Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Early Morning Runners"
                  className="w-full px-4 py-3 rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-bg)] text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="pact-mono block text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your circle..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-bg)] text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="pact-mono block text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2">
                  Circle Icon / Emoji
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconChoices.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon_emoji: emoji })}
                      className={`pact-tile rounded-2xl px-0 py-3 text-xl ${
                        formData.icon_emoji === emoji ? 'selected' : ''
                      }`}
                      aria-label={`Choose ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--pact-violet)]/40 bg-[var(--pact-surface-2)] px-4 py-3 text-sm text-[var(--pact-text-dim)]">
                Every circle is joinable. Circle pacts stay visible only to members of that circle.
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="pact-btn-glow flex-1 rounded-full py-3 font-bold transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
                >
                  {loading ? 'Creating...' : 'Create Circle'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="pact-btn-glow flex-1 rounded-full py-3 font-bold border"
                  style={{ borderColor: 'var(--pact-violet)', background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
