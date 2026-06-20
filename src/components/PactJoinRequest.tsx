'use client';

import { useState } from 'react';
import { joinRequestService } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { MessageSquare, Send, LogOut } from 'lucide-react';

interface PactJoinRequestProps {
  pactId: number;
  creatorId: number;
  isPublic: boolean;
  isUserParticipant?: boolean;
  onRequestSuccess?: () => void;
  onLeaveSuccess?: () => void;
}

export default function PactJoinRequest({
  pactId,
  creatorId,
  isPublic,
  isUserParticipant = false,
  onRequestSuccess,
  onLeaveSuccess,
}: PactJoinRequestProps) {
  const user = useAuthStore((state) => state.user);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isCreator = user?.id === creatorId;

  const handleSendRequest = async () => {
    if (!user) {
      toast.error('Please login to send a request');
      return;
    }

    setLoading(true);
    try {
      await joinRequestService.sendRequest(pactId, message || undefined);
      toast.success('Join request sent successfully!');
      setMessage('');
      setShowRequestForm(false);
      onRequestSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleLeavePact = async () => {
    if (!confirm('Are you sure you want to leave this pact?')) return;

    setLoading(true);
    try {
      await joinRequestService.leavePact(pactId);
      toast.success('You have left the pact');
      onLeaveSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to leave pact');
    } finally {
      setLoading(false);
    }
  };

  if (isCreator) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-medium">👑 You are the creator of this pact</p>
      </div>
    );
  }

  if (isUserParticipant) {
    return (
      <button
        onClick={handleLeavePact}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg font-medium transition disabled:opacity-50"
      >
        <LogOut size={18} />
        {loading ? 'Leaving...' : 'Leave Pact'}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {!showRequestForm ? (
        <button
          onClick={() => setShowRequestForm(true)}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <MessageSquare size={18} />
          Request to Join
        </button>
      ) : (
        <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: Why do you want to join this pact?"
            className="w-full p-2 border border-blue-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button
              onClick={() => {
                setShowRequestForm(false);
                setMessage('');
              }}
              className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-600">
            {isPublic
              ? 'Your request will be reviewed by the pact creator'
              : 'As a circle member, your request will be reviewed by the pact creator'}
          </p>
        </div>
      )}
    </div>
  );
}
