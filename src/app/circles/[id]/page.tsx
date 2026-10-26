'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { loginHrefForHere } from '@/lib/authNext'
import { useRouter, useParams } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { circleService, circleJoinRequestService, circleAdvancedService, pactService } from '@/services/api'
import { Circle, Pact } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Plus, Camera, ChevronLeft, Share2, Lock, Pencil, UserPlus, X } from 'lucide-react'
import { useSeedBackHistory } from '@/hooks/useSeedBackHistory'
import { useSmartBack } from '@/hooks/useSmartBack'
import InviteMembersModal from '@/components/InviteMembersModal'
import ConfirmModal from '@/components/ConfirmModal'
import LogoSpinner from '@/components/LogoSpinner'
import { CircleInviteQRSheet } from '@/components/CircleInviteQR'
import FeedPactCard from '@/components/FeedPactCard'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import OrbitRing from '@/components/circles/OrbitRing'
import Seat from '@/components/classic/Seat'

const PRIVACY_LABEL: Record<string, string> = {
  public: 'Anyone can join',
  open: 'Anyone can join',
  approval: 'Ask to join',
  private: 'Private · ask to join',
}

export default function CircleDetailPage() {
  const router = useRouter(); const params = useParams(); const { user, isInitialized } = useRequireAuth(); const circleId = Number(params.id)
  const [circle, setCircle] = useState<Circle | null>(null); const [members, setMembers] = useState<any[]>([]); const [pacts, setPacts] = useState<Pact[]>([]); const [loading, setLoading] = useState(true); const [isMember, setIsMember] = useState(false); const [qrOpen, setQrOpen] = useState(false); const [inviteModal, setInviteModal] = useState(false); const [leaveModal, setLeaveModal] = useState(false); const [leaving, setLeaving] = useState(false); const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const queryClient = useQueryClient(); const [deleteModal, setDeleteModal] = useState(false); const [deletingCircle, setDeletingCircle] = useState(false)
  const [requested, setRequested] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null)
  // Tracks which members were just nudged this session so the button can
  // flip to a disabled "Nudged" state and prevent an accidental double-send
  // — not persisted, so it resets on reload (there's no "already nudged
  // today" read endpoint yet to hydrate this from).
  const [nudgedIds, setNudgedIds] = useState<Set<number>>(new Set())
  const [capturePact, setCapturePact] = useState<any | null>(null)
  // Grid layout (mockup): a handful of members shown up front with a "See
  // all" expand toggle, rather than the full roster always rendered flat.
  useSeedBackHistory('/circles')
  const smartBack = useSmartBack('/circles')
  useEffect(() => { if (!isInitialized) return; if (!user) { router.push(loginHrefForHere()); return } (async () => { try { const c = await circleService.getById(circleId); setCircle(c.data); setIsMember(!!c.data?.is_member); setRequested(c.data?.my_join_request === 'pending'); const [m, p] = await Promise.allSettled([circleJoinRequestService.listMembers(circleId), circleService.listPacts(circleId)]); setMembers(m.status === 'fulfilled' ? m.value.data || [] : []); setPacts(p.status === 'fulfilled' ? p.value.data || [] : []) } catch { toast.error('Failed to load circle'); router.push('/circles') } finally { setLoading(false) } })() }, [isInitialized, user, router, circleId])
  if (!isInitialized || loading) return <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]"><LogoSpinner size={32} color="var(--navy)" /></div>
  if (!user) return null
  // Real not-found state instead of a blank screen — reachable when the load
  // effect's catch block hasn't redirected away yet (or a future change stops
  // redirecting), matching the Pact detail page's "not found" pattern.
  if (!circle) return <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-5 text-center text-[var(--ink)]"><div><p className="font-serif text-lg">Circle not found</p><p className="mt-2 text-[13px] text-[var(--muted)]">This circle could not be loaded or is no longer available.</p><button type="button" onClick={() => router.push('/circles')} className="mt-4 h-11 rounded-full bg-[var(--navy)] px-6 text-[14px] font-semibold text-[var(--card)]">Back to circles</button></div></div>
  const isPrivateCircle = ((circle as any)?.visibility || 'public') === 'private'
  const reloadAfterJoin = async () => { const [m, p] = await Promise.allSettled([circleJoinRequestService.listMembers(circleId), circleService.listPacts(circleId)]); if (m.status === 'fulfilled') setMembers(m.value.data || []); if (p.status === 'fulfilled') setPacts(p.value.data || []) }
  const handleJoin = async () => {
    if (isPrivateCircle) {
      try { await circleJoinRequestService.sendRequest(circleId); setRequested(true); toast.success(`Asked to join. ${(circle as any)?.owner_username ? '@' + (circle as any).owner_username : 'The owner'} decides.`) } catch (error: any) { toast.error(error?.response?.data?.detail || 'Could not send your request') }
      return
    }
    try { await circleService.join(circleId); setIsMember(true); await reloadAfterJoin(); toast.success('Joined circle') } catch (error: any) { toast.error(error?.response?.data?.detail || 'Failed to join circle') }
  }
  const togglePrivacy = async () => {
    if (!circle || savingPrivacy) return
    const next = isPrivateCircle ? 'public' : 'private'
    setSavingPrivacy(true)
    try { const res = await circleService.setVisibility(circleId, next); setCircle(prev => prev ? { ...prev, ...res.data } as any : prev); toast.success(next === 'private' ? 'Circle is private. Everyone in it stays.' : 'Anyone can join again') } catch { toast.error('Could not change that') } finally { setSavingPrivacy(false) }
  }
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
  // Owner only. The server moves the circle's pacts out of it (they stay with their creators).
  const handleDeleteCircle = async () => {
    setDeletingCircle(true)
    try {
      await circleService.remove(circleId)
      queryClient.removeQueries({ queryKey: queryKeys.circles.detail(circleId) })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.circles.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pacts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all }),
        queryClient.invalidateQueries({ queryKey: ['my-pacts'] }),
      ])
      toast.success('Circle deleted')
      router.replace('/circles')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Couldn't delete this circle. Try again.")
      setDeletingCircle(false)
      setDeleteModal(false)
    }
  }
  const handleLeave = async () => { setLeaving(true); try { await circleService.leave(circleId); router.push('/circles') } finally { setLeaving(false); setLeaveModal(false) } }
  const joinPactForCapture = async (pact: any) => {
    if (!pact?.can_join) return false
    try {
      await pactService.join(Number(pact.id))
      const refreshed = await circleService.listPacts(circleId)
      const nextPacts = refreshed.data || []
      setPacts(nextPacts)
      setCapturePact((current: any) => current ? (nextPacts.find((item: any) => Number(item.id) === Number(current.id)) || { ...current, is_joined_by_me: true, can_join: false, join_block_reason: 'already_joined' }) : current)
      return true
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not join this pact')
      return false
    }
  }
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
  const showedUp = members.filter((m: any) => m.sent_proof_this_week === true)
  const notYet = members.filter((m: any) => m.sent_proof_this_week !== true)
  const ringMembers = [
    ...members.filter((m: any) => m.user_id === user.id),
    ...showedUp.filter((m: any) => m.user_id !== user.id),
    ...notYet.filter((m: any) => m.user_id !== user.id),
  ].map((m: any) => ({ ...m, is_you: m.user_id === user.id }))
  const nudgeable = notYet.filter((m: any) => m.user_id !== user.id && !nudgedIds.has(m.user_id))
  const nudgeAll = async () => {
    for (const member of nudgeable) await handleNudgeMember(member.user_id)
  }
  const saveDetails = async () => {
    const name = draftName.trim()
    if (!name) return
    setSavingDetails(true)
    try {
      const res = await circleService.updateDetails(circleId, { name, description: draftDescription })
      setCircle((prev) => (prev ? ({ ...prev, ...res.data } as any) : prev))
      setEditing(false)
      toast.success('Saved')
    } catch {
      toast.error('Could not save that')
    } finally {
      setSavingDetails(false)
    }
  }
  const removeMember = async (memberId: number) => {
    try {
      await circleAdvancedService.removeMember(circleId, memberId)
      setMembers((prev) => prev.filter((m: any) => m.user_id !== memberId))
      setCircle((prev) => (prev ? ({ ...prev, member_count: Math.max(1, Number((prev as any).member_count || 1) - 1) } as any) : prev))
      toast.success('Removed from the circle')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not remove them')
    } finally {
      setConfirmRemove(null)
    }
  }

  const memberRow = (member: any, showNudge: boolean) => {
    const isSelf = member.user_id === user.id
    const isNudged = nudgedIds.has(member.user_id)
    const displayName = member.full_name || member.username
    const lit = member.sent_proof_this_week === true
    return (
      <li key={member.user_id} className="flex items-center gap-3 py-2.5">
        <Link href={`/profile/${member.username}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Seat name={displayName} avatarUrl={member.avatar_url} size={40} lit={lit} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold" style={{ color: '#17181D' }}>
              {displayName}
              {isSelf ? ' (you)' : ''}
              {member.role === 'owner' ? <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold" style={{ background: '#F4EFE4', color: '#5A5C63' }}>Owner</span> : null}
            </span>
            <span className="block text-[12.5px]" style={{ color: '#5A5C63' }}>
              {lit && member.last_proof_at ? `Posted ${new Date(member.last_proof_at).toLocaleDateString(undefined, { weekday: 'short' })}` : lit ? 'Posted this week' : 'Nothing this week'}
            </span>
          </span>
        </Link>
        {isOwner && !isSelf && member.role !== 'owner' && (
          confirmRemove === member.user_id ? (
            <button type="button" onClick={() => void removeMember(member.user_id)} className="h-9 rounded-full px-3 text-[12.5px] font-extrabold" style={{ background: '#A23B2A', color: '#FFFFFF' }}>
              Remove?
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmRemove(member.user_id)} aria-label={`Remove ${displayName}`} className="flex size-9 items-center justify-center rounded-full" style={{ color: '#5A5C63' }}>
              <X className="size-4" />
            </button>
          )
        )}
        {showNudge && isMember && !isSelf && (
          <button
            type="button"
            onClick={() => void handleNudgeMember(member.user_id)}
            disabled={isNudged}
            aria-label={isNudged ? `Nudged ${displayName}` : `Nudge ${displayName}`}
            className="h-9 rounded-full px-3.5 text-[13px] font-extrabold disabled:font-semibold"
            style={isNudged ? { color: '#5A5C63' } : { background: '#E8ECF7', color: '#1F3A93' }}
          >
            {isNudged ? 'Nudged' : 'Nudge'}
          </button>
        )}
      </li>
    )
  }

  return <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
    <div className="mx-auto flex max-w-2xl items-center justify-between px-2 pt-3">
      <button type="button" onClick={smartBack} aria-label="Go back" className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)]">
        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
      </button>
      <button type="button" onClick={() => setQrOpen(true)} aria-label="Share Circle QR" className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)]">
        <Share2 className="h-5 w-5" strokeWidth={1.9} />
      </button>
    </div>

    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center px-6 text-center">
        <OrbitRing
          name={circle.name}
          photoUrl={(circle as any).photo_url}
          members={ringMembers}
          total={memberCount}
          active={showedUp.length}
          size={208}
          duration="70s"
          center={isOwner ? (
            <label className="absolute flex size-10 cursor-pointer items-center justify-center rounded-full" style={{ right: 58, bottom: 58, background: '#FFFFFF', color: '#17181D', boxShadow: '0 4px 12px -4px rgba(23,24,29,0.4)' }} aria-label="Change circle photo">
              {uploadingPhoto ? <LogoSpinner size={12} color="var(--navy)" /> : <Camera className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
            </label>
          ) : null}
        />
        <h1 className="mt-3 text-balance text-[32px] font-extrabold leading-none tracking-[-0.04em]" style={{ color: '#17181D' }}>
          {circle.name}
          {isPrivateCircle && <Lock className="ml-2 inline size-5 align-[-2px]" strokeWidth={2.4} style={{ color: '#5A5C63' }} aria-label="Private circle" />}
        </h1>
        {circle.description && <p className="mt-2 max-w-[320px] text-[15px] leading-[1.45]" style={{ color: '#5A5C63' }}>{circle.description}</p>}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <span className="rounded-full px-3 py-1 text-[12.5px] font-extrabold" style={showedUp.length ? { background: '#E8ECF7', color: '#1F3A93' } : { background: '#ECE6D8', color: '#5A5C63' }}>
            {showedUp.length ? `${showedUp.length} of ${memberCount} showed up this week` : 'Quiet this week'}
          </span>
          <span className="rounded-full px-3 py-1 text-[12.5px] font-bold" style={{ background: '#FBF8F1', border: '1px solid #DCD3C1', color: '#17181D' }}>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="rounded-full px-3 py-1 text-[12.5px] font-bold" style={{ background: '#FBF8F1', border: '1px solid #DCD3C1', color: '#17181D' }}>
            {privacyLabel}
          </span>
        </div>
        {startedLabel && <p className="mt-2 text-[12.5px]" style={{ color: '#5A5C63' }}>Started {startedLabel}{(circle as any).owner_username ? ` by @${(circle as any).owner_username}` : ''}</p>}
      </div>

      <div className="mx-4 mt-5 flex gap-2.5">
        {!isMember ? (
          requested ? (
            <div className="flex h-[52px] w-full items-center justify-center rounded-full border-[1.5px] border-[var(--line)] text-[15px] font-semibold text-[var(--muted)]">Requested · waiting for the owner</div>
          ) : (
            <button onClick={handleJoin} className="flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--navy)] text-[16px] font-extrabold text-white transition hover:bg-[var(--navy-hover)]">{isPrivateCircle ? 'Ask to Join' : 'Join Circle'}</button>
          )
        ) : (
          <>
            <button onClick={() => router.push(`/pacts/create?circleId=${circleId}`)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--navy)] text-[15px] font-extrabold text-white">
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              {pacts.length === 0 ? 'First Pact' : 'New Pact'}
            </button>
            <button onClick={() => setInviteModal(true)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] text-[15px] font-extrabold text-[var(--navy)]">
              <UserPlus className="h-4 w-4" strokeWidth={2.2} />
              Invite
            </button>
          </>
        )}
      </div>

      <section className="mx-4 mt-8">
        <h2 className="px-1 text-[20px] font-extrabold tracking-[-0.025em]" style={{ color: '#17181D' }}>Pacts{pacts.length ? ` · ${pacts.length}` : ''}</h2>
        <div className="mt-3 flex flex-col gap-3.5">
          {!isMember && (isPrivateCircle || pacts.length === 0) ? (
            <p className="px-1 text-[14px] text-[var(--muted)]">{isPrivateCircle ? 'Members only. Ask to join to see its pacts.' : 'Join this circle to see its pacts.'}</p>
          ) : pacts.length === 0 ? (
            <p className="px-1 text-[14px] text-[var(--muted)]">No pacts here yet. Start the first one.</p>
          ) : (
            pacts.map((pact: any) => {
              const mine = Boolean(pact.is_joined_by_me || pact.creator_id === user.id)
              return (
                <div key={pact.id} className="-mx-4">
                  <FeedPactCard pact={pact} onAddMoment={mine ? () => setCapturePact(pact) : undefined} />
                </div>
              )
            })
          )}
        </div>
      </section>

      {(isMember || !isPrivateCircle) && members.length > 0 && (
        <section className="mx-4 mt-8 rounded-[24px] px-4 pb-2 pt-4" style={{ background: '#FFFFFF', border: '1px solid #DCD3C1' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-extrabold" style={{ color: '#17181D' }}>Showed Up This Week · {showedUp.length}</h2>
          </div>
          {showedUp.length === 0 ? (
            <p className="py-3 text-[13.5px]" style={{ color: '#5A5C63' }}>Nobody yet. Post today and be the first.</p>
          ) : (
            <ul>{showedUp.map((m: any) => memberRow(m, false))}</ul>
          )}
          <div className="mt-2 flex items-center justify-between border-t pt-4" style={{ borderColor: '#ECE6D8' }}>
            <h2 className="text-[17px] font-extrabold" style={{ color: '#17181D' }}>Not Yet · {notYet.length}</h2>
            {isMember && nudgeable.length > 1 && (
              <button type="button" onClick={() => void nudgeAll()} className="h-9 rounded-full px-3.5 text-[13px] font-extrabold" style={{ background: '#1F3A93', color: '#FFFFFF' }}>
                Nudge all {nudgeable.length}
              </button>
            )}
          </div>
          {notYet.length === 0 ? (
            <p className="py-3 text-[13.5px]" style={{ color: '#22663F' }}>Everyone showed up this week.</p>
          ) : (
            <ul>{notYet.map((m: any) => memberRow(m, true))}</ul>
          )}
        </section>
      )}

      {isOwner && (
        <section className="mx-4 mt-6 rounded-[24px] p-4" style={{ background: '#FBF8F1', border: '1px solid #DCD3C1' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-extrabold" style={{ color: '#17181D' }}>Circle Settings</h2>
            {!editing && (
              <button type="button" onClick={() => { setDraftName(circle.name || ''); setDraftDescription(circle.description || ''); setEditing(true) }} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-extrabold" style={{ color: '#1F3A93', border: '1.5px solid #1F3A93' }}>
                <Pencil className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                Edit
              </button>
            )}
          </div>
          {editing && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="text-[12px] font-extrabold tracking-[0.06em]" style={{ color: '#5A5C63' }}>
                NAME
                <input value={draftName} onChange={(e) => setDraftName(e.target.value.slice(0, 120))} className="mt-1 h-11 w-full rounded-[14px] border bg-white px-3.5 text-[15px] font-semibold tracking-normal outline-none" style={{ borderColor: '#DCD3C1', color: '#17181D' }} />
              </label>
              <label className="text-[12px] font-extrabold tracking-[0.06em]" style={{ color: '#5A5C63' }}>
                WHAT IT&apos;S FOR
                <input value={draftDescription} onChange={(e) => setDraftDescription(e.target.value.slice(0, 280))} placeholder="Chasing fitness goals together" className="mt-1 h-11 w-full rounded-[14px] border bg-white px-3.5 text-[15px] font-normal tracking-normal outline-none" style={{ borderColor: '#DCD3C1', color: '#17181D' }} />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(false)} className="h-11 flex-1 rounded-full text-[14px] font-bold" style={{ border: '1px solid #DCD3C1', color: '#17181D' }}>Cancel</button>
                <button type="button" onClick={() => void saveDetails()} disabled={savingDetails || !draftName.trim()} className="h-11 flex-1 rounded-full text-[14px] font-extrabold disabled:opacity-60" style={{ background: '#1F3A93', color: '#FFFFFF' }}>{savingDetails ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-white p-3.5" style={{ border: '1px solid #DCD3C1' }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: isPrivateCircle ? '#1F3A93' : '#EFEBE1', color: isPrivateCircle ? '#FFFFFF' : '#17181D' }}>
              <Lock className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[15px] font-bold" style={{ color: '#17181D' }}>Private Circle</span>
              <span className="block text-[12.5px] leading-snug" style={{ color: '#5A5C63' }}>{isPrivateCircle ? 'People ask to join and you approve.' : 'Anyone can join. Turn on to approve each person; everyone already in stays.'}</span>
            </span>
            <button type="button" role="switch" aria-checked={isPrivateCircle} aria-label="Private circle" onClick={() => void togglePrivacy()} disabled={savingPrivacy} className="relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:opacity-60" style={{ background: isPrivateCircle ? '#1F3A93' : '#D4D5D9' }}>
              <span className="absolute top-1 h-6 w-6 rounded-full bg-white transition-all" style={{ left: isPrivateCircle ? 24 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          {isPrivateCircle && (
            <button type="button" onClick={() => router.push('/requests')} className="mt-2 flex h-11 w-full items-center justify-center rounded-full text-[14px] font-extrabold text-[var(--navy)]">See Join Requests</button>
          )}
          <p className="mt-2 text-[12.5px]" style={{ color: '#5A5C63' }}>To remove someone, tap the × next to them in the members list.</p>
        </section>
      )}

      {isMember && !isOwner && (
        <div className="mt-10 text-center"><button onClick={() => setLeaveModal(true)} className="h-11 px-4 text-[14px] text-[var(--muted)]">Leave circle</button></div>
      )}
      {isOwner && (
        <div className="mt-10 text-center">
          <button onClick={() => setDeleteModal(true)} className="h-11 px-4 text-[14px] font-semibold" style={{ color: '#B3261E' }}>Delete circle</button>
          <ConfirmModal isOpen={deleteModal} onClose={() => (deletingCircle ? undefined : setDeleteModal(false))} onConfirm={handleDeleteCircle} title="Delete this circle?" description={`${circle.name} will be removed for everyone in it${(circle as any).member_count > 1 ? ` (${(circle as any).member_count} members, who'll be told)` : ''}. Pacts made here stay with the people who made them and become private. This can't be undone.`} confirmLabel="Delete circle" destructive loading={deletingCircle} />
        </div>
      )}
    </div>
    {capturePact && (
      <StoryCaptureSheet
        isOpen
        onClose={() => setCapturePact(null)}
        pactId={Number(capturePact.id)}
        pactTitle={capturePact.title}
        canJoin={Boolean(capturePact.can_join)}
        onJoin={() => joinPactForCapture(capturePact)}
      />
    )}
    {circle && qrOpen && <CircleInviteQRSheet circle={circle} onClose={() => setQrOpen(false)} />} {circle && <InviteMembersModal isOpen={inviteModal} onClose={() => setInviteModal(false)} circleId={circle.id} circleName={circle.name} existingMemberIds={members.map((m: any) => m.user_id)} isPrivate={isPrivateCircle} />}<ConfirmModal isOpen={leaveModal} onClose={() => setLeaveModal(false)} onConfirm={handleLeave} title="Leave circle?" description={`You'll lose access to ${circle.name}'s pacts until you rejoin.`} confirmLabel="Leave Circle" destructive loading={leaving} /></main>
}
