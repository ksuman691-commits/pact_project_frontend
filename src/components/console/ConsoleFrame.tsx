'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import ConsoleBrand from '@/components/console/ConsoleBrand';
import CodeInput from '@/components/console/CodeInput';
import Avatar from '@/components/Avatar';
import { consoleApi, consoleSession, errorText, setCodePrompt, type TeamMember, type TeamRole } from '@/lib/console/api';

const MemberContext = createContext<TeamMember | null>(null);
export const useConsoleMember = () => useContext(MemberContext);

export const ROLE_LABEL: Record<TeamRole, string> = { owner: 'Owner', staff: 'Staff', moderator: 'Moderator', creator: 'Creator' };
export const ROLE_STYLE: Record<TeamRole, React.CSSProperties> = {
  owner: { background: 'var(--ink)', color: '#fff' },
  staff: { background: '#E3E8F7', color: 'var(--navy)' },
  moderator: { background: '#FDE4E1', color: '#9A1E14' },
  creator: { background: '#FFF1C2', color: '#6B4A00' },
};

export function RolePill({ role }: { role: TeamRole }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12.5px] font-bold" style={ROLE_STYLE[role]}>
      {ROLE_LABEL[role]}
    </span>
  );
}

/** Only what's built is in the menu; each role sees its own tools. */
const NAV: { href: string; label: string; roles: TeamRole[] }[] = [
  { href: '/console/studio', label: 'Dare studio', roles: ['staff', 'creator'] },
  { href: '/console/reports', label: 'Reports', roles: ['moderator'] },
  { href: '/console/team', label: 'Team', roles: ['owner'] },
  { href: '/console/activity', label: 'Activity log', roles: ['owner'] },
];

/**
 * The console's frame: checks the session, shows the sidebar for this role,
 * and owns the "enter your code again" prompt that high-impact actions need.
 */
export default function ConsoleFrame({ children, ownerOnly = false }: { children: React.ReactNode; ownerOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [prompt, setPrompt] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    if (!consoleSession.get()) {
      router.replace('/console/sign-in');
      return;
    }
    consoleApi
      .me()
      .then(({ member: me }) => setMember(me))
      .catch(() => {
        consoleSession.clear();
        router.replace('/console/sign-in');
      });
  }, [router]);

  const ask = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setCode('');
        setCodeError(null);
        setPrompt(true);
      }),
    [],
  );

  useEffect(() => {
    setCodePrompt(ask);
    return () => setCodePrompt(null);
  }, [ask]);

  const finish = (ok: boolean) => {
    setPrompt(false);
    resolver.current?.(ok);
    resolver.current = null;
  };

  const submit = async (value: string) => {
    setBusy(true);
    setCodeError(null);
    try {
      await consoleApi.reauth(value);
      finish(true);
    } catch (error) {
      setCodeError(errorText(error, "That code isn't right."));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await consoleApi.signOut();
    } catch {
      /* signed out locally either way */
    }
    consoleSession.clear();
    router.replace('/console/sign-in');
  };

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]" aria-busy="true">
        <ConsoleBrand />
      </div>
    );
  }

  const items = NAV.filter((item) => member.role === 'owner' || item.roles.includes(member.role));
  const blocked = ownerOnly && member.role !== 'owner';

  return (
    <MemberContext.Provider value={member}>
      <div className="flex min-h-screen flex-wrap bg-[var(--paper)] text-[var(--ink)]">
        <nav aria-label="Console" className="flex w-full flex-col gap-1 bg-[var(--ink)] px-3.5 py-4 text-white md:sticky md:top-0 md:h-screen md:w-[240px] md:shrink-0 md:py-5">
          <div className="flex items-center justify-between px-2 pb-3 md:pb-4">
            <Link href="/console" aria-label="Console home">
              <ConsoleBrand size={19} tone="cream" />
            </Link>
            <button type="button" onClick={() => void signOut()} className="text-[13px] font-semibold text-[#C9C8CF] md:hidden">
              Sign out
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto md:flex-col">
            {items.map((item) => {
              const current = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={`flex h-10 shrink-0 items-center rounded-[10px] px-2.5 text-[14.5px] transition ${current ? 'bg-[#2A2B31] font-bold text-white' : 'font-semibold text-[#C9C8CF] hover:bg-[#222329] hover:text-white'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-auto hidden items-center gap-2.5 border-t border-[#2E2F36] px-2 pt-3.5 md:flex">
            <Avatar name={member.name} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">{member.name}</span>
              <span className="block text-[12px] text-[#C9C8CF]">{ROLE_LABEL[member.role]}</span>
            </span>
            <button type="button" onClick={() => void signOut()} className="text-[12.5px] font-semibold text-[#C9C8CF] hover:text-white">
              Sign out
            </button>
          </div>
        </nav>

        <main className="min-w-0 flex-[999_1_560px] px-5 py-6 md:px-8 md:py-7">
          <div className="max-w-[960px]">
            {blocked ? (
              <div className="rounded-[20px] border border-[var(--hairline)] bg-[var(--card)] p-6">
                <h1 className="text-[22px] font-bold tracking-[-0.03em]">Only the owner can open this</h1>
                <p className="mt-1.5 text-[14.5px] text-[var(--muted)]">Ask the owner if you need something changed here.</p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {prompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="reauth-title">
          <div className="w-full max-w-[400px] rounded-[24px] bg-[var(--card)] p-6">
            <h2 id="reauth-title" className="text-[22px] font-bold tracking-[-0.03em]">Enter your code to confirm</h2>
            <p className="mt-1.5 text-[14px] leading-[1.45] text-[var(--muted)]">This change matters, so we check it&apos;s really you. You won&apos;t be asked again for 5 minutes.</p>
            <div className="mt-5">
              <CodeInput value={code} onChange={setCode} onComplete={(v) => void submit(v)} disabled={busy} />
            </div>
            {codeError && (
              <p className="mt-3 text-[13.5px] font-semibold text-[#B3261E]" role="alert">
                {codeError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => finish(false)} className="h-11 rounded-full border border-[var(--hairline)] px-5 text-[15px] font-bold">
                Cancel
              </button>
              <button type="button" disabled={code.length !== 6 || busy} onClick={() => void submit(code)} className="h-11 rounded-full bg-[var(--ink)] px-5 text-[15px] font-bold text-white disabled:opacity-40">
                {busy ? 'Checking…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MemberContext.Provider>
  );
}
