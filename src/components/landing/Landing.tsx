'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Camera, Check, Flame, Moon, Target, Users } from 'lucide-react';
import CircleMark, { MarkProgress } from '@/components/brand/CircleMark';

const INK = '#17181D';
const MUTED = '#5A5C63';
const LINE = '#DCD3C1';
const NAVY = '#1F3A93';
const GREEN = '#2E7D5B';

const STEPS = [
  { icon: Target, title: 'Say it', body: 'Pick one thing to do every day, and for how long. Run 3 km for 7 days. Read 20 pages for 30.' },
  { icon: Camera, title: 'Show it', body: 'Post a photo or a 15-second video as proof each day. Life happens, so every week has one rest day.' },
  { icon: Users, title: 'Your circle keeps you honest', body: 'Friends see your moments, cheer you on, and nudge you when you slip. It’s much harder to quit in front of people.' },
];

/** A static pact card, drawn in CSS, to show what the app looks like. */
function PactPreview() {
  const reduce = useReducedMotion();
  const days: ('done' | 'rest' | 'today' | 'later')[] = ['done', 'done', 'rest', 'done', 'today', 'later', 'later'];
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="overflow-hidden rounded-[26px] shadow-[0_18px_50px_rgba(23,24,29,0.18)]" style={{ background: 'var(--card)', border: `1px solid ${LINE}` }}>
        <div className="flex items-center gap-2.5 px-4 pt-4">
          <span className="flex size-9 items-center justify-center rounded-full text-[14px] font-bold text-white" style={{ background: NAVY }}>A</span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold" style={{ color: INK }}>Ananya</div>
            <div className="text-[12px]" style={{ color: MUTED }}>Morning runners · 8 min ago</div>
          </div>
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-extrabold" style={{ background: '#FFF1E6', color: '#C2410C' }}>
            <Flame className="size-3.5" strokeWidth={2.6} /> 4
          </span>
        </div>
        <div
          className="relative mx-3 mt-3 flex aspect-[4/3] items-end overflow-hidden rounded-[20px] p-3.5"
          style={{ background: 'linear-gradient(160deg,#F6B979 0%,#E9825B 45%,#3A3F8F 100%)' }}
        >
          <svg aria-hidden viewBox="0 0 300 160" className="absolute inset-x-0 bottom-0 w-full opacity-40">
            <path d="M0 120 Q60 70 120 105 T240 90 T300 100 V160 H0Z" fill="#1E2257" />
            <path d="M0 140 Q80 110 160 135 T300 125 V160 H0Z" fill="#14173F" />
          </svg>
          <span className="relative flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold" style={{ color: INK }}>
            <MarkProgress value={5 / 7} size={13} track="rgba(23,24,29,0.14)" />
            Day 5 of 7
          </span>
        </div>
        <div className="px-4 pb-4 pt-3">
          <div className="text-[17px] font-extrabold" style={{ color: INK }}>Run 3 km every morning</div>
          <div className="mt-3 flex items-center gap-1.5" aria-label="Days 1 to 7">
            {days.map((d, i) => (
              <motion.span
                key={i}
                className="flex h-7 flex-1 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: d === 'done' ? GREEN : d === 'rest' ? '#E7E1D4' : d === 'today' ? NAVY : 'transparent',
                  color: d === 'done' || d === 'today' ? '#fff' : MUTED,
                  border: d === 'later' ? `1.5px dashed ${LINE}` : 'none',
                }}
                animate={d === 'today' && !reduce ? { scale: [1, 1.08, 1] } : undefined}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                {d === 'done' ? <Check className="size-3.5" strokeWidth={3} /> : d === 'rest' ? <Moon className="size-3.5" /> : i + 1}
              </motion.span>
            ))}
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <div className="flex -space-x-2">
              {[['P', '#7C3AED'], ['K', '#0E7490'], ['R', '#B45309']].map(([l, c]) => (
                <span key={l} className="flex size-6 items-center justify-center rounded-full border-2 text-[10.5px] font-bold text-white" style={{ background: c, borderColor: 'var(--card)' }}>
                  {l}
                </span>
              ))}
            </div>
            <span className="text-[12.5px]" style={{ color: MUTED }}>
              <b style={{ color: INK }}>Priya, Karan</b> and 2 others cheered
            </span>
          </div>
        </div>
      </div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-2 top-[42%] flex items-center gap-2 rounded-[16px] px-3 py-2 shadow-[0_10px_30px_rgba(23,24,29,0.16)] sm:-right-8"
        style={{ background: '#fff', border: `1px solid ${LINE}` }}
      >
        <span className="text-[18px]" aria-hidden>👋</span>
        <span className="text-[12.5px] font-semibold leading-tight" style={{ color: INK }}>
          Karan nudged you
          <span className="block text-[11.5px] font-normal" style={{ color: MUTED }}>Day 5 is waiting</span>
        </span>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] } };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--paper)', color: INK }}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-5">
        <span className="flex items-center gap-2 text-[18px] font-extrabold tracking-tight">
          <CircleMark size={28} variant="disc" animation="draw" delay={0.15} />
          CirclePact
        </span>
        <Link href="/auth/login" className="rounded-full px-4 py-2 text-[14px] font-bold" style={{ color: NAVY }}>
          Sign in
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-14 pt-10 md:grid-cols-2 md:pt-16">
          <div className="text-center md:text-left">
            <motion.h1 {...rise(0)} className="text-balance text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[54px]">
              Say it. Show it.
              <span className="block" style={{ color: NAVY }}>Your circle keeps you honest.</span>
            </motion.h1>
            <motion.p {...rise(0.08)} className="mx-auto mt-5 max-w-md text-pretty text-[17px] leading-relaxed md:mx-0" style={{ color: MUTED }}>
              Make a pact to do something every day. Post a photo as proof. Your friends see it, cheer you on, and notice when you skip.
            </motion.p>
            <motion.div {...rise(0.16)} className="mt-7 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
              <Link
                href="/auth/register"
                className="flex h-14 w-full items-center justify-center rounded-full px-8 text-[17px] font-extrabold text-white shadow-[0_8px_24px_rgba(31,58,147,0.28)] sm:w-auto"
                style={{ background: NAVY }}
              >
                Start a 7-day pact
              </Link>
              <span className="text-[13px]" style={{ color: MUTED }}>Free · 18+ · Takes a minute</span>
            </motion.div>
          </div>
          <motion.div {...rise(0.12)}>
            <PactPreview />
          </motion.div>
        </section>

        <section className="px-5 py-12" style={{ background: 'var(--card)' }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-[26px] font-extrabold tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-[22px] p-5" style={{ background: 'var(--paper)', border: `1px solid ${LINE}` }}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full text-white" style={{ background: NAVY }}>
                      <s.icon className="size-5" strokeWidth={2.4} />
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: MUTED }}>Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-[19px] font-extrabold">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: MUTED }}>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-12">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Streaks that forgive', 'One rest day a week, and a comeback within 48 hours keeps most of your streak.'],
              ['Circles', 'Small groups for your gym crew, book club or family. See who showed up this week.'],
              ['Dares', 'Challenge a friend to a 7-day sprint, and set a reward if they make it.'],
            ].map(([t, b]) => (
              <div key={t} className="rounded-[20px] p-5" style={{ background: 'var(--card)', border: `1px solid ${LINE}` }}>
                <h3 className="text-[16px] font-extrabold">{t}</h3>
                <p className="mt-1 text-[14px] leading-relaxed" style={{ color: MUTED }}>{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 pb-16 pt-4 text-center">
          <h2 className="mx-auto max-w-md text-balance text-[28px] font-extrabold leading-tight tracking-tight">
            Pick one thing. Bring a friend. Start today.
          </h2>
          <Link
            href="/auth/register"
            className="mx-auto mt-6 flex h-14 w-full max-w-xs items-center justify-center rounded-full text-[17px] font-extrabold text-white"
            style={{ background: NAVY }}
          >
            Start a 7-day pact
          </Link>
          <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold" style={{ color: NAVY }}>Sign in</Link>
          </p>
        </section>
      </main>

      <footer className="border-t px-5 py-6 text-center text-[13px]" style={{ borderColor: LINE, color: MUTED }}>
        <Link href="/terms" className="font-semibold hover:underline">Terms</Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="font-semibold hover:underline">Privacy</Link>
        <span className="mx-2">·</span>© {new Date().getFullYear()} CirclePact
      </footer>
    </div>
  );
}
