'use client';

import UserAvatarLink from '@/components/UserAvatarLink';

export interface AvatarStackMember {
  /** Unique key for this entry — user id. */
  userId: number | string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}

interface MemberAvatarStackProps {
  members: AvatarStackMember[];
  /**
   * Total count this stack represents. When greater than `members.length`
   * (e.g. the list was truncated server-side, or a card only fetched a
   * preview page of members), the difference renders as a "+N" overflow
   * bubble instead of silently dropping people.
   */
  totalCount?: number;
  /** Max avatars shown before the rest collapse into the overflow bubble. */
  maxVisible?: number;
  size?: number;
  className?: string;
}

/**
 * Shared horizontal row of overlapping member/recipient avatars — each
 * independently clickable to that person's profile — used anywhere a
 * card or header needs to show "who" rather than just "how many". Built
 * once for CircleCard's member row and reused as-is (not re-implemented)
 * for Dare cards/detail so both surfaces stay in sync with the single
 * Avatar component instead of drifting into separate hand-rolled markup.
 */
export default function MemberAvatarStack({
  members,
  totalCount,
  maxVisible = 4,
  size = 32,
  className = '',
}: MemberAvatarStackProps) {
  if (members.length === 0) return null;

  const visible = members.slice(0, maxVisible);
  const overflowCount = Math.max(0, (totalCount ?? members.length) - visible.length);

  return (
    <div className={`flex -space-x-2 ${className}`.trim()}>
      {visible.map((member) => (
        <div key={member.userId} className="rounded-full border-2" style={{ borderColor: 'var(--pact-surface)' }}>
          <UserAvatarLink
            name={member.name || member.username}
            avatarUrl={member.avatarUrl}
            username={member.username}
            size={size}
            stopPropagation
          />
        </div>
      ))}
      {overflowCount > 0 && (
        <div
          className="flex items-center justify-center rounded-full border-2 text-xs font-bold"
          style={{
            width: size,
            height: size,
            background: 'var(--pact-surface-2)',
            color: 'var(--pact-text-faint)',
            borderColor: 'var(--pact-surface)',
          }}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}
