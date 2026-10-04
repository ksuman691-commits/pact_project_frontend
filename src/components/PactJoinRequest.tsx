'use client';

import { useState } from 'react';
import { joinRequestService, pactService } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { MessageSquare, Send, LogOut } from 'lucide-react';

interface PactJoinRequestProps {
  pactId: number;
  creatorId: number;
  canJoinDirectly?: boolean;
  isUserParticipant?: boolean;
  onRequestSuccess?: () => void;
  onLeaveSuccess?: () => void;
}

export default function PactJoinRequest({
  pactId,
  creatorId,
  canJoinDirectly = false,
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

  const handleDirectJoin = async () => {
    setLoading(true);
    try {
      await pactService.join(pactId);
      toast.success('Joined pact successfully!');
      onRequestSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to join pact');
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
      <div className="bg-[var(--card)] border border-[var(--hairline)] rounded-[14px] p-4">
        <p className="text-sm text-[var(--ink)] font-medium">You are the creator of this pact</p>
      </div>
    );
  }

  if (isUserParticipant) {
    return (
      <button
        onClick={handleLeavePact}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--card)] hover:bg-[var(--hairline)] border border-[var(--hairline)] text-[var(--ink-soft)] rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
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
          onClick={() => (canJoinDirectly ? handleDirectJoin() : setShowRequestForm(true))}
          disabled={loading}
          className="w-full px-4 py-3 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-[var(--card)] rounded-full font-medium transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageSquare size={18} />
          {loading ? 'joining...' : 'Join Pact'}
        </button>
      ) : (
        <div className="space-y-3 bg-[var(--card)] border border-[var(--hairline)] rounded-[14px] p-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: Why do you want to join this pact?"
            className="w-full p-2 border border-[var(--hairline)] rounded-[6px] bg-[var(--card)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--navy)]"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSendRequest}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-[var(--card)] rounded-full font-medium transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button
              onClick={() => {
                setShowRequestForm(false);
                setMessage('');
              }}
              className="flex-1 px-4 py-2 bg-[var(--card)] border border-[var(--hairline)] text-[var(--ink-soft)] rounded-full font-medium transition"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Your request will be reviewed by the pact creator
          </p>
        </div>
      )}
    </div>
  );
}
