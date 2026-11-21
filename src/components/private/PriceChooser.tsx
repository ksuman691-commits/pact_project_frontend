'use client'

import { useState } from 'react'

const INK = '#17181D'
const MUTED = '#5A5C63'
const NAVY = '#1F3A93'
const LINE = '#DCD3C1'
const PRESETS = [21, 51, 101]

function chip(on: boolean, dark: boolean): React.CSSProperties {
  if (dark) {
    return on
      ? { background: '#FFFFFF', color: NAVY, border: '1px solid #FFFFFF', fontWeight: 800 }
      : { background: 'transparent', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.28)' }
  }
  return on ? { background: NAVY, color: '#FFFFFF', border: `1px solid ${NAVY}` } : { background: '#FBF8F1', color: INK, border: `1px solid ${LINE}` }
}

/**
 * Price to watch a private pact, paid over UPI. There is no "free" lock: if a
 * pact's moments are free they're simply open. The creator lets each buyer in
 * after checking the payment arrived (no automatic access since 22 Nov).
 * `dark` is for the blue "paid moments" card in New Pact.
 */
export default function PriceChooser({
  price,
  onPrice,
  disabled = false,
  dark = false,
  lockPrice = false,
}: {
  price: number | null
  onPrice: (price: number | null) => void
  disabled?: boolean
  dark?: boolean
  /** The price can't change (people have paid). */
  lockPrice?: boolean
}) {
  const custom = price != null && !PRESETS.includes(price)
  const [editing, setEditing] = useState(custom)
  const [draft, setDraft] = useState(custom ? String(price) : '')
  const label = dark ? '#DCE3F7' : MUTED
  const text = dark ? '#FFFFFF' : INK

  return (
    <div>
      <div className="text-[12px] font-extrabold tracking-[0.08em]" style={{ color: label }}>PRICE TO WATCH</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((value) => (
          <button key={value} type="button" disabled={disabled || lockPrice} onClick={() => { setEditing(false); onPrice(value) }} className={`${dark ? 'h-10 px-4' : 'h-9 px-3.5'} rounded-full text-[13.5px] font-bold disabled:opacity-50`} style={chip(price === value && !editing, dark)}>
            ₹{value}
          </button>
        ))}
        {editing ? (
          <label className={`flex ${dark ? 'h-10' : 'h-9'} items-center rounded-full px-3 text-[13.5px] font-bold`} style={dark ? { background: 'transparent', border: '1.5px solid #FFFFFF', color: '#FFFFFF' } : { background: '#FFFFFF', border: `1.5px solid ${INK}`, color: INK }}>
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
          <button type="button" disabled={disabled || lockPrice} onClick={() => setEditing(true)} className={`${dark ? 'h-10 px-4' : 'h-9 px-3.5'} rounded-full text-[13.5px] font-bold disabled:opacity-50`} style={chip(custom, dark)}>
            {custom ? `₹${price}` : 'Your price'}
          </button>
        )}
      </div>
      <div className="mt-1.5 text-[12.5px] leading-snug" style={{ color: label }}>
        {lockPrice ? `The price stays ₹${price} because people have already paid.` : price == null ? 'Pick a price. Free moments don’t need a lock: switch Private off and everyone who sees the pact watches.' : `People pay ₹${price} to your UPI, then you let them in.`}
      </div>

    </div>
  )
}
