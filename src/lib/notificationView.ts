/** Turns raw notifications into the rows the notifications page shows. */

export interface NotificationActor {
  id: number;
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface RawNotification {
  id: number;
  title?: string;
  description?: string;
  subtype?: string | null;
  related_pact_id?: number | null;
  related_circle_id?: number | null;
  related_user_id?: number | null;
  related_comment_id?: number | null;
  actor?: NotificationActor | null;
  is_read: boolean;
  created_at: string;
}

export type RowKind = 'pact_like' | 'pact_comment' | 'comment_like' | 'comment_reply' | 'other';

export interface NotificationRow {
  key: string;
  kind: RowKind;
  ids: number[];
  unread: boolean;
  createdAt: string;
  actors: NotificationActor[];
  /** The bold name part, then the rest of the sentence, then an optional bold pact title and quoted tail. */
  names: string;
  verb: string;
  pactTitle?: string;
  tail?: string;
  source: RawNotification;
}

const nameOf = (actor: NotificationActor) => actor.full_name || actor.username || 'Someone';
const firstName = (actor: NotificationActor) => String(nameOf(actor)).trim().split(/\s+/)[0] || 'Someone';

/** Older rows have no subtype; their titles say what they are. */
export function kindOf(n: RawNotification): RowKind {
  const subtype = n.subtype;
  if (subtype === 'pact_like' || subtype === 'pact_comment' || subtype === 'comment_like' || subtype === 'comment_reply') return subtype;
  const title = String(n.title || '');
  if (title === 'New like') return 'pact_like';
  if (title === 'New comment') return 'pact_comment';
  if (title === 'Comment liked') return 'comment_like';
  if (title === 'New reply') return 'comment_reply';
  return 'other';
}

/** Drops the person's name from the front of a description ("Suman liked X." -> "liked X."). */
function afterName(description: string, actor?: NotificationActor | null): string {
  const text = String(description || '').trim();
  if (!actor) return text;
  for (const candidate of [actor.full_name, actor.username]) {
    if (candidate && text.startsWith(`${candidate} `)) return text.slice(candidate.length + 1);
  }
  return text;
}

function namesLine(actors: NotificationActor[]): string {
  const first = actors.slice(0, 2).map(firstName);
  const others = actors.length - first.length;
  return others > 0 ? `${first.join(', ')} and ${others} ${others === 1 ? 'other' : 'others'}` : first.length === 2 ? `${first[0]} and ${first[1]}` : first[0] ?? 'Someone';
}

function single(n: RawNotification, kind: RowKind): NotificationRow {
  const rest = afterName(n.description || '', n.actor);
  let verb = rest;
  let pactTitle: string | undefined;
  let tail: string | undefined;
  if (kind === 'pact_like') {
    // "liked {title}."
    const title = rest.replace(/^liked /, '').replace(/\.$/, '');
    verb = 'liked your pact';
    pactTitle = title || undefined;
  } else if (kind === 'pact_comment') {
    // "commented on {title}: {snippet}"
    const body = rest.replace(/^commented on /, '');
    const cut = body.indexOf(': ');
    verb = 'commented on';
    pactTitle = cut >= 0 ? body.slice(0, cut) : body;
    tail = cut >= 0 ? body.slice(cut + 2) : undefined;
  } else if (kind === 'comment_like' || kind === 'comment_reply') {
    const cut = rest.indexOf(': ');
    verb = cut >= 0 ? rest.slice(0, cut) : rest;
    tail = cut >= 0 ? rest.slice(cut + 2) : undefined;
  }
  return {
    key: `n${n.id}`,
    kind,
    ids: [n.id],
    unread: !n.is_read,
    createdAt: n.created_at,
    actors: n.actor ? [n.actor] : [],
    names: n.actor ? firstName(n.actor) : '',
    verb,
    pactTitle,
    tail,
    source: n,
  };
}

/**
 * One row per notification, except that several likes on the same pact
 * (within the same New/Earlier section) fold into one line.
 */
export function buildRows(notifications: RawNotification[], isNew: (n: RawNotification) => boolean): { fresh: NotificationRow[]; earlier: NotificationRow[] } {
  const fresh: NotificationRow[] = [];
  const earlier: NotificationRow[] = [];
  const groups = new Map<string, NotificationRow>();
  for (const n of notifications) {
    const kind = kindOf(n);
    const bucket = isNew(n) ? fresh : earlier;
    const row = single(n, kind);
    if (kind === 'pact_like' && n.related_pact_id != null && n.actor) {
      const key = `like:${n.related_pact_id}:${bucket === fresh ? 'new' : 'old'}`;
      const existing = groups.get(key);
      if (existing) {
        existing.ids.push(n.id);
        existing.unread = existing.unread || !n.is_read;
        if (!existing.actors.some((a) => a.id === n.actor!.id)) existing.actors.push(n.actor);
        existing.names = namesLine(existing.actors);
        continue;
      }
      row.key = key;
      row.names = namesLine(row.actors);
      groups.set(key, row);
    }
    bucket.push(row);
  }
  return { fresh, earlier };
}

/** Where a tap on this row goes. */
export function rowTarget(row: NotificationRow): string | null {
  const n = row.source;
  if (!n.related_pact_id) return null;
  if (row.kind === 'pact_like') return `/pacts/${n.related_pact_id}`;
  if (row.kind === 'pact_comment' || row.kind === 'comment_like' || row.kind === 'comment_reply') {
    return n.related_comment_id ? `/pacts/${n.related_pact_id}?comment=${n.related_comment_id}` : `/pacts/${n.related_pact_id}`;
  }
  return null;
}

export function shortTime(iso: string): string {
  const raw = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`;
  const at = new Date(raw).getTime();
  if (Number.isNaN(at)) return '';
  const seconds = Math.max(0, (Date.now() - at) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 86400 * 2) return 'Yesterday';
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / (86400 * 7))}w`;
}
