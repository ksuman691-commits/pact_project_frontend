import React from 'react';
import { Trophy, Medal, Flame } from 'lucide-react';
import PremiumCard from './PremiumCard';

interface LeaderboardMember {
  id: number;
  username: string;
  fullName: string;
  avatar?: string;
  wins: number;
  winRate: number;
  moneyEarned: number;
  streak: number;
}

interface LeaderboardProps {
  members: LeaderboardMember[];
  isLoading?: boolean;
}

export default function Leaderboard({ members, isLoading }: LeaderboardProps) {
  if (isLoading) {
    return (
      <PremiumCard>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </PremiumCard>
    );
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-sm font-bold text-slate-500">#{rank}</span>;
  };

  return (
    <PremiumCard>
      <h3 className="font-bold text-slate-900 mb-4">Circle Leaderboard</h3>
      <div className="space-y-3">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-transparent rounded-lg hover:from-slate-100 transition-all"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 flex items-center justify-center">
                {getMedalIcon(index + 1)}
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-300 to-purple-400" />

              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{member.fullName}</p>
                <p className="text-xs text-slate-500">@{member.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="flex items-center gap-1 justify-end mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <p className="text-sm font-bold text-slate-900">{member.streak}</p>
                </div>
                <p className="text-xs text-slate-500">{member.winRate}%</p>
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-600">${member.moneyEarned}</p>
                <p className="text-xs text-slate-500">{member.wins} wins</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}
