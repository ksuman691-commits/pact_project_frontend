import toast from 'react-hot-toast'

/**
 * Inviting people to a circle from outside the app. The link is the circle's
 * own page: signed-in people land on it and can Join (open circle) or Ask to
 * Join (private circle); signed-out people sign in first and come back to it.
 */

export type ShareKind = 'native' | 'whatsapp' | 'copy'

export function circleLink(circleId: number | string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://circlepact.com'
  return `${origin}/circles/${circleId}`
}

export function circleInviteMessage(name: string, isPrivate: boolean): string {
  return isPrivate
    ? `I started "${name}" on CirclePact. Ask to join and I'll let you in.`
    : `Join my circle "${name}" on CirclePact. We keep each other going.`
}

/** Copies text, with a fallback for browsers that block the clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the older way.
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export async function shareCircle(kind: ShareKind, circle: { id: number | string; name: string; isPrivate: boolean }) {
  const url = circleLink(circle.id)
  const message = circleInviteMessage(circle.name, circle.isPrivate)

  if (kind === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`, '_blank', 'noopener')
    return
  }

  if (kind === 'native' && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: circle.name, text: message, url })
      return
    } catch (error: any) {
      // Closing the share sheet isn't an error worth a toast.
      if (error?.name === 'AbortError') return
    }
  }

  const ok = await copyText(kind === 'copy' ? url : `${message} ${url}`)
  if (ok) toast.success(kind === 'copy' ? 'Link copied' : 'Invite copied. Paste it anywhere.')
  else toast.error('Could not copy. Long-press the link to copy it.')
}
