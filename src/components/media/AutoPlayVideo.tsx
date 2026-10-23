'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

/** Every autoplay video on the page reports how much of it is visible; only the most visible one plays. */
const registry = new Map<number, { ratio: number; setActive: (on: boolean) => void }>()
let nextId = 1
function electActive() {
  let best: number | null = null
  let bestRatio = 0.5
  registry.forEach((entry, id) => {
    if (entry.ratio >= bestRatio) {
      best = id
      bestRatio = entry.ratio
    }
  })
  registry.forEach((entry, id) => entry.setActive(id === best))
}

/**
 * A moment video that plays by itself, muted and looping, while it's the most
 * visible video on screen (at least half showing), and pauses when it scrolls away. A small button turns the sound
 * on and off. Phones in Data Saver mode see the first frame until the sound
 * button (or opening the moment) starts it.
 */
export default function AutoPlayVideo({
  src,
  className = '',
  soundButton = true,
  soundButtonClassName = 'right-3 top-14',
}: {
  src: string
  className?: string
  /** Show the sound on/off button over the video. */
  soundButton?: boolean
  /** Where the sound button sits (Tailwind position classes). */
  soundButtonClassName?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [visible, setVisible] = useState(false)
  const [allowAuto, setAllowAuto] = useState(true)
  const [userStarted, setUserStarted] = useState(false)
  // Load nothing until the video is within about a screen of view. A feed of
  // cards used to start ~50 downloads at once on open, competing with the feed.
  const [near, setNear] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video || near) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px' },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [near])

  useEffect(() => {
    const video = ref.current
    if (video) {
      // React doesn't reliably set the muted attribute; browsers only autoplay muted video.
      video.muted = true
      video.defaultMuted = true
    }
    try {
      // Only Data Saver holds videos back. "Reduce motion" is NOT checked: Android
      // turns it on with Battery Saver and "Remove animations", and it froze every
      // moment on its first frame (feed tiles have no button to start them).
      const saveData = Boolean((navigator as any).connection?.saveData)
      setAllowAuto(!saveData)
    } catch {
      setAllowAuto(true)
    }
  }, [])

  useEffect(() => {
    const video = ref.current
    if (!video || typeof IntersectionObserver === 'undefined') return
    const id = nextId++
    registry.set(id, { ratio: 0, setActive: setVisible })
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const current = registry.get(id)
          if (current) current.ratio = entry.isIntersecting ? entry.intersectionRatio : 0
        })
        electActive()
      },
      // Fine steps, so a card that settles into place after animating in still gets noticed.
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
    )
    observer.observe(video)
    return () => {
      observer.disconnect()
      registry.delete(id)
      electActive()
    }
  }, [])

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const shouldPlay = near && visible && (allowAuto || userStarted)
    if (shouldPlay) {
      void video.play().catch(() => {
        // Blocked (e.g. low-power mode). The first frame stays; the sound button can start it.
      })
    } else if (!video.paused) {
      video.pause()
      // Scrolling away puts the sound back off, so a card further down never starts loud.
      if (!video.muted) {
        video.muted = true
        setMuted(true)
      }
    }
  }, [near, visible, allowAuto, userStarted])

  const toggleSound = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const video = ref.current
    if (!video) return
    const next = !muted
    video.muted = next
    setMuted(next)
    setUserStarted(true)
    if (video.paused) void video.play().catch(() => {})
  }

  return (
    <>
      {/* "#t=0.1" makes phones paint the first frame even when autoplay is held back. */}
      <video ref={ref} src={near ? (src.includes('#') ? src : `${src}#t=0.1`) : undefined} muted loop playsInline preload={near ? 'metadata' : 'none'} className={className} />
      {soundButton && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          className={`absolute z-10 flex size-9 items-center justify-center rounded-full ${soundButtonClassName}`}
          style={{ background: 'rgba(15,16,20,0.55)', color: '#FFFFFF' }}
        >
          {muted ? <VolumeX className="size-[17px]" aria-hidden="true" /> : <Volume2 className="size-[17px]" aria-hidden="true" />}
        </button>
      )}
    </>
  )
}
