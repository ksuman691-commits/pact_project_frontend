'use client'

import { useState } from 'react'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const GOLD = '#F2C14E'
const PRESETS = [21, 51, 101]

function chip(on: boolean, dark: boolean): React.CSSProperties {
  if (dark) {
    return on
      ? { background: GOLD, color: INK, border: `1px solid ${GOLD}`, fontWeight: 800 }
      : { background: 'transparent', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.28)' }
  }
  return on ? { background: INK, color: '#FFFFFF', border: `1px solid ${INK}` } : { background: '#FBF8F1', color: INK, border: `1px solid ${LINE}` }
}

/**
 * Price to watch a private pact, paid over UPI. There is no "free" lock: if a
 * pact's moments are free they're simply open. Plus when people get in once
 * they say they paid. `dark` is for the dark "paid moments" card in New Pact.
 */
export default function PriceChooser({
  price,
  onPrice,
  autoApprove,
  onAutoApprove,
  disabled = false,
  dark = false,
}: {
  price: number | null
  onPrice: (price: number | null) => void
  autoApprove: boolean
  onAutoApprove: (on: boolean) => void
  disabled?: boolean
  dark?: boolean
}) {
  const custom = price != null && !PRESETS.includes(price)
  const [editing, setEditing] = useState(custom)
  const [draft, setDraft] = useState(custom ? String(price) : '')
  const label = dark ? '#BFC2CB' : MUTED
  const text = dark ? '#FFFFFF' : INK

  return (
    <div>
      <div className="text-[12px] font-extrabold tracking-[0.08em]" style={{ color: label }}>PRICE TO WATCH</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((value) => (
          <button key={value} type="button" disabled={disabled} onClick={() => { setEditing(false); onPrice(value) }} className={`${dark ? 'h-10 px-4' : 'h-9 px-3.5'} rounded-full text-[13.5px] font-bold disabled:opacity-50`} style={chip(price === value && !editing, dark)}>
            ₹{value}
          </button>
        ))}
        {editing ? (
          <label className={`flex ${dark ? 'h-10' : 'h-9'} items-center rounded-full px-3 text-[13.5px] font-bold`} style={dark ? { background: 'transparent', border: `1.5px solid ${GOLD}`, color: '#FFFFFF' } : { background: '#FFFFFF', border: `1.5px solid ${INK}`, color: INK }}>
            ₹
            <input
              autoFocus
              inputMode="numeric"
              value={draft}
              disabled={disabled}
              aria-label="Your price in rupees"
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 5)
                setDraft(digits)
                const value = Number(digits)
                onPrice(value >= 1 ? value : null)
              }}
              className="w-14 bg-transparent pl-0.5 outline-none"
              placeholder="99"
            />
          </label>
        ) : (
          <button type="button" disabled={disabled} onClick={() => setEditing(true)} className={`${dark ? 'h-10 px-4' : 'h-9 px-3.5'} rounded-full text-[13.5px] font-bold disabled:opacity-50`} style={chip(custom, dark)}>
            {custom ? `₹${price}` : 'Your price'}
          </button>
        )}
      </div>
      <div className="mt-1.5 text-[12.5px] leading-snug" style={{ color: label }}>
        {price == null ? 'Pick a price. Free moments don’t need a lock: switch Private off and everyone who sees the pact watches.' : `People pay ₹${price} to your UPI, then you let them in.`}
      </div>

      {price != null && (
        <button
          type="button"
          role="switch"
          aria-checked={autoApprove}
          disabled={disabled}
          onClick={() => onAutoApprove(!autoApprove)}
          className="mt-3 flex w-full items-center gap-3 rounded-[16px] px-3.5 py-3 text-left disabled:opacity-50"
          style={dark ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' } : { background: '#FFFFFF', border: `1px solid ${LINE}` }}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-bold" style={{ color: text }}>Let them in when they say they paid</span>
            <span className="block text-[12.5px] leading-snug" style={{ color: label }}>
              {autoApprove ? 'Instant for buyers. Remove anyone whose payment never shows up.' : 'Off: you confirm each payment in your UPI app first.'}
            </span>
          </span>
          <span className="relative h-7 w-12 shrink-0 rounded-full transition-colors" style={{ background: autoApprove ? (dark ? GOLD : NAVY) : dark ? '#5A5C63' : '#D4D5D9' }}>
            <span className="absolute top-0.5 size-6 rounded-full bg-white transition-all" style={{ left: autoApprove ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </span>
        </button>
      )}
    </div>
  )
}
