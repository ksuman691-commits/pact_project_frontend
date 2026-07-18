'use client';

import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
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

  const copyInviteLink = () => {
    const link = `${window.location.origin}/circles/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Invite link copied!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Join Circle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Circle Info */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h3 className="font-bold text-emerald-900 mb-1">{circle.name}</h3>
            <p className="text-sm text-emerald-700">{circle.description}</p>
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the circle admins why you want to join..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Invite Code Field */}
          {circle.isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter the invite code from the admin"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-medium text-blue-900 mb-2">Tips:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Circle admins must approve your request</li>
              <li>• Your message helps get accepted faster</li>
              <li>• Once joined, you can participate in all pacts</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Request to Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
