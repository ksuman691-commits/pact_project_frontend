'use client';

import React, { useEffect, useRef, useState } from 'react';

/*
 * Temporary diagnostic for the skewed camera (black wedge) on Android.
 * Shows the raw camera <video> and a plain 2D-canvas copy side by side on a
 * pink background (so letterboxing is pink and any real black is the bug),
 * for a few camera settings, with what the phone actually returned.
 * Not linked from anywhere; remove once the camera bug is fixed.
 */

type Option = { id: string; label: string; video: MediaTrackConstraints };

const OPTIONS: Option[] = [
  { id: 'A', label: 'A · App today (1280×720)', video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } } },
  { id: 'B', label: 'B · No size asked', video: { facingMode: { ideal: 'environment' } } },
  { id: 'C', label: 'C · Portrait 720×1280', video: { facingMode: { ideal: 'environment' }, width: { ideal: 720 }, height: { ideal: 1280 } } },
  { id: 'D', label: 'D · Front, no size', video: { facingMode: { ideal: 'user' } } },
];

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [info, setInfo] = useState('Tap A, B, C and D one by one. Screenshot each.');

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = async (opt: Option) => {
    stop();
    setActive(opt.id);
    setInfo('Starting…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: opt.video, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
    } catch (err: any) {
      setInfo(`${opt.id}: could not open camera (${err?.name || 'error'})`);
    }
  };

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (t - last > 500) {
        last = t;
        const track = streamRef.current?.getVideoTracks()[0];
        const s: any = track?.getSettings() || {};
        const ua = navigator.userAgent.match(/Android [\d.]+|Chrome\/[\d.]+|wv/g)?.join(' · ') || navigator.userAgent.slice(0, 60);
        setInfo(
          [
            `Option ${active ?? '?'}`,
            `video: ${video.videoWidth}×${video.videoHeight}`,
            `track: ${s.width ?? '?'}×${s.height ?? '?'} · ratio ${s.aspectRatio ? Number(s.aspectRatio).toFixed(3) : '?'} · ${s.frameRate ? Math.round(s.frameRate) : '?'}fps · resize ${s.resizeMode ?? '?'}`,
            `camera: ${track?.label || '?'}`,
            `screen: ${window.innerWidth}×${window.innerHeight} · ${screen.orientation?.type ?? '?'}`,
            `browser: ${ua}`,
          ].join('\n'),
        );
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  useEffect(() => stop, []);

  return (
    <main style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#FF2D9B', color: '#111', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 8, padding: 10, overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => void start(o)}
            style={{ minHeight: 44, borderRadius: 10, border: 'none', fontWeight: 800, fontSize: 18, background: active === o.id ? '#111' : '#fff', color: active === o.id ? '#fff' : '#111' }}
            aria-label={o.label}
          >
            {o.id}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600 }}>{OPTIONS.find((o) => o.id === active)?.label ?? 'Pick an option'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <figure style={{ margin: 0 }}>
          <figcaption style={{ fontSize: 12, fontWeight: 700 }}>1 · Raw camera</figcaption>
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '44vh', objectFit: 'contain', background: 'transparent', display: 'block' }} />
        </figure>
        <figure style={{ margin: 0 }}>
          <figcaption style={{ fontSize: 12, fontWeight: 700 }}>2 · Copied to canvas</figcaption>
          <canvas ref={canvasRef} style={{ width: '100%', height: '44vh', objectFit: 'contain', display: 'block' }} />
        </figure>
      </div>
      <pre style={{ margin: 0, padding: 10, borderRadius: 10, background: '#fff', fontSize: 12, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{info}</pre>
    </main>
  );
}
