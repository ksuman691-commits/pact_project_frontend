'use client'

import { Plus, Users } from 'lucide-react'

interface HomeActionsRowProps {
  onNavigateCircles?: () => void
  onCreatePact?: () => void
  disabled?: boolean
}

/**
 * Primary/secondary action row for the home feed — split out of
 * WelcomeHeader so it can sit between the streak hero and the circles rail
 * (matching the approved mockup's Topbar → Hero → Actions → Circles rail
 * order) instead of being locked inside the topbar card above the hero.
 * Same two actions, same styling as before: "My Circles" is the primary
 * home page action; Dare is deliberately not in this row (still reachable
 * via the bottom nav).
 */
export default function HomeActionsRow({ onNavigateCircles, onCreatePact, disabled = false }: HomeActionsRowProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onNavigateCircles?.()
        }}
        disabled={disabled}
        aria-label="Open My Circles"
        data-testid="my-circles-button"
        className="pact-btn-glow relative z-20 flex flex-1 touch-manipulation items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
      >
        <Users className="h-4 w-4" strokeWidth={2.4} />
        My Circles
      </button>
      <button
        onClick={onCreatePact}
        disabled={disabled}
        className="pact-btn-glow flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: 'var(--pact-violet)', background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
      >
        <Plus className="h-4 w-4" strokeWidth={2.2} />
        New Pact
      </button>
    </div>
  )
}
