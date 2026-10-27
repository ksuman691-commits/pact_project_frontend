'use client'

import React from 'react'

const SPARK = '#FFD84D'
const NAVY = '#1F3A93'

/**
 * The dare's version of a circle's orbit ring: a clock ring whose arc is the
 * time still left, with lightning bolts turning slowly around it. The centre
 * holds a face (or a number). On a dark tile the arc is white and the bolts
 * are electric yellow; in the last quarter of the clock the arc turns yellow
 * as well, so a dare about to run out reads at a glance.
 */
export default function SparkRing({
  size = 120,
  left,
  tone = 'dark',
  bolts = 2,
  duration = '36s',
  children,
  className = '',
  burst = false,
}: {
  size?: number
  /** Fraction of the clock still left, 0 to 1. Leave out for a plain full ring. */
  left?: number | null
  tone?: 'dark' | 'light'
  bolts?: number
  duration?: string
  children?: React.ReactNode
  className?: string
  /** One expanding flash, for the moment a dare is sent. */
  burst?: boolean
}) {
  const stroke = Math.max(3, size * 0.035)
  const radius = size / 2 - stroke - size * 0.09
  const circumference = 2 * Math.PI * radius
  const fraction = left == null ? 1 : Math.min(1, Math.max(0, left))
  const urgent = left != null && fraction <= 0.25
  const dark = tone === 'dark'
  const track = dark ? 'rgba(255,255,255,0.16)' : '#ECE6D8'
  const arc = urgent ? SPARK : dark ? '#FFFFFF' : NAVY
  const boltColor = dark ? SPARK : NAVY
  const boltSize = Math.max(14, Math.round(size * 0.2))
  const disc = (radius - stroke * 1.6) * 2

  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {burst && <span className="cp-spark-burst absolute inset-0 rounded-full" style={{ border: `2px solid ${SPARK}` }} />}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 600ms ease, stroke 300ms ease' }}
        />
      </svg>
      <span
        className="absolute flex items-center justify-center overflow-hidden rounded-full"
        style={{ left: (size - disc) / 2, top: (size - disc) / 2, width: disc, height: disc }}
      >
        {children}
      </span>
      <span className="cp-orbit-spin absolute inset-0" style={{ animationDuration: duration }}>
        {Array.from({ length: bolts }).map((_, i) => {
          const angle = (i / bolts) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5
          return (
            <span
              key={i}
              className="absolute size-0"
              style={{ left: size / 2 + radius * Math.cos(angle), top: size / 2 + radius * Math.sin(angle) }}
            >
              <span
                className="cp-orbit-upright absolute flex items-center justify-center rounded-full"
                style={{
                  left: -boltSize / 2,
                  top: -boltSize / 2,
                  width: boltSize,
                  height: boltSize,
                  animationDuration: duration,
                  background: dark ? '#17181D' : '#FFFFFF',
                  boxShadow: `0 0 0 ${Math.max(1.5, size * 0.016)}px ${dark ? 'rgba(255,255,255,0.2)' : '#DCD3C1'}`,
                }}
              >
                <svg viewBox="0 0 24 24" width={boltSize * 0.62} height={boltSize * 0.62} className={dark ? 'cp-spark-glow' : ''}>
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" fill={boltColor} stroke={boltColor} strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
