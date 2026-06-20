'use client';

import { useState, useEffect } from 'react';
import { joinRequestService } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { PactJoinRequest } from '@/types';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface PactJoinRequestsManagerProps {
  pactId: number;
  isCreator: boolean;
  onRequestHandled?: () => void;
}

export default function PactJoinRequestsManager({
  pactId,
  isCreator,
  onRequestHandled,
}: PactJoinRequestsManagerProps) {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<PactJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [handlingRequestId, setHandlingRequestId] = useState<number | null>(null);

  useEffect(() => {
    if (!isCreator || !user) return;

    const fetchRequests = async () => {
      try {
        const response = await joinRequestService.listPending(pactId);
        setRequests(response.data.filter((r: PactJoinRequest) => r.status === 'pending'));
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [pactId, isCreator, user]);

  const handleApprove = async (requestId: number) => {
    setHandlingRequestId(requestId);
    try {
      await joinRequestService.approve(pactId, requestId);
      toast.success('Request approved! User has been added as participant');
      setRequests(requests.filter((r) => r.id !== requestId));
      onRequestHandled?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to approve request');
    } finally {
      setHandlingRequestId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setHandlingRequestId(requestId);
    try {
      await joinRequestService.reject(pactId, requestId);
      toast.success('Request rejected');
      setRequests(requests.filter((r) => r.id !== requestId));
      onRequestHandled?.();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reject request');
    } finally {
      setHandlingRequestId(null);
    }
  };

  if (!isCreator || !user) return null;

  if (loading) {
    return <div className="text-center py-4 text-slate-500">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">✓ No pending join requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">
          Join Requests ({requests.length})
        </h3>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
          >
            <div>
              <p className="font-medium text-slate-900">
                {request.user?.full_name} (@{request.user?.username})
              </p>
              {request.request_message && (
                <p className="text-sm text-slate-700 mt-2 italic">
                  "{request.request_message}"
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={handlingRequestId === request.id}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium transition disabled:opacity-50"
              >
                <CheckCircle size={16} />
                Approve
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={handlingRequestId === request.id}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium transition disabled:opacity-50"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
