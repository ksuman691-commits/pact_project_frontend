'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: number;
  circleName: string;
}

export default function InviteMembersModal({ isOpen, onClose, circleId, circleName }: InviteMembersModalProps) {
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  // NOTE: the backend has no invite-code/invite-link endpoint either
  // (confirmed against the live OpenAPI schema — only /join and
  // /join-request exist, neither of which issues a shareable code). This
  // link and code are still client-generated placeholders, same gap as
  // the removed "Search people" tab, just not addressed in this pass per
  // explicit instruction to only pull that tab and leave Link as-is.
  // The generated /circles/join/{code} route does not resolve to anything
  // real yet — needs its own backend endpoint before this tab is genuinely
  // functional.
  const generateInviteLink = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteLink(`${window.location.origin}/circles/join/${code}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="rounded-[24px] max-w-md w-full shadow-xl max-h-[85vh] flex flex-col"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--pact-hairline)] flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--pact-text)]">Invite Members</h2>
          <button onClick={onClose} className="text-[var(--pact-text-faint)] hover:text-[var(--pact-text)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* "Search people" was removed: it depended on a direct-invite
            endpoint (POST /api/circles/{id}/invite) that returns 404 on
            the live backend — confirmed against the OpenAPI schema, which
            only exposes /join and /join-request (self-service, not
            something an owner can trigger for someone else). Link is the
            only invite path that stays until that endpoint exists. */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 text-sm font-medium flex-shrink-0" style={{ color: 'var(--pact-violet)' }}>
          <LinkIcon className="w-4 h-4" />
          Shareable link
        </div>

        {/* Content */}
        <div className="p-6 pt-2 overflow-y-auto flex-1">
          <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--pact-text-dim)] mb-2">Invite Link</label>
                {!inviteLink ? (
                  <button
                    onClick={generateInviteLink}
                    className="w-full px-4 py-3 rounded-[28px] font-medium transition"
                    style={{
                      background: 'var(--pact-surface-2)',
                      border: '1px dashed var(--pact-violet)',
                      color: 'var(--pact-violet)',
                    }}
                  >
                    Generate Invite Link
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-[28px]"
                      style={{
                        background: 'var(--pact-surface-2)',
                        border: '1px solid var(--pact-hairline)',
                        color: 'var(--pact-text-dim)',
                      }}
                    />
                    <button
                      onClick={copyLink}
                      className="px-4 py-3 rounded-[28px] text-white transition"
                      style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>

              <div
                className="rounded-[28px] p-3 space-y-2"
                style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
              >
                <p className="text-xs text-[var(--pact-text)] font-medium">How it works:</p>
                <ul className="text-xs text-[var(--pact-text-faint)] space-y-1">
                  <li>• Share the link with anyone, even outside the app</li>
                  <li>• They can join without requiring approval</li>
                  <li>• Link is valid for 30 days</li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-[28px] font-medium transition"
                style={{
                  background: 'var(--pact-surface-2)',
                  border: '1px solid var(--pact-hairline)',
                  color: 'var(--pact-text-dim)',
                }}
              >
                Done
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}
