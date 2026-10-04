'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { circleService, circleJoinRequestService, circleAdvancedService, userService } from '@/services/api'
import { Circle, Pact } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Users, Camera, ChevronLeft, Share2, Bell } from 'lucide-react'
import { useSeedBackHistory } from '@/hooks/useSeedBackHistory'
import InviteMembersModal from '@/components/InviteMembersModal'
import ConfirmModal from '@/components/ConfirmModal'
import UserAvatarLink from '@/components/UserAvatarLink'
import LogoSpinner from '@/components/LogoSpinner'
import { CircleQRFullView } from '@/components/CircleQR'
import FeedPactCard from '@/components/FeedPactCard'
import { useSkipPact } from '@/hooks/usePactActions'
import Ring, { type RingMember } from '@/components/classic/Ring'
import StatLedger from '@/components/classic/StatLedger'

const PRIVACY_LABEL: Record<string, string> = {
  public: 'OPEN TO JOIN',
  open: 'OPEN TO JOIN',
  approval: 'APPROVAL REQUIRED',
  private: 'INVITE ONLY',
}

export default function CircleDetailPage() {
  const router = useRouter(); const params = useParams(); const { user, isInitialized } = useRequireAuth(); const circleId = Number(params.id)
  const [circle, setCircle] = useState<Circle | null>(null); const [members, setMembers] = useState<any[]>([]); const [pacts, setPacts] = useState<Pact[]>([]); const [loading, setLoading] = useState(true); const [isMember, setIsMember] = useState(false); const [qrOpen, setQrOpen] = useState(false); const [inviteModal, setInviteModal] = useState(false); const [leaveModal, setLeaveModal] = useState(false); const [leaving, setLeaving] = useState(false);   const [memberStats, setMemberStats] = useState<any[]>([]); const [uploadingPhoto, setUploadingPhoto] = useState(false); const [showAllMembers, setShowAllMembers] = useState(false)
  // Tracks which members were just nudged this session so the button can
  // flip to a disabled "Nudged" state and prevent an accidental double-send
  // — not persisted, so it resets on reload (there's no "already nudged
  // today" read endpoint yet to hydrate this from).
  const [nudgedIds, setNudgedIds] = useState<Set<number>>(new Set())
  // Grid layout (mockup): a handful of members shown up front with a "See
  // all" expand toggle, rather than the full roster always rendered flat.
  const MEMBER_PREVIEW_COUNT = 9
  const visibleMembers = showAllMembers ? members : members.slice(0, MEMBER_PREVIEW_COUNT)
  const skipMutation = useSkipPact()
  const handleSkipPact = async (pactId: number, _vote: 'skip') => { await skipMutation.mutateAsync(pactId) }
  useSeedBackHistory('/circles')
  useEffect(() => { if (!isInitialized) return; if (!user) { router.push('/auth/login'); return } (async () => { try { const [c, m, p] = await Promise.all([circleService.getById(circleId), circleJoinRequestService.listMembers(circleId), circleService.listPacts(circleId)]); setCircle(c.data); setMembers(m.data || []); setPacts(p.data || []); setIsMember(!!c.data?.is_member) } catch { toast.error('Failed to load circle'); router.push('/circles') } finally { setLoading(false) } })() }, [isInitialized, user, router, circleId])
  useEffect(() => { if (!members.length) { setMemberStats([]); return } Promise.allSettled(members.map(m => userService.getStats(m.user_id))).then(results => setMemberStats(results.map((r, i) => r.status === 'fulfilled' ? { ...members[i], ...(r.value.data || {}) } : null).filter(Boolean))) }, [members])
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
  // Same clipboard-with-fallback approach as FeedPactCard's share button —
  // and the same private-visibility heads-up, since a private circle's link
  // is only useful to people who already have access.
  const handleShare = async () => {
    const url = `${window.location.origin}/circles/${circleId}`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      if (circle?.visibility === 'private') {
        toast('Link copied — heads up, this circle is private so only people with access can open it', { icon: '🔒' })
      } else {
        toast.success('Invite link copied')
      }
    } catch {
      toast.error('Could not copy the link')
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
  const privacyLabel = PRIVACY_LABEL[privacyKey] || 'OPEN TO JOIN'
  // Ring seats: "active this week" per member isn't exposed by the member
  // list or stats endpoint yet (only a lifetime current_streak is), so
  // every seat renders unlit and the ring draws no arc — the honest
  // reading of "activity unavailable" rather than a guess. Swap the
  // `activeThisWeek: false` line below for the real field the moment it
  // ships; nothing else here needs to change.
  const ringMembers: RingMember[] = members.map((m: any) => ({
    userId: m.user_id,
    name: m.full_name || m.username || 'Member',
    avatarUrl: m.avatar_url,
    activeThisWeek: false,
  }))
  const activeThisWeekCount = ringMembers.filter(m => m.activeThisWeek).length
  const pactsKept = pacts.filter((p: any) => p.status === 'completed' || p.status === 'kept').length
  // Real pact-creation events only — there's no circle activity-feed
  // endpoint yet, so "member joined" / "pact kept" entries aren't shown
  // since there's no real timestamp or actor for them (see report).
  const ledgerEntries = [...pacts]
    .filter((p: any) => p.created_at)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)

  return <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
    <div className="flex items-center justify-between px-2 pt-3">
      <button type="button" onClick={() => router.push('/circles')} aria-label="Back to circles" className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)]">
        <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
      </button>
      <button type="button" onClick={() => void handleShare()} aria-label="Share circle" className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)]">
        <Share2 className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </div>

    <div className="mx-auto max-w-2xl px-6 pt-2">
      <div className="flex flex-col items-center gap-3 text-center">
        <Ring circleName={circle.name} members={ringMembers} totalMemberCount={circle.member_count ?? members.length} size="detail" coverPhotoUrl={(circle as any).photo_url} />
        {isOwner && (
          <label className="flex h-9 items-center gap-1.5 rounded-full border border-[var(--navy)] px-4 text-[13px] font-semibold text-[var(--navy)]" aria-label="Change circle cover photo">
            {uploadingPhoto ? <LogoSpinner size={12} color="var(--navy)" /> : <Camera className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />}
            Change cover
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
          </label>
        )}
        <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">EST. {new Date(circle.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase()}</p>
        <h1 className="text-balance font-serif text-[34px] font-medium leading-[1.1] text-[var(--ink)]">{circle.name}</h1>
        {circle.description && <p className="max-w-sm text-[14px] leading-[1.5] text-[var(--muted)]">{circle.description}</p>}
        <p className="font-mono text-[11px] tracking-[0.1em] text-[var(--muted)]">{privacyLabel}</p>
      </div>

      <StatLedger
        className="mt-6"
        stats={[
          { value: circle.member_count ?? members.length, label: 'members' },
          { value: activeThisWeekCount, label: 'showed proof this week' },
          { value: pacts.length === 0 ? null : pactsKept, label: pacts.length === 0 ? 'no pacts yet' : 'pacts kept' },
        ]}
      />

      <div className="mt-5 flex flex-col gap-2.5">
        {!isMember ? (
          <button onClick={handleJoin} className="flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--navy)] text-[16px] font-semibold text-[var(--card)]">Join circle</button>
        ) : (
          <>
            <button onClick={() => router.push(`/pacts/create?circleId=${circleId}`)} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--navy)] text-[16px] font-semibold text-[var(--card)]">
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              {pacts.length === 0 ? 'Make the first pact' : 'Make a pact'}
            </button>
            <button onClick={() => setInviteModal(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--navy)] text-[14px] font-semibold text-[var(--navy)]">
              <Users className="h-4 w-4" strokeWidth={1.8} />
              Invite someone
            </button>
          </>
        )}
      </div>

      <section className="mt-7">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Members</h2>
          {members.length > MEMBER_PREVIEW_COUNT && <button type="button" onClick={() => setShowAllMembers(v => !v)} className="text-[13px] font-semibold text-[var(--muted)]">{showAllMembers ? 'Show less' : 'See all'}</button>}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4 sm:grid-cols-6">{visibleMembers.map((member: any) => { const stat = memberStats.find(s => s.user_id === member.user_id); const isSelf = member.user_id === user.id; const isNudged = nudgedIds.has(member.user_id); return (
          <div key={member.user_id} className="flex flex-col items-center gap-1.5 text-center">
            <UserAvatarLink name={member.username} avatarUrl={member.avatar_url} username={member.username} size={40} />
            <p className="w-full truncate text-[11px] font-semibold text-[var(--ink)]">{member.full_name || member.username}</p>
            <p className="font-mono text-[10px] text-[var(--muted)]">{stat?.current_streak || 0}d streak</p>
            {isMember && !isSelf && (
              <button
                type="button"
                onClick={() => handleNudgeMember(member.user_id)}
                disabled={isNudged}
                aria-label={isNudged ? `Nudged ${member.full_name || member.username}` : `Nudge ${member.full_name || member.username}`}
                className="mt-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)] disabled:text-[var(--dash)]"
              >
                <Bell className="h-3 w-3" strokeWidth={1.7} />
                {isNudged ? 'Nudged' : 'Nudge'}
              </button>
            )}
          </div>
        ) })}</div>
      </section>

      <section className="mt-7 mb-[120px]">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">THE LEDGER</h2>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="mt-3 flex h-12 w-full items-center justify-between rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-4 text-[14px] font-medium text-[var(--ink)]"
        >
          Circle QR code
          <span className="font-mono text-[11px] text-[var(--muted)]">SHOW</span>
        </button>
        {!isMember ? (
          <p className="py-6 font-serif text-[14px] italic text-[var(--muted)]">Join this circle to view its pacts.</p>
        ) : ledgerEntries.length > 0 ? (
          <div className="mt-3 rounded-[6px] border border-[var(--hairline)] bg-[var(--card)]">
            {ledgerEntries.map((pact: any, i) => (
              <div key={pact.id} className="flex items-center justify-between px-4 py-3.5" style={i > 0 ? { borderTop: '1px solid var(--hairline-soft)' } : undefined}>
                <p className="text-[14px] text-[var(--ink)]">
                  <span className="font-semibold">{pact.creator_full_name || pact.creator_username || 'Someone'}</span> founded a pact · {pact.title}
                </p>
                <span className="shrink-0 pl-3 font-mono text-[11px] text-[var(--muted)]">{new Date(pact.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 font-serif text-[14px] italic text-[var(--muted)]">Nothing kept here yet. The first pact sets the tone.</p>
        )}
        {isMember && pacts.length > 0 && (
          <div className="mt-5 space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Pacts in this circle</h3>
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
          </div>
        )}
      </section>

      <div className="border-t border-[var(--hairline)] pt-4 text-center"><button onClick={() => setLeaveModal(true)} className="text-[14px] text-[var(--muted)]">Leave circle</button></div>
    </div>
    {circle && qrOpen && <CircleQRFullView circle={circle} onClose={() => setQrOpen(false)} />} {circle && <InviteMembersModal isOpen={inviteModal} onClose={() => setInviteModal(false)} circleId={circle.id} circleName={circle.name} existingMemberIds={members.map((m: any) => m.user_id)} />}<ConfirmModal isOpen={leaveModal} onClose={() => setLeaveModal(false)} onConfirm={handleLeave} title="Leave circle?" description={`You'll lose access to ${circle.name}'s pacts until you rejoin.`} confirmLabel="Leave Circle" destructive loading={leaving} /></main>
}
