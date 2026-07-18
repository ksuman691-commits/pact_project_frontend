/**
 * Query Keys Factory
 * Centralized query key management for React Query
 * Follows the recommended pattern from React Query docs
 */

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'],
    profile: () => [...queryKeys.auth.all, 'profile'],
    verify: () => [...queryKeys.auth.all, 'verify'],
  },

  // Users
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: (filters?: any) => [...queryKeys.users.lists(), filters],
    details: () => [...queryKeys.users.all, 'detail'],
    detail: (id: number) => [...queryKeys.users.details(), id],
    detailByUsername: (username: string) => [...queryKeys.users.details(), username],
    stats: (userId: number) => [...queryKeys.users.detail(userId), 'stats'],
    followers: (userId: number) => [...queryKeys.users.detail(userId), 'followers'],
    following: (userId: number) => [...queryKeys.users.detail(userId), 'following'],
    analytics: (userId: number) => [...queryKeys.users.detail(userId), 'analytics'],
    search: (query: string) => [...queryKeys.users.all, 'search', query],
  },

  // Pacts
  pacts: {
    all: ['pacts'],
    lists: () => [...queryKeys.pacts.all, 'list'],
    list: (filters?: any) => [...queryKeys.pacts.lists(), filters],
    details: () => [...queryKeys.pacts.all, 'detail'],
    detail: (id: number) => [...queryKeys.pacts.details(), id],
    byUser: (userId: number) => [...queryKeys.pacts.all, 'user', userId],
    byCircle: (circleId: number) => [...queryKeys.pacts.all, 'circle', circleId],
    public: () => [...queryKeys.pacts.all, 'public'],
    active: () => [...queryKeys.pacts.all, 'active'],
    today: () => [...queryKeys.pacts.all, 'today'],
    search: (query: string) => [...queryKeys.pacts.all, 'search', query],
    proofHistory: (pactId: number) => [...queryKeys.pacts.detail(pactId), 'proof-history'],
    analytics: (pactId: number) => [...queryKeys.pacts.detail(pactId), 'analytics'],
    likes: (pactId: number) => [...queryKeys.pacts.detail(pactId), 'likes'],
    comments: (pactId: number) => [...queryKeys.pacts.detail(pactId), 'comments'],
    shares: (pactId: number) => [...queryKeys.pacts.detail(pactId), 'shares'],
  },

  // Circles
  circles: {
    all: ['circles'],
    lists: () => [...queryKeys.circles.all, 'list'],
    list: (filters?: any) => [...queryKeys.circles.lists(), filters],
    details: () => [...queryKeys.circles.all, 'detail'],
    detail: (id: number) => [...queryKeys.circles.details(), id],
    public: () => [...queryKeys.circles.all, 'public'],
    members: (circleId: number) => [...queryKeys.circles.detail(circleId), 'members'],
    leaderboard: (circleId: number) => [...queryKeys.circles.detail(circleId), 'leaderboard'],
    pacts: (circleId: number) => [...queryKeys.circles.detail(circleId), 'pacts'],
    search: (query: string) => [...queryKeys.circles.all, 'search', query],
    analytics: (circleId: number) => [...queryKeys.circles.detail(circleId), 'analytics'],
  },

  // Wallet
  wallet: {
    all: ['wallet'],
    detail: () => [...queryKeys.wallet.all, 'detail'],
    balance: () => [...queryKeys.wallet.all, 'balance'],
    locked: () => [...queryKeys.wallet.all, 'locked'],
    rewards: () => [...queryKeys.wallet.all, 'rewards'],
    transactions: () => [...queryKeys.wallet.all, 'transactions'],
    history: () => [...queryKeys.wallet.all, 'history'],
    withdrawalRequests: () => [...queryKeys.wallet.all, 'withdrawal-requests'],
  },

  // Verifications
  verifications: {
    all: ['verifications'],
    byPact: (pactId: number) => [...queryKeys.verifications.all, 'pact', pactId],
    byUser: (userId: number) => [...queryKeys.verifications.all, 'user', userId],
    stats: (pactId: number) => [...queryKeys.verifications.byPact(pactId), 'stats'],
  },

  // Feed
  feed: {
    all: ['feed'],
    personalized: () => [...queryKeys.feed.all, 'personalized'],
    trending: () => [...queryKeys.feed.all, 'trending'],
    discover: () => [...queryKeys.feed.all, 'discover'],
    following: () => [...queryKeys.feed.all, 'following'],
  },

  // Leaderboards
  leaderboards: {
    all: ['leaderboards'],
    global: () => [...queryKeys.leaderboards.all, 'global'],
    circle: (circleId: number) => [...queryKeys.leaderboards.all, 'circle', circleId],
    trending: () => [...queryKeys.leaderboards.all, 'trending'],
  },

  // Notifications
  notifications: {
    all: ['notifications'],
    list: () => [...queryKeys.notifications.all, 'list'],
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'],
  },

  // Follows
  follows: {
    all: ['follows'],
    pending: () => [...queryKeys.follows.all, 'pending'],
    followers: (userId: number) => [...queryKeys.follows.all, 'followers', userId],
    following: (userId: number) => [...queryKeys.follows.all, 'following', userId],
    state: (userId: number) => [...queryKeys.follows.all, 'state', userId],
  },

  // Shorts (Video feed)
  shorts: {
    all: ['shorts'],
    feed: () => [...queryKeys.shorts.all, 'feed'],
    detail: (id: number) => [...queryKeys.shorts.all, 'detail', id],
  },
};
