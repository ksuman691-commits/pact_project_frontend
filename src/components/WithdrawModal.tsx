'use client';

import React, { useState } from 'react';
import { X, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount?: number;
  onWithdraw?: (amount: number, method: string) => Promise<void>;
}

const WITHDRAWAL_METHODS = [
  { id: 'bank', label: 'Bank Account', description: 'Direct bank transfer' },
  { id: 'upi', label: 'UPI', description: 'Instant to UPI ID' },
];

export default function WithdrawModal({ 
  isOpen, 
  onClose, 
  maxAmount = 0,
  onWithdraw 
}: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > maxAmount) {
      toast.error(`Amount exceeds available balance of ₹${maxAmount}`);
      return;
    }

    setLoading(true);
    try {
      if (onWithdraw) {
        await onWithdraw(withdrawAmount, method);
      }
      setAmount('');
      toast.success(`Withdrawal request for ₹${amount} submitted!`);
      onClose();
    } catch (error) {
      toast.error('Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Withdraw Funds</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Available Balance */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-emerald-900">
            <span className="font-medium">Available Balance:</span> ₹{maxAmount.toLocaleString()}
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Withdrawal Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            max={maxAmount}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-gray-600 mt-2">
            Minimum: ₹100 | Maximum: ₹{maxAmount.toLocaleString()}
          </p>
        </div>

        {/* Withdrawal Method */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Withdrawal Method
          </label>
          <div className="space-y-2">
            {WITHDRAWAL_METHODS.map(({ id, label, description }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`w-full flex items-start justify-between p-4 border-2 rounded-lg transition-all ${
                  method === id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-600">{description}</p>
                </div>
                {method === id && (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 ml-3">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900 mb-1">Processing Time</p>
            <p className="text-xs text-yellow-800">
              Bank transfers typically take 1-2 business days. UPI transfers are instant.
            </p>
          </div>
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
            onClick={handleWithdraw}
            disabled={loading || !amount}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Withdraw'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
