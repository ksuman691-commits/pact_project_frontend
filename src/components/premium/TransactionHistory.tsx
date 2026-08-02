import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Lock, Unlock } from 'lucide-react';
import PremiumCard from './PremiumCard';

interface Transaction {
  id: number;
  type: 'deposit' | 'withdraw' | 'lock' | 'unlock' | 'reward' | 'penalty';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-[#A78BFA]" />;
      case 'withdraw':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'lock':
        return <Lock className="w-4 h-4 text-orange-600" />;
      case 'unlock':
        return <Unlock className="w-4 h-4 text-blue-600" />;
      case 'reward':
        return <ArrowDownLeft className="w-4 h-4 text-amber-600" />;
      case 'penalty':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
    }
  };

  const getColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'reward':
        return 'text-[#A78BFA]';
      case 'withdraw':
      case 'penalty':
        return 'text-red-600';
      case 'lock':
        return 'text-orange-600';
      case 'unlock':
        return 'text-blue-600';
    }
  };

  const getAmountSign = (type: Transaction['type']) => {
    if (['deposit', 'reward', 'unlock'].includes(type)) return '+';
    return '-';
  };

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

  if (transactions.length === 0) {
    return (
      <PremiumCard>
        <div className="text-center py-8">
          <p className="text-[#6B7280] font-medium">No wallet activity yet</p>
          <p className="text-xs text-[#9CA3AF]">Transactions will appear here once you start using your wallet</p>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard>
      <h3 className="font-bold text-[#14121F] mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 bg-[#F4F2FB] rounded-[28px] hover:bg-[#FAF9FE] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-[rgba(20,18,31,0.06)] flex items-center justify-center">
                {getIcon(tx.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#14121F]">{tx.description}</p>
                <p className="text-xs text-[#9CA3AF]">{new Date(tx.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="text-right">
              <p className={`text-sm font-bold ${getColor(tx.type)}`}>
                {getAmountSign(tx.type)}${tx.amount.toFixed(2)}
              </p>
              <p className={`text-xs font-medium ${
                tx.status === 'completed'
                  ? 'text-[#A78BFA]'
                  : tx.status === 'pending'
                  ? 'text-orange-600'
                  : 'text-red-600'
              }`}>
                {tx.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}
