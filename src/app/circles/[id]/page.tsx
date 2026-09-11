'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { circleService, circleJoinRequestService, circleAdvancedService, userService } from '@/services/api'
import { Circle, Pact } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Users, Camera, Sparkles, Share2, Bell } from 'lucide-react'
import DetailPageHeader from '@/components/DetailPageHeader'
import { useSeedBackHistory } from '@/hooks/useSeedBackHistory'
import InviteMembersModal from '@/components/InviteMembersModal'
import ConfirmModal from '@/components/ConfirmModal'
import UserAvatarLink from '@/components/UserAvatarLink'
import LogoSpinner from '@/components/LogoSpinner'
import { CircleQRTeaser, CircleQRFullView, CircleQRQuietLine } from '@/components/CircleQR'
import FeedPactCard from '@/components/FeedPactCard'
import { useSkipPact } from '@/hooks/usePactActions'

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
  if (!isInitialized || loading) return <><DetailPageHeader title="Loading circle…" fallbackHref="/circles" maxWidthClassName="max-w-4xl" /><div className="flex min-h-screen items-center justify-center bg-[var(--pact-bg)]"><LogoSpinner size={32} color="var(--pact-violet)" /></div></>
  if (!user) return null
  // Real not-found state instead of a blank screen — reachable when the load
  // effect's catch block hasn't redirected away yet (or a future change stops
  // redirecting), matching the Pact detail page's "not found" pattern.
  if (!circle) return <><DetailPageHeader title="Circle not found" backHref="/circles" maxWidthClassName="max-w-4xl" /><div className="flex min-h-screen items-center justify-center bg-[var(--pact-bg)] px-5 text-center text-[var(--pact-text)]"><div><p className="text-lg font-bold">Circle not found</p><p className="mt-2 text-sm text-[var(--pact-text-muted)]">This circle could not be loaded or is no longer available.</p></div></div></>
  const activeMembers = memberStats.filter(m => Number(m.current_streak) > 0).length; const activeStreaks = memberStats.filter(m => Number(m.current_streak) > 0).map(m => Number(m.current_streak)); const groupStreak = activeStreaks.length ? Math.min(...activeStreaks) : 0
  // A circle is "new" (nothing to show yet) once it has real activity in
  // either dimension — an extra member OR a pact — so the full layout
  // takes over the moment there's something worth showing, rather than
  // waiting for both conditions to be true.
  const isNewCircle = members.length <= 1 && pacts.length === 0
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
  return <main className="min-h-screen bg-[var(--pact-bg)] pb-24 text-[var(--pact-text)]"><DetailPageHeader title={circle.name || 'Circle'} fallbackHref="/circles" maxWidthClassName="max-w-4xl" /><div className="mx-auto max-w-4xl px-5 pb-12 pt-8">
    <header className="border-b border-[var(--pact-hairline)] pb-8">
      {/* Photo-forward cover, always a full-width banner — either the
          circle's real photo_url, or (when there is none) a gradient banner
          using the same violet/pink pair used elsewhere in the app, so a
          circle without an uploaded photo still gets the banner structure
          the approved layout calls for rather than falling back to a tiny
          64px chip. The icon/emoji/initial and the owner-gated "change
          cover" affordance sit on top of either background the same way. */}
      <div className="relative mb-5 aspect-[16/9] w-full overflow-hidden rounded-[28px]">
        {(circle as any).photo_url ? (
          <Image src={(circle as any).photo_url} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,var(--pact-pink),var(--pact-violet))' }} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-5 bottom-4 flex items-end gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/80 bg-black/20 text-2xl backdrop-blur-sm">
            {(circle as any).icon_emoji || (circle as any).emoji || circle.name?.charAt(0)}
          </div>
          <div className="min-w-0 pb-0.5">
            <h1 className="truncate text-2xl font-black tracking-[-0.04em] text-white">{circle.name}</h1>
            <p className="mt-0.5 text-xs font-semibold text-white/80">{circle.member_count ?? members.length} member{(circle.member_count ?? members.length) === 1 ? '' : 's'} · Active since {new Date(circle.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        {isOwner && (
          <label className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm" style={{ background: 'rgba(16,24,40,0.45)', border: '1px solid rgba(255,255,255,0.25)' }} aria-label="Change circle cover photo">
            {uploadingPhoto ? <LogoSpinner size={12} color="#fff" /> : <Camera className="h-3.5 w-3.5" aria-hidden="true" />}
            Change cover
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
          </label>
        )}
      </div>
      {/* Italicized — a bio-style tagline in the circle's own voice, not
      another metadata fact like the stats line below it. */}
      <p className="max-w-xl text-sm italic leading-relaxed text-[var(--pact-text-muted)]">{circle.description || 'A place to show up for each other.'}</p>
      <p className="mt-4 text-sm text-[var(--pact-text-muted)]">Started {new Date(circle.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · {pacts.length} pacts made together</p><p className="mt-3 text-sm text-[var(--pact-text)]">{circle.member_count ?? members.length} people · {activeMembers} active this week · {groupStreak}d group streak</p>
    </header>
    {isNewCircle ? <>
      {/* New/empty-circle state: one hero CTA instead of the full widget
          stack — nothing else on this page has content yet, so showing
          six mostly-empty sections would bury the two actions that
          actually move a new circle forward. */}
      <section className="rounded-3xl border border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] px-6 py-10 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-[var(--pact-violet)]" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-black tracking-[-0.03em]">Let&apos;s get this circle moving</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--pact-text-muted)]">Invite a few people or start your first pact together — this is where it all begins.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => setInviteModal(true)} className="rounded-full bg-[var(--pact-violet)] px-6 py-3 text-sm font-bold text-white">Invite members</button>
          {isMember && <button onClick={() => router.push(`/pacts/create?circleId=${circleId}`)} className="rounded-full border border-[var(--pact-hairline)] px-6 py-3 text-sm font-bold text-[var(--pact-text)]">Create a pact</button>}
        </div>
      </section>
      <div className="mt-6"><CircleQRQuietLine circle={circle} onOpen={() => setQrOpen(true)} /></div>
      {members.length === 1 && <p className="mt-6 text-sm text-[var(--pact-text-muted)]">Just {members[0]?.full_name || members[0]?.username || 'you'} for now.</p>}
      {/* Leave stays available, but de-emphasized to a small footer link —
          it's a rare, destructive action and shouldn't sit at equal visual
          weight next to the constructive CTAs above. */}
      <div className="mt-10 border-t border-[var(--pact-hairline)] pt-4 text-center"><button onClick={() => setLeaveModal(true)} className="text-xs text-[var(--pact-text-faint)] underline underline-offset-2">Leave circle</button></div>
    </> : <>
      <CircleQRTeaser circle={circle} onOpen={() => setQrOpen(true)} />
      {/* Was "Showing up lately" — misleading since it's just the static
          member roster with each person's streak next to their name, and
          several legitimately show "0d" (no current streak), which directly
          contradicted a header implying recent activity. */}
      <section className="border-b border-[var(--pact-hairline)] py-8">
        <div className="flex items-baseline justify-between"><h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--pact-violet)]">Members</h2>{members.length > MEMBER_PREVIEW_COUNT && <button type="button" onClick={() => setShowAllMembers(v => !v)} className="text-xs font-semibold text-[var(--pact-text-muted)]">{showAllMembers ? 'Show less' : 'See all'}</button>}</div>
        <div className="mt-5 grid grid-cols-4 gap-4 sm:grid-cols-6">{visibleMembers.map((member: any) => { const stat = memberStats.find(s => s.user_id === member.user_id); const isSelf = member.user_id === user.id; const isNudged = nudgedIds.has(member.user_id); return (
          <div key={member.user_id} className="flex flex-col items-center gap-1.5 text-center">
            <UserAvatarLink name={member.username} avatarUrl={member.avatar_url} username={member.username} size={40} />
            <p className="w-full truncate text-[11px] font-semibold text-[var(--pact-text)]">{member.full_name || member.username}</p>
            <p className="text-[10px] font-semibold text-[var(--pact-violet)]">{stat?.current_streak || 0}d</p>
            {/* Nudge: only meaningful for other members, and only once you're
                a circle member yourself (mirrors the "Create pact"/"Invite
                members" actions below, which are also isMember-gated). */}
            {isMember && !isSelf && (
              <button
                type="button"
                onClick={() => handleNudgeMember(member.user_id)}
                disabled={isNudged}
                aria-label={isNudged ? `Nudged ${member.full_name || member.username}` : `Nudge ${member.full_name || member.username}`}
                className="mt-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--pact-text-muted)] transition-colors disabled:text-[var(--pact-text-faint)] enabled:hover:bg-[var(--pact-violet)]/10 enabled:hover:text-[var(--pact-violet)] enabled:active:scale-95"
              >
                <Bell className="h-3 w-3" />
                {isNudged ? 'Nudged' : 'Nudge'}
              </button>
            )}
          </div>
        ) })}</div>
      </section>
      <div className="flex flex-wrap items-center gap-5 border-b border-[var(--pact-hairline)] py-5 text-sm">{isMember && <><button onClick={() => router.push(`/pacts/create?circleId=${circleId}`)} className="flex items-center gap-2 font-bold text-[var(--pact-violet)]"><Plus className="h-4 w-4" />Create pact</button><button onClick={() => setInviteModal(true)} className="flex items-center gap-2 text-[var(--pact-text-muted)]"><Users className="h-4 w-4" />Invite members</button></>}{!isMember && <button onClick={handleJoin} className="font-bold text-[var(--pact-violet)]">Join circle</button>}<button onClick={() => void handleShare()} className="flex items-center gap-2 text-[var(--pact-text-muted)]"><Share2 className="h-4 w-4" />Share</button><button onClick={() => setLeaveModal(true)} className="text-[var(--pact-text-faint)]">Leave</button></div>
      <section className="pt-8"><h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--pact-violet)]">Pacts in this circle</h2>{!isMember ? <p className="py-8 text-sm text-[var(--pact-text-muted)]">Join this circle to view its pacts.</p> : pacts.length ? (
        // Same photo-forward FeedPactCard used on the main feed and the
        // single-pact detail page — not a simplified duplicate — so a
        // circle's pacts get the same proof gallery, creator chip, and
        // progress ring treatment everywhere they appear.
        <div className="mt-4 space-y-4">{pacts.map((pact: any) => (
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
        ))}</div>
      ) : <p className="py-8 text-sm text-[var(--pact-text-muted)]">No pacts in this circle yet.</p>}</section>
    </>}
  </div>{circle && qrOpen && <CircleQRFullView circle={circle} onClose={() => setQrOpen(false)} />} {circle && <InviteMembersModal isOpen={inviteModal} onClose={() => setInviteModal(false)} circleId={circle.id} circleName={circle.name} existingMemberIds={members.map((m: any) => m.user_id)} />}<ConfirmModal isOpen={leaveModal} onClose={() => setLeaveModal(false)} onConfirm={handleLeave} title="Leave circle?" description={`You'll lose access to ${circle.name}'s pacts until you rejoin.`} confirmLabel="Leave Circle" destructive loading={leaving} /></main>
}
