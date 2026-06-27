'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useWallet, useWalletTransactions } from '@/hooks/useWallet';
import { walletService } from '@/services/api';
import toast from 'react-hot-toast';
import PremiumLayout from '@/layouts/PremiumLayout';
import PremiumCard from '@/components/premium/PremiumCard';
import WalletStats from '@/components/premium/WalletStats';
import WalletActions from '@/components/premium/WalletActions';
import TransactionHistory from '@/components/premium/TransactionHistory';
import { TrendingUp, PiggyBank, ArrowRight } from 'lucide-react';

export default function WalletPage() {
  const { data: walletData, isLoading: walletLoading } = useWallet();
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions();
  const wallet = walletData?.data;
  const transactions = transactionsData?.data || [];

  const handleDeposit = async (amount: number) => {
    try {
      await walletService.deposit({ amount, payment_method: 'razorpay' });
      toast.success('Deposit successful!');
    } catch (error: any) {
      toast.error('Deposit failed');
    }
  };

  const handleWithdraw = async (amount: number) => {
    try {
      await walletService.withdraw(amount);
      toast.success('Withdrawal initiated!');
    } catch (error: any) {
      toast.error('Withdrawal failed');
    }
  };

  if (!wallet) {
    return <PremiumLayout>Loading...</PremiumLayout>;
  }

  return (
    <PremiumLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Your Wallet</h1>
          <p className="text-sm text-slate-600">Manage your CirclePact funds</p>
        </div>

        {/* Main Balance Hero */}
        <PremiumCard glass className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <PiggyBank className="w-8 h-8 text-slate-700" />
            <span className="text-xs font-bold text-slate-600 uppercase">Total Account</span>
          </div>
          <p className="text-5xl font-black text-slate-900 mb-2">
            ${wallet.balance.toFixed(2)}
          </p>
          <p className="text-sm text-slate-600">
            {wallet.balance > 100 ? 'Keep building!' : 'Start making pacts to earn rewards'}
          </p>
        </PremiumCard>

        {/* Quick Stats */}
        <WalletStats
          balance={wallet.balance}
          locked={wallet.escrow_locked}
          earned={wallet.rewards_earned}
          pending={0}
        />

        {/* Actions */}
        <div>
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Quick Actions</h2>
          <WalletActions
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            isLoading={walletLoading}
          />
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Activity</h2>
          <TransactionHistory
            transactions={[
              {
                id: 1,
                type: 'deposit',
                amount: 50,
                description: 'Deposit via Card',
                date: new Date().toISOString(),
                status: 'completed',
              },
              {
                id: 2,
                type: 'lock',
                amount: 25,
                description: 'Locked for "Ship MVP"',
                date: new Date(Date.now() - 86400000).toISOString(),
                status: 'completed',
              },
              {
                id: 3,
                type: 'reward',
                amount: 35,
                description: 'Earned from "100 Days Code"',
                date: new Date(Date.now() - 172800000).toISOString(),
                status: 'completed',
              },
            ]}
            isLoading={transactionsLoading}
          />
        </div>

        {/* Security Note */}
        <PremiumCard className="bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Your funds are secure</p>
              <p className="text-xs text-blue-700 mt-1">All transactions are encrypted and verified. Money in pacts is held in escrow until verification.</p>
            </div>
          </div>
        </PremiumCard>
      </div>
    </PremiumLayout>
  );
}
