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
      return 'text-emerald-600 bg-emerald-50';
    case 'withdraw':
      return 'text-red-600 bg-red-50';
    case 'stake':
      return 'text-orange-600 bg-orange-50';
    case 'reward':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-emerald-700 bg-emerald-100';
    case 'pending':
      return 'text-orange-700 bg-orange-100';
    case 'failed':
      return 'text-red-700 bg-red-100';
    default:
      return 'text-gray-700 bg-gray-100';
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
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTER_TYPES.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedFilter === filter
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition"
            >
              {/* Left: Icon & Description */}
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-xs text-gray-600">
                    {transaction.date.toLocaleDateString()} at {transaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Right: Amount & Status */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    transaction.type === 'deposit' || transaction.type === 'reward'
                      ? 'text-emerald-600'
                      : 'text-gray-900'
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
        <button className="w-full mt-6 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
          View More Transactions
        </button>
      )}
    </div>
  );
}
