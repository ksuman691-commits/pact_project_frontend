'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Clock, Users, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateDare } from '@/hooks/useDareMutations';
import { useSearchUsers } from '@/hooks/useUserQueries';
import { useAuthStore } from '@/store/auth';
import ProgressDots from '@/components/create-pact-flow/ProgressDots';

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
    <div className="pact-flow fixed inset-0 bg-black/60 flex items-end z-50">
      <div
        className="pact-page-enter w-full max-w-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: 'var(--pact-bg)', border: '1px solid var(--pact-hairline)', borderBottom: 'none' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--pact-hairline)] sticky top-0" style={{ background: 'var(--pact-bg)' }}>
          <h2 className="text-lg font-bold text-[var(--pact-text)]">Create Dare</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--pact-surface)' }}>
            <X className="w-5 h-5 text-[var(--pact-text)]" />
          </button>
        </div>

        <div className="px-6 pt-5">
          <ProgressDots current={step - 1} total={4} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Title & Description */}
          {step === 1 && (
            <div className="pact-step-enter space-y-4">
              <h1 className="text-2xl font-bold text-[var(--pact-text)]">Dare someone</h1>
              <p className="text-sm text-[var(--pact-text-dim)]">Set the challenge — the details come next.</p>
              <div>
                <label className="pact-mono block text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2">Dare Title</label>
                <input
                  type="text"
                  placeholder="e.g., Run 5k in under 30 minutes"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]"
                />
              </div>
              <div>
                <label className="pact-mono block text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2">Description</label>
                <textarea
                  placeholder="Tell them more about the dare..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)] resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Durations */}
          {step === 2 && (
            <div className="pact-step-enter space-y-6">
              <h1 className="text-2xl font-bold text-[var(--pact-text)]">Set the clock</h1>
              <div>
                <label className="pact-mono text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2 flex items-center gap-2">
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
                          ? ''
                          : 'bg-[var(--pact-surface)] text-[var(--pact-text-dim)] hover:bg-[var(--pact-surface-2)]'
                      }`}
                      style={form.respondByHours === option.hours ? { background: 'var(--pact-pink)', color: 'var(--pact-bg)' } : undefined}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="pact-mono text-xs text-[var(--pact-text-faint)] mt-2">Users have {form.respondByHours} hours to accept</p>
              </div>
              <div>
                <label className="pact-mono text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2 flex items-center gap-2">
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
                          ? ''
                          : 'bg-[var(--pact-surface)] text-[var(--pact-text-dim)] hover:bg-[var(--pact-surface-2)]'
                      }`}
                      style={form.completeByHours === option.hours ? { background: 'var(--pact-pink)', color: 'var(--pact-bg)' } : undefined}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="pact-mono text-xs text-[var(--pact-text-faint)] mt-2">Users must complete within {form.completeByHours} hours</p>
              </div>
            </div>
          )}

          {/* Step 3: Recipients */}
          {step === 3 && (
            <div className="pact-step-enter space-y-4">
              <h1 className="text-2xl font-bold text-[var(--pact-text)]">Who&apos;s in?</h1>
              <div>
                <label className="pact-mono block text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2">Visibility</label>
                <div className="space-y-2">
                  {[
                    { id: 'public', label: 'Public', desc: 'Anyone can see and claim' },
                    { id: 'private', label: 'Private', desc: 'Only invite specific people' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setForm({ ...form, visibility: opt.id as 'public' | 'private' })}
                      className={`pact-tile w-full p-3 rounded-[28px] text-left ${
                        form.visibility === opt.id ? 'selected' : ''
                      }`}
                    >
                      <p className="font-semibold text-[var(--pact-text)]">{opt.label}</p>
                      <p className="text-sm text-[var(--pact-text-dim)]">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.visibility === 'private' && (
                <div className="pact-step-enter">
                  <label className="pact-mono block text-xs uppercase tracking-wide text-[var(--pact-text-dim)] mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Add Recipients
                  </label>

                  {form.recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.recipients.map((recipient) => (
                        <div
                          key={recipient.id}
                          className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full"
                          style={{ background: 'var(--pact-surface-2)' }}
                        >
                          <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-[var(--pact-violet)] to-[var(--pact-pink)] flex-shrink-0 overflow-hidden">
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
                          <span className="text-sm text-[var(--pact-text-dim)]">@{recipient.username}</span>
                          <button
                            onClick={() => handleRemoveRecipient(recipient.id)}
                            className="text-[var(--pact-text-faint)] hover:text-[var(--pact-pink)]"
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
                      className="w-full px-4 py-2.5 rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] text-[var(--pact-text)] placeholder:text-[var(--pact-text-faint)] focus:outline-none focus:border-[var(--pact-pink)]"
                    />

                    {recipientQuery.trim().length > 0 && (
                      <div
                        className="absolute left-0 right-0 mt-1 rounded-[20px] max-h-56 overflow-y-auto z-10"
                        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)', boxShadow: '0 12px 28px var(--pact-shadow-violet)' }}
                      >
                        {isSearchingRecipients ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader className="w-5 h-5 text-[var(--pact-violet)] animate-spin" />
                          </div>
                        ) : recipientSearchResults.length === 0 ? (
                          <div className="flex items-center justify-center py-6 text-[var(--pact-text-faint)]">
                            <p className="text-sm">No users found</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[var(--pact-hairline)]">
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
                                className="w-full flex items-center gap-3 p-3 hover:bg-[var(--pact-surface-2)] transition text-left"
                              >
                                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[var(--pact-violet)] to-[var(--pact-pink)] flex-shrink-0 overflow-hidden">
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
                                  <p className="font-medium text-[var(--pact-text)] text-sm truncate">
                                    {candidate.full_name || candidate.username}
                                  </p>
                                  <p className="text-xs text-[var(--pact-text-faint)] truncate">@{candidate.username}</p>
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
            <div className="pact-step-enter space-y-4">
              <h1 className="text-2xl font-bold text-[var(--pact-text)]">How should they prove it?</h1>
              <div className="space-y-2">
                {VERIFICATION_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setForm({ ...form, verification_method: method.id as any })}
                    className={`pact-tile w-full p-3 rounded-[28px] text-left ${
                      form.verification_method === method.id ? 'selected' : ''
                    }`}
                  >
                    <p className="font-semibold text-[var(--pact-text)]">{method.label}</p>
                    <p className="text-sm text-[var(--pact-text-dim)]">{method.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="pact-step-enter space-y-4">
              <h1 className="text-2xl font-bold text-[var(--pact-text)]">Review the dare</h1>
              <div className="rounded-[28px] p-4 space-y-3" style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}>
                <div>
                  <p className="pact-mono text-xs font-semibold text-[var(--pact-text-faint)] uppercase">Title</p>
                  <p className="text-[var(--pact-text)] font-semibold">{form.title}</p>
                </div>
                <div>
                  <p className="pact-mono text-xs font-semibold text-[var(--pact-text-faint)] uppercase">Description</p>
                  <p className="text-[var(--pact-text-dim)]">{form.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--pact-hairline)]">
                  <div>
                    <p className="pact-mono text-xs font-semibold text-[var(--pact-text-faint)] uppercase">Respond By</p>
                    <p className="pact-mono text-[var(--pact-text)]">{form.respondByHours} hours</p>
                  </div>
                  <div>
                    <p className="pact-mono text-xs font-semibold text-[var(--pact-text-faint)] uppercase">Complete By</p>
                    <p className="pact-mono text-[var(--pact-text)]">{form.completeByHours} hours</p>
                  </div>
                </div>
                <div>
                  <p className="pact-mono text-xs font-semibold text-[var(--pact-text-faint)] uppercase">Visibility</p>
                  <p className="text-[var(--pact-text)] capitalize">{form.visibility}</p>
                </div>
                {form.recipients.length > 0 && (
                  <div>
                    <p className="pact-mono text-xs font-semibold text-[var(--pact-text-faint)] uppercase">Recipients</p>
                    <p className="text-[var(--pact-text)]">{form.recipients.map((r) => `@${r.username}`).join(', ')}</p>
                  </div>
                )}
                <div>
                  <p className="pact-mono text-xs font-semibold text-[var(--pact-text-faint)] uppercase">Verification</p>
                  <p className="text-[var(--pact-text)] capitalize">{form.verification_method}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--pact-hairline)] sticky bottom-0" style={{ background: 'var(--pact-bg)' }}>
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="pact-btn-glow flex items-center gap-2 px-4 py-2.5 text-[var(--pact-text-dim)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--pact-surface)] rounded-[28px]"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={step === 5 ? handleSubmit : handleNext}
            disabled={createDareMutation.isPending}
            className="pact-btn-glow flex items-center gap-2 px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed rounded-[28px]"
            style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
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
