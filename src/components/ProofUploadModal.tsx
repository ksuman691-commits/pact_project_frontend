'use client';

import React, { useState } from 'react';
import { X, Upload, Image, Video, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pactId: number;
  onUpload?: (pactId: number) => void;
}

export default function ProofUploadModal({
  isOpen,
  onClose,
  pactId,
  onUpload,
}: ProofUploadModalProps) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Please add a description for your proof');
      return;
    }

    if (!file) {
      toast.error('Please select an image or video');
      return;
    }

    setIsUploading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Proof uploaded successfully!');
      onUpload?.(pactId);
      resetForm();
      onClose();
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setFile(null);
    setPreview('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Upload Proof</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              What did you accomplish today?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your progress..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Upload Evidence
            </label>
            
            {!preview ? (
              <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, MP4 (max 50MB)
                    </p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="relative">
                <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  {file?.type.startsWith('image/') ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={preview} className="w-full h-full object-cover" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview('');
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-600 mt-2">{file?.name}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {isUploading && <Loader className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Submit Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
