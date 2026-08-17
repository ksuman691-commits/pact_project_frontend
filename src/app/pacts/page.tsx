'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, CheckCircle2, CircleDot, Flame, Target } from 'lucide-react'
import DetailPageHeader from '@/components/DetailPageHeader'
import PactProgressRing, { getPactProgress } from '@/components/PactProgressRing'
import { pactAdvancedService, userService } from '@/services/api'
import { useAuthStore } from '@/store/auth'

const filters = ['All', 'Active', 'Completed'] as const
type Filter = (typeof filters)[number]

export default function PactsPage() {
  const { user } = useAuthStore()
  const [filter, setFilter] = useState<Filter>('All')
  const pactsQuery = useQuery({ queryKey: ['my-pacts', user?.id], queryFn: () => pactAdvancedService.getMyPacts(0, 100), enabled: Boolean(user?.id), staleTime: 60_000 })
  const statsQuery = useQuery({ queryKey: ['user-stats', user?.id], queryFn: () => userService.getStats(user!.id!), enabled: Boolean(user?.id), staleTime: 60_000 })
  const pacts = pactsQuery.data?.data || []
  const filtered = useMemo(() => pacts.filter((pact: any) => filter === 'All' || (filter === 'Active' ? pact.status === 'active' : ['completed', 'failed', 'cancelled'].includes(pact.status))), [filter, pacts])
  const grouped = useMemo(() => filtered.reduce((groups: Record<string, any[]>, pact: any) => { const name = pact.circle_name || 'Personal pacts'; ;(groups[name] ||= []).push(pact); return groups }, {}), [filtered])
  const stats = statsQuery.data?.data || {}
  const activeCount = pacts.filter((pact: any) => pact.status === 'active').length
  const winRate = Number(stats.win_rate ?? stats.completion_rate ?? 0)
  const streak = Number(stats.current_streak ?? stats.streak ?? 0)

  return (
    <main className="pact-flow min-h-screen pb-32">
      <DetailPageHeader title="Pacts" backHref="/feed" />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <section className="rounded-[28px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] p-5 shadow-[0_18px_50px_var(--pact-shadow-violet)]">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--pact-text-faint)]">Your pact orbit</p><h1 className="mt-1 text-2xl font-black text-[var(--pact-text)]">Keep your circle moving.</h1></div><CircleDot className="h-8 w-8 text-[var(--pact-violet)]" /></div>
          <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--pact-hairline)] rounded-2xl bg-[var(--pact-surface-2)] py-3"><Stat icon={Activity} value={activeCount} label="Active" /><Stat icon={Target} value={`${Math.round(winRate)}%`} label="Win rate" /><Stat icon={Flame} value={streak} label="Day streak" /></div>
        </section>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pact status filter">{filters.map((item) => <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === item ? 'bg-[var(--pact-violet)] text-white' : 'border border-[var(--pact-hairline)] bg-[var(--pact-surface)] text-[var(--pact-text-faint)]'}`}>{item}</button>)}</div>
        {pactsQuery.isLoading ? <p className="py-12 text-center text-sm text-[var(--pact-text-faint)]">Loading your pacts...</p> : Object.keys(grouped).length === 0 ? <div className="rounded-[28px] border border-dashed border-[var(--pact-hairline)] p-10 text-center"><Target className="mx-auto h-10 w-10 text-[var(--pact-text-faint)]" /><p className="mt-3 font-bold text-[var(--pact-text)]">No pacts in this view</p><p className="mt-1 text-sm text-[var(--pact-text-faint)]">Create a pact or switch the filter to see more.</p></div> : (Object.entries(grouped) as [string, any[]][]).map(([circleName, circlePacts]) => <section key={circleName}><h2 className="mb-3 px-1 text-[11px] font-black uppercase tracking-[0.28em] text-[var(--pact-violet)]">{circleName}</h2><div className="space-y-3">{circlePacts.map((pact: any) => <PactRow key={pact.id} pact={pact} />)}</div></section>)}
      </div>
    </main>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Activity; value: string | number; label: string }) { return <div className="flex flex-col items-center gap-1 text-center"><Icon className="h-4 w-4 text-[var(--pact-violet)]" /><strong className="text-lg font-black text-[var(--pact-text)]">{value}</strong><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--pact-text-faint)]">{label}</span></div> }
function PactRow({ pact }: { pact: any }) { const progress = getPactProgress(pact); return <article className="flex items-center gap-4 rounded-[24px] border border-[var(--pact-hairline)] bg-[var(--pact-surface)] p-4 transition hover:border-[var(--pact-violet)]/60"><PactProgressRing completed={progress.completed} total={progress.total} missed={progress.missed} size={62} pactId={pact.id} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-bold text-[var(--pact-text)]">{pact.title}</h3>{pact.status === 'completed' && <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--pact-violet)]" />}</div><p className="mt-1 truncate text-sm text-[var(--pact-text-faint)]">{pact.circle_name || 'Personal pact'}</p>{progress.missed > 0 && <p className="mt-2 text-xs font-semibold text-[var(--pact-danger)]">Missed {progress.missed} {progress.missed === 1 ? 'day' : 'days'}</p>}</div><span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-text-faint)' }}>{pact.status}</span></article> }
