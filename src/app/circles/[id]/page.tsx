'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { circleService, circleJoinRequestService, circleAdvancedService } from '@/services/api'
import { Circle, Pact } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Plus, Users, Camera, ChevronLeft, Share2 } from 'lucide-react'
import { useSeedBackHistory } from '@/hooks/useSeedBackHistory'
import InviteMembersModal from '@/components/InviteMembersModal'
import ConfirmModal from '@/components/ConfirmModal'
import LogoSpinner from '@/components/LogoSpinner'
import { CircleQRFullView } from '@/components/CircleQR'
import FeedPactCard from '@/components/FeedPactCard'
import { useSkipPact } from '@/hooks/usePactActions'
import Ring from '@/components/classic/Ring'
import Seat from '@/components/classic/Seat'
import { readCircleActivity } from '@/lib/circleActivity'

const PRIVACY_LABEL: Record<string, string> = {
  public: 'Anyone can join',
  open: 'Anyone can join',
  approval: 'Approval needed to join',
  private: 'Invite only',
}

export default function CircleDetailPage() {
  const router = useRouter(); const params = useParams(); const { user, isInitialized } = useRequireAuth(); const circleId = Number(params.id)
  const [circle, setCircle] = useState<Circle | null>(null); const [members, setMembers] = useState<any[]>([]); const [pacts, setPacts] = useState<Pact[]>([]); const [loading, setLoading] = useState(true); const [isMember, setIsMember] = useState(false); const [qrOpen, setQrOpen] = useState(false); const [inviteModal, setInviteModal] = useState(false); const [leaveModal, setLeaveModal] = useState(false); const [leaving, setLeaving] = useState(false); const [uploadingPhoto, setUploadingPhoto] = useState(false)
  // Tracks which members were just nudged this session so the button can
  // flip to a disabled "Nudged" state and prevent an accidental double-send
  // — not persisted, so it resets on reload (there's no "already nudged
  // today" read endpoint yet to hydrate this from).
  const [nudgedIds, setNudgedIds] = useState<Set<number>>(new Set())
  // Grid layout (mockup): a handful of members shown up front with a "See
  // all" expand toggle, rather than the full roster always rendered flat.
  const skipMutation = useSkipPact()
  const handleSkipPact = async (pactId: number, _vote: 'skip') => { await skipMutation.mutateAsync(pactId) }
  useSeedBackHistory('/circles')
  useEffect(() => { if (!isInitialized) return; if (!user) { router.push('/auth/login'); return } (async () => { try { const [c, m, p] = await Promise.all([circleService.getById(circleId), circleJoinRequestService.listMembers(circleId), circleService.listPacts(circleId)]); setCircle(c.data); setMembers(m.data || []); setPacts(p.data || []); setIsMember(!!c.data?.is_member) } catch { toast.error('Failed to load circle'); router.push('/circles') } finally { setLoading(false) } })() }, [isInitialized, user, router, circleId])
  if (!isInitialized || loading) return <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]"><LogoSpinner size={32} color="var(--navy)" /></div>
  if (!user) return null
  // Real not-found state instead of a blank screen — reachable when the load
  // effect's catch block hasn't redirected away yet (or a future change stops
  // redirecting), matching the Pact detail page's "not found" pattern.
  if (!circle) return <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-5 text-center text-[var(--ink)]"><div><p className="font-serif text-lg">Circle not found</p><p className="mt-2 text-[13px] text-[var(--muted)]">This circle could not be loaded or is no longer available.</p><button type="button" onClick={() => router.push('/circles')} className="mt-4 h-11 rounded-full bg-[var(--navy)] px-6 text-[14px] font-semibold text-[var(--card)]">Back to circles</button></div></div>
  const handleJoin = async () => { try { await circleService.join(circleId); setIsMember(true); const m = await circleJoinRequestService.listMembers(circleId); setMembers(m.data || []); toast.success('Joined circle') } catch { toast.error('Failed to join circle') } }
  // POST /api/circles/{id}/members/{user_id}/nudge — see
  // circleAdvancedService.nudgeMember and BACKEND_SPEC_PUSH_NOTIFICATIONS.md.
  // Not live yet, same graceful-degradation convention as
  // circleAdvancedService.inviteUser: a 404 (endpoint doesn't exist) is
  // downgraded to a "not available yet" toast rather than a generic error,
  // and the button still flips to its nudged state either way so the UI is
  // fully clickable/testable ahead of the backend shipping.
  const handleNudgeMember = async (memberUserId: number) => {
    setNudgedIds((prev) => new Set(prev).add(memberUserId))
    try {
      await circleAdvancedService.nudgeMember(circleId, memberUserId)
      toast.success('Nudge sent!')
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast('Nudges are coming soon', { icon: '🔔' })
      } else {
        toast.error('Failed to send nudge')
        setNudgedIds((prev) => {
          const next = new Set(prev)
          next.delete(memberUserId)
          return next
        })
      }
    }
  }
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
  const privacyKey = ((circle as any).visibility || (circle as any).privacy || 'public') as string
  const privacyLabel = PRIVACY_LABEL[privacyKey] || 'Anyone can join'
  const startedLabel = circle.created_at ? new Date(circle.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null
  const memberCount = circle.member_count ?? members.length
  // Weekly activity is only shown when the API gives a real boolean for
  // every member (see BACKEND_SPEC_MEMBER_ACTIVITY.md). Otherwise: no ticks,
  // no statuses, just the member list.
  const activity = readCircleActivity(circle, members)
  const litById = new Map<number | string, boolean>(activity.ringMembers.map(m => [m.userId, m.activeThisWeek]))
  const orderedMembers = activity.known
    ? [...members].sort((a: any, b: any) => Number(litById.get(b.user_id) ?? 0) - Number(litById.get(a.user_id) ?? 0))
    : members
  // Real pact-creation events only. There is no circle activity endpoint,
  // so join events are not shown (no real timestamp for them).
  const recentEvents = [...pacts]
    .filter((p: any) => p.created_at)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)

  return <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
    <div className="flex items-center justify-between px-2 pt-3">
      <button type="button" onClick={() => router.push('/circles')} aria-label="Back to circles" className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)]">
        <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
      </button>
      <button type="button" onClick={() => setQrOpen(true)} aria-label="Share circle" className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)]">
        <Share2 className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </div>

    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center gap-3 px-6 pt-1 text-center">
        <Ring circleName={circle.name} members={activity.ringMembers} totalMemberCount={activity.totalMembers} size="detail" activityKnown={activity.known} coverPhotoUrl={(circle as any).photo_url} />
        {isOwner && (
          <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[var(--navy)] px-4 text-[13px] font-semibold text-[var(--navy)]" aria-label="Change circle cover photo">
            {uploadingPhoto ? <LogoSpinner size={12} color="var(--navy)" /> : <Camera className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />}
            Change cover
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
          </label>
        )}
        <h1 className="text-balance text-[34px] font-bold leading-none tracking-[-0.035em]">{circle.name}</h1>
        {circle.description && <p className="max-w-[300px] text-[15px] leading-[1.45] text-[var(--ink-soft)]">{circle.description}</p>}
        <p className="text-[13px] text-[var(--muted)]">{memberCount} {memberCount === 1 ? 'person' : 'people'} · {privacyLabel}{startedLabel ? ` · started ${startedLabel}` : ''}</p>
      </div>

      <div className="mx-4 mt-[22px] flex flex-col gap-2.5">
        {!isMember ? (
          <button onClick={handleJoin} className="flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--navy)] text-[16px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)]">Join circle</button>
        ) : (
          <>
            <button onClick={() => router.push(`/pacts/create?circleId=${circleId}`)} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--navy)] text-[16px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)]">
              <Plus className="h-4 w-4" strokeWidth={2} />
              {pacts.length === 0 ? 'Make the first pact' : 'Make a pact'}
            </button>
            <button onClick={() => setInviteModal(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] text-[15px] font-semibold text-[var(--navy)]">
              <Users className="h-4 w-4" strokeWidth={1.8} />
              Invite someone
            </button>
          </>
        )}
      </div>

      <section className="mx-6 mt-[30px]">
        <h2 className="text-[20px] font-bold tracking-[-0.025em]">{activity.known ? 'This week' : 'Members'}</h2>
        <ul className="mt-2">
          {orderedMembers.map((member: any) => {
            const isSelf = member.user_id === user.id
            const isNudged = nudgedIds.has(member.user_id)
            const displayName = member.full_name || member.username
            const lit = activity.known ? litById.get(member.user_id) === true : false
            return (
              <li key={member.user_id} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <Link href={`/profile/${member.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Seat name={displayName} avatarUrl={member.avatar_url} size={40} lit={lit} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{displayName}{isSelf ? ' (you)' : ''}</span>
                    {activity.known && <span className="block text-[13px] text-[var(--muted)]">{lit ? 'Sent proof this week' : 'Nothing sent yet'}</span>}
                  </span>
                </Link>
                {isMember && !isSelf && (
                  <button
                    type="button"
                    onClick={() => handleNudgeMember(member.user_id)}
                    disabled={isNudged}
                    aria-label={isNudged ? `Nudged ${displayName}` : `Nudge ${displayName}`}
                    className="h-11 px-2 text-[13px] font-semibold text-[var(--navy)] disabled:font-normal disabled:text-[var(--muted)]"
                  >
                    {isNudged ? 'Nudged' : 'Nudge'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {activity.known && <p className="mt-2 text-[12px] text-[var(--muted)]">A tick means they sent proof for a pact this week.</p>}
      </section>

      <section className="mx-6 mt-[30px]">
        <h2 className="text-[20px] font-bold tracking-[-0.025em]">Recently</h2>
        {!isMember ? (
          <p className="mt-2 text-[14px] text-[var(--muted)]">Join this circle to see its pacts.</p>
        ) : recentEvents.length > 0 ? (
          <ul className="mt-2">
            {recentEvents.map((pact: any) => (
              <li key={pact.id} className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-3 last:border-b-0">
                <Link href={`/pacts/${pact.id}`} className="min-w-0 text-[14px] leading-[1.4]">
                  <span className="font-semibold">{pact.creator_full_name || pact.creator_username || 'Someone'}</span> started a pact: {pact.title}
                </Link>
                <span className="shrink-0 text-[13px] text-[var(--muted)]">{new Date(pact.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] text-[var(--muted)]">No pacts here yet.</p>
        )}
      </section>

      {isMember && pacts.length > 0 && (
        <section className="mx-4 mt-[30px] space-y-4">
          <h2 className="px-2 text-[20px] font-bold tracking-[-0.025em]">Pacts in this circle</h2>
          {pacts.map((pact: any) => (
            <FeedPactCard
              key={pact.id}
              pact={pact}
              userVote={(pact as any).user_vote || (pact as any).userVote}
              onVote={handleSkipPact}
              detailHref={`/pacts/${pact.id}`}
              canUploadProof={isMember}
              canReport={pact.creator_id !== user?.id}
              showVoteActions={false}
              dismissOnVote={false}
            />
          ))}
        </section>
      )}

      {isMember && (
        <div className="mt-10 text-center"><button onClick={() => setLeaveModal(true)} className="h-11 px-4 text-[14px] text-[var(--muted)]">Leave circle</button></div>
      )}
    </div>
    {circle && qrOpen && <CircleQRFullView circle={circle} onClose={() => setQrOpen(false)} />} {circle && <InviteMembersModal isOpen={inviteModal} onClose={() => setInviteModal(false)} circleId={circle.id} circleName={circle.name} existingMemberIds={members.map((m: any) => m.user_id)} />}<ConfirmModal isOpen={leaveModal} onClose={() => setLeaveModal(false)} onConfirm={handleLeave} title="Leave circle?" description={`You'll lose access to ${circle.name}'s pacts until you rejoin.`} confirmLabel="Leave Circle" destructive loading={leaving} /></main>
}
