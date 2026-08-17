'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, RotateCcw, X } from 'lucide-react';

interface CheerCaptureModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CheerCaptureModal({
  isOpen,
  isSubmitting,
  onClose,
  onCapture,
}: CheerCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let cancelled = false;
    setError(null);
    setCapturedFile(null);
    setCapturedUrl(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support front-camera capture.');
      return () => {
        cancelled = true;
        stopCamera();
      };
    }

    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { exact: 'user' }, width: { ideal: 1080 }, height: { ideal: 1080 } },
    })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) {
          setError('Front camera access is required to send an authentic Cheer.');
        }
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1080;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `cheer-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCapturedFile(file);
      setCapturedUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const retake = () => {
    setCapturedFile(null);
    setCapturedUrl(null);
    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ audio: false, video: { facingMode: { exact: 'user' } } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('Front camera access is required to retake your Cheer.'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button type="button" aria-label="Close Cheer camera" onClick={onClose} className="absolute inset-0 cursor-default" />
      <section role="dialog" aria-modal="true" aria-labelledby="cheer-camera-title" className="relative z-10 flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-white/15 bg-[#171421] text-white shadow-2xl sm:rounded-[28px]">
        <header className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pact-gold)]">24-hour story</p>
            <h2 id="cheer-camera-title" className="mt-1 text-xl font-bold">Send a Cheer</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Cheer camera" className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative mx-4 overflow-hidden rounded-[24px] bg-black">
          {capturedUrl ? (
            <img src={capturedUrl} alt="Preview of your Cheer selfie" className="aspect-square w-full object-cover" />
          ) : (
            <video ref={videoRef} autoPlay muted playsInline aria-label="Front camera preview" className="aspect-square w-full object-cover -scale-x-100" />
          )}
          {!capturedUrl && !error && <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white/85">Front camera only</span>}
          {error && <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm leading-6 text-white/80">{error}</div>}
        </div>

        <footer className="flex items-center justify-center gap-3 px-5 py-5">
          {capturedFile ? (
            <>
              <button type="button" onClick={retake} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50">
                <RotateCcw className="h-4 w-4" /> Retake
              </button>
              <button type="button" onClick={() => onCapture(capturedFile)} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#171421] transition disabled:opacity-60" style={{ background: 'var(--pact-gold)' }}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Send Cheer
              </button>
            </>
          ) : (
            <button type="button" onClick={capture} disabled={Boolean(error)} aria-label="Take Cheer selfie" className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/80 bg-[var(--pact-gold)] text-[#171421] shadow-lg transition hover:scale-105 disabled:opacity-40">
              <Camera className="h-7 w-7" />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
