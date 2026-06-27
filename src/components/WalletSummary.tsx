'use client';

import React from 'react';
import { Wallet, TrendingUp, Lock, Zap } from 'lucide-react';
import Image from 'next/image';

interface WalletSummaryProps {
  balance?: number;
  locked?: number;
  rewards?: number;
  loading?: boolean;
}

export default function WalletSummary({ 
  balance = 0, 
  locked = 0, 
  rewards = 0,
  loading = false 
}: WalletSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <Image 
              src="/logo.png" 
              alt="CirclePact" 
              width={40} 
              height={40}
              className="w-full h-full"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
            <p className="text-xs text-gray-600">CirclePact Balance</p>
          </div>
        </div>
        <Wallet className="w-6 h-6 text-emerald-600" />
      </div>

      {/* Main Balance */}
      <div className="mb-6">
        <p className="text-gray-600 text-sm font-medium mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-gray-900">
          {loading ? '...' : `₹${balance.toLocaleString()}`}
        </p>
      </div>

      {/* Balance Breakdown Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Locked Funds */}
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-gray-600 font-medium">Locked</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {loading ? '...' : `₹${locked.toLocaleString()}`}
          </p>
        </div>

        {/* Rewards */}
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-gray-600 font-medium">Rewards</p>
          </div>
          <p className="text-lg font-bold text-emerald-600">
            {loading ? '...' : `₹${rewards.toLocaleString()}`}
          </p>
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-600 font-medium">Total</p>
          </div>
          <p className="text-lg font-bold text-blue-600">
            {loading ? '...' : `₹${(balance + locked + rewards).toLocaleString()}`}
          </p>
        </div>
      </div>
    </div>
  );
}
