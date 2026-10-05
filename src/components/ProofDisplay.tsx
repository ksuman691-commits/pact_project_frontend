'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface ProofData {
  id: string;
  type: 'image' | 'video' | 'checklist';
  url?: string; // for image/video
  description?: string;
  timestamp: string; // e.g. "Day 3" or ISO date
  items?: ChecklistItem[]; // for checklist type
}

interface ProofDisplayProps {
  proof: ProofData;
  onVerify?: () => void;
}

export default function ProofDisplay({ proof, onVerify }: ProofDisplayProps) {
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Photo display
  if (proof.type === 'image' && proof.url) {
    return (
      <div className="rounded-[24px] overflow-hidden bg-[#FAF9FE] border border-[rgba(20,18,31,0.06)]">
        <div className="relative aspect-video w-full">
          <Image
            src={proof.url}
            alt={proof.description || 'Proof'}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
        <div className="p-4 bg-[var(--card)]">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--ink)]">{proof.timestamp}</span>
            <span className="text-xs bg-[var(--paper)] text-[var(--navy)] px-2 py-1 rounded-full font-medium">
              Photo
            </span>
          </div>
          {proof.description && (
            <p className="text-sm text-[var(--muted)]">{proof.description}</p>
          )}
        </div>
      </div>
    );
  }

  // Video display
  if (proof.type === 'video' && proof.url) {
    return (
      <div className="rounded-[14px] overflow-hidden bg-[var(--ink)] border border-[var(--hairline)]">
        <div className="relative aspect-video w-full bg-black flex items-center justify-center group cursor-pointer">
          <video
            src={proof.url}
            className="w-full h-full object-cover"
            onClick={() => setVideoPlaying(!videoPlaying)}
          />
          {!videoPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition">
              <Play className="w-16 h-16 text-white fill-white" />
            </div>
          )}
        </div>
        <div className="p-4 bg-[var(--card)]">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--ink)]">{proof.timestamp}</span>
            <span className="text-xs bg-card-muted text-ink-soft px-2 py-1 rounded-full font-medium">
              Video
            </span>
          </div>
          {proof.description && (
            <p className="text-sm text-[var(--muted)]">{proof.description}</p>
          )}
        </div>
      </div>
    );
  }

  // Checklist display
  if (proof.type === 'checklist' && proof.items) {
    const completedCount = proof.items.filter(item => item.completed).length;
    const totalCount = proof.items.length;
    const completionPercent = Math.round((completedCount / totalCount) * 100);

    return (
      <div className="rounded-[14px] bg-[var(--card)] border border-[var(--hairline)] overflow-hidden">
        <div className="p-4 bg-[var(--card)] border-b border-[var(--hairline)]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-[var(--ink)] block">{proof.timestamp}</span>
              {proof.description && (
                <p className="text-sm text-[var(--muted)] mt-1">{proof.description}</p>
              )}
            </div>
            <span className="text-xs bg-[var(--paper)] text-[var(--navy)] px-2 py-1 rounded-full font-medium">
              Checklist
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[var(--muted)]">Progress</span>
              <span className="text-sm font-bold text-navy">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--line)] rounded-full overflow-hidden">
              <div
                className="h-full bg-navy transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-[#6B7280]">{completionPercent}% complete</p>
        </div>

        {/* Checklist items */}
        <div className="divide-y divide-[var(--line)]">
          {proof.items.map((item) => (
            <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-[#F4F2FB] transition">
              <div className="flex-shrink-0 mt-0.5">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-navy" strokeWidth={2} />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--muted)]" strokeWidth={2} />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  item.completed
                    ? 'text-[#14121F] line-through opacity-60'
                    : 'text-[#14121F]'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: no proof data
  return (
    <div className="rounded-[24px] bg-[#F4F2FB] border-2 border-dashed border-[var(--line)] p-6 flex flex-col items-center justify-center min-h-[200px]">
      <AlertCircle className="w-8 h-8 text-[var(--muted)] mb-2" />
      <p className="text-sm font-medium text-[#6B7280]">No proof submitted yet</p>
      <p className="text-xs text-[#9CA3AF] mt-1">
        The pact creator has not uploaded any proof yet.
      </p>
    </div>
  );
}
