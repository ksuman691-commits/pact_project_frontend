'use client';

import { useEffect, useState } from 'react';
import { joinRequestService } from '@/services/api';
import { Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ParticipantInfo {
  participant_id: number;
  user_id: number;
  user_uuid: string;
  username: string;
  full_name: string;
  role: string;
  joined_at: string;
}

interface PactParticipantsProps {
  pactId: number;
  canViewParticipants?: boolean;
}

export default function PactParticipants({ pactId, canViewParticipants = true }: PactParticipantsProps) {
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canViewParticipants) {
      setLoading(false);
      return;
    }

    const fetchParticipants = async () => {
      try {
        const response = await joinRequestService.listParticipants(pactId);
        setParticipants(response.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('You do not have access to view participants');
        } else {
          setError('Failed to load participants');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [pactId, canViewParticipants]);

  if (!canViewParticipants) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Private Pact</p>
          <p className="text-xs text-amber-700 mt-1">Participants list is only visible to circle members</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading participants...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">
          Participants ({participants.length})
        </h3>
      </div>

      {participants.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No participants yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {participants.map((participant) => (
            <div
              key={participant.participant_id}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">{participant.full_name}</p>
                <p className="text-xs text-slate-600">@{participant.username}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded capitalize">
                  {participant.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
