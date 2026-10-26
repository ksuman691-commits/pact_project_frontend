'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';
import { copyText } from '@/lib/circleInvite';

/**
 * Circle invite QR sheet. Deliberately self-contained: it has its own QR
 * renderer, its own share card and its own copy, and it shares nothing with
 * the UPI/tip QR (CircleQR.tsx) or any pact QR. The code carries only the
 * circle's public wall link.
 *
 * Two actions, both built on the same branded card image:
 *  - Share QR: native share sheet with the card image + invite text (which
 *    includes the link, so it still works for someone scanning on their own
 *    phone). Falls back to text-only share, then to copying the invite text.
 *  - Save image: downloads the same card as a PNG.
 */

type CircleLike = { id: number; name: string; icon_emoji?: string | null; member_count?: number };

export const circleWallUrl = (id: number) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://circlepact.app';
  return `${origin}/circles/${id}/wall`;
};

const INK = '#17181D';
const FONT = "'Inter Tight', 'Helvetica Neue', Arial, sans-serif";
const QUIET_MODULES = 4;

type Matrix = { size: number; data: boolean[] };

function buildMatrix(url: string): Matrix {
  // Level Q with no logo over the code keeps it sparse and reliably scannable.
  const qr = QRCode.create(url, { errorCorrectionLevel: 'Q' }) as any;
  return { size: qr.modules.size as number, data: Array.from(qr.modules.data) as boolean[] };
}

function monogram(circle: CircleLike): string {
  if (circle.icon_emoji) return circle.icon_emoji;
  const words = circle.name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2);
  return letters.toUpperCase();
}

function fileName(circle: CircleLike) {
  const slug = circle.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
  return `CirclePact-Circle-${slug || circle.id}.png`;
}

function inviteText(circle: CircleLike, url: string) {
  return `Join "${circle.name}" on CirclePact: ${url}`;
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

/** Shrinks the font until the text fits the width, so long circle names never overflow. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, maxPx: number, minPx: number, maxWidth: number) {
  let px = maxPx;
  while (px > minPx) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  ctx.font = `${weight} ${px}px ${FONT}`;
}

/**
 * The shareable card (1080 x 1350, 4:5): circle name, QR on a white quiet
 * zone, "Scan to join" and the printed link. Used by both Share QR and Save
 * image so people always get the same thing.
 */
async function buildCard(circle: CircleLike, url: string, matrix: Matrix): Promise<Blob | null> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#F4EFE4';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Brand
  ctx.fillStyle = '#5A5C63';
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText('CIRCLEPACT', width / 2, 96);

  // Monogram
  const cy = 210;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(width / 2, cy, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F4EFE4';
  ctx.font = `800 48px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(monogram(circle), width / 2, cy + 3);
  ctx.textBaseline = 'alphabetic';

  // Name + subtitle
  ctx.fillStyle = INK;
  fitFont(ctx, circle.name, 700, 72, 40, 900);
  ctx.fillText(circle.name, width / 2, 350);
  ctx.fillStyle = '#5A5C63';
  ctx.font = `400 32px ${FONT}`;
  const members = circle.member_count && circle.member_count > 0 ? ` · ${circle.member_count} ${circle.member_count === 1 ? 'member' : 'members'}` : '';
  ctx.fillText(`A circle on CirclePact${members}`, width / 2, 404);

  // QR on a white card with a proper quiet zone
  const card = 600;
  const cx = (width - card) / 2;
  const cardY = 450;
  ctx.save();
  ctx.shadowColor = 'rgba(60,45,20,0.22)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 14;
  roundedRect(ctx, cx, cardY, card, card, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  const modules = matrix.size + QUIET_MODULES * 2;
  const px = Math.floor((card - 24) / modules);
  const qrSize = px * modules;
  const ox = cx + (card - qrSize) / 2 + QUIET_MODULES * px;
  const oy = cardY + (card - qrSize) / 2 + QUIET_MODULES * px;
  ctx.fillStyle = INK;
  for (let i = 0; i < matrix.data.length; i++) {
    if (matrix.data[i]) ctx.fillRect(ox + (i % matrix.size) * px, oy + Math.floor(i / matrix.size) * px, px, px);
  }

  // Call to action + link
  ctx.fillStyle = INK;
  ctx.font = `700 52px ${FONT}`;
  ctx.fillText('Scan to join', width / 2, cardY + card + 96);
  ctx.fillStyle = '#1F3A93';
  fitFont(ctx, url.replace(/^https?:\/\//, ''), 600, 30, 20, 940);
  ctx.fillText(url.replace(/^https?:\/\//, ''), width / 2, cardY + card + 148);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

const buttonPrimary =
  'flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--navy)] px-6 text-[16px] font-semibold text-[var(--card)] transition-colors hover:bg-[var(--navy-hover)] disabled:opacity-60';
const buttonSecondary =
  'flex min-h-[52px] w-full items-center justify-center rounded-full border-[1.5px] border-[var(--navy)] bg-transparent px-6 text-[16px] font-semibold text-[var(--navy)] transition-colors hover:bg-[var(--navy)]/5 disabled:opacity-60';

export function CircleInviteQRSheet({ circle, onClose }: { circle: CircleLike; onClose: () => void }) {
  const url = circleWallUrl(circle.id);
  const matrix = useMemo(() => buildMatrix(url), [url]);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copyLink = async () => {
    const ok = await copyText(url);
    if (ok) toast.success('Link copied');
    else toast.error('Could not copy. Long-press the link to copy it.');
  };

  const shareQR = async () => {
    if (busy) return;
    setBusy('share');
    try {
      const text = inviteText(circle, url);
      const title = `${circle.name} on CirclePact`;
      const png = await buildCard(circle, url, matrix);
      const file = png ? new File([png], fileName(circle), { type: 'image/png' }) : null;

      if (file && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        // The link rides in the text; some apps drop a separate url field when a file is attached.
        await navigator.share({ files: [file], title, text });
        return;
      }
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text: inviteText(circle, url) });
        return;
      }
      const ok = await copyText(text);
      if (ok) toast.success('Invite copied. Paste it anywhere.');
      else toast.error('Could not share. Try Save image instead.');
    } catch (error: any) {
      // Closing the share sheet isn't an error worth a toast.
      if (error?.name !== 'AbortError') toast.error('Could not share. Try Save image instead.');
    } finally {
      setBusy(null);
    }
  };

  const saveImage = async () => {
    if (busy) return;
    setBusy('save');
    try {
      const png = await buildCard(circle, url, matrix);
      if (!png) throw new Error('no image');
      const href = URL.createObjectURL(png);
      const a = document.createElement('a');
      a.href = href;
      a.download = fileName(circle);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      toast.success('Image saved');
    } catch {
      toast.error('Could not save. Try Share QR instead.');
    } finally {
      setBusy(null);
    }
  };

  const total = matrix.size + QUIET_MODULES * 2;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Share Circle QR for ${circle.name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" style={{ background: 'rgba(23,24,29,0.52)' }} />
      <div
        className="relative flex max-h-[92vh] w-full max-w-md flex-col items-center gap-4 overflow-y-auto rounded-t-[22px] bg-[var(--card)] px-6 pb-7 pt-3 text-[var(--ink)]"
        style={{ boxShadow: '0 -12px 30px -12px rgba(23,24,29,0.35)' }}
      >
        <div className="h-1 w-10 rounded-full bg-[var(--seat-border)]" aria-hidden="true" />
        <h2 className="text-center text-[24px] font-bold leading-tight tracking-[-0.03em]">Share Circle QR</h2>
        <p className="max-w-[300px] text-center text-[14px] text-[var(--muted)]">
          Anyone who scans sees <span className="font-semibold text-[var(--ink)]">{circle.name}</span>&apos;s public wall and can ask to join.
        </p>
        <div className="rounded-[12px] bg-white" style={{ boxShadow: '0 1px 2px rgba(60,45,20,0.12), 0 12px 22px -14px rgba(60,45,20,0.4)' }}>
          <svg
            role="img"
            aria-label={`QR code to join ${circle.name}`}
            viewBox={`0 0 ${total} ${total}`}
            width={208}
            height={208}
            shapeRendering="crispEdges"
            className="block"
          >
            {matrix.data.map((dark, i) =>
              dark ? (
                <rect key={i} x={(i % matrix.size) + QUIET_MODULES} y={Math.floor(i / matrix.size) + QUIET_MODULES} width={1} height={1} fill={INK} />
              ) : null,
            )}
          </svg>
        </div>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link"
          className="flex max-w-full items-center gap-1.5 break-all text-center text-[12px] text-[var(--muted)]"
        >
          <span>{url.replace(/^https?:\/\//, '')}</span>
          <Copy className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
        </button>
        <div className="flex w-full flex-col gap-2.5">
          <button type="button" onClick={shareQR} disabled={busy !== null} className={buttonPrimary}>
            Share QR
          </button>
          <button type="button" onClick={saveImage} disabled={busy !== null} className={buttonSecondary}>
            Save image
          </button>
        </div>
      </div>
    </div>
  );
}

export default CircleInviteQRSheet;
