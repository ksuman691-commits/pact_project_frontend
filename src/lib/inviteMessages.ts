/**
 * What people paste into WhatsApp and other apps when they invite someone. The audit found the old
 * lines cold ("Join X on CirclePact"): asking someone to keep you honest is awkward, so the message
 * does the asking, says what the goal is, and says what the other person would actually do.
 */

function firstName(name?: string | null): string {
  return String(name || '').trim().split(/\s+/)[0] || 'A friend'
}

function goal(title?: string | null): string {
  const t = String(title || '').trim().replace(/[.!]+$/, '')
  return t ? `"${t}"` : 'a new pact'
}

/** Your own pact, or someone else's that you're passing on. */
export function pactInviteMessage(opts: { title?: string | null; mine: boolean; day?: number | null; totalDays?: number | null; creatorName?: string | null }): string {
  const { title, mine, day, totalDays, creatorName } = opts
  if (!mine) {
    return `${firstName(creatorName)} made a pact on CirclePact: ${goal(title)}. Cheer them on and keep them honest.`
  }
  if (day && day > 1 && totalDays) {
    return `Day ${day} of ${totalDays} on my pact ${goal(title)}. Keep me honest: watch my daily check-ins and nudge me if I slip.`
  }
  return `I just made a pact: ${goal(title)}. Will you keep me honest? I'll post a photo every day, and you can nudge me if I miss one.`
}

/** A circle invite. `purpose` is the circle's "What it's for", when it has one. */
export function circleInviteMessage(name: string, isPrivate: boolean, purpose?: string | null): string {
  const p = purpose?.trim().replace(/[.!]+$/, '') ?? ''
  // "Chasing fitness goals" reads mid-sentence as "for chasing fitness goals".
  const what = p ? ` for ${/^[A-Z][a-z]/.test(p) ? p[0].toLowerCase() + p.slice(1) : p}` : ''
  const how = 'Each of us posts one photo a day for our goal, and the circle keeps us honest.'
  return isPrivate
    ? `Join me in "${name}" on CirclePact${what}. ${how} Tap the link to ask to join.`
    : `Join me in "${name}" on CirclePact${what}. ${how} Want in?`
}
