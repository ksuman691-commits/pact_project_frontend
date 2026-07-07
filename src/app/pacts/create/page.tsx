'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PactWizardProvider, usePactWizard } from '@/context/PactWizardContext';
import { useCreatePact } from '@/hooks/usePactMutations';
import { useWalletBalance } from '@/hooks/useWallet';
import TopNav from '@/components/TopNav';
import PactWizardStep1 from '@/components/PactWizardStep1';
import PactWizardStep2 from '@/components/PactWizardStep2';
import PactWizardStep3 from '@/components/PactWizardStep3';
import PactWizardStep4 from '@/components/PactWizardStep4';
import PactWizardStep5 from '@/components/PactWizardStep5';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';

function WizardContent() {
  const router = useRouter();
  const { data, currentStep, nextStep, prevStep } = usePactWizard();
  const createMutation = useCreatePact();
  const { data: balanceData } = useWalletBalance();

  const balance = balanceData?.balance || 0;

  // Validation for each step
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
        stake_amount: data.stakeAmount,
        deadline: data.endDate,
        verification_type: data.verificationType,
        verification_frequency: data.verificationFrequency,
        max_proof_uploads: data.maxProofUploads,
        min_participants: data.minParticipants,
        max_participants: data.maxParticipants,
        visibility: data.visibility,
        circle_id: data.selectedCircleId || null,
      });
      toast.success('Pact created successfully!');
      router.push('/home');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create pact');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav showBack={true} />

      <div className="max-w-2xl mx-auto px-4 pt-32 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Pact</h1>
          <p className="text-gray-600 mt-1">Step {currentStep} of 5: Make your commitment</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition ${
                  step <= currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Info</span>
            <span>Schedule</span>
            <span>Verify</span>
            <span>Visibility</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
          {currentStep === 1 && <PactWizardStep1 />}
          {currentStep === 2 && <PactWizardStep2 />}
          {currentStep === 3 && <PactWizardStep3 />}
          {currentStep === 4 && <PactWizardStep4 />}
          {currentStep === 5 && <PactWizardStep5 />}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              if (currentStep > 1) prevStep();
              else router.back();
            }}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 5 && (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex items-center gap-2 flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 5 && (
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Pact'}
            </button>
          )}
        </div>

        {/* Wallet Balance Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          Current balance: <span className="font-semibold">₹{balance}</span> | Stake required: <span className="font-semibold">₹{data.stakeAmount}</span>
        </div>
      </div>
    </div>
  );
}

export default function CreatePactPage() {
  return (
    <PactWizardProvider>
      <WizardContent />
    </PactWizardProvider>
  );
}
