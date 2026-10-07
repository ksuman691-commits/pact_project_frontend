'use client'

import { useMemo, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, MessageCircle, PartyPopper, UserPlus, Users, Home } from 'lucide-react'
import Link from 'next/link'

type Moment = { id: number | string; url?: string; type?: string; description?: string; day?: number }

type Props = {
  pact: any
  moments: Moment[]
  participants: any[]
  progress: { completed: number; total: number; missed: number } | null
  onBack: () => void
  onInvite: () => void
  onAddMoment: () => void
  onCheer?: () => void
}

const gradient = 'linear-gradient(160deg, #F4B26A 0%, #E4684F 48%, #5B3A78 100%)'

function Avatar({ person, index }: { person: any; index: number }) {
  const label = String(person?.full_name || person?.name || person?.username || 'M').charAt(0).toUpperCase()
  return person?.avatar_url || person?.avatar ? (
    <img src={person.avatar_url || person.avatar} alt="" className={`size-[34px] rounded-full border-2 border-white object-cover ${index ? '-ml-2' : ''}`} />
  ) : (
    <span className={`flex size-[34px] items-center justify-center rounded-full border-2 border-white text-[13px] font-extrabold text-white ${index ? '-ml-2' : ''}`} style={{ background: index ? 'linear-gradient(135deg,#E9B872,#9A5B3C)' : '#12131A' }}>{label}</span>
  )
}

export default function PactMomentsDetail({ pact, moments, participants, progress, onBack, onInvite, onAddMoment, onCheer }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMoments = moments.length > 0
  const current = moments[activeIndex] || moments[0]
  const total = progress?.total || 7
  const completed = progress?.completed || 0
  const day = pact?.status === 'ended' || pact?.is_completed ? total : Math.min(total, completed + (progress?.missed || 0) + 1)
  const percent = total ? Math.round((completed / total) * 100) : 0
  const dayLabel = pact?.status === 'ended' || pact?.is_completed ? 'Ended' : pact?.timeRemaining || `${Math.max(0, total - day)} days to go`
  const visiblePeople = participants.slice(0, 3)
  const overflow = Math.max(0, participants.length - 3)
  const caption = current?.description || 'Keep showing up for yourself.'
  const step = (amount: number) => setActiveIndex((index) => (index + amount + moments.length) % moments.length)

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#F5F3EE] px-[14px] pb-3 pt-5 font-[Manrope,system-ui,sans-serif] text-[#12131A]">
      <div className="mx-auto flex h-[calc(100vh-92px)] max-w-[390px] flex-col gap-[14px] rounded-[32px] border border-[#E7E4DC] bg-white p-[18px_16px_16px]">
        <div className="flex gap-[5px]" aria-label={`${total} pact days`}>
          {Array.from({ length: total }).map((_, index) => <span key={index} className="h-1 flex-1 rounded-[2px]" style={{ background: !hasMoments || index >= completed ? '#DADDE4' : index === completed ? 'linear-gradient(90deg,#1D7BF2 50%,#DADDE4 50%)' : '#12131A' }} />)}
        </div>

        <header className="flex items-center gap-3">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#1D7BF2 ${percent}%, #DADDE4 ${percent}% 100%)` }}>
            <span className="flex size-[35px] items-center justify-center rounded-full bg-white text-[11px] font-extrabold">{percent}%</span>
          </div>
          <div className="min-w-0 flex-1"><h1 className="text-[20px] font-extrabold leading-6">Day {day} of {total}</h1><p className="text-[13px] font-semibold leading-[18px] text-[#6B7080]">{dayLabel}</p></div>
          <div className="flex items-center">{visiblePeople.map((person, index) => <Avatar key={person.id || person.user_id || index} person={person} index={index} />)}{overflow > 0 && <span className="-ml-2 flex size-[34px] items-center justify-center rounded-full border-2 border-white bg-[#E9EAF0] text-[11px] font-bold">+{overflow}</span>}<button onClick={onInvite} aria-label="Invite someone" className="ml-1 flex size-11 items-center justify-center rounded-full border border-[#E1DED5] bg-white"><UserPlus className="size-5" /></button></div>
        </header>

        <section className="relative min-h-0 flex-1 overflow-hidden rounded-[24px]" style={{ background: gradient }} aria-label="Moments">
          <div className="absolute left-[20%] top-[13%] size-56 rounded-full bg-[#FFE3A8]/40" /><div className="absolute left-[-5%] right-[-5%] bottom-0 h-[35%] rounded-[50%_50%_0_0] bg-[#3C2650]" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#12131A]/75 to-transparent" />
          {hasMoments && current?.url && (current.type === 'video' ? <video src={current.url} className="absolute inset-0 size-full object-cover" muted playsInline /> : <img src={current.url} alt={caption} className="absolute inset-0 size-full object-cover" />)}
          {hasMoments && <><button aria-label="Previous moment" onClick={() => step(-1)} className="absolute inset-y-0 left-0 w-1/3" /><button aria-label="Next moment" onClick={() => step(1)} className="absolute inset-y-0 right-0 w-1/3" /><div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/35 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur"><span className="flex size-5 items-center justify-center rounded-full bg-white/80 text-[10px] text-[#12131A]">{String(pact?.creator_username || 'Y').charAt(0).toUpperCase()}</span>You - Day {current.day || day}</div><div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2"><button aria-label="Cheer for this moment" onClick={onCheer} className="flex size-12 items-center justify-center rounded-full bg-white text-[#12131A] shadow-lg"><PartyPopper className="size-5" /></button><button aria-label="Comment on this moment" className="flex size-12 items-center justify-center rounded-full bg-white text-[#12131A] shadow-lg"><MessageCircle className="size-5" /></button></div><div className="absolute inset-x-5 bottom-5 text-white"><p className="text-xs font-bold opacity-80">{3 + activeIndex} cheers</p><p className="mt-0.5 text-[17px] font-extrabold leading-[22px]">{caption}</p></div></>}
          {!hasMoments && <div className="absolute inset-x-0 top-[22%] flex flex-col items-center gap-4 text-white"><button onClick={onAddMoment} aria-label="Add a moment" className="flex size-[104px] items-center justify-center rounded-full bg-white shadow-[0_0_0_10px_rgba(255,255,255,.28),0_0_0_22px_rgba(255,255,255,.14)]"><span className="text-[44px] font-light leading-none">+</span></button><p className="text-[24px] font-extrabold tracking-[-.4px]">Add a moment</p></div>}
          {!hasMoments && <div className="absolute inset-x-5 bottom-[22px] text-white"><p className="text-xs font-bold opacity-80">No moments yet</p><p className="mt-0.5 text-[17px] font-extrabold">Make something worth showing.</p></div>}
        </section>

        <footer className="flex min-h-14 items-center gap-2">
          {hasMoments ? <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">{moments.slice(0, 4).map((moment, index) => <button key={moment.id} onClick={() => setActiveIndex(index)} aria-label={`Open moment ${index + 1}`} className={`relative size-11 shrink-0 overflow-hidden rounded-xl bg-[#DADDE4] ${index === activeIndex ? 'border-2 border-[#12131A]' : ''}`}>{moment.url && <img src={moment.url} alt="" className="size-full object-cover" />}</button>)}{moments.length > 4 && <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F3F1EA] text-xs font-extrabold">+{moments.length - 4}</span>}</div> : <div className="flex flex-1 gap-2"><span className="flex h-11 items-center gap-1.5 rounded-full bg-[#F3F1EA] px-3.5 text-sm font-extrabold"><Users className="size-[18px]" />{participants.length}</span><span className="flex h-11 items-center gap-1.5 rounded-full bg-[#F3F1EA] px-3.5 text-sm font-extrabold"><PartyPopper className="size-[18px]" />0</span></div>}
          <button onClick={onAddMoment} aria-label="Open camera" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#1D7BF2] text-white"><Camera className="size-[26px]" /></button>
        </footer>
      </div>
    </main>
  )
}

export function PactMomentsNavHint() { return <Link href="/pacts" className="sr-only">Pacts</Link> }
export { ChevronLeft, ChevronRight, Home }
