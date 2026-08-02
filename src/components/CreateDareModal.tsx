'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateDare } from '@/hooks/useDareMutations';
import { useAuthStore } from '@/store/auth';

interface CreateDareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DareFormData {
  title: string;
  description: string;
  respondByDate: string;
  completeByDate: string;
  recipients: string[];
  verification_method: 'photo' | 'video' | 'checklist';
  visibility: 'public' | 'private';
  circle_id?: number;
}

const INITIAL_FORM: DareFormData = {
  title: '',
  description: '',
  respondByDate: '',
  completeByDate: '',
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
  const [recipientEmail, setRecipientEmail] = useState('');

  const handleNext = () => {
    if (step === 1 && (!form.title.trim() || !form.description.trim())) {
      toast.error('Please fill in title and description');
      return;
    }
    if (step === 2 && (!form.respondByDate || !form.completeByDate)) {
      toast.error('Please select both dates');
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

  const handleAddRecipient = () => {
    if (form.visibility === 'public') {
      toast.error('Public dares cannot have specific recipients');
      return;
    }
    if (!recipientEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (!form.recipients.includes(recipientEmail)) {
      setForm({ ...form, recipients: [...form.recipients, recipientEmail] });
      setRecipientEmail('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setForm({ ...form, recipients: form.recipients.filter((r) => r !== email) });
  };

  const handleSubmit = async () => {
    if (form.visibility !== 'public' && form.recipients.length === 0) {
      toast.error('Please add at least one recipient or make it public');
      return;
    }

    const payload: any = {
      title: form.title,
      description: form.description,
      respond_by_date: form.respondByDate,
      complete_by_date: form.completeByDate,
      verification_method: form.verification_method,
      visibility: form.visibility,
    };

    if (form.recipients.length > 0) {
      payload.recipient_emails = form.recipients;
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
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Create Dare</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Title & Description */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Dare Title</label>
                <input
                  type="text"
                  placeholder="e.g., Run 5k in under 30 minutes"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                <textarea
                  placeholder="Tell them more about the dare..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Dates */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Respond By Date
                </label>
                <input
                  type="datetime-local"
                  value={form.respondByDate}
                  onChange={(e) => setForm({ ...form, respondByDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Users have until this date to accept</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Complete By Date
                </label>
                <input
                  type="datetime-local"
                  value={form.completeByDate}
                  onChange={(e) => setForm({ ...form, completeByDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Users must complete by this date</p>
              </div>
            </div>
          )}

          {/* Step 3: Recipients */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Visibility</label>
                <div className="space-y-2">
                  {[
                    { id: 'public', label: 'Public', desc: 'Anyone can see and claim' },
                    { id: 'private', label: 'Private', desc: 'Only invite specific people' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setForm({ ...form, visibility: opt.id as 'public' | 'private' })}
                      className={`w-full p-3 rounded-lg border-2 text-left transition ${
                        form.visibility === opt.id
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{opt.label}</p>
                      <p className="text-sm text-slate-600">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.visibility === 'private' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Add Recipients
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleAddRecipient}
                      className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.recipients.map((email) => (
                      <div key={email} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">{email}</p>
                        <button
                          onClick={() => handleRemoveRecipient(email)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Verification Method */}
          {step === 4 && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-900 mb-4">How should they prove it?</label>
              <div className="space-y-2">
                {VERIFICATION_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setForm({ ...form, verification_method: method.id as any })}
                    className={`w-full p-3 rounded-lg border-2 text-left transition ${
                      form.verification_method === method.id
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{method.label}</p>
                    <p className="text-sm text-slate-600">{method.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Title</p>
                  <p className="text-slate-900 font-semibold">{form.title}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Description</p>
                  <p className="text-slate-700">{form.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Respond By</p>
                    <p className="text-slate-900">{new Date(form.respondByDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Complete By</p>
                    <p className="text-slate-900">{new Date(form.completeByDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Visibility</p>
                  <p className="text-slate-900 capitalize">{form.visibility}</p>
                </div>
                {form.recipients.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase">Recipients</p>
                    <p className="text-slate-900">{form.recipients.join(', ')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Verification</p>
                  <p className="text-slate-900 capitalize">{form.verification_method}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-white sticky bottom-0">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition ${s <= step ? 'bg-emerald-600 w-4' : 'bg-slate-300 w-2'}`}
              />
            ))}
          </div>

          <button
            onClick={step === 5 ? handleSubmit : handleNext}
            disabled={createDareMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
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
