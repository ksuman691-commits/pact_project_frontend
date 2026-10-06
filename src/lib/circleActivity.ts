import type { RingMember } from '@/components/classic/Ring'

export interface CircleActivity {
  /** True only when the proof-this-week count is real for the WHOLE circle
   * (every member's flag is known, or the API gave a circle-level count). */
  known: boolean
  /** Number of members who sent proof this week. Meaningless unless `known`. */
  activeCount: number
  ringMembers: RingMember[]
  totalMembers: number
}

const MAX_PREVIEW_SEATS = 5

function readFlag(member: any): boolean | undefined {
  return typeof member?.sent_proof_this_week === 'boolean' ? member.sent_proof_this_week : undefined
}

function toRingMember(m: any, flag: boolean | undefined): RingMember {
  return {
    userId: m.user_id ?? m.id ?? m.username,
    name: m.name || m.full_name || m.username,
    avatarUrl: m.avatar_url || null,
    // Only an explicit true lights a seat; null/undefined means unknown.
    activeThisWeek: flag === true,
  }
}

/**
 * Reads circle members and weekly activity from whatever the API returned,
 * without issuing any request. Source order:
 *   1. `memberList` (full list, e.g. the circle detail page)
 *   2. `circle.members_preview` (list endpoint, max 5, pre-ranked)
 *   3. `circle.members`
 *   4. owner only, until the backend ships `members_preview`
 * A missing or null flag means "unknown", never "false". See
 * BACKEND_SPEC_MEMBER_ACTIVITY.md.
 */
export function readCircleActivity(circle: any, memberList?: any[]): CircleActivity {
  const hasList = Array.isArray(memberList) && memberList.length > 0
  const source: any[] =
    (hasList && memberList) ||
    (Array.isArray(circle?.members_preview) && circle.members_preview) ||
    (Array.isArray(circle?.members) && circle.members) ||
    []
  const members = hasList ? source : source.slice(0, MAX_PREVIEW_SEATS)

  const flags = members.map(readFlag)
  const ringMembers = members.map((m, i) => toRingMember(m, flags[i]))

  if (ringMembers.length === 0 && circle?.owner_username) {
    ringMembers.push({
      userId: circle.owner_id,
      name: circle.owner_username,
      avatarUrl: circle.owner_avatar_url || null,
      activeThisWeek: false,
    })
  }

  const totalMembers: number = circle?.member_count ?? ringMembers.length

  // A 5-person preview of a 19-person circle can't say how many of the 19
  // sent proof, so the circle-level count is only "known" when every member
  // is represented with a real flag.
  const coversEveryone = members.length > 0 && members.length >= totalMembers
  if (coversEveryone && flags.every((f) => f !== undefined)) {
    return { known: true, activeCount: flags.filter(Boolean).length, ringMembers, totalMembers }
  }
  if (typeof circle?.members_sent_proof_this_week === 'number') {
    return { known: true, activeCount: circle.members_sent_proof_this_week, ringMembers, totalMembers }
  }
  return { known: false, activeCount: 0, ringMembers, totalMembers }
}
