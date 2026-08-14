'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface AnimatedTabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface AnimatedTabsProps {
  tabs: AnimatedTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Unique layoutId namespace so multiple tab bars on one page don't collide. */
  layoutId?: string;
  className?: string;
}

/**
 * Pill tab row with a sliding active-indicator (shared layoutId), used by
 * Profile tabs, Circle sort tabs, and Leaderboard sort — dark pact-flow
 * styling only.
 */
export default function AnimatedTabs({
  tabs,
  activeId,
  onChange,
  layoutId = 'animated-tabs-indicator',
  className = '',
}: AnimatedTabsProps) {
  return (
    <div className={`flex gap-1 overflow-x-auto scrollbar-hide ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive ? 'text-[var(--pact-text)]' : 'text-[var(--pact-text-faint)] hover:text-[var(--pact-text-dim)]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))',
                  boxShadow: '0 4px 16px var(--pact-shadow-violet)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    isActive ? 'bg-white/20' : 'bg-[var(--pact-surface-2)] text-[var(--pact-text-faint)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
