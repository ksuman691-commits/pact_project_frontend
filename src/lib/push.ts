'use client'

import { pushService } from '@/services/api'

/**
 * Standard Web Push for check-in reminders (no Firebase). The server hands
 * out its public key; this device subscribes with it and sends the
 * subscription back, along with its time zone so reminders land at the
 * right local hour.
 */

export type PushSupport = 'supported' | 'unsupported' | 'needs-install'

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported'
  const hasApis = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (hasApis) return 'supported'
  // iPhone Safari only allows push once CirclePact is added to the Home Screen.
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return ios ? 'needs-install' : 'unsupported'
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

function keyToBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing && existing.active?.scriptURL.endsWith('/sw.js')) return existing
  await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  return navigator.serviceWorker.ready
}

function timezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  } catch {
    return 'Asia/Kolkata'
  }
}

async function sendToServer(subscription: PushSubscription) {
  const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  return pushService.subscribe({ subscription: { endpoint: json.endpoint, keys: json.keys }, timezone: timezone(), user_agent: navigator.userAgent.slice(0, 255) })
}

export class PushNotReadyError extends Error {}

/** Ask for permission (if needed), subscribe this device and register it. True when it worked. */
export async function enablePushOnThisDevice(): Promise<boolean> {
  if (pushSupport() !== 'supported') return false
  const { data } = await pushService.vapidKey()
  if (!data?.public_key) throw new PushNotReadyError('Reminders are not switched on on the server yet.')
  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
  if (permission !== 'granted') return false
  const reg = await registration()
  let subscription = await reg.pushManager.getSubscription()
  const wanted = keyToBytes(data.public_key)
  // A subscription made with a different server key can't be used; replace it.
  const current = subscription?.options?.applicationServerKey
  if (subscription && current && new Uint8Array(current as ArrayBuffer).toString() !== wanted.toString()) {
    await subscription.unsubscribe()
    subscription = null
  }
  if (!subscription) subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: wanted })
  await sendToServer(subscription)
  return true
}

/** Turn push off for this device only. */
export async function disablePushOnThisDevice(): Promise<void> {
  if (pushSupport() !== 'supported') return
  const reg = await navigator.serviceWorker.getRegistration('/')
  const subscription = await reg?.pushManager.getSubscription()
  if (!subscription) return
  try {
    await pushService.unsubscribe(subscription.endpoint)
  } finally {
    await subscription.unsubscribe()
  }
}

/** Is this device currently subscribed? */
export async function isSubscribedHere(): Promise<boolean> {
  if (pushSupport() !== 'supported' || Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.getRegistration('/')
  return Boolean(await reg?.pushManager.getSubscription())
}

/**
 * Once per app load: if this device already has push, re-send it so the
 * server has the current time zone and knows the device is alive.
 */
let resynced = false
export async function resyncPush(): Promise<void> {
  if (resynced) return
  resynced = true
  try {
    if (pushSupport() !== 'supported' || Notification.permission !== 'granted') return
    const reg = await navigator.serviceWorker.getRegistration('/')
    const subscription = await reg?.pushManager.getSubscription()
    if (subscription) await sendToServer(subscription)
  } catch {
    // Best effort; the next load tries again.
  }
}

const PROMPT_KEY = 'cp:reminder-prompt-until'

export function reminderPromptSnoozed(): boolean {
  try {
    return Number(localStorage.getItem(PROMPT_KEY) || 0) > Date.now()
  } catch {
    return false
  }
}

export function snoozeReminderPrompt(days = 14) {
  try {
    localStorage.setItem(PROMPT_KEY, String(Date.now() + days * 86_400_000))
  } catch {
    // Storage blocked: the prompt may show again next time, which is fine.
  }
}

/** Fired by usePostStory after a moment posts; the reminder sheet listens for it. */
export const MOMENT_POSTED_EVENT = 'cp:moment-posted'
