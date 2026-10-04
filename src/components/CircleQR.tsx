'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, ExternalLink, Share2, X } from 'lucide-react';

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

/**
 * Circle QR codes are available in full, immediately, from the moment a
 * circle is created — no member-count or "maturity" threshold gates them.
 * Always rendered at progress=100 (fully revealed/scannable); the
 * progressive-reveal mechanic in CircleQR above is kept as a generic,
 * reusable capability of the component (driven by its `progress` prop)
 * but is no longer used to gate anything here.
 */
export function CircleQRTeaser({ circle, onOpen }: { circle: CircleLike; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 border-y border-[var(--pact-hairline)] py-5 text-left">
    <div className="h-24 w-24 shrink-0 rounded-xl bg-white p-2"><CircleQR url={circleWallUrl(circle.id)} progress={100} size={200} /></div>
    <span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-[0.2em] text-[var(--pact-violet)]">Circle QR</span><span className="mt-1 block font-bold">Ready to share</span><span className="mt-1 block text-sm text-[var(--pact-text-muted)]">Scan or share it so anyone can see what you&apos;re building together.</span></span>
  </button>;
}

/**
 * Quiet, single-line stand-in for the full CircleQRTeaser card — used only
 * in the new-circle hero layout, where a large QR visual would be the
 * loudest thing on a page that has nothing else to show yet. Still opens
 * the same CircleQRFullView, with a full, scannable QR immediately.
 */
export function CircleQRQuietLine({ circle, onOpen }: { circle: CircleLike; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="text-left text-sm text-[var(--pact-text-muted)] underline decoration-[var(--pact-hairline)] underline-offset-4">
    Share your circle&apos;s QR code
  </button>;
}

export function CircleQRFullView({ circle, onClose }: { circle: CircleLike; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="dialog" aria-modal="true" aria-label="Circle QR">
    <div className="w-full max-w-md rounded-3xl bg-[var(--pact-bg)] p-6 text-[var(--pact-text)]"><button type="button" onClick={onClose} className="float-right rounded-full p-2" aria-label="Close"><X className="h-5 w-5" /></button><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--pact-violet)]">{circle.name}</p><h2 className="mt-2 text-2xl font-black">Your circle, ready to share.</h2><div className="mx-auto mt-6 max-w-[280px] rounded-2xl bg-white p-4"><CircleQR url={circleWallUrl(circle.id)} progress={100} size={280} /></div><p className="mt-4 text-center text-sm text-[var(--pact-text-muted)]">Scan or share this QR so anyone can see what {circle.name} is building together.</p><CircleShareCard circle={circle} /></div>
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
