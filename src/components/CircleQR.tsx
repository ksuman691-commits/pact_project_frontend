'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, ExternalLink, Lock, Share2, X } from 'lucide-react';
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

/** Fade-out threshold for the "locked" treatment below — chosen so the
 * overlay is only present while reveal_progress is still close to nothing
 * (the "broken image" range), and is fully gone well before the QR
 * actually becomes scannable (~78%, see CircleQR above). */
const LOCKED_OVERLAY_THRESHOLD = 8;

/**
 * At/near 0% revealed, the sparse QR modules on their own read as a
 * broken or glitchy image rather than an intentional "not yet earned"
 * state. This frosted-blur + lock treatment (Duolingo/Apple Fitness style)
 * signals "locked reward," not "something's wrong" - and fades out as soon
 * as there's meaningful progress, rather than snapping off abruptly.
 */
function LockedQrOverlay({ progress }: { progress: number }) {
  if (progress >= LOCKED_OVERLAY_THRESHOLD) return null;
  const opacity = 1 - progress / LOCKED_OVERLAY_THRESHOLD;
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-[inherit] backdrop-blur-sm transition-opacity"
      style={{ background: 'rgba(255,255,255,0.72)', opacity }}
      aria-hidden="true"
    >
      <Lock className="h-6 w-6 text-slate-400" strokeWidth={2.5} />
    </div>
  );
}

export function CircleQRTeaser({ circle, onOpen }: { circle: CircleLike; onOpen: () => void }) {
  const { progress, seed, loaded } = useCircleQrProgress(circle.id);
  const scannable = progress >= 78;
  return <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 border-y border-[var(--pact-hairline)] py-5 text-left">
    <div className="relative h-24 w-24 shrink-0 rounded-xl bg-white p-2"><CircleQR url={circleWallUrl(circle.id)} progress={progress} seed={seed} size={200} />{loaded && <LockedQrOverlay progress={progress} />}</div>
    {/* The reveal mechanic itself was previously unexplained ("keep
        showing up to unlock it" — showing up how? unlocks what?), reading
        as a mystery box rather than a motivating feature. This states the
        one thing we can actually confirm ties reveal progress to circle
        activity: the Wall this QR links to only ever surfaces the
        circle's PUBLIC pacts (see circlePublicWallService.ts), so framing
        it around completing those together is accurate without
        overclaiming an exact formula (streak days vs. proof count) the
        backend doesn't expose. */}
    <span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-[0.2em] text-[var(--pact-violet)]">Circle QR</span><span className="mt-1 block font-bold">{loaded ? `${Math.round(progress)}% revealed` : 'Loading…'}</span><span className="mt-1 block text-sm text-[var(--pact-text-muted)]">{scannable ? 'Already scannable!' : 'Reveals as your circle completes public pacts together.'}</span></span>
  </button>;
}

/**
 * Quiet, single-line stand-in for the full CircleQRTeaser card — used only
 * in the new-circle hero layout, where a large locked-QR visual would be
 * the loudest thing on a page that has nothing to show yet. Still opens
 * the same CircleQRFullView, so sharing works even at 0% reveal.
 */
export function CircleQRQuietLine({ circle, onOpen }: { circle: CircleLike; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="text-left text-sm text-[var(--pact-text-muted)] underline decoration-[var(--pact-hairline)] underline-offset-4">
    Circle QR unlocks once you complete a public pact together
  </button>;
}

export function CircleQRFullView({ circle, onClose }: { circle: CircleLike; onClose: () => void }) {
  const { progress, seed, loaded } = useCircleQrProgress(circle.id);
  const complete = loaded && progress >= 100;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="dialog" aria-modal="true" aria-label="Circle QR">
    <div className="w-full max-w-md rounded-3xl bg-[var(--pact-bg)] p-6 text-[var(--pact-text)]"><button type="button" onClick={onClose} className="float-right rounded-full p-2" aria-label="Close"><X className="h-5 w-5" /></button><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--pact-violet)]">{circle.name}</p><h2 className="mt-2 text-2xl font-black">Your circle, revealed.</h2><div className="relative mx-auto mt-6 max-w-[280px] rounded-2xl bg-white p-4"><CircleQR url={circleWallUrl(circle.id)} progress={progress} seed={seed} size={280} />{loaded && <LockedQrOverlay progress={progress} />}</div><p className="mt-4 text-center text-sm text-[var(--pact-text-muted)]">{complete ? '100% complete — this QR is ready to share anywhere.' : `${Math.round(progress)}% revealed — reveals as your circle completes public pacts together`}</p><CircleShareCard circle={circle} /></div>
  </div>;
}

/** Loads an SVG string as a rasterizable <img>, resolving once it's decoded. */
function loadSvgAsImage(svgMarkup: string): Promise<{ image: HTMLImageElement; revoke: () => void }> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => resolve({ image, revoke: () => URL.revokeObjectURL(svgUrl) });
    image.onerror = reject;
    image.src = svgUrl;
  });
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Composes the actual downloadable/shareable artifact — a branded poster,
 * not the bare QR — via real canvas drawing so it's a genuine exportable
 * PNG (vs. a CSS-only card that can only ever be screenshotted). The QR
 * itself is drawn from its live <svg> (whatever reveal state it's
 * currently in — this intentionally works pre-100%, per the "even a
 * partially-revealed QR should be shareable" requirement) rasterized onto
 * an offscreen canvas first, then composited into the white inset panel
 * here alongside the wordmark/name/taglines drawn with canvas text APIs.
 */
async function buildCircleShareCardImage(circle: CircleLike, qrSvgEl: SVGElement): Promise<Blob | null> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Card background + border, matching the app's cream/off-white share-card treatment.
  ctx.fillStyle = '#FBF5EC';
  ctx.fillRect(0, 0, width, height);
  roundedRectPath(ctx, 24, 24, width - 48, height - 48, 40);
  ctx.strokeStyle = '#E8DCC8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Logo mark (LogoMark's wedge, see src/components/LogoMark.tsx) + full
  // "CirclePact" wordmark. This card is the external-facing artifact
  // people post to WhatsApp/social/print, so it spells out the full brand
  // name for clarity, unlike the app's internal "pact" wordmark shorthand
  // used in in-product chrome (nav, spinner, etc).
  ctx.font = '600 40px system-ui, -apple-system, sans-serif';
  const wordmarkText = 'CirclePact';
  const wordmarkWidth = ctx.measureText(wordmarkText).width;
  const logoSize = 54;
  const logoGap = 16;
  const lockupWidth = logoSize + logoGap + wordmarkWidth;
  const lockupX = (width - lockupWidth) / 2;
  const wedgePath = new Path2D('M80 80 L137.34 39.84 A70 70 0 1 1 92.16 11.06 Z');
  ctx.save();
  ctx.translate(lockupX, 88 - logoSize / 2);
  ctx.scale(logoSize / 160, logoSize / 160);
  ctx.fillStyle = '#E5373B';
  ctx.fill(wedgePath);
  ctx.restore();
  ctx.fillStyle = '#1C1310';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(wordmarkText, lockupX + logoSize + logoGap, 88);

  // QR code, rasterized from its live SVG and framed in a white inset panel.
  const svgMarkup = new XMLSerializer().serializeToString(qrSvgEl);
  const { image: qrImage, revoke } = await loadSvgAsImage(svgMarkup);
  const panelSize = 640;
  const panelX = (width - panelSize) / 2;
  const panelY = 200;
  roundedRectPath(ctx, panelX, panelY, panelSize, panelSize, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  const qrPadding = 48;
  ctx.drawImage(qrImage, panelX + qrPadding, panelY + qrPadding, panelSize - qrPadding * 2, panelSize - qrPadding * 2);
  revoke();

  // Circle name.
  ctx.fillStyle = '#1C1310';
  ctx.font = '800 52px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(circle.name, width / 2, panelY + panelSize + 90);

  // Tagline.
  ctx.fillStyle = '#6B5D52';
  ctx.font = '400 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('Scan to see what we\u2019re chasing together', width / 2, panelY + panelSize + 140);

  // Footer tagline.
  ctx.fillStyle = '#A99991';
  ctx.font = '600 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('Real goals. Real proof. Real people.', width / 2, height - 70);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

export function CircleShareCard({ circle }: { circle: CircleLike }) {
  const node = useRef<HTMLDivElement>(null); const url = circleWallUrl(circle.id);
  const buildImage = async () => {
    const svg = node.current?.querySelector('svg');
    if (!svg) return null;
    return buildCircleShareCardImage(circle, svg);
  };
  const share = async () => {
    const png = await buildImage();
    if (navigator.share && png && (!navigator.canShare || navigator.canShare({ files: [new File([png], 'circle-qr.png', { type: 'image/png' })] }))) {
      const file = new File([png], `${circle.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-circlepact-qr.png`, { type: 'image/png' });
      await navigator.share({ title: `${circle.name} on CirclePact`, text: 'Real goals. Real proof. Real people.', url, files: [file] });
    } else if (navigator.share) {
      await navigator.share({ title: `${circle.name} on CirclePact`, text: 'Real goals. Real proof. Real people.', url });
    } else {
      window.open(`mailto:?subject=${encodeURIComponent(circle.name + ' on CirclePact')}&body=${encodeURIComponent(url)}`, '_self');
    }
  };
  const download = async () => {
    const png = await buildImage();
    if (!png) return;
    const href = URL.createObjectURL(png);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${circle.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-circlepact-qr.png`;
    a.click();
    URL.revokeObjectURL(href);
  };
  return <div className="mt-5 border-t border-[var(--pact-hairline)] pt-5" ref={node}><p className="font-bold">Share this circle</p><p className="mt-1 text-sm text-[var(--pact-text-muted)]">{circle.member_count ?? 0} members</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full bg-[var(--pact-violet)] px-4 py-2 text-sm font-bold text-white"><Share2 className="h-4 w-4" />Share</button><button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-full border border-[var(--pact-hairline)] px-4 py-2 text-sm font-bold"><Download className="h-4 w-4" />Download</button><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[var(--pact-hairline)] px-3 py-2 text-sm font-bold">LinkedIn <ExternalLink className="h-3 w-3" /></a><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(circle.name + ' is building accountability on CirclePact')}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[var(--pact-hairline)] px-3 py-2 text-sm font-bold">X <ExternalLink className="h-3 w-3" /></a></div></div>;
}

export default CircleQR;
