import type { ReactNode } from 'react';
import LogoMark from '@/components/LogoMark';

interface AuthShellProps {
  heading: string;
  subheading: string;
  children: ReactNode;
}

/**
 * Shared visual shell for /auth/login and /auth/register so the two screens
 * feel like one coherent flow instead of two different apps. Owns the
 * background, decorative blobs, card, and logo/heading block; each page
 * supplies its own form + footer content as children. Auth logic
 * (handleSubmit, useAuthStore, redirects) stays entirely in the page
 * components — this component is presentation only.
 */
export default function AuthShell({ heading, subheading, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF6F0] px-5 py-12 text-[#2F211D]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[rgba(127,119,221,0.20)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[rgba(127,119,221,0.13)]"
      />

      <section className="relative w-full max-w-md rounded-[30px] bg-white px-7 py-9 shadow-[0_24px_70px_rgba(75,53,42,0.12)] sm:px-10 sm:py-11">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={52} />
          <h1 className="mt-7 text-4xl font-bold lowercase tracking-[-0.05em] text-[#2F211D]">{heading}</h1>
          <p className="mt-2 text-sm text-[#8E7C73]">{subheading}</p>
        </div>

        {children}
      </section>
    </main>
  );
}
