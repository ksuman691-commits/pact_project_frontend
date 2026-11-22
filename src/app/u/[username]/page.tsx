'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Lock, Share2 } from 'lucide-react'
import Avatar from '@/components/Avatar'
import CircleMark from '@/components/brand/CircleMark'
import { CheckBadge, CpClockBadge, FlameBadge } from '@/components/hero/HeroBadges'
import api from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { MARK_PATH } from '@/lib/circleMark'
import { publicName, type PublicProfile } from '@/lib/publicProfile'

const SOFT = '#D4DBFA'
const TILE: React.CSSProperties = { background: '#2A4AAC', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22), 0 2px 0 rgba(10,20,70,0.55)' }

function Tile({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub?: string }) {
  return (
    <div className="flex min-h-[122px] flex-col rounded-[18px] p-3" style={TILE}>
      {icon}
      <span className="mt-3 text-[30px] font-bold leading-none tracking-[-0.04em] tabular-nums text-white">{value}</span>
      <span className="mt-1 truncate text-[13px] font-bold text-white">{label}</span>
      {sub && <span className="mt-0.5 truncate text-[11.5px] font-medium" style={{ color: '#C7D0F7' }}>{sub}</span>}
    </div>
  )
}

function joined(iso: string | null) {
  if (!iso) return null
  const when = new Date(iso)
  return Number.isNaN(when.getTime()) ? null : when.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

/**
 * The page someone gets when a person shares their profile: who they are, their
 * CP Score, streak and pacts kept, and the public pacts they're showing up for
 * right now. Works signed out; the next step is following them on CirclePact.
 */
export default function PublicProfilePage() {
  const params = useParams<{ username: string }>()
  const username = decodeURIComponent(String(params?.username ?? ''))
  const { user, isInitialized } = useAuthStore()
  const query = useQuery({
    queryKey: ['public-profile', username.toLowerCase()],
    queryFn: async () => (await api.get<PublicProfile>(`/api/public/profiles/${encodeURIComponent(username)}`)).data,
    enabled: Boolean(username),
    staleTime: 60_000,
  })
  const p = query.data
  const mine = Boolean(user && p && Number(user.id) === p.id)
  const signedIn = isInitialized && Boolean(user)
  const name = p ? publicName(p) : ''
  const first = name.split(' ')[0]

  const share = async () => {
    const url = `${window.location.origin}/u/${encodeURIComponent(p?.username ?? username)}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} on CirclePact`, url })
        return
      }
    } catch {
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const profileHref = `/profile/${encodeURIComponent(p?.username ?? username)}`
  const cta = mine ? (
    <button type="button" onClick={() => void share()} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white text-[16px] font-extrabold text-[var(--navy)]" style={{ boxShadow: '0 0 0 2px #17181D' }}>
      <Share2 className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
      Share your page
    </button>
  ) : (
    <Link
      href={signedIn ? profileHref : `/auth/register?next=${encodeURIComponent(profileHref)}`}
      className="flex h-[52px] w-full items-center justify-center rounded-full bg-white text-[16px] font-extrabold text-[var(--navy)]"
      style={{ boxShadow: '0 0 0 2px #17181D' }}
    >
      {signedIn ? `Follow ${first}` : `Follow ${first} on CirclePact`}
    </Link>
  )

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-16 text-[var(--ink)]">
      <section className="relative overflow-hidden rounded-b-[32px] bg-[#1F3A93] px-5 pb-6 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute -right-24 -top-24 size-[340px]" aria-hidden="true">
          <path d={MARK_PATH} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.8" />
        </svg>

        <div className="relative mx-auto flex max-w-md items-center justify-between">
          <Link href={signedIn ? '/feed' : '/'} className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-white" style={{ boxShadow: '0 0 0 1.5px #17181D' }}>
              <CircleMark size={22} />
            </span>
            <span className="text-[17px] font-extrabold tracking-[-0.02em]">CirclePact</span>
          </Link>
          {!signedIn && isInitialized && (
            <Link href={`/auth/login?next=${encodeURIComponent(profileHref)}`} className="flex h-9 items-center rounded-full px-3.5 text-[14px] font-bold" style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6)' }}>
              Log in
            </Link>
          )}
        </div>

        <div className="relative mx-auto max-w-md">
          {query.isLoading ? (
            <div className="mt-8 flex flex-col gap-3" aria-busy="true" aria-label="Loading profile">
              <span className="size-[84px] rounded-full bg-white/15" />
              <span className="h-8 w-48 rounded bg-white/15" />
              <span className="h-4 w-32 rounded bg-white/10" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => <span key={i} className="h-[122px] rounded-[18px] bg-white/10" />)}
              </div>
            </div>
          ) : !p ? (
            <div className="py-16 text-center">
              <h1 className="text-[28px] font-extrabold" style={{ color: '#FFFFFF' }}>No one here by that name</h1>
              <p className="mt-2 text-[14px]" style={{ color: SOFT }}>The link may be old, or the account was closed.</p>
            </div>
          ) : (
            <>
              <div className="mt-7 flex items-center gap-4">
                <span className="shrink-0 rounded-full bg-white p-[3px]" style={{ boxShadow: '0 0 0 2px #17181D' }}>
                  <Avatar name={name} avatarUrl={p.avatar_url} size={78} />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em]" style={{ color: '#FFFFFF' }}>{name}</h1>
                  <p className="mt-1 truncate text-[13.5px] font-semibold" style={{ color: SOFT }}>
                    @{p.username}
                    {joined(p.joined_at) ? ` · since ${joined(p.joined_at)}` : ''}
                    {p.followers ? ` · ${p.followers} ${p.followers === 1 ? 'follower' : 'followers'}` : ''}
                  </p>
                </div>
              </div>
              {p.bio && <p className="mt-3 line-clamp-3 text-[14.5px] leading-[1.4] text-white">{p.bio}</p>}

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Tile
                  icon={<CpClockBadge value={p.cp_score.score} />}
                  value={p.cp_score.score != null ? String(Math.round(p.cp_score.score)) : '–'}
                  label="CP Score"
                  sub={p.cp_score.band ?? undefined}
                />
                <Tile icon={<FlameBadge />} value={String(p.streak)} label="Day streak" sub={p.longest_streak > p.streak ? `Best ${p.longest_streak}` : undefined} />
                <Tile icon={<CheckBadge />} value={String(p.pacts_kept)} label="Pacts kept" sub={p.pacts_ended ? `of ${p.pacts_ended} finished` : 'First one running'} />
              </div>
              <div className="mt-3">{cta}</div>
            </>
          )}
        </div>
      </section>

      {p && (
        <div className="mx-auto max-w-md px-4">
          <h2 className="mt-7 px-1 text-[17px] font-extrabold tracking-[-0.01em]">
            Showing up now {p.running_count > 0 && <span className="text-[var(--muted)]">{p.running_count}</span>}
          </h2>
          {!mine && (p.followers_only_count ?? 0) > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 px-1 text-[13.5px] font-semibold text-[var(--muted)]">
              <Lock className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
              +{p.followers_only_count} followers-only {p.followers_only_count === 1 ? 'pact' : 'pacts'}. Follow {first} to see {p.followers_only_count === 1 ? 'it' : 'them'}.
            </p>
          )}
          {p.running.length === 0 ? (
            <p className="mt-2 px-1 text-[14px] text-[var(--muted)]">No public pacts running right now.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {p.running.map((pact) => {
                const total = pact.total_days || pact.day
                return (
                  <li key={pact.id}>
                    <Link
                      href={signedIn ? `/pacts/${pact.id}` : `/auth/login?next=${encodeURIComponent(`/pacts/${pact.id}`)}`}
                      className="block rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] p-4 transition active:scale-[0.99]"
                    >
                      <span className="block truncate text-[16px] font-extrabold tracking-[-0.01em]">{pact.title}</span>
                      <span className="mt-2 flex items-center gap-2 text-[12.5px] font-semibold text-[var(--muted)]">
                        <span className="rounded-full bg-[var(--navy)] px-2.5 py-[3px] text-[12px] font-extrabold text-white">
                          Day {pact.day} of {total}
                        </span>
                        {pact.days_posted} {pact.days_posted === 1 ? 'day' : 'days'} posted
                      </span>
                      <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[var(--hairline)]" aria-hidden="true">
                        <span className="block h-full rounded-full bg-[var(--navy)]" style={{ width: `${Math.min(100, (pact.days_posted / Math.max(1, total)) * 100)}%` }} />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          {!mine && (
            <div className="mt-8 flex items-center gap-3 rounded-[20px] border border-[var(--hairline)] bg-[var(--card)] p-4">
              <CircleMark size={34} animation="draw" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold">Make a pact. Let people see.</p>
                <p className="text-[12.5px] text-[var(--muted)]">A photo a day, your circle watching.</p>
              </div>
              <Link
                href={signedIn ? '/pacts/create' : '/auth/register'}
                className="flex h-10 shrink-0 items-center rounded-full bg-[var(--navy)] px-4 text-[14px] font-bold text-white"
              >
                Start yours
              </Link>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
