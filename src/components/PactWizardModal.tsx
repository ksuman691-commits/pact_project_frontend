'use client';

import React from 'react';
import { X } from 'lucide-react';
import { PactWizardProvider, usePactWizard } from '@/context/PactWizardContext';
import { useCreatePact } from '@/hooks/usePactMutations';
import { useWalletBalance } from '@/hooks/useWallet';
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
  const { data: balanceData } = useWalletBalance();

  const balance = balanceData?.balance || 0;

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.title.trim().length > 0 && data.description.trim().length > 0;
      case 2:
        return data.endDate && data.stakeAmount > 0 && data.minParticipants <= data.maxParticipants;
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
    if (data.stakeAmount > balance) {
      toast.error(`Insufficient balance. You have ₹${balance} but need ₹${data.stakeAmount}`);
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category,
        start_date: new Date().toISOString(),
        end_date: data.endDate,
        stake_amount: data.stakeAmount,
        min_participants: data.minParticipants,
        max_participants: data.maxParticipants,
        verification_type: data.verificationType,
        verification_frequency: data.verificationFrequency,
        max_proof_uploads: data.maxProofUploads,
        visibility: data.visibility,
        circle_id: data.selectedCircleId,
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Your Pact</h2>
            <p className="text-xs text-gray-500">Step {currentStep} of 5</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 flex-shrink-0">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 1 && <PactWizardStep1 />}
          {currentStep === 2 && <PactWizardStep2 />}
          {currentStep === 3 && <PactWizardStep3 />}
          {currentStep === 4 && <PactWizardStep4 />}
          {currentStep === 5 && <PactWizardStep5 balance={balance} />}
        </div>

        {/* Footer - Navigation Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0 bg-white">
          <button
            onClick={() => (currentStep === 1 ? onClose() : prevStep())}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!isStepValid() || createMutation.isPending}
              className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
