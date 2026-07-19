'use client';

import React from 'react';
import FeedPactCard from './FeedPactCard';

interface PactCardProps {
  pact: any;
  onVote?: (pactId: number, vote: string) => void;
  userVote?: string | null;
  onProofUpload?: (pactId: number, proof?: any) => void;
  canUploadProof?: boolean;
  canReport?: boolean;
}

export default function PactCard({
  pact,
  onVote,
  userVote,
  onProofUpload,
  canUploadProof,
  canReport,
}: PactCardProps) {
  return (
    <FeedPactCard
      pact={pact}
      userVote={userVote}
      onVote={onVote as ((pactId: number, vote: 'support' | 'skip') => Promise<void> | void) | undefined}
      onProofUpload={onProofUpload}
      canUploadProof={canUploadProof}
      canReport={canReport}
      dismissOnVote={false}
      enableGestures={Boolean(onVote)}
      showVoteActions={Boolean(onVote)}
      detailHref={`/pacts/${pact.id}`}
    />
  );
}
