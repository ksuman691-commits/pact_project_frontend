'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, Video, Loader } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { pactService } from '@/services/api';

interface ProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pactId: number;
  onUpload?: (pactId: number, proof?: any) => void;
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
  const [cameraMode, setCameraMode] = useState<'photo' | 'video' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const genericInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const stopCamera = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraMode(null);
    setCameraReady(false);
    setIsRecording(false);
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  };

  const startCamera = async (mode: 'photo' | 'video') => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera is not supported in this browser');
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: mode === 'video',
      });
      streamRef.current = stream;
      setCameraMode(mode);
      setCameraReady(true);
      requestAnimationFrame(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => undefined);
        }
      });
    } catch (err: any) {
      toast.error('Unable to access camera. Check browser permissions.');
    }
  };

  const capturePhoto = () => {
    if (!liveVideoRef.current || !canvasRef.current) {
      toast.error('Camera is not ready');
      return;
    }

    const video = liveVideoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Unable to capture photo');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Unable to capture photo');
          return;
        }
        const capturedFile = new File([blob], `proof-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFile(capturedFile);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  const startRecording = () => {
    if (!streamRef.current) {
      toast.error('Camera is not ready');
      return;
    }
    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const recordedFile = new File([blob], `proof-${Date.now()}.webm`, { type: 'video/webm' });
        setFile(recordedFile);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Unable to start video recording');
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state === 'inactive') {
      return;
    }
    recorderRef.current.stop();
    setIsRecording(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
      const proofType = file.type.startsWith('video/') ? 'video' : 'photo';
      const response = await pactService.uploadProofFile(pactId, file, proofType, description);
      
      toast.success('Proof uploaded successfully!');
      onUpload?.(pactId, {
        id: response.data?.proof_id ?? Date.now(),
        file_url: response.data?.file_url || preview,
        proof_type: proofType,
        caption: description,
        created_at: new Date().toISOString(),
      });
      resetForm();
      onClose();
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    stopCamera();
    setDescription('');
    setFile(null);
    setPreview('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
      <div className="w-full sm:max-w-md sm:rounded-[24px] rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto bg-slate-950 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Upload Proof</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 transition"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              What did you accomplish today?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your progress..."
              className="w-full px-4 py-3 rounded-[24px] outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none bg-white/5 border border-white/10 text-white placeholder:text-white/40"
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Upload Evidence
            </label>
            
            {!preview ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera('photo')}
                    className="px-3 py-2 rounded-[28px] text-sm font-semibold transition bg-white/5 hover:bg-white/10 text-violet-300"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Take Photo
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startCamera('video')}
                    className="px-3 py-2 rounded-[28px] text-sm font-semibold transition bg-white/5 hover:bg-white/10 text-pink-300"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Record Video
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => genericInputRef.current?.click()}
                    className="px-3 py-2 rounded-[28px] text-sm font-semibold transition bg-white/5 hover:bg-white/10 text-white/70"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Choose File
                    </span>
                  </button>
                </div>

                {cameraMode && cameraReady && (
                  <div className="rounded-[24px] p-3 space-y-3 border border-white/10 bg-white/5">
                    <div className="w-full aspect-video bg-black rounded-[28px] overflow-hidden">
                      <video ref={liveVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      {cameraMode === 'photo' ? (
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex-1 px-3 py-2 rounded-[28px] text-white text-sm font-semibold transition bg-gradient-to-r from-pink-500 to-violet-500 hover:brightness-110"
                        >
                          Capture Photo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`flex-1 px-3 py-2 rounded-[28px] text-white text-sm font-semibold transition ${
                            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'
                          }`}
                        >
                          {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-2 rounded-[28px] text-sm font-semibold transition border border-white/10 text-white/70 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <label className="rounded-[24px] p-6 text-center cursor-pointer transition block border-2 border-dashed border-white/15 hover:border-violet-400/50 hover:bg-white/5">
                  <input
                    ref={genericInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-white/40" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-white/50">
                        PNG, JPG, GIF, MP4 (max 50MB)
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="w-full aspect-square rounded-[24px] overflow-hidden bg-white/5">
                  {file?.type.startsWith('image/') ? (
                    <Image
                      src={preview}
                      alt="Proof preview"
                      width={800}
                      height={800}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video src={preview} className="w-full h-full object-cover" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setFile(null);
                    setPreview('');
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-white/50 mt-2">{file?.name}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 font-semibold rounded-[24px] transition border border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-4 py-3 text-white font-semibold rounded-[24px] transition flex items-center justify-center gap-2 disabled:opacity-50 bg-gradient-to-r from-pink-500 to-violet-500 hover:brightness-110"
            >
              {isUploading && <Loader className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Submit Proof'}
            </button>
          </div>
        </form>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
