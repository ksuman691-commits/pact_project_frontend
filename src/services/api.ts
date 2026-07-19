import axios, { AxiosInstance, AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pact-project-backend-v2.onrender.com';

let token: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

if (typeof window !== 'undefined') {
  token = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const mapUser = (raw: any) => {
  if (!raw) return null;
  return {
    id: raw?.id ?? raw?.user_id,
    user_uuid: raw?.user_uuid,
    username: raw?.username,
    email: raw?.email,
    full_name: raw?.full_name,
    reputation_score: Number(raw?.reputation_score ?? 0),
    is_active: raw?.is_active ?? true,
    created_at: raw?.created_at ?? new Date().toISOString(),
    avatar_url: raw?.avatar_url ?? null,
    bio: raw?.bio ?? null,
  };
};

const formatTimeRemaining = (endDateRaw: string | undefined) => {
  if (!endDateRaw) return null;

  const endDate = new Date(endDateRaw);
  const diffMs = endDate.getTime() - Date.now();

  if (Number.isNaN(endDate.getTime())) return null;
  if (diffMs <= 0) return 'Ended';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (totalHours > 0) return `${totalHours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
};

const calculateCurrentDay = (startDateRaw: string | undefined, durationDaysRaw: number | undefined) => {
  if (!startDateRaw || !durationDaysRaw) return undefined;

  const startDate = new Date(startDateRaw);
  if (Number.isNaN(startDate.getTime())) return undefined;

  const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(elapsedDays, 1), Math.max(durationDaysRaw, 1));
};

const mapCircle = (raw: any) => {
  if (!raw) return null;
  return {
    ...raw,
    is_public: raw?.visibility === 'public',
    memberCount: raw?.member_count ?? 0,
  };
};

const mapPact = (raw: any) => {
  if (!raw) return null;
  return {
    ...raw,
    pact_uuid: raw?.pact_uuid ?? String(raw?.id ?? ''),
    is_public: raw?.visibility === 'public',
    verification_type: raw?.verification_method,
    deadline: raw?.end_date,
    stake_amount: Number(raw?.stake_amount ?? 0),
    creator: raw?.creator_username ?? raw?.creator?.username ?? 'unknown',
    avatar: raw?.creator_username?.charAt(0)?.toUpperCase?.() ?? raw?.creator?.username?.charAt(0)?.toUpperCase?.() ?? '🔥',
    creatorAvatarUrl: raw?.creator_avatar_url ?? raw?.creator?.avatar_url ?? null,
    circle: raw?.circle_name ?? raw?.circle?.name ?? null,
    circleEmoji: raw?.circle_icon_emoji ?? null,
    daysTotal: Number(raw?.duration_days ?? 0) || undefined,
    daysCurrent: calculateCurrentDay(raw?.start_date, Number(raw?.duration_days ?? 0) || undefined),
    timeRemaining: formatTimeRemaining(raw?.end_date),
    
    // Legacy fields (for backward compatibility)
    believers: raw?.believers ?? 0,
    doubters: raw?.doubters ?? 0,
    
    // New reporting fields
    support_count: raw?.support_count ?? raw?.believers ?? 0,
    recent_supporters: raw?.recent_supporters ?? [],
    is_reported_by_me: raw?.is_reported_by_me ?? false,
    report_count: raw?.report_count ?? 0,
    
    // Proof fields from feed
    proof_url: raw?.proof_url ?? null,
    proof_type: raw?.proof_type ?? null,
    latest_proof_caption: raw?.latest_proof_caption ?? null,
    latest_proof_upload_date: raw?.latest_proof_upload_date ?? null,
  };
};

// Add Bearer token to all requests and keep the token in sync with localStorage
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      token = storedToken;
    }
  }

  if (token) {
    const headers = config.headers as AxiosRequestHeaders | undefined;
    config.headers = {
      ...(headers ?? {}),
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders;
  }

  return config;
});

// Clear stale auth state when the backend rejects the token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error.response;
    const originalRequest = error.config || {};
    const requestUrl: string = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/token') ||
      requestUrl.includes('/api/auth/refresh');

    if (response && response.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessTokenSilently();
      if (newAccessToken) {
        const headers = originalRequest.headers as AxiosRequestHeaders | undefined;
        originalRequest.headers = {
          ...(headers ?? {}),
          Authorization: `Bearer ${newAccessToken}`,
        } as AxiosRequestHeaders;
        return api.request(originalRequest);
      }

      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const setToken = (newToken: string) => {
  token = newToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', newToken);
  }
};

export const setRefreshToken = (newRefreshToken: string) => {
  refreshToken = newRefreshToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', newRefreshToken);
  }
};

export const setAuthTokens = (newToken: string, newRefreshToken?: string | null) => {
  setToken(newToken);
  if (newRefreshToken) {
    setRefreshToken(newRefreshToken);
  }
};

export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('refresh_token');
    if (stored) refreshToken = stored;
  }
  return refreshToken;
};

export const clearToken = () => {
  token = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

async function refreshAccessTokenSilently(): Promise<string | null> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/api/auth/refresh', { refresh_token: currentRefreshToken })
      .then((response) => {
        const newAccessToken = response.data?.access_token;
        const newRefreshToken = response.data?.refresh_token;
        if (!newAccessToken || !newRefreshToken) {
          throw new Error('Invalid refresh response');
        }
        setAuthTokens(newAccessToken, newRefreshToken);
        return newAccessToken as string;
      })
      .catch(() => {
        clearToken();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Auth Services
export const authService = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  refresh: (refresh_token: string) => api.post('/api/auth/refresh', { refresh_token }),
  getProfile: async () => {
    const response = await api.get('/api/auth/me');
    return { ...response, data: mapUser(response.data) };
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { ...response, data: mapUser(response.data) };
  },
  verify: () => api.get('/api/auth/verify'),
  logout: () => api.post('/api/auth/logout'),
};

// Circle Services
export const circleService = {
  create: async (data: any) => {
    const response = await api.post('/api/circles', data);
    return { ...response, data: mapCircle(response.data) };
  },
  list: async () => {
    const response = await api.get('/api/circles');
    return { ...response, data: (response.data || []).map(mapCircle) };
  },
  getById: async (id: number) => {
    const response = await api.get(`/api/circles/${id}`);
    return { ...response, data: mapCircle(response.data) };
  },
  listPublic: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/circles/public', { params: { skip, limit } });
    return { ...response, data: (response.data || []).map(mapCircle) };
  },
  join: (id: number) => api.post(`/api/circles/${id}/join`),
  leave: (id: number) => api.post(`/api/circles/${id}/leave`),
  listPacts: async (id: number, skip = 0, limit = 20) => {
    const response = await api.get(`/api/circles/${id}/pacts`, { params: { skip, limit } });
    return { ...response, data: (response.data || []).map(mapPact) };
  },
};

export const circleJoinRequestService = {
  sendRequest: (circleId: number, message?: string) =>
    api.post(`/api/circles/${circleId}/join-request`, { message }),

  listPending: (circleId: number) =>
    api.get(`/api/circles/${circleId}/join-requests`),

  listUserRequests: (userId: number) =>
    api.get(`/api/circles/user/${userId}/circle-join-requests`),

  approve: (circleId: number, requestId: number, message?: string) =>
    api.post(`/api/circles/${circleId}/join-requests/${requestId}/approve`,
      { message }),

  reject: (circleId: number, requestId: number, message?: string) =>
    api.post(`/api/circles/${circleId}/join-requests/${requestId}/reject`,
      { message }),

  withdraw: (circleId: number, requestId: number) =>
    api.post(`/api/circles/${circleId}/join-requests/${requestId}/withdraw`),

  listMembers: (circleId: number) => api.get(`/api/circles/${circleId}/members`),
};

// Pact Services
export const pactService = {
  create: async (data: any) => {
    const response = await api.post('/api/pacts', data);
    return { ...response, data: mapPact(response.data) };
  },
  list: async (params?: any) => {
    const response = await api.get('/api/pacts', { params });
    let rows = (response.data || []).map(mapPact);
    if (params?.circle_id) {
      rows = rows.filter((p: any) => p.circle_id === params.circle_id);
    }
    return { ...response, data: rows };
  },
  getById: async (id: number) => {
    const response = await api.get(`/api/pacts/${id}`);
    return { ...response, data: mapPact(response.data) };
  },
  update: (id: number, data: any) => api.put(`/api/pacts/${id}`, data),
  uploadProof: (id: number, payload: any) =>
    api.post(`/api/pacts/${id}/upload-proof`, payload),
  uploadProofFile: (id: number, file: File, proofType: 'photo' | 'video' | 'checklist' = 'photo', caption?: string, dayNumber?: number) => {
    const formData = new FormData();
    formData.append('proof_type', proofType);
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    if (typeof dayNumber === 'number') formData.append('day_number', String(dayNumber));
    return api.post(`/api/pacts/${id}/upload-proof-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listProofs: (id: number, limit = 20) =>
    api.get(`/api/pacts/${id}/proofs`, { params: { limit } }),
  vote: (id: number, vote: 'believe' | 'doubt') => api.post(`/api/pacts/${id}/vote`, { vote }),
  voteSupport: (id: number) => api.post(`/api/pacts/${id}/vote-support`),
  voteSkip: (id: number) => api.post(`/api/pacts/${id}/vote-skip`),
  getVotes: (id: number) => api.get(`/api/pacts/${id}/votes`),
  personalized: (skip = 0, limit = 20) => api.get('/api/pacts/feed/personalized', { params: { skip, limit } }),
  
  // Reporting endpoints
  report: async (id: number, reason: 'fake_or_ai' | 'spam' | 'offensive') => {
    const response = await api.post(`/api/pacts/${id}/report`, { reason });
    return response;
  },
  getMyReports: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/pacts/my-reports', { params: { skip, limit } });
    return { ...response, data: (response.data?.data || []).map(mapPact) };
  },
  getReportCount: async (id: number) => {
    const response = await api.get(`/api/pacts/${id}/report-count`);
    return response;
  },
  getReportLogs: async (id: number) => {
    const response = await api.get(`/api/pacts/${id}/report-logs`);
    return response;
  },
};

// Pact Join Requests (NEW)
export const joinRequestService = {
  sendRequest: (pactId: number, message?: string) =>
    api.post(`/api/pacts/${pactId}/join-request`, { message }),
  
  listPending: (pactId: number) =>
    api.get(`/api/pacts/${pactId}/join-requests`),
  
  listUserRequests: (userId: number) =>
    api.get(`/api/pacts/user/${userId}/join-requests`),
  
  approve: (pactId: number, requestId: number, message?: string) =>
    api.post(`/api/pacts/${pactId}/join-requests/${requestId}/approve`, 
      { message }),
  
  reject: (pactId: number, requestId: number, message?: string) =>
    api.post(`/api/pacts/${pactId}/join-requests/${requestId}/reject`,
      { message }),
  
  withdraw: (pactId: number, requestId: number) =>
    api.post(`/api/pacts/${pactId}/join-requests/${requestId}/withdraw`),
  
  listParticipants: (pactId: number) =>
    api.get(`/api/pacts/${pactId}/participants`),
  
  leavePact: (pactId: number) =>
    api.delete(`/api/pacts/${pactId}/leave`),
};

// Verification Services
export const verificationService = {
  create: (pactId: number, data: any) =>
    api.post(`/api/verifications/${pactId}`, data),
  getByPactId: (pactId: number) =>
    api.get(`/api/verifications/${pactId}`),
  getStats: (pactId: number) =>
    api.get(`/api/verifications/${pactId}/stats`),
};

// Wallet Services
export const walletService = {
  get: () => api.get('/api/wallet'),
  deposit: (data: any) => api.post('/api/wallet/deposit', data),
  withdraw: (amount: number) =>
    api.post('/api/wallet/withdraw', { amount }),
  getTransactions: () => api.get('/api/wallet/transactions'),
};

// Shorts Services (Feed, Reactions, Views)
export const shortsService = {
  getFeed: (page?: number, limit?: number) =>
    api.get('/api/shorts/feed', { params: { page, limit } }),
  react: (shortId: number, reactionType: string) =>
    api.post(`/api/shorts/${shortId}/react`, null, { params: { reaction: reactionType } }),
  recordView: (shortId: number) =>
    api.post(`/api/shorts/${shortId}/view`),
  getById: (shortId: number) =>
    api.get(`/api/shorts/${shortId}`),
};

// User Services
export const userService = {
  getById: (id: number) => api.get(`/api/users/${id}`),
  getByUsername: (username: string) => api.get(`/api/users/by-username/${username}`),
  update: (id: number, data: any) => api.put(`/api/users/${id}`, data),
  follow: (userId: number) => api.post(`/api/users/${userId}/follow`),
  unfollow: (userId: number) => api.delete(`/api/users/${userId}/follow`),
  getFollowers: (userId: number) => api.get(`/api/users/${userId}/followers`),
  getFollowing: (userId: number) => api.get(`/api/users/${userId}/following`),
  getStats: (userId: number) => api.get(`/api/users/${userId}/stats`),
  getPacts: async (userId: number) => {
    const response = await api.get(`/api/users/${userId}/pacts`);
    return { ...response, data: (response.data || []).map(mapPact) };
  },
  search: (query: string, limit?: number) =>
    api.get('/api/users/search', { params: { q: query, limit } }),
};

// Leaderboard Services
export const leaderboardService = {
  getGlobal: (skip?: number, limit?: number) =>
    api.get('/api/leaderboards/global', { params: { skip, limit } }),
  getCircle: (circleId: number, skip?: number, limit?: number) =>
    api.get(`/api/leaderboards/circles/${circleId}`, { params: { skip, limit } }),
  getTrending: (skip?: number, limit?: number) =>
    api.get('/api/leaderboards/trending', { params: { skip, limit } }),
};

// Social Services (Likes, Comments, Shares)
export const socialService = {
  // Pact Interactions
  likePact: (pactId: number) => api.post(`/api/pacts/${pactId}/like`),
  unlikePact: (pactId: number) => api.delete(`/api/pacts/${pactId}/like`),
  getPactLikes: (pactId: number) => api.get(`/api/pacts/${pactId}/likes`),
  
  // Comments
  addComment: (pactId: number, text: string) =>
    api.post(`/api/pacts/${pactId}/comments`, { text }),
  deleteComment: (pactId: number, commentId: number) =>
    api.delete(`/api/pacts/${pactId}/comments/${commentId}`),
  getComments: (pactId: number, skip?: number, limit?: number) =>
    api.get(`/api/pacts/${pactId}/comments`, { params: { skip, limit } }),
  
  // Shares
  sharePact: (pactId: number, platform?: string) =>
    api.post(`/api/pacts/${pactId}/share`, { platform }),
  getShares: (pactId: number) => api.get(`/api/pacts/${pactId}/shares`),
};

// Notification Services
export const notificationService = {
  list: (skip?: number, limit?: number) =>
    api.get('/api/notifications', { params: { skip, limit } }),
  markAsRead: (notificationId: number) =>
    api.post(`/api/notifications/${notificationId}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
  delete: (notificationId: number) =>
    api.delete(`/api/notifications/${notificationId}`),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

// Follow Services
export const followService = {
  request: (userId: number) => api.post(`/api/follows/${userId}`),
  accept: (followId: number) => api.post(`/api/follows/${followId}/accept`),
  reject: (followId: number) => api.post(`/api/follows/${followId}/reject`),
  remove: (followId: number) => api.delete(`/api/follows/${followId}`),
  pending: () => api.get('/api/follows/pending'),
  state: (userId: number) => api.get(`/api/follows/state/${userId}`),
};

// Feed Services (Personalized feed, trending, discover)
export const feedService = {
  getPersonalized: (skip?: number, limit?: number, category?: string) =>
    api.get('/api/feed', { params: { skip, limit, category } }),
  getTrending: (skip?: number, limit?: number) =>
    api.get('/api/feed', { params: { skip, limit, category: 'trending' } }),
  getDiscover: (skip?: number, limit?: number) =>
    api.get('/api/feed', { params: { skip, limit } }),
  getFollowingFeed: (skip?: number, limit?: number) =>
    api.get('/api/feed', { params: { skip, limit } }),
};

// Pact Advanced Services
export const pactAdvancedService = {
  getPublicPacts: (skip?: number, limit?: number) =>
    api.get('/api/pacts', { params: { skip, limit } }),
  getMyPacts: async (skip?: number, limit?: number) => {
    const response = await api.get('/api/my-pacts', { params: { skip, limit } });
    return { ...response, data: (response.data || []).map(mapPact) };
  },
  getPactsByUser: async (userId: number, skip?: number, limit?: number) => {
    const response = await api.get(`/api/pacts/user/${userId}/created`, { params: { skip, limit } });
    return { ...response, data: (response.data || []).map(mapPact) };
  },
  getJoinedPactsByUser: async (userId: number, skip?: number, limit?: number) => {
    const response = await api.get(`/api/pacts/user/${userId}/joined`, { params: { skip, limit } });
    return { ...response, data: (response.data || []).map(mapPact) };
  },
  getVotedPactsByUser: async (userId: number, skip?: number, limit?: number) => {
    const response = await api.get(`/api/pacts/user/${userId}/voted`, { params: { skip, limit } });
    return { ...response, data: (response.data || []).map(mapPact) };
  },
  getPactsByCircle: (circleId: number, skip?: number, limit?: number) =>
    circleService.listPacts(circleId, skip, limit),
  searchPacts: (query: string, skip?: number, limit?: number) =>
    api.get('/api/pacts', { params: { skip, limit } }).then((response) => ({
      ...response,
      data: (response.data || []).filter((p: any) =>
        String(p.title || '').toLowerCase().includes(query.toLowerCase()) ||
        String(p.description || '').toLowerCase().includes(query.toLowerCase())
      ),
    })),
  getProofHistory: (pactId: number) =>
    api.get(`/api/pacts/${pactId}`),
};

// Verification Advanced Services
export const verificationAdvancedService = {
  listByPact: (pactId: number) =>
    api.get(`/api/verifications/${pactId}`),
  listByUser: (userId: number) =>
    api.get(`/api/verifications/${userId}`),
  submitVerification: (pactId: number, data: any) =>
    api.post(`/api/verifications/${pactId}`, data),
  getStats: (pactId: number) =>
    api.get(`/api/verifications/${pactId}/stats`),
};

// Circle Advanced Services
export const circleAdvancedService = {
  getPublicCircles: (skip?: number, limit?: number) =>
    api.get('/api/circles/public', { params: { skip, limit } }),
  searchCircles: (query: string, skip?: number, limit?: number) =>
    api.get('/api/circles/public', { params: { skip, limit } }).then((response) => ({
      ...response,
      data: (response.data || []).filter((c: any) =>
        String(c.name || '').toLowerCase().includes(query.toLowerCase()) ||
        String(c.description || '').toLowerCase().includes(query.toLowerCase())
      ),
    })),
  inviteUser: (circleId: number, userId: number, message?: string) =>
    api.post(`/api/circles/${circleId}/invite`, { user_id: userId, message }),
  removeMember: (circleId: number, userId: number) =>
    api.delete(`/api/circles/${circleId}/members/${userId}`),
  updateMember: (circleId: number, userId: number, data: any) =>
    api.put(`/api/circles/${circleId}/members/${userId}`, data),
  getLeaderboard: (circleId: number) =>
    api.get(`/api/circles/${circleId}/leaderboard`),
};

// Wallet Advanced Services
export const walletAdvancedService = {
  getBalance: () => walletService.get(),
  getLocked: () => walletService.get(),
  getRewards: () => walletService.get(),
  getHistory: (skip?: number, limit?: number) =>
    api.get('/api/wallet/transactions', { params: { skip, limit } }),
  initiateWithdrawal: (amount: number, method: string) =>
    api.post('/api/wallet/withdraw-request', { amount, method }),
  getWithdrawalRequests: () =>
    api.get('/api/wallet/withdrawal-requests'),
};

// Analytics Services
export const analyticsService = {
  getPactStats: (pactId: number) =>
    api.get(`/api/pacts/${pactId}/analytics`),
  getUserStats: (userId: number) =>
    api.get(`/api/users/${userId}/analytics`),
  getCircleStats: (circleId: number) =>
    api.get(`/api/circles/${circleId}/analytics`),
};

// Health Check
export const healthService = {
  check: () => api.get('/health'),
};

export default api;
