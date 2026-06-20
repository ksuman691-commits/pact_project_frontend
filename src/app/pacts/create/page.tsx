'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Navbar from '@/components/Navbar';
import { pactService, circleService } from '@/services/api';
import { Circle } from '@/types';
import toast from 'react-hot-toast';

export default function CreatePactPage() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stake_amount: 0,
    deadline: '',
    verification_type: 'video',
    circle_id: 0,
    required_approvers: 4,
    is_public: false, // NEW: Public/Private pact
  });

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchCircles = async () => {
      try {
        const response = await circleService.list();
        setCircles(response.data);
        if (response.data.length > 0) {
          setFormData((prev) => ({ ...prev, circle_id: response.data[0].id }));
        }
      } catch (error) {
        toast.error('Failed to load circles');
      }
    };

    fetchCircles();
  }, [user, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    
    setFormData({
      ...formData,
      [name]: (name === 'stake_amount' || name === 'circle_id' || name === 'required_approvers') && !isCheckbox
        ? Number(inputValue) 
        : inputValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.circle_id) {
      toast.error('Please select a circle');
      return;
    }

    if (formData.stake_amount < 99) {
      toast.error('Stake amount must be at least ₹99.');
      return;
    }

    setLoading(true);
    try {
      const response = await pactService.create(formData);
      toast.success('Pact created successfully!');
      router.push(`/pacts/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create pact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Create New Pact</h1>

          <form onSubmit={handleSubmit} className="card space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pact Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g., Lose 5kg in 60 days"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="input-field h-24 resize-none"
                placeholder="Describe your pact in detail..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stake Amount (₹)
                </label>
                <input
                  type="number"
                  name="stake_amount"
                  value={formData.stake_amount}
                  onChange={handleChange}
                  min="99"
                  className="input-field"
                  placeholder="99"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Minimum stake is ₹99 and your wallet must have sufficient balance.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Type
                </label>
                <select
                  name="verification_type"
                  value={formData.verification_type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Required Approvers
                </label>
                <input
                  type="number"
                  name="required_approvers"
                  value={formData.required_approvers}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Circle *
              </label>
              <select
                name="circle_id"
                value={formData.circle_id}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select a circle</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Pact Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                  <span className="ml-3 text-sm text-slate-700">
                    Public Pact (Anyone can see and join)
                  </span>
                </label>
                <p className="text-xs text-slate-500 ml-7">
                  {formData.is_public 
                    ? '✓ Public: Anyone from the community can discover and request to join this pact'
                    : '✓ Private: Only circle members can see and request to join'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Pact'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
