'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Mail, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: number;
  circleName: string;
  onInvite?: (emails: string[]) => void;
}

export default function InviteMembersModal({
  isOpen,
  onClose,
  circleId,
  circleName,
  onInvite,
}: InviteMembersModalProps) {
  const [emails, setEmails] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'email' | 'link'>('email');

  const handleSendInvites = async () => {
    const emailList = emails
      .split('\n')
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'));

    if (emailList.length === 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    setLoading(true);
    try {
      onInvite?.(emailList);
      toast.success(`Invites sent to ${emailList.length} people`);
      setEmails('');
      onClose();
    } catch (error) {
      toast.error('Failed to send invites');
    } finally {
      setLoading(false);
    }
  };

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
        className="rounded-[24px] max-w-md w-full shadow-xl"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--pact-hairline)]">
          <h2 className="text-xl font-bold text-[var(--pact-text)]">Invite Members</h2>
          <button
            onClick={onClose}
            className="text-[var(--pact-text-faint)] hover:text-[var(--pact-text)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--pact-hairline)]">
          <button
            onClick={() => setTab('email')}
            className="flex-1 px-4 py-3 font-medium text-sm border-b-2 transition"
            style={
              tab === 'email'
                ? { color: 'var(--pact-violet)', borderColor: 'var(--pact-violet)' }
                : { color: 'var(--pact-text-faint)', borderColor: 'transparent' }
            }
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Email
          </button>
          <button
            onClick={() => setTab('link')}
            className="flex-1 px-4 py-3 font-medium text-sm border-b-2 transition"
            style={
              tab === 'link'
                ? { color: 'var(--pact-violet)', borderColor: 'var(--pact-violet)' }
                : { color: 'var(--pact-text-faint)', borderColor: 'transparent' }
            }
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Link
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--pact-text-dim)] mb-2">
                  Email Addresses
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter email addresses (one per line)&#10;user1@example.com&#10;user2@example.com"
                  className="w-full px-4 py-3 rounded-[28px] resize-none outline-none focus:ring-2 transition"
                  style={{
                    background: 'var(--pact-surface-2)',
                    border: '1px solid var(--pact-hairline)',
                    color: 'var(--pact-text)',
                  }}
                  rows={4}
                />
              </div>

              <div
                className="rounded-[28px] p-3"
                style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
              >
                <p className="text-xs text-[var(--pact-text-dim)] font-medium">
                  Invites will be sent to {circleName}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-[28px] font-medium transition"
                  style={{
                    background: 'var(--pact-surface-2)',
                    border: '1px solid var(--pact-hairline)',
                    color: 'var(--pact-text-dim)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvites}
                  disabled={loading || !emails.trim()}
                  className="pact-btn-glow flex-1 px-4 py-2.5 rounded-[28px] font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                >
                  {loading ? 'Sending...' : 'Send Invites'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--pact-text-dim)] mb-2">
                  Invite Link
                </label>
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
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
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
                  <li>• Share the link with anyone</li>
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
          )}
        </div>
      </div>
    </div>
  );
}
