'use client'

import { useEffect, useRef, useState } from 'react'
import type { CameraFilter } from '@/lib/cameraFilters'
import { FACE_EFFECTS, type FaceEffectId } from '@/lib/camera/faceEffects'
import type { EffectStatus } from '@/lib/camera/useCameraPipeline'

const INK = '#17181D'

/** Little sticker icons for the effect buttons, in the app's badge style. */
function EffectIcon({ id }: { id: FaceEffectId }) {
  const common = { width: 30, height: 30, viewBox: '0 0 32 32', 'aria-hidden': true as const }
  switch (id) {
    case 'none':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="9" fill="none" stroke="#fff" strokeWidth="2.4" />
          <path d="M10 22L22 10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'crown':
      return (
        <svg {...common}>
          <path d="M16 4.6c.7 3.3 3.2 4.9 5 7.3 1.4 1.9 2.1 3.8 2.1 5.7 0 4.1-3.2 7.1-7.1 7.1s-7.1-3-7.1-7c0-2.4 1.1-4.4 2.7-5.7.2 1.6 1.1 2.8 2.3 3.3-.6-4.1.6-8 2.1-10.7z" fill="#FF5A1F" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16 14.8c.4 1.7 1.9 2.6 2.6 3.8.4.7.5 1.4.5 2 0 1.8-1.4 3.1-3.1 3.1s-3.1-1.3-3.1-3.1c0-1.5.8-2.7 1.8-3.6.1.8.5 1.4 1.1 1.6-.2-1.4 0-2.8.2-3.8z" fill="#FFD23F" />
        </svg>
      )
    case 'halo':
      return (
        <svg {...common}>
          <ellipse cx="16" cy="15" rx="11" ry="4.5" fill="none" stroke={INK} strokeWidth="5" />
          <ellipse cx="16" cy="15" rx="11" ry="4.5" fill="none" stroke="#FFD23F" strokeWidth="2.6" />
          <path d="M23 19 A4 4 0 1 1 25.5 16.2 L23 19Z" fill="#E5363B" stroke={INK} strokeWidth="1.2" />
        </svg>
      )
    case 'shades':
      return (
        <svg {...common}>
          <rect x="3.5" y="11" width="11" height="8" rx="3" fill={INK} />
          <rect x="17.5" y="11" width="11" height="8" rx="3" fill={INK} />
          <path d="M14 13.2q2-1.4 4 0" stroke={INK} strokeWidth="2" fill="none" />
          <path d="M6 12.5l2.5 0-3 5.5h-1z" fill="rgba(255,255,255,0.45)" />
          <circle cx="26.5" cy="12.6" r="1.3" fill="#E5363B" />
        </svg>
      )
    case 'blush':
      return (
        <svg {...common}>
          <path d="M16 26s-8.5-5.2-10.8-10.4C3.5 11.8 5.9 7.4 9.9 7.4c2.4 0 4.1 1.4 5 2.9.9-1.5 2.6-2.9 5-2.9 4 0 6.4 4.4 4.7 8.2C24.5 20.8 16 26 16 26z" fill="#FF5C8A" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )
    case 'stamp':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="11" fill="#E5363B" stroke={INK} strokeWidth="1.5" />
          <path d="M11 16.4l3.3 3.3 6.7-7.2" fill="none" stroke={INK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 16.4l3.3 3.3 6.7-7.2" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
  }
}

/**
 * Looks and Effects under the camera, Instagram-style: two tabs and a row of
 * round buttons. The picked one sits in a white ring; its name flashes over
 * the camera when it changes (the camera sheet shows that).
 */
export default function CameraEffectsBar({
  looks,
  lookId,
  onLook,
  effectId,
  onEffect,
  effectStatus,
}: {
  looks: CameraFilter[]
  lookId: string
  onLook: (id: string) => void
  effectId: FaceEffectId
  onEffect: (id: FaceEffectId) => void
  effectStatus: EffectStatus
}) {
  const [tab, setTab] = useState<'looks' | 'effects'>('looks')
  const rowRef = useRef<HTMLDivElement>(null)
  const selectedKey = tab === 'looks' ? lookId : effectId

  // Keep the picked button in view (also after a swipe on the camera changes the look).
  useEffect(() => {
    const el = rowRef.current?.querySelector<HTMLElement>(`[data-key="${selectedKey}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedKey, tab])

  const items =
    tab === 'looks'
      ? looks.map((l) => ({ key: l.id, name: l.name, on: l.id === lookId, pick: () => onLook(l.id), face: <span className="block size-full rounded-full" style={{ background: l.swatch }} /> }))
      : FACE_EFFECTS.map((e) => ({
          key: e.id,
          name: e.name,
          on: e.id === effectId,
          pick: () => onEffect(e.id),
          face: (
            <span className="flex size-full items-center justify-center rounded-full" style={{ background: e.id === 'none' ? 'rgba(255,255,255,0.14)' : '#FFFFFF' }}>
              <EffectIcon id={e.id} />
            </span>
          ),
        }))

  return (
    <div className="flex w-full flex-col items-center gap-2.5">
      <div className="flex gap-1 rounded-full p-1" role="tablist" aria-label="Camera styles" style={{ background: 'rgba(0,0,0,0.35)' }}>
        {(['looks', 'effects'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="h-8 rounded-full px-3.5 text-[13px] font-bold"
            style={tab === t ? { background: '#FFFFFF', color: INK } : { color: '#FFFFFF' }}
          >
            {t === 'looks' ? 'Looks' : 'Effects'}
          </button>
        ))}
      </div>
      <div
        ref={rowRef}
        className="flex w-full snap-x gap-1.5 overflow-x-auto px-[calc(50%-33px)] pb-1 scrollbar-hide"
        role="radiogroup"
        aria-label={tab === 'looks' ? 'Look' : 'Face effect'}
      >
        {items.map((item) => (
          <button
            key={item.key}
            data-key={item.key}
            type="button"
            role="radio"
            aria-checked={item.on}
            onClick={item.pick}
            className="flex w-[66px] shrink-0 snap-center flex-col items-center gap-1"
          >
            <span
              className="relative block size-14 rounded-full p-[3px] transition-transform"
              style={{ boxShadow: item.on ? '0 0 0 3px #FFFFFF, 0 0 0 4.5px rgba(23,24,29,0.6)' : '0 0 0 1.5px rgba(255,255,255,0.45)', transform: item.on ? 'scale(1.08)' : undefined }}
            >
              {item.face}
              {tab === 'effects' && item.on && effectStatus === 'loading' && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.45)' }}>
                  <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-label="Loading" />
                </span>
              )}
            </span>
            <span className="max-w-full truncate text-[11.5px] font-bold" style={{ color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.5)', opacity: item.on ? 1 : 0.8 }}>
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
