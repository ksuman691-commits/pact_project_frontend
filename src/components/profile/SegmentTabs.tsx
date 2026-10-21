'use client'

export interface SegmentTab {
  id: string
  label: string
  count?: number
}

/**
 * The app-wide "selected" look: ink-filled pill for the active choice,
 * card pill with a hairline for the rest. Navy stays for primary actions.
 */
export default function SegmentTabs({ tabs, active, onChange, className = '' }: { tabs: SegmentTab[]; active: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div role="tablist" className={`flex gap-1.5 overflow-x-auto scrollbar-hide ${className}`}>
      {tabs.map((tab) => {
        const on = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            className="h-9 shrink-0 rounded-full px-3.5 text-[13.5px] font-bold transition active:scale-[0.97]"
            style={on ? { background: '#17181D', color: '#FFFFFF', border: '1px solid #17181D' } : { background: '#FBF8F1', color: '#17181D', border: '1px solid #DCD3C1' }}
          >
            {tab.label}
            {typeof tab.count === 'number' && <span style={{ opacity: on ? 0.7 : 0.55 }}> · {tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
