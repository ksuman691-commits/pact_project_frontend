'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

    // Checklist proofs don't collect a file (there's no file-picker step for
    // them above), but the upload-proof endpoint's FormData contract always
    // requires a `file` part. Without this, `file` stays null and the guard
    // below used to silently no-op on submit — no request, no error, no
    // feedback. Synthesize a small text file from the completion status so
    // the request actually fires and the existing onError toast can report
    // any real failure.
    const proofFile =
      file ?? (proofType === 'checklist' ? new File([caption], 'checklist.txt', { type: 'text/plain' }) : null);

    if (proofFile) {
      uploadMutation.mutate(
        {
          proof_file: proofFile,
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

  // Portalled straight to document.body. Rendering this inline where the
  // card lives isn't enough to guarantee `fixed inset-0` covers the real
  // viewport: any ancestor card — even ones with no explicit z-index — can
  // create its own CSS stacking context (backdrop-filter, or a lingering
  // non-"none" transform left behind by a mount-in animation, like the
  // .pact-list-item wrapper every list card sits in here) and silently cap
  // this modal's z-50 below feed-wide chrome like the bottom nav (z-40).
  // A portal sidesteps the whole class of ancestor-stacking-context bugs.
  return createPortal(
    <div className="pact-flow fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="pact-card w-full max-w-md rounded-[28px] overflow-hidden" style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--pact-hairline)]">
          <h2 className="text-lg font-bold text-[var(--pact-text)]">Submit Proof</h2>
          <button
            onClick={handleClose}
            disabled={uploadMutation.isPending}
            className="p-1.5 rounded-[28px] transition hover:bg-[var(--pact-surface-2)]"
          >
            <X className="w-5 h-5 text-[var(--pact-text)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Proof Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-[var(--pact-text)] mb-3">Proof Type</label>
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
                  className="p-3 rounded-[28px] border-2 transition flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={
                    proofType === id
                      ? { borderColor: 'var(--pact-pink)', background: 'var(--pact-surface-raised)', color: 'var(--pact-text)' }
                      : { borderColor: 'var(--pact-hairline)', color: 'var(--pact-text-dim)' }
                  }
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
              <label className="block text-sm font-semibold text-[var(--pact-text)] mb-3">
                {proofType === 'photo' ? 'Select Photo' : 'Select Video'}
              </label>
              <label
                className="rounded-[28px] p-6 flex flex-col items-center justify-center cursor-pointer transition border-2 border-dashed"
                style={{ borderColor: 'var(--pact-hairline)', background: 'var(--pact-surface-2)' }}
              >
                <Upload className="w-8 h-8 mb-2 text-[var(--pact-text-faint)]" />
                <p className="text-sm font-semibold text-[var(--pact-text)]">Click to upload</p>
                <p className="text-xs text-[var(--pact-text-faint)]">or drag and drop</p>
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
                  <p className="text-xs text-[var(--pact-text-faint)] mb-2">Preview:</p>
                  {proofType === 'photo' ? (
                    <img src={preview} alt="Preview" className="w-full rounded-[28px] max-h-40 object-cover" />
                  ) : (
                    <video src={preview} className="w-full rounded-[28px] max-h-40" controls />
                  )}
                  {file && <p className="text-xs text-[var(--pact-text-faint)] mt-2">{file.name}</p>}
                </div>
              )}
            </div>
          )}

          {/* Caption / Status */}
          <div>
            <label className="block text-sm font-semibold text-[var(--pact-text)] mb-3">
              {proofType === 'checklist' ? 'Completion Status' : 'Optional Caption'}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploadMutation.isPending}
              placeholder={proofType === 'checklist' ? 'Describe your completion...' : 'Add a caption (optional)'}
              rows={4}
              className="w-full px-4 py-2.5 rounded-[28px] resize-none disabled:opacity-50 focus:outline-none focus:ring-2"
              style={{
                background: 'var(--pact-surface-2)',
                border: '1px solid var(--pact-hairline)',
                color: 'var(--pact-text)',
                ['--tw-ring-color' as any]: 'var(--pact-violet)',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-[var(--pact-hairline)]" style={{ background: 'var(--pact-surface-2)' }}>
          <button
            onClick={handleClose}
            disabled={uploadMutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-[28px] transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--pact-surface-raised)]"
            style={{ color: 'var(--pact-text)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || (proofType !== 'checklist' && !file)}
            className="pact-btn-glow flex-1 px-4 py-2.5 rounded-[28px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Submit Proof'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
