'use client';

import { useMemo } from 'react';
import QRCode from 'qrcode';

const INK = '#17181D';

/**
 * Generic scannable QR renderer (ink modules, crisp edges), currently used by
 * the tips/UPI screens. The circle invite QR lives separately in
 * CircleInviteQR.tsx so the two never share behaviour or copy.
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

export default CircleQR;
