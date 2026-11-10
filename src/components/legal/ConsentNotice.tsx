'use client';

import type { ConsentChoices } from '@/lib/consent';

/**
 * The DPDP notice people see before an account is created (Act s.5, Rules rule 3): what we
 * collect and why, item by item, kept apart from the rest of the form. The optional uses are
 * separate tick boxes that start unticked, and agreeing is its own tick box.
 * The full texts are /privacy and /terms.
 */
export default function ConsentNotice({
  value,
  onChange,
  idPrefix = 'consent',
}: {
  value: ConsentChoices;
  onChange: (next: ConsentChoices) => void;
  idPrefix?: string;
}) {
  const set = (patch: Partial<ConsentChoices>) => onChange({ ...value, ...patch });

  return (
    <section
      aria-labelledby={`${idPrefix}-heading`}
      className="rounded-[14px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-4 text-[13px] leading-snug text-[var(--ink-soft)]"
    >
      <h2 id={`${idPrefix}-heading`} className="m-0 text-[15px] font-semibold text-[var(--ink)]">
        How we use your data
      </h2>

      <p className="mb-1.5 mt-3 font-semibold text-[var(--ink)]">What we need, and why</p>
      <ul className="m-0 list-disc space-y-1 pl-4">
        <li><b>Name, username, email, password and date of birth</b>: your account, signing in, and checking you&apos;re 18 or older.</li>
        <li><b>Pacts, photos, videos, comments and circles</b>: shown to the people you choose, and used for streaks and your CP Score. Photos are checked for unsafe content.</li>
        <li><b>Sign-in records, device and IP address</b>: to keep CirclePact secure. Kept for one year.</li>
        <li><b>UPI ID, only if you turn on tips</b>: so people can pay you.</li>
      </ul>

      <p className="mb-1.5 mt-3 font-semibold text-[var(--ink)]">Optional, off unless you tick</p>
      <label htmlFor={`${idPrefix}-ai`} className="flex items-start gap-2.5 py-1">
        <input
          id={`${idPrefix}-ai`}
          type="checkbox"
          checked={value.ai_training}
          onChange={(e) => set({ ai_training: e.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-[var(--navy)]"
        />
        <span>Use my posts to help train and improve CirclePact&apos;s AI.</span>
      </label>
      <label htmlFor={`${idPrefix}-ads`} className="flex items-start gap-2.5 py-1">
        <input
          id={`${idPrefix}-ads`}
          type="checkbox"
          checked={value.ads_sharing}
          onChange={(e) => set({ ads_sharing: e.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-[var(--navy)]"
        />
        <span>Share my data with advertising partners for more relevant ads (we may be paid for it).</span>
      </label>

      <p className="mt-3">
        You can change these any time in <b>Edit profile → Privacy choices</b>, and see, correct or delete your data.
        Questions or complaints go to our Grievance Officer, and then to the Data Protection Board of India.
      </p>

      <label htmlFor={`${idPrefix}-accept`} className="mt-3 flex items-start gap-2.5 border-t border-[var(--hairline)] pt-3 text-[var(--ink)]">
        <input
          id={`${idPrefix}-accept`}
          type="checkbox"
          checked={value.accepted}
          onChange={(e) => set({ accepted: e.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-[var(--navy)]"
        />
        <span>
          I&apos;ve read this and agree to the{' '}
          <a href="/terms" target="_blank" rel="noopener" className="font-semibold text-[var(--navy)] underline">Terms of Service</a>{' '}
          and to CirclePact using my data as the{' '}
          <a href="/privacy" target="_blank" rel="noopener" className="font-semibold text-[var(--navy)] underline">Privacy Policy</a>{' '}
          explains.
        </span>
      </label>
    </section>
  );
}
