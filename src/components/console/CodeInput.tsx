'use client';

import { useRef } from 'react';

/**
 * Six boxes for an authenticator code. Typing moves along, backspace moves
 * back, and pasting a whole code fills every box. Calls onComplete once all six
 * digits are in.
 */
export default function CodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  label = '6-digit code',
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const set = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
    return clean;
  };

  return (
    <fieldset className="m-0 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">{label}</legend>
      <div className="grid grid-cols-6 gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            aria-label={`Digit ${i + 1}`}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoFocus={autoFocus && i === 0}
            maxLength={6}
            value={digit}
            onChange={(e) => {
              const typed = e.target.value.replace(/\D/g, '');
              if (typed.length > 1) {
                const filled = set(typed);
                refs.current[Math.min(filled.length, 5)]?.focus();
                return;
              }
              const next = (value.slice(0, i) + typed + value.slice(i + 1)).slice(0, 6);
              set(next);
              if (typed && i < 5) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digit && i > 0) {
                set(value.slice(0, i - 1) + value.slice(i));
                refs.current[i - 1]?.focus();
              }
            }}
            className="h-14 w-full rounded-[12px] border bg-white text-center text-[24px] font-bold text-[var(--ink)] outline-none transition focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_rgba(31,58,147,0.18)] disabled:opacity-60"
            style={{ borderColor: digit ? 'var(--ink)' : 'var(--hairline)', borderWidth: digit ? 1.5 : 1 }}
          />
        ))}
      </div>
    </fieldset>
  );
}
