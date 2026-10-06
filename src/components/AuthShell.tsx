import type { ReactNode } from 'react';

interface AuthShellProps {
  heading: string;
  subheading?: string;
  children: ReactNode;
}

export const authInputClass =
  'h-12 w-full rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-3.5 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]';

export const authLabelClass = 'mb-1.5 block text-[13px] font-medium text-[var(--ink-soft)]';

export const authPrimaryButtonClass =
  'h-[52px] w-full rounded-full bg-[var(--navy)] text-[16px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)] disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Shared cover for /auth/login and /auth/register: an ink page with the
 * wordmark centred in the top half and a paper panel holding the form.
 * Presentation only; auth logic stays in the page components.
 */
export default function AuthShell({ heading, subheading, children }: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-[#17181D]">
      <header className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="m-0 text-[66px] font-bold leading-none tracking-[-0.045em] text-white">CirclePact</h1>
        <p className="m-0 text-[17px] text-white/70">Say it. Do it. Let people see.</p>
      </header>

      <section className="rounded-t-[6px] bg-[var(--paper)] px-6 pb-[calc(1.75rem+env(safe-area-inset-bottom))] pt-7 text-[var(--ink)]">
        <h2 className="mb-1.5 text-[24px] font-bold tracking-[-0.03em]">{heading}</h2>
        {subheading ? <p className="mb-5 text-[14px] text-[var(--muted)]">{subheading}</p> : null}
        {children}
      </section>
    </main>
  );
}
