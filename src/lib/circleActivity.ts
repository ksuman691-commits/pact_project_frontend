import type { RingMember } from '@/components/classic/Ring'

export interface CircleActivity {
  /** True only when the API gave a real boolean for every member shown. */
  known: boolean
  /** Number of members who sent proof this week. Meaningless unless `known`. */
  activeCount: number
  ringMembers: RingMember[]
  totalMembers: number
}

function readFlag(member: any): boolean | undefined {
  return typeof member?.sent_proof_this_week === 'boolean' ? member.sent_proof_this_week : undefined
}

function toRingMember(m: any, flag: boolean | undefined): RingMember {
  return {
    userId: m.user_id ?? m.id ?? m.username,
    name: m.full_name || m.username,
    avatarUrl: m.avatar_url || null,
    activeThisWeek: flag === true,
  }
}

/**
 * Reads per-member weekly activity from whatever the API returned.
 * A missing or null flag means "unknown", never "false". See
 * BACKEND_SPEC_MEMBER_ACTIVITY.md.
 */
export function readCircleActivity(circle: any, memberList?: any[]): CircleActivity {
  const members: any[] =
    (memberList && memberList.length > 0 && memberList) ||
    (Array.isArray(circle?.members_preview) && circle.members_preview) ||
    (Array.isArray(circle?.members) && circle.members) ||
    []
  const totalMembers: number = circle?.member_count ?? members.length

  const flags = members.map(readFlag)
  const everyFlagReal = members.length > 0 && flags.every((f) => f !== undefined)
  const ringMembers = members.map((m, i) => toRingMember(m, flags[i]))

  if (ringMembers.length === 0 && circle?.owner_username) {
    ringMembers.push({
      userId: circle.owner_id,
      name: circle.owner_username,
      avatarUrl: circle.owner_avatar_url || null,
      activeThisWeek: false,
    })
  }

  if (everyFlagReal) {
    return { known: true, activeCount: flags.filter(Boolean).length, ringMembers, totalMembers }
  }
  if (typeof circle?.members_sent_proof_this_week === 'number') {
    return { known: true, activeCount: circle.members_sent_proof_this_week, ringMembers, totalMembers }
  }
  return { known: false, activeCount: 0, ringMembers, totalMembers }
}
