'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Clock, Users, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateDare } from '@/hooks/useDareMutations';
import { useSearchUsers } from '@/hooks/useUserQueries';
import { useAuthStore } from '@/store/auth';

interface CreateDareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedRecipient {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string | null;
}

interface DareFormData {
  title: string;
  description: string;
  respondByHours: number;
  completeByHours: number;
  recipients: SelectedRecipient[];
  verification_method: 'photo' | 'video' | 'checklist';
  visibility: 'public' | 'private';
  circle_id?: number;
}

const RESPOND_BY_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
];

const COMPLETE_BY_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
];

const INITIAL_FORM: DareFormData = {
  title: '',
  description: '',
  respondByHours: 12,
  completeByHours: 24,
  recipients: [],
  verification_method: 'photo',
  visibility: 'public',
};

const VERIFICATION_METHODS = [
  { id: 'photo', label: 'Photo', description: 'Submit photo proof' },
  { id: 'video', label: 'Video', description: 'Submit video proof' },
  { id: 'checklist', label: 'Checklist', description: 'Complete checklist' },
];

export default function CreateDareModal({ isOpen, onClose }: CreateDareModalProps) {
  const { user } = useAuthStore();
  const createDareMutation = useCreateDare();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DareFormData>(INITIAL_FORM);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(recipientQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [recipientQuery]);

  const { data: recipientResults, isLoading: isSearchingRecipients } = useSearchUsers(debouncedQuery, 8);
  const recipientSearchResults = (recipientResults?.data || []).filter(
    (candidate: any) => !form.recipients.some((selected) => selected.id === candidate.id)
  );

  const handleNext = () => {
    if (step === 1 && (!form.title.trim() || !form.description.trim())) {
      toast.error('Please fill in title and description');
      return;
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSelectRecipient = (candidate: SelectedRecipient) => {
    if (form.visibility === 'public') {
      toast.error('Public dares cannot have specific recipients');
      return;
    }
    setForm({ ...form, recipients: [...form.recipients, candidate] });
    setRecipientQuery('');
    setDebouncedQuery('');
  };

  const handleRemoveRecipient = (id: number) => {
    setForm({ ...form, recipients: form.recipients.filter((r) => r.id !== id) });
  };

  const handleSubmit = () => {
    if (form.visibility !== 'public' && form.recipients.length === 0) {
      toast.error('Please add at least one recipient or make it public');
      return;
    }

    const now = Date.now();
    const respondBy = new Date(now + form.respondByHours * 60 * 60 * 1000).toISOString();
    const completeBy = new Date(now + form.completeByHours * 60 * 60 * 1000).toISOString();

    // Backend has no "circle" audience option surfaced in this UI yet, so
    // private dares map to "individual" (recipient-based) audience.
    const audience: 'public' | 'individual' = form.visibility === 'public' ? 'public' : 'individual';
    const recipientUserIds: number[] = form.recipients.map((recipient) => recipient.id);

    const payload: any = {
      title: form.title,
      description: form.description,
      respond_by: respondBy,
      complete_by: completeBy,
      verification_method: form.verification_method,
      audience,
    };

    if (recipientUserIds.length > 0) {
      payload.recipient_user_ids = recipientUserIds;
    }

    createDareMutation.mutate(payload, {
      onSuccess: () => {
        setForm(INITIAL_FORM);
        setStep(1);
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full max-w-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(20,18,31,0.06)] sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-[#14121F]">Create Dare</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#FAF9FE] rounded-[28px]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Title & Description */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#14121F] mb-2">Dare Title</label>
                <input
                  type="text"
                  placeholder="e.g., Run 5k in under 30 minutes"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14121F] mb-2">Description</label>
                <textarea
                  placeholder="Tell them more about the dare..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Durations */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#14121F] mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Respond By
                </label>
                <div className="flex flex-wrap gap-2">
                  {RESPOND_BY_OPTIONS.map((option) => (
                    <button
                      key={option.hours}
                      type="button"
                      onClick={() => setForm({ ...form, respondByHours: option.hours })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        form.respondByHours === option.hours
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_4px_12px_rgba(94,84,142,0.08)]'
                          : 'bg-[#FAF9FE] text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#9CA3AF] mt-2">Users have {form.respondByHours} hours to accept</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14121F] mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Complete By
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPLETE_BY_OPTIONS.map((option) => (
                    <button
                      key={option.hours}
                      type="button"
                      onClick={() => setForm({ ...form, completeByHours: option.hours })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        form.completeByHours === option.hours
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_4px_12px_rgba(94,84,142,0.08)]'
                          : 'bg-[#FAF9FE] text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#9CA3AF] mt-2">Users must complete within {form.completeByHours} hours</p>
              </div>
            </div>
          )}

          {/* Step 3: Recipients */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#14121F] mb-2">Visibility</label>
                <div className="space-y-2">
                  {[
                    { id: 'public', label: 'Public', desc: 'Anyone can see and claim' },
                    { id: 'private', label: 'Private', desc: 'Only invite specific people' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setForm({ ...form, visibility: opt.id as 'public' | 'private' })}
                      className={`w-full p-3 rounded-[28px] border-2 text-left transition ${
                        form.visibility === opt.id
                          ? 'border-emerald-600 bg-[#EDE9FE]'
                          : 'border-[rgba(20,18,31,0.06)] hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-[#14121F]">{opt.label}</p>
                      <p className="text-sm text-[#6B7280]">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.visibility === 'private' && (
                <div>
                  <label className="block text-sm font-semibold text-[#14121F] mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Add Recipients
                  </label>

                  {form.recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.recipients.map((recipient) => (
                        <div
                          key={recipient.id}
                          className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 bg-[#F4F2FB] rounded-full"
                        >
                          <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-emerald-300 to-blue-300 flex-shrink-0 overflow-hidden">
                            {recipient.avatar_url ? (
                              <Image
                                src={recipient.avatar_url}
                                alt={recipient.username}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                                {(recipient.full_name || recipient.username)?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-slate-700">@{recipient.username}</span>
                          <button
                            onClick={() => handleRemoveRecipient(recipient.id)}
                            className="text-slate-400 hover:text-red-600"
                            aria-label={`Remove @${recipient.username}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name or username"
                      value={recipientQuery}
                      onChange={(e) => setRecipientQuery(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    {recipientQuery.trim().length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[20px] shadow-lg max-h-56 overflow-y-auto z-10">
                        {isSearchingRecipients ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader className="w-5 h-5 text-[#A78BFA] animate-spin" />
                          </div>
                        ) : recipientSearchResults.length === 0 ? (
                          <div className="flex items-center justify-center py-6 text-gray-500">
                            <p className="text-sm">No users found</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {recipientSearchResults.map((candidate: any) => (
                              <button
                                key={candidate.id}
                                type="button"
                                onClick={() =>
                                  handleSelectRecipient({
                                    id: candidate.id,
                                    username: candidate.username,
                                    full_name: candidate.full_name,
                                    avatar_url: candidate.avatar_url,
                                  })
                                }
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                              >
                                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-blue-300 flex-shrink-0 overflow-hidden">
                                  {candidate.avatar_url ? (
                                    <Image
                                      src={candidate.avatar_url}
                                      alt={candidate.full_name || candidate.username}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
                                      {(candidate.full_name || candidate.username)?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {candidate.full_name || candidate.username}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">@{candidate.username}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Verification Method */}
          {step === 4 && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[#14121F] mb-4">How should they prove it?</label>
              <div className="space-y-2">
                {VERIFICATION_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setForm({ ...form, verification_method: method.id as any })}
                    className={`w-full p-3 rounded-[28px] border-2 text-left transition ${
                      form.verification_method === method.id
                        ? 'border-emerald-600 bg-[#EDE9FE]'
                        : 'border-[rgba(20,18,31,0.06)] hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-[#14121F]">{method.label}</p>
                    <p className="text-sm text-[#6B7280]">{method.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-[#F4F2FB] rounded-[28px] p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase">Title</p>
                  <p className="text-[#14121F] font-semibold">{form.title}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase">Description</p>
                  <p className="text-slate-700">{form.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[rgba(20,18,31,0.06)]">
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase">Respond By</p>
                    <p className="text-[#14121F]">{form.respondByHours} hours</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase">Complete By</p>
                    <p className="text-[#14121F]">{form.completeByHours} hours</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase">Visibility</p>
                  <p className="text-[#14121F] capitalize">{form.visibility}</p>
                </div>
                {form.recipients.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase">Recipients</p>
                    <p className="text-[#14121F]">{form.recipients.map((r) => `@${r.username}`).join(', ')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase">Verification</p>
                  <p className="text-[#14121F] capitalize">{form.verification_method}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-4 border-t border-[rgba(20,18,31,0.06)] bg-white sticky bottom-0">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FAF9FE] rounded-[28px]"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition ${s <= step ? 'bg-[#A78BFA] w-4' : 'bg-slate-300 w-2'}`}
              />
            ))}
          </div>

          <button
            onClick={step === 5 ? handleSubmit : handleNext}
            disabled={createDareMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#A78BFA] text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-[28px]"
          >
            {step === 5 ? (
              createDareMutation.isPending ? 'Creating...' : 'Create Dare'
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
