"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Navbar from '@/components/Navbar';
import { pactService, walletService } from '@/services/api';
import { Pact, Wallet } from '@/types';
import { TrendingUp, Wallet as WalletIcon, Target } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  useEffect(() => {
    if (!isInitialized || !user) return;

    const fetchData = async () => {
      try {
        const [pactsRes, walletRes] = await Promise.all([
          pactService.list(),
          walletService.get(),
        ]);
        setPacts(pactsRes.data);
        setWallet(walletRes.data);
      } catch (error: any) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const handleCreatePact = () => {
    if (!wallet) {
      toast.error('Wallet not loaded. Please try again.');
      return;
    }
    if (wallet.balance < 99) {
      toast.error('You need at least ₹99 in your wallet to create a pact. Please add funds.');
      router.push('/wallet');
      return;
    }
    router.push('/pacts/create');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  const activePacts = pacts.filter((p) => p.status === 'active').length;
  const completedPacts = pacts.filter((p) => p.status === 'completed').length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-slate-600">
              Your execution reputation: <span className="font-bold text-blue-600">{user?.reputation_score.toFixed(2)}</span>
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Active Pacts</p>
                <p className="text-3xl font-bold text-slate-900">{activePacts}</p>
              </div>
              <Target className="w-12 h-12 text-blue-600 opacity-20" />
            </div>

            <div className="card flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Completed Pacts</p>
                <p className="text-3xl font-bold text-slate-900">{completedPacts}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
            </div>

            <div className="card flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Wallet Balance</p>
                <p className="text-3xl font-bold text-slate-900">₹{wallet?.balance.toFixed(2)}</p>
              </div>
              <WalletIcon className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleCreatePact}
              className="btn-primary py-3 text-lg font-medium"
            >
              Create New Pact
            </button>
            <button
              onClick={() => router.push('/circles/create')}
              className="btn-secondary py-3 text-lg font-medium"
            >
              Create Circle
            </button>
            <button
              onClick={() => router.push('/wallet')}
              className="btn-secondary py-3 text-lg font-medium"
            >
              Manage Wallet
            </button>
          </div>

          {/* Recent Pacts */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Pacts</h2>
            {pacts.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-slate-600 mb-4">You haven't created any pacts yet</p>
                <button
                  onClick={handleCreatePact}
                  className="btn-primary"
                >
                  Create Your First Pact
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pacts.map((pact) => (
                  <div
                    key={pact.id}
                    onClick={() => router.push(`/pacts/${pact.id}`)}
                    className="card cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-900">{pact.title}</h3>
                      <span
                        className={`badge text-xs font-medium ${
                          pact.status === 'completed'
                            ? 'badge-success'
                            : pact.status === 'failed'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {pact.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">{pact.description}</p>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Stake: ₹{pact.stake_amount}</span>
                      <span>Approvers: {pact.required_approvers}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
