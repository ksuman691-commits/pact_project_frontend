"use client";

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { usePacts } from '@/hooks/usePacts';
import { useWallet } from '@/hooks/useWallet';
import PremiumLayout from '@/layouts/PremiumLayout';
import PremiumCard from '@/components/premium/PremiumCard';
import ProfileStats from '@/components/premium/ProfileStats';
import Achievements from '@/components/premium/Achievements';
import { Trophy, Zap, Target, Heart, TrendingUp, Award, Settings, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: pactsData } = usePacts();
  const { data: walletData } = useWallet();

  const pacts = (Array.isArray(pactsData) ? pactsData : pactsData?.data || []) as any[];
  const wallet = walletData?.data;

  const completedPacts = pacts.filter((p: any) => p.status === 'completed').length;
  const failedPacts = pacts.filter((p: any) => p.status === 'failed').length;
  const winRate = pacts.length > 0 ? Math.round((completedPacts / pacts.length) * 100) : 0;

  const achievements = [
    { id: 1, title: 'Getting Started', description: 'Create your first pact', icon: <Target className="w-6 h-6" />, unlocked: pacts.length > 0 },
    { id: 2, title: 'On Fire', description: 'Reach 7-day streak', icon: <Zap className="w-6 h-6" />, unlocked: false, progress: 30 },
    { id: 3, title: 'Winner', description: 'Win 5 pacts', icon: <Trophy className="w-6 h-6" />, unlocked: completedPacts >= 5 },
    { id: 4, title: 'Community', description: 'Join a circle', icon: <Heart className="w-6 h-6" />, unlocked: false, progress: 60 },
    { id: 5, title: 'Millionaire', description: 'Earn $1000', icon: <TrendingUp className="w-6 h-6" />, unlocked: false, progress: 15 },
    { id: 6, title: 'Trusted', description: 'Build reputation', icon: <Award className="w-6 h-6" />, unlocked: false, progress: 70 },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (!user) {
    return null;
  }

  return (
    <PremiumLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header with profile info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{user.full_name}</h1>
            <p className="text-sm text-slate-600 mt-1">@{user.username}</p>
            <p className="text-xs text-slate-500 mt-1">Reputation: {(user.reputation_score || 0).toFixed(1)}</p>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 hover:bg-red-100 rounded-full transition-all"
          >
            <LogOut className="w-5 h-5 text-red-600" />
          </button>
        </div>

        {/* Main Stats */}
        <ProfileStats
          completed={completedPacts}
          failed={failedPacts}
          winRate={winRate}
          reputation={Math.round(user.reputation_score || 0)}
          streak={14}
          totalEarned={wallet?.rewards_earned || 0}
        />

        {/* Achievements */}
        <div>
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Achievements
          </h2>
          <Achievements achievements={achievements} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/pacts/create')}
            className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all"
          >
            New Pact
          </button>
          <button
            onClick={() => router.push('/wallet')}
            className="py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
          >
            Wallet
          </button>
        </div>

        {/* Pacts Summary */}
        <PremiumCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900">Your Pacts</h3>
            <span className="text-sm font-semibold text-slate-600">{pacts.length} total</span>
          </div>
          {pacts.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">No pacts yet. Create your first one!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pacts.slice(0, 5).map((pact: any) => (
                <div
                  key={pact.id}
                  onClick={() => router.push(`/pacts/${pact.id}`)}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{pact.title}</p>
                      <p className="text-xs text-slate-500">${pact.stake_amount} stake</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      pact.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      pact.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {pact.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>
      </div>
    </PremiumLayout>
  );
}
