import type { QueryClient } from '@tanstack/react-query'

type LikeState = { liked: boolean; likeCount: number }

function patch(node: any, pactId: number, state: LikeState): any {
  if (Array.isArray(node)) {
    let changed = false
    const next = node.map((item) => {
      const updated = patch(item, pactId, state)
      if (updated !== item) changed = true
      return updated
    })
    return changed ? next : node
  }
  if (node && typeof node === 'object') {
    if (Number(node.id) === pactId && ('like_count' in node || 'is_liked_by_me' in node)) {
      if (node.like_count === state.likeCount && node.is_liked_by_me === state.liked) return node
      return { ...node, like_count: state.likeCount, is_liked_by_me: state.liked }
    }
    let changed = false
    const next: Record<string, any> = {}
    for (const key of Object.keys(node)) {
      const updated = patch(node[key], pactId, state)
      if (updated !== node[key]) changed = true
      next[key] = updated
    }
    return changed ? next : node
  }
  return node
}

/**
 * A like is saved on the server, but every screen reads its own cached copy of
 * the pact (feed, my pacts, the pact page). Write the new like state into all
 * of them so each screen shows the same heart and count straight away.
 */
export function syncPactLike(queryClient: QueryClient, pactId: number, state: LikeState) {
  queryClient.setQueriesData({}, (data: unknown) => (data === undefined ? data : patch(data, pactId, state)))
}
