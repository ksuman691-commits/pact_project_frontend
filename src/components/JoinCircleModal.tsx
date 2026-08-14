'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  circle: {
    id: number;
    name: string;
    description?: string;
    isPrivate?: boolean;
  };
  onJoin?: (circleId: number) => void;
}

export default function JoinCircleModal({
  isOpen,
  onClose,
  circle,
  onJoin,
}: JoinCircleModalProps) {
  const [message, setMessage] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (circle.isPrivate && !inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      onJoin?.(circle.id);
      toast.success(`Joined ${circle.name}!`);
      onClose();
    } catch (error) {
      toast.error('Failed to join circle');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-xl font-bold text-[var(--pact-text)]">Join Circle</h2>
          <button
            onClick={onClose}
            className="text-[var(--pact-text-faint)] hover:text-[var(--pact-text)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Circle Info */}
          <div
            className="rounded-[28px] p-4"
            style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-violet)' }}
          >
            <h3 className="font-bold text-[var(--pact-text)] mb-1">{circle.name}</h3>
            <p className="text-sm text-[var(--pact-text-dim)]">{circle.description}</p>
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-[var(--pact-text-dim)] mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the circle admins why you want to join..."
              className="w-full px-4 py-3 rounded-[28px] resize-none outline-none focus:ring-2 transition"
              style={{
                background: 'var(--pact-surface-2)',
                border: '1px solid var(--pact-hairline)',
                color: 'var(--pact-text)',
              }}
              rows={3}
            />
          </div>

          {/* Invite Code Field */}
          {circle.isPrivate && (
            <div>
              <label className="block text-sm font-medium text-[var(--pact-text-dim)] mb-2">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter the invite code from the admin"
                className="w-full px-4 py-3 rounded-[28px] outline-none focus:ring-2 transition"
                style={{
                  background: 'var(--pact-surface-2)',
                  border: '1px solid var(--pact-hairline)',
                  color: 'var(--pact-text)',
                }}
              />
            </div>
          )}

          {/* Tips */}
          <div
            className="rounded-[28px] p-4"
            style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
          >
            <p className="text-xs font-medium text-[var(--pact-text)] mb-2">Tips:</p>
            <ul className="text-xs text-[var(--pact-text-faint)] space-y-1">
              <li>• Circle admins must approve your request</li>
              <li>• Your message helps get accepted faster</li>
              <li>• Once joined, you can participate in all pacts</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-[var(--pact-hairline)]">
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
            onClick={handleJoin}
            disabled={loading}
            className="pact-btn-glow flex-1 px-4 py-2.5 rounded-[28px] font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
          >
            {loading ? 'Joining...' : 'Request to Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
