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

const mapUser = (raw: any) => ({
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
});

const formatTimeRemaining = (endDateRaw: string | undefined) => {
  if (!endDateRaw) return null;

  const endDate = new Date(endDateRaw);
  if (Number.isNaN(endDate.getTime())) return null;

  const diffMs = endDate.getTime() - Date.now();
  if (diffMs <= 0) return 'Ended';

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) return 'Ends today';
  if (days <= 6) return `${days} day${days === 1 ? '' : 's'} left`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'} left`;
  return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'} left`;
};

const calculateCurrentDay = (startDateRaw: string | undefined, durationDaysRaw: number | undefined) => {
  if (!startDateRaw || !durationDaysRaw) return undefined;

  const startDate = new Date(startDateRaw);
  if (Number.isNaN(startDate.getTime())) return undefined;

  const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(elapsedDays, 1), Math.max(durationDaysRaw, 1));
};

const mapCircle = (raw: any) => ({
  ...raw,
  is_public: raw?.visibility === 'public',
  memberCount: raw?.member_count ?? 0,
  visibility: 'public',
});

const mapSupporter = (raw: any) => ({
  id: raw?.id,
  username: raw?.username,
  avatar_url: raw?.avatar_url ?? null,
});

const mapProof = (raw: any) => ({
  ...raw,
  proof_url: raw?.proof_url ?? raw?.file_url ?? null,
  file_url: raw?.file_url ?? raw?.proof_url ?? null,
  uploaded_at: raw?.uploaded_at ?? raw?.created_at ?? null,
});

const mapCheer = (raw: any) => ({
  id: raw?.id,
  pact_id: raw?.pact_id,
  sender_id: raw?.sender_id,
  sender_username: raw?.sender_username ?? raw?.username ?? null,
  sender_avatar_url: raw?.sender_avatar_url ?? raw?.avatar_url ?? null,
  photo_url: raw?.photo_url ?? raw?.file_url ?? null,
  created_at: raw?.created_at ?? null,
  expires_at: raw?.expires_at ?? null,
});

const normalizeListResponse = <T,>(response: any, mapper: (item: any) => T = (item) => item): any => {
  const payload = response.data;
  const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  const pagination = payload?.pagination ?? { skip: 0, limit: rows.length, total: rows.length };

  return {
    ...response,
    data: rows.map(mapper),
    pagination,
  };
};

const mapPact = (raw: any) => ({
  ...raw,
  pact_uuid: raw?.pact_uuid ?? String(raw?.id ?? ''),
  is_public: raw?.visibility === 'public',
  verification_type: raw?.verification_method,
  deadline: raw?.end_date,
  creator: raw?.creator_username ?? raw?.creator?.username ?? 'unknown',
  avatar: raw?.creator_username?.charAt(0)?.toUpperCase?.() ?? raw?.creator?.username?.charAt(0)?.toUpperCase?.() ?? '🔥',
  creatorAvatarUrl: raw?.creator_avatar_url ?? raw?.creator?.avatar_url ?? null,
  circle: raw?.circle_name ?? raw?.circle?.name ?? null,
  circleEmoji: raw?.circle_icon_emoji ?? null,
  daysTotal: Number(raw?.duration_days ?? 0) || undefined,
  daysCurrent: calculateCurrentDay(raw?.start_date, Number(raw?.duration_days ?? 0) || undefined),
  timeRemaining: formatTimeRemaining(raw?.end_date),
  believers: raw?.support_count ?? raw?.believers ?? 0,
  doubters: raw?.doubters ?? 0,
  support_count: raw?.support_count ?? raw?.believers ?? 0,
  recent_supporters: Array.isArray(raw?.recent_supporters) ? raw.recent_supporters.map(mapSupporter) : [],
  report_count: Number(raw?.report_count ?? 0),
  is_reported_by_me: Boolean(raw?.is_reported_by_me),
  is_joined_by_me: Boolean(raw?.is_joined_by_me),
  can_join: Boolean(raw?.can_join),
  proof_url: raw?.proof_url ?? null,
  proof_type: raw?.proof_type ?? null,
  latest_proof_caption: raw?.latest_proof_caption ?? null,
  latest_proof_upload_date: raw?.latest_proof_upload_date ?? null,
  comment_count: Number(raw?.comment_count ?? 0),
});

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
      // Guard against a reload loop: if some component fires an
      // authenticated request while already sitting on /auth/login (e.g.
      // before the session has hydrated), a hard redirect here would
      // reload the page, remount that component, and 401 again forever.
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/login')) {
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
    // Do not hardcode Content-Type here: the api instance's default
    // 'application/json' header must be explicitly cleared (not just
    // omitted) or it leaks onto this FormData request and the backend
    // rejects it with no CORS headers, which axios surfaces as an opaque
    // Network Error. Setting it to undefined lets the browser generate the
    // correct multipart boundary itself.
    const response = await api.post('/api/auth/avatar', formData, {
      headers: { 'Content-Type': undefined },
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
    return normalizeListResponse(response, mapCircle);
  },
  getById: async (id: number) => {
    const response = await api.get(`/api/circles/${id}`);
    return { ...response, data: mapCircle(response.data) };
  },
  listPublic: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/circles/public', { params: { skip, limit } });
    return normalizeListResponse(response, mapCircle);
  },
  join: (id: number) => api.post(`/api/circles/${id}/join`),
  leave: (id: number) => api.post(`/api/circles/${id}/leave`),
  listPacts: async (id: number, skip = 0, limit = 20) => {
    const response = await api.get(`/api/circles/${id}/pacts`, { params: { skip, limit } });
    return normalizeListResponse(response, mapPact);
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
    const normalized = normalizeListResponse(response, mapPact);
    if (params?.circle_id) {
      normalized.data = normalized.data.filter((p: any) => p.circle_id === params.circle_id);
    }
    return normalized;
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
    // See uploadAvatar above: Content-Type must be explicitly cleared, not
    // hardcoded to 'multipart/form-data', or the request 400s silently and
    // surfaces to the user as an opaque Network Error.
    return api.post(`/api/pacts/${id}/upload-proof-file`, formData, {
      headers: { 'Content-Type': undefined },
    });
  },
  listProofs: async (id: number, limit = 20, skip = 0) => {
    const response = await api.get(`/api/pacts/${id}/proofs`, { params: { skip, limit } });
    return normalizeListResponse(response, mapProof);
  },
  vote: (id: number, vote: 'support' | 'skip' | 'believe' | 'doubt') => {
    const path = vote === 'support' || vote === 'believe' ? 'vote-support' : 'vote-skip';
    return api.post(`/api/pacts/${id}/${path}`);
  },
  skip: (id: number) => api.post(`/api/pacts/${id}/vote-skip`),
  join: (id: number) => api.post(`/api/pacts/${id}/join`),
  report: (id: number, reason: 'fake_or_ai' | 'spam' | 'offensive') =>
    api.post(`/api/pacts/${id}/report`, { reason }),
  getReportCount: (id: number) => api.get(`/api/pacts/${id}/report-count`),
  getReportLogs: (id: number) => api.get(`/api/pacts/${id}/report-logs`),
  getMyReports: (skip = 0, limit = 20) =>
    api.get('/api/pacts/my-reports', { params: { skip, limit } }),
  getVotes: (id: number) => api.get(`/api/pacts/${id}/votes`),
  personalized: (skip = 0, limit = 20) => api.get('/api/pacts/feed/personalized', { params: { skip, limit } }),
};

// Cheers (photo-only encouragement posts from non-creator members)
export const cheerService = {
  create: (pactId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // The api instance sets a default 'Content-Type: application/json'
    // header. That default must be explicitly cleared here (not just
    // omitted) or it leaks onto this FormData request and the backend
    // rejects it. Setting it to undefined lets the browser generate the
    // correct multipart boundary itself.
    return api.post(`/api/pacts/${pactId}/cheers`, formData, {
      headers: { 'Content-Type': undefined },
    });
  },
  list: async (pactId: number, skip = 0, limit = 50) => {
    const response = await api.get(`/api/pacts/${pactId}/cheers`, { params: { skip, limit } });
    return normalizeListResponse(response, mapCheer);
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
    api.get(`/api/pacts/${pactId}/comments`, { params: { skip, limit } }).then((response) => normalizeListResponse(response)),
  
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
    api.get('/api/feed', { params: { skip, limit, category } }).then((response) => normalizeListResponse(response, mapPact)),
  getTrending: (skip?: number, limit?: number) =>
    api.get('/api/feed', { params: { skip, limit, category: 'trending' } }).then((response) => normalizeListResponse(response, mapPact)),
  getDiscover: (skip?: number, limit?: number) =>
    api.get('/api/feed', { params: { skip, limit } }).then((response) => normalizeListResponse(response, mapPact)),
  getFollowingFeed: (skip?: number, limit?: number) =>
    api.get('/api/feed', { params: { skip, limit } }).then((response) => normalizeListResponse(response, mapPact)),
};

// Pact Advanced Services
export const pactAdvancedService = {
  getPublicPacts: (skip?: number, limit?: number) =>
    api.get('/api/pacts', { params: { skip, limit } }).then((response) => normalizeListResponse(response, mapPact)),
  getMyPacts: async (skip?: number, limit?: number) => {
    const response = await api.get('/api/my-pacts', { params: { skip, limit } });
    return normalizeListResponse(response, mapPact);
  },
  getPactsByUser: async (userId: number, skip?: number, limit?: number) => {
    const response = await api.get(`/api/pacts/user/${userId}/created`, { params: { skip, limit } });
    return normalizeListResponse(response, mapPact);
  },
  getJoinedPactsByUser: async (userId: number, skip?: number, limit?: number) => {
    const response = await api.get(`/api/pacts/user/${userId}/joined`, { params: { skip, limit } });
    return normalizeListResponse(response, mapPact);
  },
  getVotedPactsByUser: async (userId: number, skip?: number, limit?: number) => {
    const response = await api.get(`/api/pacts/user/${userId}/voted`, { params: { skip, limit } });
    return normalizeListResponse(response, mapPact);
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

// Dare Services
// The backend's real field names are respond_by/complete_by/audience/
// recipient_count/my_recipient_status — NOT the respond_by_date/
// complete_by_date/visibility/*Count names an earlier pass assumed. Reading
// the wrong (always-undefined) fields is what produced "Invalid Date" and a
// permanently unreachable Claim flow. See src/types/index.ts for the full
// real Dare shape.
const mapDare = (raw: any) => ({
  ...raw,
  dare_uuid: raw?.dare_uuid ?? String(raw?.id ?? ''),
  recipientCount: raw?.recipient_count ?? raw?.recipients?.length ?? 0,
  isPendingForMe: raw?.my_recipient_status === 'pending',
  isAcceptedByMe: raw?.my_recipient_status === 'accepted',
  isCompletedByMe: raw?.my_recipient_status === 'completed',
  isDeclinedByMe: raw?.my_recipient_status === 'declined',
  creatorAvatarUrl: raw?.creator_avatar_url ?? raw?.creator?.avatar_url ?? null,
  timeRemaining: formatTimeRemaining(raw?.complete_by),
});

export const dareService = {
  create: async (data: any) => {
    const response = await api.post('/api/dares', data);
    return { ...response, data: mapDare(response.data) };
  },
  list: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/dares', { params: { skip, limit } });
    return normalizeListResponse(response, mapDare);
  },
  getFeed: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/dares/feed', { params: { skip, limit } });
    return normalizeListResponse(response, mapDare);
  },
  getMine: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/dares/mine', { params: { skip, limit } });
    return normalizeListResponse(response, mapDare);
  },
  getById: async (id: number) => {
    const response = await api.get(`/api/dares/${id}`);
    return { ...response, data: mapDare(response.data) };
  },
  claim: (id: number) => api.post(`/api/dares/${id}/claim`),
  accept: (id: number) => api.post(`/api/dares/${id}/accept`),
  decline: (id: number) => api.post(`/api/dares/${id}/decline`),
  uploadProof: (id: number, file: File, proofType: 'photo' | 'video' | 'checklist' = 'photo', caption?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('proof_type', proofType);
    if (caption) formData.append('caption', caption);
    // See uploadAvatar above: Content-Type must be explicitly cleared, not
    // hardcoded to 'multipart/form-data', or the request 400s silently and
    // surfaces to the user as an opaque Network Error.
    return api.post(`/api/dares/${id}/upload-proof`, formData, {
      headers: { 'Content-Type': undefined },
    });
  },
  verify: (id: number, data: any) => api.post(`/api/dares/${id}/verify`, data),
  cancel: (id: number) => api.delete(`/api/dares/${id}`),
  getRecipients: async (id: number, skip = 0, limit = 20) => {
    const response = await api.get(`/api/dares/${id}/recipients`, { params: { skip, limit } });
    return normalizeListResponse(response);
  },
  getStats: (id: number) => api.get(`/api/dares/${id}/verify/stats`),
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
