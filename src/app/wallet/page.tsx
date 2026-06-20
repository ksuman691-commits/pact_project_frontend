'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Navbar from '@/components/Navbar';
import { walletService } from '@/services/api';
import { Wallet } from '@/types';
import toast from 'react-hot-toast';
import { TrendingUp, Send, Plus } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchWallet = async () => {
      try {
        const response = await walletService.get();
        setWallet(response.data);
      } catch (error: any) {
        toast.error('Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [isInitialized, user, router]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      await walletService.deposit({
        amount: Number(depositAmount),
        payment_method: 'razorpay',
      });
      toast.success('Deposit successful!');
      setDepositAmount('');
      // Refresh wallet data instead of full page reload
      const response = await walletService.get();
      setWallet(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Deposit failed');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (wallet && Number(withdrawAmount) > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      await walletService.withdraw(Number(withdrawAmount));
      toast.success('Withdrawal initiated!');
      setWithdrawAmount('');
      // Refresh wallet data instead of full page reload
      const response = await walletService.get();
      setWallet(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Withdrawal failed');
    }
  };

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

  if (loading || !wallet) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }


  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Wallet</h1>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <p className="text-blue-100 text-sm font-medium mb-2">Available Balance</p>
              <p className="text-4xl font-bold">₹{wallet.balance.toFixed(2)}</p>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <p className="text-purple-100 text-sm font-medium mb-2">Locked Escrow</p>
              <p className="text-4xl font-bold">₹{wallet.escrow_locked.toFixed(2)}</p>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <p className="text-green-100 text-sm font-medium mb-2">Rewards Earned</p>
              <p className="text-4xl font-bold">₹{wallet.rewards_earned.toFixed(2)}</p>
            </div>
          </div>

          {/* Deposit & Withdraw */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6 text-green-600" />
                Deposit Funds
              </h2>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input-field"
                    placeholder="Enter amount"
                    min="0"
                    step="100"
                  />
                </div>
                <button type="submit" className="w-full btn-primary">
                  Deposit
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Send className="w-6 h-6 text-orange-600" />
                Withdraw Funds
              </h2>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="input-field"
                    placeholder="Enter amount"
                    min="0"
                    step="100"
                    max={wallet.balance}
                  />
                </div>
                <button type="submit" className="w-full btn-primary">
                  Withdraw
                </button>
              </form>
            </div>
          </div>

          {/* Wallet Stats */}
          <div className="card">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Wallet Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-600 text-sm">Total Transactions</p>
                <p className="text-3xl font-bold text-slate-900">{wallet.total_transactions}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-600 text-sm">Total Balance</p>
                <p className="text-3xl font-bold text-slate-900">
                  ₹{(wallet.balance + wallet.escrow_locked).toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-600 text-sm">Escrow % of Total</p>
                <p className="text-3xl font-bold text-slate-900">
                  {((wallet.escrow_locked / (wallet.balance + wallet.escrow_locked)) * 100 || 0).toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-600 text-sm">Rewards/Balance Ratio</p>
                <p className="text-3xl font-bold text-slate-900">
                  {wallet.balance > 0 
                    ? ((wallet.rewards_earned / wallet.balance) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
