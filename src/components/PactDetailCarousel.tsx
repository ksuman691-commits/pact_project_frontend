'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';

export interface DetailCarouselPanel {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  content: React.ReactNode;
}

interface PactDetailCarouselProps {
  panels: DetailCarouselPanel[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

// How far (px) or how fast (px/s) a drag has to travel before it counts as
// an intentional swipe to the next/previous panel rather than a tap or a
// scroll-cancelling wobble.
const SWIPE_OFFSET_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 400;

function DetailTabButton({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
        active
          ? 'bg-white text-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.12)]'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-slate-950/10 text-slate-700' : 'bg-white/10 text-white/60'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Tabs + a real horizontal swipe carousel for the pact detail sections
 * (Proofs / Timeline / Participants / Comments). Tabs, dot indicators, and
 * drag gestures all drive the same `activeIndex`, so tapping a tab, tapping
 * a dot, or swiping the panel itself stay in sync with each other.
 */
export default function PactDetailCarousel({ panels, activeIndex, onIndexChange }: PactDetailCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [panelWidth, setPanelWidth] = useState(0);
  const [panelHeight, setPanelHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const measure = () => setPanelWidth(node.offsetWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Clamp in case panels.length changes under us (shouldn't happen here,
  // but keeps the dots/track from pointing past the last panel).
  const clampedIndex = Math.min(activeIndex, panels.length - 1);

  // Every panel lives in the DOM at once (side by side) so the drag gesture
  // can slide smoothly between neighbors, but that means a naive flex row
  // sizes itself to the TALLEST panel — leaving a dead gap under shorter
  // ones like "Proofs" while "Timeline" is open elsewhere in the row. Track
  // only the active panel's height and animate the visible container to it.
  useLayoutEffect(() => {
    const activeNode = panelRefs.current[clampedIndex];
    if (!activeNode) return;

    const measure = () => setPanelHeight(activeNode.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(activeNode);
    return () => observer.disconnect();
  }, [clampedIndex, panelWidth]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const draggedLeft = offset.x < -SWIPE_OFFSET_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD;
    const draggedRight = offset.x > SWIPE_OFFSET_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD;

    if (draggedLeft && clampedIndex < panels.length - 1) {
      onIndexChange(clampedIndex + 1);
    } else if (draggedRight && clampedIndex > 0) {
      onIndexChange(clampedIndex - 1);
    }
    // Otherwise the drag didn't clear the threshold — the `animate` prop
    // below snaps the track back to the current panel.
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1">
        {panels.map((panel, index) => (
          <DetailTabButton
            key={panel.key}
            active={index === clampedIndex}
            icon={panel.icon}
            label={panel.label}
            count={panel.count}
            onClick={() => onIndexChange(index)}
          />
        ))}
      </div>

      <div ref={trackRef} className="overflow-hidden">
        <motion.div
          className="overflow-hidden"
          animate={{ height: panelHeight ?? 'auto' }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <motion.div
            className="flex items-start cursor-grab active:cursor-grabbing"
            drag={panelWidth > 0 ? 'x' : false}
            dragConstraints={{ left: -(panels.length - 1) * panelWidth, right: 0 }}
            dragElastic={0.08}
            onDragEnd={handleDragEnd}
            animate={{ x: -clampedIndex * panelWidth }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {panels.map((panel, index) => (
              <div
                key={panel.key}
                ref={(node) => {
                  panelRefs.current[index] = node;
                }}
                className="shrink-0 self-start px-4 py-5"
                style={{ width: panelWidth || '100%' }}
              >
                {panel.content}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-1 pt-2" role="tablist" aria-label="Pact detail sections">
        {panels.map((panel, index) => (
          <button
            key={panel.key}
            type="button"
            role="tab"
            aria-selected={index === clampedIndex}
            aria-label={panel.label}
            onClick={() => onIndexChange(index)}
            className="p-1"
          >
            <span
              className="block h-1.5 rounded-full transition-all duration-200"
              style={{
                width: index === clampedIndex ? '20px' : '6px',
                background: index === clampedIndex ? 'var(--pact-pink)' : 'var(--pact-hairline)',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
