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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Invite Members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('email')}
            className={`flex-1 px-4 py-3 font-medium text-sm border-b-2 transition ${
              tab === 'email'
                ? 'text-emerald-600 border-emerald-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Email
          </button>
          <button
            onClick={() => setTab('link')}
            className={`flex-1 px-4 py-3 font-medium text-sm border-b-2 transition ${
              tab === 'link'
                ? 'text-emerald-600 border-emerald-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Addresses
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter email addresses (one per line)&#10;user1@example.com&#10;user2@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900 font-medium">
                  Invites will be sent to {circleName}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvites}
                  disabled={loading || !emails.trim()}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Invites'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Link
                </label>
                {!inviteLink ? (
                  <button
                    onClick={generateInviteLink}
                    className="w-full px-4 py-3 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition"
                  >
                    Generate Invite Link
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={copyLink}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
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

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <p className="text-xs text-green-900 font-medium">How it works:</p>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>• Share the link with anyone</li>
                  <li>• They can join without requiring approval</li>
                  <li>• Link is valid for 30 days</li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
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
