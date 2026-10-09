'use client';

import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit?: (amount: number, method: string) => Promise<void>;
}

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'bank', label: 'Bank Transfer', icon: Building2 },
];

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000];

export default function DepositModal({ isOpen, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      if (onDeposit) {
        await onDeposit(parseFloat(amount), method);
      }
      setAmount('');
      toast.success(`Deposit of ₹${amount} initiated!`);
      onClose();
    } catch (error) {
      toast.error('Failed to process deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-[var(--card)] w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink">Add Funds</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted mb-2">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-hairline rounded-md focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="mb-6">
          <p className="text-sm font-medium text-muted mb-3">Quick amounts</p>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  amount === quickAmount.toString()
                    ? 'bg-navy text-white '
                    : 'bg-card-muted text-ink-soft hover:bg-hairline'
                }`}
              >
                ₹{(quickAmount / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted mb-3">
            Payment Method
          </label>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`w-full flex items-center justify-between p-4 border-2 rounded-md transition-all ${
                  method === id
                    ? 'border-navy bg-card'
                    : 'border-hairline hover:border-hairline'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-navy" />
                  <span className="font-medium text-ink">{label}</span>
                </div>
                {method === id && (
                  <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Fee Information */}
        <div className="bg-card-muted border border-hairline rounded-md p-4 mb-6">
          <p className="text-xs text-ink">
            <span className="font-medium">Processing Fee:</span> 0% for orders above ₹1000
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-hairline rounded-md text-muted font-medium hover:bg-card-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-navy text-white rounded-full font-medium hover:bg-navy-hover transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Add Funds'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
