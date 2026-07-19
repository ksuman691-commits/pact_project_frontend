'use client';

import React, { useRef } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pact: {
    id: number;
    title: string;
    creator: string;
    avatar: string;
    category: string;
    daysCurrent: number;
    daysTotal: number;
    confidence: number;
    believers: number;
    doubters: number;
    progressPercentage: number;
  };
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, pact }) => {
  const shareImageRef = useRef<HTMLDivElement>(null);

  const generateImage = async () => {
    if (!shareImageRef.current) return;
    
    try {
      const canvas = await html2canvas(shareImageRef.current, {
        backgroundColor: '#f5ede4',
        scale: 2,
        logging: false,
      });
      
      const image = canvas.toDataURL('image/jpeg', 0.95);
      return image;
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  const handleShare = async (platform: 'instagram' | 'linkedin' | 'x') => {
    const image = await generateImage();
    if (!image) {
      alert('Failed to generate share image');
      return;
    }

    const link = document.createElement('a');
    link.href = image;
    link.download = `pact-${pact.id}-${platform}.jpg`;
    link.click();

    // Social media sharing URLs
    const text = `I committed to "${pact.title}" for ${pact.daysTotal} days! 💪 ${pact.confidence}% confidence. Join me on CirclePact!`;
    
    const shareUrls = {
      instagram: `https://instagram.com/share?url=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
            <h2 className="text-lg font-bold text-gray-900">Share Your Pact</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Preview */}
          <div className="px-6 py-6">
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600 font-medium mb-3">Preview</p>
              
              {/* Share Image Preview */}
              <div 
                ref={shareImageRef}
                className="w-full bg-gradient-to-b from-yellow-50 to-amber-50 rounded-2xl p-6 text-center shadow-sm border border-gray-200"
                style={{ backgroundColor: '#f5ede4' }}
              >
                {/* Header */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 tracking-wide">CIRCLEPACT</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 leading-tight">
                    {pact.title}
                  </h3>
                </div>

                {/* Avatar & Creator */}
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 flex items-center justify-center text-white text-lg font-bold">
                    {pact.avatar}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">@{pact.creator}</p>
                  <p className="text-xs text-gray-600">{pact.category}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-emerald-600">{pact.confidence}%</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Duration</p>
                    <p className="text-2xl font-bold text-blue-600">{pact.daysTotal}d</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Supporting</p>
                    <p className="text-2xl font-bold text-emerald-600">{(pact.believers / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Skipped</p>
                    <p className="text-2xl font-bold text-red-600">{(pact.doubters / 1000).toFixed(1)}k</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-600">Progress</span>
                    <span className="text-xs font-bold text-gray-900">{pact.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-blue-500"
                      style={{ width: `${pact.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-600 font-medium">
                  Day {pact.daysCurrent}/{pact.daysTotal}
                </p>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={async () => {
                const image = await generateImage();
                if (image) {
                  const link = document.createElement('a');
                  link.href = image;
                  link.download = `pact-${pact.id}.jpg`;
                  link.click();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg mb-4"
            >
              <Download className="w-4 h-4" />
              Download Image
            </button>

            {/* Social Share Options */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 font-medium text-center mb-3">Share to</p>
              <div className="flex justify-center gap-3">
                {/* Instagram */}
                <button
                  onClick={() => handleShare('instagram')}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 hover:shadow-lg transition-all flex items-center justify-center text-white font-bold text-lg group hover:scale-110"
                  title="Share on Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 100-8 4 4 0 000 8zm4.965-10.322a1.44 1.44 0 110 2.881 1.44 1.44 0 010-2.881z"/>
                  </svg>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center text-white font-bold text-lg group hover:scale-110"
                  title="Share on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>

                {/* X (Twitter) */}
                <button
                  onClick={() => handleShare('x')}
                  className="w-12 h-12 rounded-full bg-black hover:bg-gray-900 hover:shadow-lg transition-all flex items-center justify-center text-white font-bold text-lg group hover:scale-110"
                  title="Share on X"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.223-6.831-5.974 6.831H2.882l7.732-8.835L1.227 2.25h6.802l4.721 6.247 5.462-6.247zM17.002 18.807h1.844L6.603 3.552H4.674l12.328 15.255z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
              Download the image and share it manually, or click social icons to share directly
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareModal;
