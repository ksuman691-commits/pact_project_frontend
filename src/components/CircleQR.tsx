'use client';

import { useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

type CircleLike = { id: number; name: string; icon_emoji?: string | null; photo_url?: string | null; member_count?: number };

export const circleWallUrl = (id: number) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://circlepact.app';
  return `${origin}/circles/${id}/wall`;
};

const INK = '#17181D';

/**
 * The full, scannable QR code: ink modules on white-warm ground, crisp
 * edges. Circle QR codes are available in full, immediately, from the
 * moment a circle is created — no member-count or "maturity" threshold
 * gates them.
 */
export function CircleQR({ url, size = 208, label = 'CirclePact QR code' }: { url: string; size?: number; label?: string }) {
  const matrix = useMemo(() => {
    const qr = QRCode.create(url, { errorCorrectionLevel: 'H' }) as any;
    return { size: qr.modules.size as number, data: Array.from(qr.modules.data) as boolean[] };
  }, [url]);

  const quiet = 0;
  const total = matrix.size + quiet * 2;
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${total} ${total}`} width={size} height={size} shapeRendering="crispEdges" className="block">
      {matrix.data.map((dark, i) =>
        dark ? <rect key={i} x={(i % matrix.size) + quiet} y={Math.floor(i / matrix.size) + quiet} width={1} height={1} fill={INK} /> : null,
      )}
    </svg>
  );
}

function slugify(name: string) {
  return name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/** Loads an SVG string as a rasterizable <img>, resolving once it's decoded. */
function loadSvgAsImage(svgMarkup: string): Promise<{ image: HTMLImageElement; revoke: () => void }> {
  return new Promise((resolve, reject) => {
    const svgUrl = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }));
    const image = new Image();
    image.onload = () => resolve({ image, revoke: () => URL.revokeObjectURL(svgUrl) });
    image.onerror = reject;
    image.src = svgUrl;
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const FONT = "'Inter Tight', 'Helvetica Neue', Arial, sans-serif";

/** Draws a saveable poster: paper background, QR on a photo frame, circle name, link. */
async function buildPoster(circle: CircleLike, url: string, qrSvg: SVGElement): Promise<Blob | null> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#F3EEE3';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.font = `700 56px ${FONT}`;
  ctx.fillText('CirclePact', width / 2, 130);

  const { image, revoke } = await loadSvgAsImage(new XMLSerializer().serializeToString(qrSvg));
  const frame = 640;
  const fx = (width - frame) / 2;
  const fy = 210;
  ctx.save();
  ctx.shadowColor = 'rgba(60,45,20,0.28)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  roundedRect(ctx, fx, fy, frame, frame, 28);
  ctx.fillStyle = '#FFFDF8';
  ctx.fill();
  ctx.restore();
  ctx.drawImage(image, fx + 56, fy + 56, frame - 112, frame - 112);
  revoke();

  ctx.fillStyle = INK;
  ctx.font = `700 64px ${FONT}`;
  ctx.fillText(circle.name, width / 2, fy + frame + 120);

  ctx.fillStyle = '#6B6A66';
  ctx.font = `400 30px ${FONT}`;
  ctx.fillText('Scan to see the circle\u2019s public wall', width / 2, fy + frame + 175);
  ctx.font = `400 26px ${FONT}`;
  ctx.fillText(url.replace(/^https?:\/\//, ''), width / 2, fy + frame + 225);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

const buttonPrimary =
  'flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--navy)] px-6 text-[16px] font-semibold text-[var(--card)] transition-colors hover:bg-[var(--navy-hover)]';
const buttonSecondary =
  'flex min-h-[48px] items-center justify-center rounded-full border-[1.5px] border-[var(--navy)] bg-transparent px-4 text-[15px] font-semibold text-[var(--navy)] transition-colors hover:bg-[var(--navy)]/5';

export function CircleQRFullView({ circle, onClose }: { circle: CircleLike; onClose: () => void }) {
  const qrBox = useRef<HTMLDivElement>(null);
  const url = circleWallUrl(circle.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const shareLink = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `${circle.name} on CirclePact`, url });
      } catch {
        // dismissed by the user
      }
      return;
    }
    await copyLink();
  };

  const saveImage = async () => {
    const svg = qrBox.current?.querySelector('svg');
    if (!svg) return;
    const png = await buildPoster(circle, url, svg as SVGElement);
    if (!png) {
      toast.error('Could not create the image');
      return;
    }
    const href = URL.createObjectURL(png);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${slugify(circle.name)}-circlepact-qr.png`;
    a.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Invite people to ${circle.name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" style={{ background: 'rgba(23,24,29,0.52)' }} />
      <div
        className="relative flex max-h-[92vh] w-full max-w-md flex-col items-center gap-4 overflow-y-auto rounded-t-[22px] bg-[var(--card)] px-6 pb-7 pt-3 text-[var(--ink)]"
        style={{ boxShadow: '0 -12px 30px -12px rgba(23,24,29,0.35)' }}
      >
        <div className="h-1 w-10 rounded-full bg-[var(--seat-border)]" aria-hidden="true" />
        <h2 className="text-center text-[24px] font-bold leading-tight tracking-[-0.03em]">Invite people to {circle.name}</h2>
        <p className="max-w-[290px] text-center text-[14px] text-[var(--muted)]">
          Anyone who scans this sees the circle&apos;s public wall and can ask to join.
        </p>
        <div
          ref={qrBox}
          className="rounded-[12px] bg-[var(--photo-frame)] p-4"
          style={{ boxShadow: '0 1px 2px rgba(60,45,20,0.12), 0 12px 22px -14px rgba(60,45,20,0.4)' }}
        >
          <CircleQR url={url} size={208} label={`QR code for ${circle.name}`} />
        </div>
        <p className="max-w-full break-all text-center text-[12px] text-[var(--muted)]">{url}</p>
        <div className="flex w-full flex-col gap-2.5">
          <button type="button" onClick={shareLink} className={buttonPrimary}>
            Share link
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={saveImage} className={buttonSecondary}>
              Save image
            </button>
            <button type="button" onClick={copyLink} className={buttonSecondary}>
              Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CircleQR;
