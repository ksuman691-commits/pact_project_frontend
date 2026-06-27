'use client';

import React from 'react';
import { usePactWizard } from '@/context/PactWizardContext';
import { Video, Image, CheckSquare, Info } from 'lucide-react';

const verificationMethods = [
  {
    id: 'video',
    name: 'Video Proof',
    description: 'Submit video recordings of your progress',
    icon: Video,
    color: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'photo',
    name: 'Photo Proof',
    description: 'Submit photos showing your daily progress',
    icon: Image,
    color: 'bg-purple-50 border-purple-200',
  },
  {
    id: 'checklist',
    name: 'Checklist',
    description: 'Simple yes/no daily check-in format',
    icon: CheckSquare,
    color: 'bg-green-50 border-green-200',
  },
];

export default function PactWizardStep3() {
  const { data, updateData } = usePactWizard();

  const selectedMethod = verificationMethods.find((m) => m.id === data.verificationType);
  const Icon = selectedMethod?.icon || Video;

  return (
    <div className="space-y-6">
      {/* Verification Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Verification Method <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {verificationMethods.map((method) => {
            const MethodIcon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => updateData({ verificationType: method.id as any })}
                className={`w-full p-4 border-2 rounded-lg transition text-left ${
                  data.verificationType === method.id
                    ? `${method.color} border-2 border-current`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MethodIcon className="w-6 h-6 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Proof Submission Frequency <span className="text-red-500">*</span>
        </label>
        <select
          value={data.verificationFrequency}
          onChange={(e) => updateData({ verificationFrequency: e.target.value as any })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="daily">Daily</option>
          <option value="every-3-days">Every 3 days</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      {/* Max Proof Uploads */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Max Proof Uploads <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={data.maxProofUploads}
          onChange={(e) => updateData({ maxProofUploads: Math.max(1, parseInt(e.target.value) || 1) })}
          min="1"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-xs text-gray-500 mt-1">Total number of proofs you'll submit</p>
      </div>

      {/* Info Box */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 mb-1">About Verification</p>
          <p className="text-sm text-blue-800">Other circle members will vote on your proofs. Need 75% approval to complete the pact.</p>
        </div>
      </div>

      {/* Method Details */}
      {selectedMethod && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
          <p className="text-sm font-semibold text-gray-900">About {selectedMethod.name}:</p>
          {selectedMethod.id === 'video' && (
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Max 50MB per video</li>
              <li>Supported formats: MP4, MOV, WebM</li>
              <li>Show your face or your work clearly</li>
            </ul>
          )}
          {selectedMethod.id === 'photo' && (
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Max 10MB per photo</li>
              <li>Supported formats: JPG, PNG, WebP</li>
              <li>Include date/timestamp when possible</li>
            </ul>
          )}
          {selectedMethod.id === 'checklist' && (
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Simple yes/no format</li>
              <li>No file uploads needed</li>
              <li>Fast daily check-ins</li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
