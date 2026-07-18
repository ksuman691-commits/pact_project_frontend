'use client';

import React from 'react';
import { X } from 'lucide-react';
import { PactWizardProvider, usePactWizard } from '@/context/PactWizardContext';
import { useCreatePact } from '@/hooks/usePactMutations';
import PactWizardStep1 from './PactWizardStep1';
import PactWizardStep2 from './PactWizardStep2';
import PactWizardStep3 from './PactWizardStep3';
import PactWizardStep4 from './PactWizardStep4';
import PactWizardStep5 from './PactWizardStep5';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';

function WizardContent({ onClose }: { onClose: () => void }) {
  const { data, currentStep, nextStep, prevStep } = usePactWizard();
  const createMutation = useCreatePact();

  const mapVisibility = (visibility: string) =>
    visibility === 'circle-specific' ? 'circle_only' : visibility;

  const mapProofFrequency = (frequency: string) => {
    if (frequency === 'every-3-days') return 'weekly';
    return frequency;
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.title.trim().length > 0 && data.description.trim().length > 0;
      case 2:
        return !!data.endDate && data.minParticipants <= data.maxParticipants;
      case 3:
        return data.verificationType && data.maxProofUploads > 0;
      case 4:
        return data.visibility === 'circle-specific' ? !!data.selectedCircleId : true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category,
        start_date: data.startDate,
        end_date: data.endDate,
        stake_amount: 0,
        min_participants: data.minParticipants,
        max_participants: data.maxParticipants,
        verification_method: data.verificationType,
        proof_submission_frequency: mapProofFrequency(data.verificationFrequency),
        max_proof_uploads: data.maxProofUploads,
        visibility: mapVisibility(data.visibility),
        circle_id: data.selectedCircleId || null,
      });

      toast.success('Pact created successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to create pact');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] rounded-t-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Create Your Pact</h2>
            <p className="text-sm text-slate-600 font-medium mt-1">
              <span className="font-bold text-emerald-600">{currentStep}</span>
              <span className="text-slate-400"> of </span>
              <span className="font-bold text-slate-400">5</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-slate-600" strokeWidth={2} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 flex-shrink-0">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300 rounded-r"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Step Indicator Dots */}
        <div className="flex justify-center gap-2 px-6 py-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                step < currentStep ? 'bg-blue-600' : step === currentStep ? 'bg-blue-600 w-8' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {currentStep === 1 && <PactWizardStep1 />}
          {currentStep === 2 && <PactWizardStep2 />}
          {currentStep === 3 && <PactWizardStep3 />}
          {currentStep === 4 && <PactWizardStep4 />}
          {currentStep === 5 && <PactWizardStep5 />}
        </div>

        {/* Footer - Navigation Buttons */}
        <div className="border-t border-slate-100 px-6 py-4 flex gap-3 flex-shrink-0 bg-white">
          <button
            onClick={() => (currentStep === 1 ? onClose() : prevStep())}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!isStepValid() || createMutation.isPending}
              className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Pact'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PactWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PactWizardModal({ isOpen, onClose }: PactWizardModalProps) {
  if (!isOpen) return null;

  return (
    <PactWizardProvider>
      <WizardContent onClose={onClose} />
    </PactWizardProvider>
  );
}
