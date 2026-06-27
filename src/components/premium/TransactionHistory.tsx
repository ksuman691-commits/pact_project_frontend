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
        return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
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
        return 'text-emerald-600';
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
            <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </PremiumCard>
    );
  }

  if (transactions.length === 0) {
    return (
      <PremiumCard>
        <div className="text-center py-8">
          <p className="text-slate-600 font-medium">No transactions yet</p>
          <p className="text-xs text-slate-500">Your wallet activity will appear here</p>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard>
      <h3 className="font-bold text-slate-900 mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                {getIcon(tx.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="text-right">
              <p className={`text-sm font-bold ${getColor(tx.type)}`}>
                {getAmountSign(tx.type)}${tx.amount.toFixed(2)}
              </p>
              <p className={`text-xs font-medium ${
                tx.status === 'completed'
                  ? 'text-emerald-600'
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
