'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { onboardingSlides } from './slides';
import OnboardingBadge from './OnboardingBadge';
import { markOnboardingSeen } from '@/lib/onboarding';

const SWIPE_THRESHOLD = 60;

export default function OnboardingCarousel() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const total = onboardingSlides.length;
  const isLast = index === total - 1;
  const slide = onboardingSlides[index];

  const goTo = (next: number) => {
    if (next < 0 || next >= total) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const finish = () => {
    markOnboardingSeen();
    router.replace('/auth/register');
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      isLast ? finish() : goTo(index + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      goTo(index - 1);
    }
  };

  return (
    <div className="pact-flow flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-1.5">
          {onboardingSlides.map((s, i) => {
            const active = i === index;
            const past = i < index;
            return (
              <span
                key={s.headline}
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: active ? '20px' : '6px',
                  background: active || past ? s.accent : 'var(--pact-hairline)',
                }}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={finish}
          className="pact-mono text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--pact-text-muted)' }}
        >
          Skip
        </button>
      </header>

      <main className="relative flex flex-1 items-center overflow-hidden px-8">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: direction >= 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -60 : 60 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full flex-col items-center gap-8 text-center"
          >
            <OnboardingBadge icon={slide.icon} accent={slide.accent} />
            <div className="flex flex-col gap-3">
              <h1 className="text-balance text-3xl font-bold">{slide.headline}</h1>
              <p className="text-pretty mx-auto max-w-xs text-base leading-relaxed" style={{ color: 'var(--pact-text-muted)' }}>
                {slide.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex flex-col gap-4 px-5 pb-10 pt-6">
        <button
          type="button"
          onClick={() => (isLast ? finish() : goTo(index + 1))}
          className="pact-btn-glow rounded-full py-4 text-base font-semibold text-[color:var(--pact-bg)]"
          style={{ background: slide.accent, color: slide.accent }}
        >
          {/* Text color above sets up .pact-btn-glow's currentColor-based glow;
              the label itself is repainted to --pact-bg here so it stays legible. */}
          <span style={{ color: 'var(--pact-bg)' }}>{isLast ? "Let's go →" : 'Next'}</span>
        </button>
        {index > 0 && (
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="pact-mono text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--pact-text-faint)' }}
          >
            Back
          </button>
        )}
      </footer>
    </div>
  );
}
