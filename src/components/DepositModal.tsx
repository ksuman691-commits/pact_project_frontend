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
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Funds</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick amounts</p>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  amount === quickAmount.toString()
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ₹{(quickAmount / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                  method === id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">{label}</span>
                </div>
                {method === id && (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Fee Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-blue-900">
            <span className="font-medium">Processing Fee:</span> 0% for orders above ₹1000
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Add Funds'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
