'use client';

import React, { createContext, useContext, useState } from 'react';

export interface PactWizardData {
  // Step 1: Basic Info
  title: string;
  description: string;
  category: string;
  categoryEmoji: string;

  // Step 2: Duration & Stakes
  startDate: string;
  endDate: string;
  stakeAmount: number;
  minParticipants: number;
  maxParticipants: number;

  // Step 3: Verification
  verificationType: 'video' | 'photo' | 'checklist';
  verificationFrequency: 'daily' | 'every-3-days' | 'weekly';
  maxProofUploads: number;

  // Step 4: Circle Selection
  visibility: 'public' | 'private' | 'circle-specific';
  selectedCircleId?: number;

  // Step 5: Review (auto-populated)
  createdAt?: string;
}

interface PactWizardContextType {
  data: PactWizardData;
  currentStep: number;
  updateData: (data: Partial<PactWizardData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

const initialData: PactWizardData = {
  title: '',
  description: '',
  category: 'other',
  categoryEmoji: '🎯',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  stakeAmount: 0,
  minParticipants: 1,
  maxParticipants: 10,
  verificationType: 'photo',
  verificationFrequency: 'daily',
  maxProofUploads: 30,
  visibility: 'public',
};

const PactWizardContext = createContext<PactWizardContextType | undefined>(undefined);

export function PactWizardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PactWizardData>(initialData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateData = (newData: Partial<PactWizardData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  };

  const reset = () => {
    setData(initialData);
    setCurrentStep(1);
  };

  return (
    <PactWizardContext.Provider value={{ data, currentStep, updateData, nextStep, prevStep, goToStep, reset }}>
      {children}
    </PactWizardContext.Provider>
  );
}

export function usePactWizard() {
  const context = useContext(PactWizardContext);
  if (context === undefined) {
    throw new Error('usePactWizard must be used within PactWizardProvider');
  }
  return context;
}
