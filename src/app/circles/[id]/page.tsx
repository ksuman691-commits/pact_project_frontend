'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { circleService, circleJoinRequestService, circleAdvancedService, userService } from '@/services/api'
import { Circle, Pact } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Users, Camera } from 'lucide-react'
import DetailPageHeader from '@/components/DetailPageHeader'
import { useSeedBackHistory } from '@/hooks/useSeedBackHistory'
import InviteMembersModal from '@/components/InviteMembersModal'
import ConfirmModal from '@/components/ConfirmModal'
import UserAvatarLink from '@/components/UserAvatarLink'
import PactProgressRing, { getPactProgress } from '@/components/PactProgressRing'
import LogoSpinner from '@/components/LogoSpinner'
import { CircleQRTeaser, CircleQRFullView } from '@/components/CircleQR'

export default function CircleDetailPage() {
  const router = useRouter(); const params = useParams(); const { user, isInitialized } = useRequireAuth(); const circleId = Number(params.id)
  const [circle, setCircle] = useState<Circle | null>(null); const [members, setMembers] = useState<any[]>([]); const [pacts, setPacts] = useState<Pact[]>([]); const [loading, setLoading] = useState(true); const [isMember, setIsMember] = useState(false); const [qrOpen, setQrOpen] = useState(false); const [inviteModal, setInviteModal] = useState(false); const [leaveModal, setLeaveModal] = useState(false); const [leaving, setLeaving] = useState(false); const [memberStats, setMemberStats] = useState<any[]>([]); const [uploadingPhoto, setUploadingPhoto] = useState(false)
  useSeedBackHistory('/circles')
  useEffect(() => { if (!isInitialized) return; if (!user) { router.push('/auth/login'); return } (async () => { try { const [c, m, p] = await Promise.all([circleService.getById(circleId), circleJoinRequestService.listMembers(circleId), circleService.listPacts(circleId)]); setCircle(c.data); setMembers(m.data || []); setPacts(p.data || []); setIsMember(!!c.data?.is_member) } catch { toast.error('Failed to load circle'); router.push('/circles') } finally { setLoading(false) } })() }, [isInitialized, user, router, circleId])
  useEffect(() => { if (!members.length) { setMemberStats([]); return } Promise.allSettled(members.map(m => userService.getStats(m.user_id))).then(results => setMemberStats(results.map((r, i) => r.status === 'fulfilled' ? { ...members[i], ...(r.value.data || {}) } : null).filter(Boolean))) }, [members])
  if (!isInitialized || loading) return <><DetailPageHeader title="Loading circle…" fallbackHref="/circles" maxWidthClassName="max-w-4xl" /><div className="flex min-h-screen items-center justify-center bg-[var(--pact-bg)]"><LogoSpinner size={32} color="var(--pact-violet)" /></div></>
  if (!user) return null
  // Real not-found state instead of a blank screen — reachable when the load
  // effect's catch block hasn't redirected away yet (or a future change stops
  // redirecting), matching the Pact detail page's "not found" pattern.
  if (!circle) return <><DetailPageHeader title="Circle not found" backHref="/circles" maxWidthClassName="max-w-4xl" /><div className="flex min-h-screen items-center justify-center bg-[var(--pact-bg)] px-5 text-center text-[var(--pact-text)]"><div><p className="text-lg font-bold">Circle not found</p><p className="mt-2 text-sm text-[var(--pact-text-muted)]">This circle could not be loaded or is no longer available.</p></div></div></>
  const activeMembers = memberStats.filter(m => Number(m.current_streak) > 0).length; const activeStreaks = memberStats.filter(m => Number(m.current_streak) > 0).map(m => Number(m.current_streak)); const groupStreak = activeStreaks.length ? Math.min(...activeStreaks) : 0
  const handleJoin = async () => { try { await circleService.join(circleId); setIsMember(true); const m = await circleJoinRequestService.listMembers(circleId); setMembers(m.data || []); toast.success('Joined circle') } catch { toast.error('Failed to join circle') } }
  const handleLeave = async () => { setLeaving(true); try { await circleService.leave(circleId); router.push('/circles') } finally { setLeaving(false); setLeaveModal(false) } }
  const isOwner = !!user && !!circle && user.id === (circle as any).owner_id
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
    setUploadingPhoto(true)
    try {
      const res = await circleAdvancedService.uploadPhoto(circleId, file)
      const photoUrl = res?.data?.photo_url ?? null
      setCircle(prev => prev ? { ...prev, photo_url: photoUrl } as any : prev)
      toast.success('Circle photo updated')
    } catch {
      toast.error("Couldn't update the photo. Try again in a moment.")
    } finally {
      setUploadingPhoto(false)
    }
  }
  return <main className="min-h-screen bg-[var(--pact-bg)] pb-24 text-[var(--pact-text)]"><DetailPageHeader title={circle.name || 'Circle'} fallbackHref="/circles" maxWidthClassName="max-w-4xl" /><div className="mx-auto max-w-4xl px-5 pb-12 pt-8">
    <header className="border-b border-[var(--pact-hairline)] pb-8"><div className="flex items-start gap-4"><div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-3xl" style={{ background: 'linear-gradient(135deg,var(--pact-pink),var(--pact-violet))' }}>{(circle as any).photo_url ? <Image src={(circle as any).photo_url} alt="" fill sizes="64px" className="object-cover" /> : ((circle as any).icon_emoji || (circle as any).emoji || circle.name?.charAt(0))}{isOwner && <label className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full" style={{ background: 'var(--pact-violet)', border: '2px solid var(--pact-bg)' }} aria-label="Change circle photo">{uploadingPhoto ? <LogoSpinner size={12} color="#fff" /> : <Camera className="h-3 w-3 text-white" aria-hidden="true" />}<input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} /></label>}</div><div><h1 className="text-4xl font-black tracking-[-0.06em] text-[var(--pact-text)]">{circle.name}</h1>{/* Italicized — a bio-style tagline in the circle's own voice, not
        another metadata fact like the member-count/streak line below it. */}<p className="mt-2 max-w-xl text-sm italic leading-relaxed text-[var(--pact-text-muted)]">{circle.description || 'A place to show up for each other.'}</p></div></div><p className="mt-6 text-sm text-[var(--pact-text-muted)]">Started {new Date(circle.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · {pacts.length} pacts made together</p><p className="mt-3 text-sm text-[var(--pact-text)]">{circle.member_count ?? members.length} people · {activeMembers} active this week · {groupStreak}d group streak</p></header>
    <CircleQRTeaser circle={circle} onOpen={() => setQrOpen(true)} />
    {/* Was "Showing up lately" — misleading since it's just the static
        member roster with each person's streak next to their name, and
        several legitimately show "0d" (no current streak), which directly
        contradicted a header implying recent activity. */}
    <section className="border-b border-[var(--pact-hairline)] py-8"><h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--pact-violet)]">Members of the circle</h2><div className="mt-5 flex flex-wrap gap-x-6 gap-y-4">{members.map((member: any) => { const stat = memberStats.find(s => s.user_id === member.user_id); return <div key={member.user_id} className="flex items-center gap-2"><UserAvatarLink name={member.username} avatarUrl={member.avatar_url} username={member.username} size={34} /><span className="text-sm"><span className="font-bold">{member.full_name || member.username}</span><span className="ml-2 text-[var(--pact-violet)]">{stat?.current_streak || 0}d</span></span></div> })}</div></section>
    <div className="flex flex-wrap items-center gap-5 border-b border-[var(--pact-hairline)] py-5 text-sm">{isMember && <><button onClick={() => router.push(`/pacts/create?circleId=${circleId}`)} className="flex items-center gap-2 font-bold text-[var(--pact-violet)]"><Plus className="h-4 w-4" />Create pact</button><button onClick={() => setInviteModal(true)} className="flex items-center gap-2 text-[var(--pact-text-muted)]"><Users className="h-4 w-4" />Invite members</button></>}{!isMember && <button onClick={handleJoin} className="font-bold text-[var(--pact-violet)]">Join circle</button>}<button onClick={() => setLeaveModal(true)} className="text-[var(--pact-text-faint)]">Leave</button></div>
    <section className="pt-8"><h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--pact-violet)]">Pacts in this circle</h2>{!isMember ? <p className="py-8 text-sm text-[var(--pact-text-muted)]">Join this circle to view its pacts.</p> : pacts.length ? <div className="mt-4">{pacts.map((pact: any) => {
      const progress = getPactProgress(pact)
      // Who made this pact — a real clarity/trust gap without it, since
      // rows were otherwise indistinguishable by author. Already present on
      // the API response (creator_username/creator_full_name/
      // creator_avatar_url), no backend change needed.
      const creatorName = pact.creator_full_name || pact.creator_username
      return <Link key={pact.id} href={`/pacts/${pact.id}`} className="flex items-center gap-4 border-t border-[var(--pact-hairline)] py-4 hover:border-[var(--pact-violet)]">
        <PactProgressRing completed={progress.completed} total={progress.total} missed={progress.missed} size={58} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[var(--pact-text)]">{pact.title}</p>
          <p className="mt-1 text-sm text-[var(--pact-text-muted)]">Day {progress.completed} of {progress.total}</p>
        </div>
        {creatorName && <div className="flex shrink-0 items-center gap-2" title={`Created by ${creatorName}`}>
          <UserAvatarLink name={creatorName} avatarUrl={pact.creator_avatar_url} username={pact.creator_username} size={28} stopPropagation />
          <span className="hidden max-w-[9rem] truncate text-xs text-[var(--pact-text-muted)] sm:inline">{creatorName}</span>
        </div>}
      </Link>
    })}</div> : <p className="py-8 text-sm text-[var(--pact-text-muted)]">No pacts in this circle yet.</p>}</section>
  </div>{circle && qrOpen && <CircleQRFullView circle={circle} onClose={() => setQrOpen(false)} />} {circle && <InviteMembersModal isOpen={inviteModal} onClose={() => setInviteModal(false)} circleId={circle.id} circleName={circle.name} existingMemberIds={members.map((m: any) => m.user_id)} />}<ConfirmModal isOpen={leaveModal} onClose={() => setLeaveModal(false)} onConfirm={handleLeave} title="Leave circle?" description={`You'll lose access to ${circle.name}'s pacts until you rejoin.`} confirmLabel="Leave Circle" destructive loading={leaving} /></main>
}
