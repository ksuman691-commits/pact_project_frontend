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
      <div className="bg-[var(--card)] w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink">Withdraw Funds</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Available Balance */}
        <div className="bg-card border border-hairline rounded-md p-4 mb-6">
          <p className="text-sm text-ink">
            <span className="font-medium">Available Balance:</span> ₹{maxAmount.toLocaleString()}
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted mb-2">
            Withdrawal Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            max={maxAmount}
            className="w-full px-4 py-3 border border-hairline rounded-md focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <p className="text-xs text-muted mt-2">
            Minimum: ₹100 | Maximum: ₹{maxAmount.toLocaleString()}
          </p>
        </div>

        {/* Withdrawal Method */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted mb-3">
            Withdrawal Method
          </label>
          <div className="space-y-2">
            {WITHDRAWAL_METHODS.map(({ id, label, description }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`w-full flex items-start justify-between p-4 border-2 rounded-md transition-all ${
                  method === id
                    ? 'border-navy bg-card'
                    : 'border-hairline hover:border-hairline'
                }`}
              >
                <div className="flex-1 text-left">
                  <p className="font-medium text-ink">{label}</p>
                  <p className="text-xs text-muted">{description}</p>
                </div>
                {method === id && (
                  <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center flex-shrink-0 ml-3">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-warn-bg border border-hairline rounded-md p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-warn-text flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warn-text mb-1">Processing Time</p>
            <p className="text-xs text-warn-text">
              Bank transfers typically take 1-2 business days. UPI transfers are instant.
            </p>
          </div>
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
            onClick={handleWithdraw}
            disabled={loading || !amount}
            className="flex-1 px-4 py-3 bg-navy text-white rounded-full font-medium hover:bg-navy-hover transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Withdraw'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
