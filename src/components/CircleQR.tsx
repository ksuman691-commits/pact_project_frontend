'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, ExternalLink, Share2, X } from 'lucide-react';
import { circlePublicWallService } from '@/services/circlePublicWallService';

type CircleLike = { id: number; name: string; icon_emoji?: string | null; photo_url?: string | null; member_count?: number };

type Matrix = { size: number; data: boolean[]; reservedBit: boolean[] };

const WALL_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://circlepact.app';
export const circleWallUrl = (id: number) => `${WALL_ORIGIN}/circles/${id}/wall`;

/** Deterministic small integer from the backend's qr_seed string, used only
 * as a cosmetic rotation offset for the reveal order below - never changes
 * which fraction of modules are revealed, only where the "first" one is. */
function seedToOffset(seed: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return mod > 0 ? hash % mod : 0;
}

function matrixFor(url: string, setMatrix: (m: Matrix | null) => void) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' }) as any;
  setMatrix({ size: qr.modules.size, data: Array.from(qr.modules.data), reservedBit: Array.from(qr.modules.reservedBit) });
}

function isFinder(row: number, col: number, size: number) {
  return (row < 9 && col < 9) || (row < 9 && col >= size - 8) || (row >= size - 8 && col < 9);
}
function isAlwaysVisible(row: number, col: number, size: number, reserved: boolean) {
  return reserved || isFinder(row, col, size);
}

/**
 * Reveals QR modules in codeword (data-bitstream) order, not visual raster
 * order - empirically verified (scripts/qr-scannability-test.js) to become
 * genuinely scannable at ~78% reveal, vs. ~97% for a scattered/random
 * order. `seed` only rotates the starting offset within that same
 * contiguous sequential order (cosmetic per-circle variety) - it never
 * scrambles which fraction is hidden, so the ~78% guarantee holds.
 */
export function CircleQR({ url, progress, size = 220, label = 'CirclePact QR code', seed = '' }: { url: string; progress: number; size?: number; label?: string; seed?: string }) {
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  useEffect(() => { matrixFor(url, setMatrix); }, [url]);
  if (!matrix) return <div className="aspect-square w-full max-w-[220px] animate-pulse bg-[var(--pact-surface-2)]" aria-label="Generating QR code" />;
  const dataIndexes = matrix.data.map((_, i) => i).filter(i => !matrix.reservedBit[i]);
  const offset = seed ? seedToOffset(seed, dataIndexes.length) : 0;
  const rotated = dataIndexes.slice(offset).concat(dataIndexes.slice(0, offset));
  const revealed = Math.floor(rotated.length * Math.min(100, Math.max(0, progress)) / 100);
  const revealedSet = new Set(rotated.slice(0, revealed));
  const moduleSize = size / matrix.size;
  return <svg role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} className="h-full w-full" shapeRendering="crispEdges">
    <rect width={size} height={size} fill="white" />
    {matrix.data.map((dark, i) => { const row = Math.floor(i / matrix.size); const col = i % matrix.size; const show = isAlwaysVisible(row, col, matrix.size, matrix.reservedBit[i]) ? dark : revealedSet.has(i) && dark; return show ? <rect key={i} x={col * moduleSize} y={row * moduleSize} width={moduleSize} height={moduleSize} fill="#111827" /> : null; })}
  </svg>;
}

/** Fetches the live server-computed reveal_progress + qr_seed for a circle.
 * Falls back to 0% (fully hidden, safe default) if the endpoint fails. */
function useCircleQrProgress(circleId: number) {
  const [state, setState] = useState<{ progress: number; seed: string; loaded: boolean }>({ progress: 0, seed: '', loaded: false });
  useEffect(() => {
    let active = true;
    (async () => {
      const result = await circlePublicWallService.getQrProgress(circleId);
      if (!active) return;
      setState({ progress: result?.reveal_progress ?? 0, seed: result?.qr_seed ?? '', loaded: true });
    })();
    return () => { active = false; };
  }, [circleId]);
  return state;
}

export function CircleQRTeaser({ circle, onOpen }: { circle: CircleLike; onOpen: () => void }) {
  const { progress, seed, loaded } = useCircleQrProgress(circle.id);
  const scannable = progress >= 78;
  return <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 border-y border-[var(--pact-hairline)] py-5 text-left">
    <div className="h-24 w-24 shrink-0 rounded-xl bg-white p-2"><CircleQR url={circleWallUrl(circle.id)} progress={progress} seed={seed} size={200} /></div>
    <span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-[0.2em] text-[var(--pact-violet)]">Circle QR</span><span className="mt-1 block font-bold">{loaded ? `${Math.round(progress)}% revealed` : 'Loading…'}</span><span className="mt-1 block text-sm text-[var(--pact-text-muted)]">{scannable ? 'Already scannable!' : 'Keep showing up to unlock it.'}</span></span>
  </button>;
}

export function CircleQRFullView({ circle, onClose }: { circle: CircleLike; onClose: () => void }) {
  const { progress, seed, loaded } = useCircleQrProgress(circle.id);
  const complete = loaded && progress >= 100;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="dialog" aria-modal="true" aria-label="Circle QR">
    <div className="w-full max-w-md rounded-3xl bg-[var(--pact-bg)] p-6 text-[var(--pact-text)]"><button type="button" onClick={onClose} className="float-right rounded-full p-2" aria-label="Close"><X className="h-5 w-5" /></button><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--pact-violet)]">{circle.name}</p><h2 className="mt-2 text-2xl font-black">Your circle, revealed.</h2><div className="mx-auto mt-6 max-w-[280px] rounded-2xl bg-white p-4"><CircleQR url={circleWallUrl(circle.id)} progress={progress} seed={seed} size={280} /></div><p className="mt-4 text-center text-sm text-[var(--pact-text-muted)]">{complete ? '100% complete — this QR is ready to share anywhere.' : `${Math.round(progress)}% revealed · public pacts only`}</p>{complete && <CircleShareCard circle={circle} />}</div>
  </div>;
}

export function CircleShareCard({ circle }: { circle: CircleLike }) {
  const node = useRef<HTMLDivElement>(null); const url = circleWallUrl(circle.id);
  const share = async () => { if (navigator.share) await navigator.share({ title: `${circle.name} on CirclePact`, text: 'Real goals. Real proof. Real people.', url }); else window.open(`mailto:?subject=${encodeURIComponent(circle.name + ' on CirclePact')}&body=${encodeURIComponent(url)}`, '_self'); };
  const download = async () => {
    const svg = node.current?.querySelector('svg');
    if (!svg) return;
    const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((png) => {
        if (!png) return;
        const href = URL.createObjectURL(png);
        const a = document.createElement('a');
        a.href = href;
        a.download = `${circle.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-circlepact-qr.png`;
        a.click();
        URL.revokeObjectURL(href);
      }, 'image/png');
      URL.revokeObjectURL(svgUrl);
    };
    image.src = svgUrl;
  };
  return <div className="mt-5 border-t border-[var(--pact-hairline)] pt-5" ref={node}><p className="font-bold">Verified circle achievement</p><p className="mt-1 text-sm text-[var(--pact-text-muted)]">{circle.member_count ?? 0} members</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full bg-[var(--pact-violet)] px-4 py-2 text-sm font-bold text-white"><Share2 className="h-4 w-4" />Share</button><button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-full border border-[var(--pact-hairline)] px-4 py-2 text-sm font-bold"><Download className="h-4 w-4" />Download QR</button><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[var(--pact-hairline)] px-3 py-2 text-sm font-bold">LinkedIn <ExternalLink className="h-3 w-3" /></a><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(circle.name + ' is building accountability on CirclePact')}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[var(--pact-hairline)] px-3 py-2 text-sm font-bold">X <ExternalLink className="h-3 w-3" /></a></div></div>;
}

export default CircleQR;
