'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Lock, Zap, TrendingUp, Calendar } from 'lucide-react';

interface Transaction {
  id: number;
  type: 'deposit' | 'withdraw' | 'stake' | 'reward';
  amount: number;
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
  loading?: boolean;
}

const FILTER_TYPES = ['All', 'Deposits', 'Withdrawals', 'Stakes', 'Rewards'];

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'deposit':
      return <ArrowDownLeft className="w-5 h-5" />;
    case 'withdraw':
      return <ArrowUpRight className="w-5 h-5" />;
    case 'stake':
      return <Lock className="w-5 h-5" />;
    case 'reward':
      return <TrendingUp className="w-5 h-5" />;
    default:
      return <Zap className="w-5 h-5" />;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case 'deposit':
      return 'text-[var(--navy)] bg-[var(--paper)]';
    case 'withdraw':
      return 'text-[var(--ink-soft)] bg-[var(--card-muted)]';
    case 'stake':
      return 'text-[var(--warn-text)] bg-[var(--warn-bg)]';
    case 'reward':
      return 'text-[var(--navy)] bg-[var(--paper)]';
    default:
      return 'text-[var(--muted)] bg-[var(--card-muted)]';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-[var(--navy)] bg-[var(--paper)]';
    case 'pending':
      return 'text-[var(--warn-text)] bg-[var(--warn-bg)]';
    case 'failed':
      return 'text-[var(--ink-soft)] bg-[var(--card-muted)]';
    default:
      return 'text-[var(--muted)] bg-[var(--card-muted)]';
  }
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    type: 'deposit',
    amount: 10000,
    description: 'Added funds via Credit Card',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'completed',
  },
  {
    id: 2,
    type: 'stake',
    amount: 5000,
    description: 'Staked on "Ship MVP in 7 days"',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5),
    status: 'completed',
  },
  {
    id: 3,
    type: 'reward',
    amount: 250,
    description: 'Earned from verification voting',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'completed',
  },
  {
    id: 4,
    type: 'withdraw',
    amount: 2000,
    description: 'Withdrawal to Bank Account',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: 'completed',
  },
  {
    id: 5,
    type: 'reward',
    amount: 150,
    description: 'Earned from pact completion bonus',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72),
    status: 'completed',
  },
];

export default function TransactionHistory({ 
  transactions = MOCK_TRANSACTIONS,
  loading = false 
}: TransactionHistoryProps) {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filteredTransactions = transactions.filter(tx => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Deposits') return tx.type === 'deposit';
    if (selectedFilter === 'Withdrawals') return tx.type === 'withdraw';
    if (selectedFilter === 'Stakes') return tx.type === 'stake';
    if (selectedFilter === 'Rewards') return tx.type === 'reward';
    return true;
  });

  return (
    <div className="bg-[var(--card)] rounded-[24px] p-6 border border-[var(--hairline)] shadow-[0_4px_12px_rgba(23,24,29,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[var(--ink)]">Transaction History</h3>
        <Calendar className="w-5 h-5 text-[var(--muted)]" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTER_TYPES.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedFilter === filter
                ? 'bg-[var(--navy)] text-[var(--card)] shadow-md'
                : 'bg-[var(--card-muted)] text-[var(--ink-soft)] hover:bg-[var(--hairline-soft)]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-[var(--muted)]">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted)]">
            No wallet activity yet
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-[var(--line)] rounded-[24px] hover:bg-[var(--card)] transition"
            >
              {/* Left: Icon & Description */}
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--ink)]">{transaction.description}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {transaction.date.toLocaleDateString()} at {transaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Right: Amount & Status */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    transaction.type === 'deposit' || transaction.type === 'reward'
                      ? 'text-[var(--navy)]'
                      : 'text-[var(--ink)]'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'reward' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(transaction.status)}`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View More Button */}
      {filteredTransactions.length > 0 && (
        <button className="w-full mt-6 px-4 py-3 border border-[var(--line)] rounded-[28px] text-[var(--ink-soft)] font-medium hover:bg-[var(--card)] transition">
          View More Transactions
        </button>
      )}
    </div>
  );
}
