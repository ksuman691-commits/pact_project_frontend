import React from 'react';
import { UserPlus } from 'lucide-react';
import PremiumCard from './PremiumCard';

interface Member {
  id: number;
  username: string;
  fullName: string;
  avatar?: string;
  role: 'moderator' | 'member';
  joinedAt: string;
}

interface CircleMembersProps {
  members: Member[];
  isLoading?: boolean;
  onInvite?: () => void;
}

export default function CircleMembers({ members, isLoading, onInvite }: CircleMembersProps) {
  if (isLoading) {
    return (
      <PremiumCard>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#FAF9FE] rounded-[28px] animate-pulse" />
          ))}
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#14121F]">Members ({members.length})</h3>
        {onInvite && (
          <button
            onClick={onInvite}
            className="p-2 hover:bg-[#FAF9FE] rounded-full transition-all"
          >
            <UserPlus className="w-5 h-5 text-slate-700" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-[#F4F2FB] rounded-[28px] hover:bg-[#FAF9FE] transition-all"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400" />

              <div className="flex-1">
                <p className="text-sm font-semibold text-[#14121F]">{member.fullName}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#9CA3AF]">@{member.username}</p>
                  {member.role === 'moderator' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      MOD
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-[#9CA3AF]">
              {new Date(member.joinedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}
