'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Navbar from '@/components/Navbar';
import { circleService } from '@/services/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function CreateCirclePage() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true,
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
      await circleService.create(formData);
      toast.success('Circle created successfully!');
      router.push('/circles');
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
                      checked={formData.is_public}
                      onChange={() => setFormData({ ...formData, is_public: true })}
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
                      checked={!formData.is_public}
                      onChange={() => setFormData({ ...formData, is_public: false })}
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
