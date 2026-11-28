'use client'

import { useSyncExternalStore } from 'react'

/**
 * Moments you just posted, kept on this phone until the server's lists include them.
 *
 * After a post the feed and the pact page are refetched, but the server can take a while
 * before a new photo shows up in a pact's recent photos, so the card kept showing the old
 * one, even after a refresh. Like Instagram, your own post appears at once: the card and the
 * pact page put these in front of the server's photos and drop each one as soon as the
 * server sends it back (or after a while, in case it never does).
 */
export type PendingMoment = {
  /** The proof id the server gave the new moment. */
  id: number
  pactId: number
  /** A local blob: URL of what was posted, so it shows without downloading. */
  url: string
  type: 'image' | 'video'
  uploadedAt: string
  uploader: string | null
  uploaderName: string | null
}

const KEEP_MS = 1000 * 60 * 30
let pending: PendingMoment[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function prune() {
  const cutoff = Date.now() - KEEP_MS
  const kept = pending.filter((moment) => Date.parse(moment.uploadedAt) > cutoff)
  if (kept.length !== pending.length) pending = kept
}

export function addPendingMoment(moment: PendingMoment) {
  prune()
  pending = [moment, ...pending.filter((m) => m.id !== moment.id)]
  emit()
}

/** The server now has these ids: stop showing the local copies. */
export function settlePendingMoments(pactId: number, serverIds: Iterable<number>) {
  const ids = new Set(serverIds)
  const next = pending.filter((moment) => moment.pactId !== pactId || !ids.has(moment.id))
  if (next.length !== pending.length) {
    pending = next
    emit()
  }
}

export function removePendingMoment(id: number) {
  const next = pending.filter((moment) => moment.id !== id)
  if (next.length !== pending.length) {
    pending = next
    emit()
  }
}

const EMPTY: PendingMoment[] = []
let snapshot: { source: PendingMoment[]; byPact: Map<number, PendingMoment[]> } | null = null

function byPact() {
  if (!snapshot || snapshot.source !== pending) {
    const map = new Map<number, PendingMoment[]>()
    pending.forEach((moment) => map.set(moment.pactId, [...(map.get(moment.pactId) ?? []), moment]))
    snapshot = { source: pending, byPact: map }
  }
  return snapshot.byPact
}

/** This pact's moments that the server hasn't sent back yet, newest first. */
export function usePendingMoments(pactId: number): PendingMoment[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => byPact().get(pactId) ?? EMPTY,
    () => EMPTY,
  )
}
