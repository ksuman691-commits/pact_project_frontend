'use client';

import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Video, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUploadDareProof } from '@/hooks/useDareMutations';

interface DareProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  dareId: number;
}

const PROOF_TYPES = [
  { id: 'photo', label: 'Photo', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
] as const;

export default function DareProofUploadModal({ isOpen, onClose, dareId }: DareProofUploadModalProps) {
  const uploadMutation = useUploadDareProof(dareId);
  const [proofType, setProofType] = useState<'photo' | 'video' | 'checklist'>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Validate file type based on proof type
    if (proofType === 'photo' && !selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (proofType === 'video' && !selectedFile.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (proofType === 'photo') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (proofType === 'video') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (proofType !== 'checklist' && !file) {
      toast.error('Please select a file');
      return;
    }

    if (proofType === 'checklist' && !caption.trim()) {
      toast.error('Please provide your completion status');
      return;
    }

    if (file) {
      uploadMutation.mutate(
        {
          proof_file: file,
          proof_type: proofType,
          caption,
        },
        {
          onSuccess: () => {
            setFile(null);
            setPreview(null);
            setCaption('');
            onClose();
          },
        }
      );
    }
  };

  const handleClose = () => {
    if (!uploadMutation.isPending) {
      setFile(null);
      setPreview(null);
      setCaption('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Submit Proof</h2>
          <button onClick={handleClose} disabled={uploadMutation.isPending} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Proof Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">Proof Type</label>
            <div className="grid grid-cols-3 gap-3">
              {PROOF_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setProofType(id);
                    setFile(null);
                    setPreview(null);
                  }}
                  disabled={uploadMutation.isPending}
                  className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                    proofType === id
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          {proofType !== 'checklist' && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                {proofType === 'photo' ? 'Select Photo' : 'Select Video'}
              </label>
              <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-900">Click to upload</p>
                <p className="text-xs text-slate-500">or drag and drop</p>
                <input
                  type="file"
                  accept={proofType === 'photo' ? 'image/*' : 'video/*'}
                  onChange={handleFileSelect}
                  disabled={uploadMutation.isPending}
                  className="hidden"
                />
              </label>

              {preview && (
                <div className="mt-3">
                  <p className="text-xs text-slate-600 mb-2">Preview:</p>
                  {proofType === 'photo' ? (
                    <img src={preview} alt="Preview" className="w-full rounded-lg max-h-40 object-cover" />
                  ) : (
                    <video src={preview} className="w-full rounded-lg max-h-40" controls />
                  )}
                  {file && <p className="text-xs text-slate-600 mt-2">📦 {file.name}</p>}
                </div>
              )}
            </div>
          )}

          {/* Caption / Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              {proofType === 'checklist' ? 'Completion Status' : 'Optional Caption'}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploadMutation.isPending}
              placeholder={proofType === 'checklist' ? 'Describe your completion...' : 'Add a caption (optional)'}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            disabled={uploadMutation.isPending}
            className="flex-1 px-4 py-2.5 text-slate-900 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || (proofType !== 'checklist' && !file)}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Submit Proof'}
          </button>
        </div>
      </div>
    </div>
  );
}
