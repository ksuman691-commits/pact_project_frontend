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
      <div className="bg-white w-full max-w-md rounded-[28px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(20,18,31,0.06)]">
          <h2 className="text-lg font-bold text-[#14121F]">Submit Proof</h2>
          <button onClick={handleClose} disabled={uploadMutation.isPending} className="p-1.5 hover:bg-[#FAF9FE] rounded-[28px]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Proof Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-[#14121F] mb-3">Proof Type</label>
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
                  className={`p-3 rounded-[28px] border-2 transition flex flex-col items-center gap-2 ${
                    proofType === id
                      ? 'border-emerald-600 bg-[#EDE9FE]'
                      : 'border-[rgba(20,18,31,0.06)] hover:border-slate-300'
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
              <label className="block text-sm font-semibold text-[#14121F] mb-3">
                {proofType === 'photo' ? 'Select Photo' : 'Select Video'}
              </label>
              <label className="border-2 border-dashed border-slate-300 rounded-[28px] p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-[#EDE9FE] transition">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-[#14121F]">Click to upload</p>
                <p className="text-xs text-[#9CA3AF]">or drag and drop</p>
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
                  <p className="text-xs text-[#6B7280] mb-2">Preview:</p>
                  {proofType === 'photo' ? (
                    <img src={preview} alt="Preview" className="w-full rounded-[28px] max-h-40 object-cover" />
                  ) : (
                    <video src={preview} className="w-full rounded-[28px] max-h-40" controls />
                  )}
                  {file && <p className="text-xs text-[#6B7280] mt-2">📦 {file.name}</p>}
                </div>
              )}
            </div>
          )}

          {/* Caption / Status */}
          <div>
            <label className="block text-sm font-semibold text-[#14121F] mb-3">
              {proofType === 'checklist' ? 'Completion Status' : 'Optional Caption'}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploadMutation.isPending}
              placeholder={proofType === 'checklist' ? 'Describe your completion...' : 'Add a caption (optional)'}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-[rgba(20,18,31,0.06)] bg-[#F4F2FB]">
          <button
            onClick={handleClose}
            disabled={uploadMutation.isPending}
            className="flex-1 px-4 py-2.5 text-[#14121F] hover:bg-slate-200 rounded-[28px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || (proofType !== 'checklist' && !file)}
            className="flex-1 px-4 py-2.5 bg-[#A78BFA] text-white hover:bg-emerald-700 rounded-[28px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Submit Proof'}
          </button>
        </div>
      </div>
    </div>
  );
}
