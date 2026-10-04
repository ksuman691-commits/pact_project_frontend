import type { ReactNode } from 'react';
import LogoMark from '@/components/LogoMark';

interface AuthShellProps {
  heading: string;
  subheading: string;
  children: ReactNode;
}

export const authInputClass =
  'h-12 w-full rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-4 font-sans text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/30';

export const authPrimaryButtonClass =
  'h-12 w-full rounded-full bg-[var(--navy)] font-sans text-base font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)] disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Shared shell for /auth/login and /auth/register. Presentation only; auth
 * logic stays in the page components.
 */
export default function AuthShell({ heading, subheading, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6 py-12 text-[var(--ink)]">
      <section className="w-full max-w-md">
        <div className="flex flex-col items-start gap-3">
          <LogoMark size={40} />
          <h1 className="font-display text-[34px] font-medium leading-[1.08] tracking-[-0.01em] text-[var(--ink)]">
            {heading}
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">{subheading}</p>
        </div>

        {children}
      </section>
    </main>
  );
}
