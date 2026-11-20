'use client';

import React from 'react';
import NewPactFlow from '@/components/new-pact/NewPactFlow';

interface CreatePactFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Full-screen New pact (Say it → Who → Day 1) for the Feed and top-nav entry points. */
export default function CreatePactFlowModal({ isOpen, onClose }: CreatePactFlowModalProps) {
  if (!isOpen) return null;

  return <NewPactFlow onExit={onClose} />;
}
