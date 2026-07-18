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
    visibility: 'public' as 'public' | 'private',
    icon_emoji: '🚀',
  });

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
        visibility: formData.visibility,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Form Card */}
          <div className="card">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Create a New Circle</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Circle Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Circle Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Early Morning Runners"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your circle..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Circle Icon / Emoji
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconChoices.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon_emoji: emoji })}
                      className={`rounded-xl border px-0 py-3 text-xl transition ${
                        formData.icon_emoji === emoji
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      aria-label={`Choose ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Privacy
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      checked={formData.visibility === 'public'}
                      onChange={() => setFormData({ ...formData, visibility: 'public' })}
                      className="w-4 h-4"
                    />
                    <span>
                      <span className="font-medium text-slate-900">Public</span>
                      <p className="text-sm text-slate-600">Anyone can find and join this circle</p>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      checked={formData.visibility === 'private'}
                      onChange={() => setFormData({ ...formData, visibility: 'private' })}
                      className="w-4 h-4"
                    />
                    <span>
                      <span className="font-medium text-slate-900">Private</span>
                      <p className="text-sm text-slate-600">Only invited members can join</p>
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-3 font-bold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Circle'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 btn-secondary py-3 font-bold"
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
