import axios, { AxiosInstance, AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

let token: string | null = null;

if (typeof window !== 'undefined') {
  token = localStorage.getItem('access_token');
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Bearer token to all requests and keep the token in sync with localStorage
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('access_token');
    console.log('[v0] Interceptor - localStorage.getItem(access_token):', storedToken);
    console.log('[v0] Interceptor - module-level token variable:', token);
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
  } else {
    console.log('[v0] Interceptor - NO TOKEN SET, Authorization header will NOT be added');
  }

  return config;
});

// Clear stale auth state when the backend rejects the token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;
    if (
      response &&
      response.status === 401 &&
      response.data &&
      typeof response.data.detail === 'string' &&
      response.data.detail.toLowerCase().includes('token')
    ) {
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

export const clearToken = () => {
  token = null;
  localStorage.removeItem('access_token');
};

// Auth Services
export const authService = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/auth/me'),
  verify: () => api.get('/api/auth/verify'),
  logout: () => api.post('/api/auth/logout'),
};

// Circle Services
export const circleService = {
  create: (data: any) => api.post('/api/circles', data),
  list: () => api.get('/api/circles'),
  getById: (id: number) => api.get(`/api/circles/${id}`),
  join: (id: number) => api.post(`/api/circles/${id}/join`),
  leave: (id: number) => api.post(`/api/circles/${id}/leave`),
};

export const circleJoinRequestService = {
  sendRequest: (circleId: number, message?: string) =>
    api.post(`/api/circles/${circleId}/join-request`, { request_message: message }),

  listPending: (circleId: number) =>
    api.get(`/api/circles/${circleId}/join-requests`),

  listUserRequests: (userId: number) =>
    api.get(`/api/users/${userId}/circle-join-requests`),

  approve: (circleId: number, requestId: number, message?: string) =>
    api.post(`/api/circles/${circleId}/join-requests/${requestId}/approve`,
      { response_message: message }),

  reject: (circleId: number, requestId: number, message?: string) =>
    api.post(`/api/circles/${circleId}/join-requests/${requestId}/reject`,
      { response_message: message }),

  withdraw: (circleId: number, requestId: number) =>
    api.post(`/api/circles/${circleId}/join-requests/${requestId}/withdraw`),

  listMembers: (circleId: number) => api.get(`/api/circles/${circleId}/members`),
};

// Pact Services
export const pactService = {
  create: (data: any) => api.post('/api/pacts', data),
  list: (params?: any) => api.get('/api/pacts', { params }),
  getById: (id: number) => api.get(`/api/pacts/${id}`),
  update: (id: number, data: any) => api.put(`/api/pacts/${id}`, data),
  uploadProof: (id: number, proofUrl: string) =>
    api.post(`/api/pacts/${id}/upload-proof`, {}, { params: { proof_url: proofUrl } }),
  uploadProofFile: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('proof_file', file);
    return api.post(`/api/pacts/${id}/upload-proof`, formData);
  },
};

// Pact Join Requests (NEW)
export const joinRequestService = {
  sendRequest: (pactId: number, message?: string) =>
    api.post(`/api/pacts/${pactId}/join-request`, { request_message: message }),
  
  listPending: (pactId: number) =>
    api.get(`/api/pacts/${pactId}/join-requests`),
  
  listUserRequests: (userId: number) =>
    api.get(`/api/users/${userId}/join-requests`),
  
  approve: (pactId: number, requestId: number, message?: string) =>
    api.post(`/api/pacts/${pactId}/join-requests/${requestId}/approve`, 
      { response_message: message }),
  
  reject: (pactId: number, requestId: number, message?: string) =>
    api.post(`/api/pacts/${pactId}/join-requests/${requestId}/reject`,
      { response_message: message }),
  
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
    api.post('/api/wallet/withdraw', {}, { params: { amount } }),
  getTransactions: () => api.get('/api/wallet/transactions'),
};

// Shorts Services (Feed, Reactions, Views)
export const shortsService = {
  getFeed: (skip?: number, limit?: number) =>
    api.get('/api/shorts/feed', { params: { skip, limit } }),
  react: (shortId: number, reactionType: string) =>
    api.post(`/api/shorts/${shortId}/react`, { reaction_type: reactionType }),
  recordView: (shortId: number) =>
    api.post(`/api/shorts/${shortId}/view`),
  getById: (shortId: number) =>
    api.get(`/api/shorts/${shortId}`),
};

// User Services
export const userService = {
  getById: (id: number) => api.get(`/api/users/${id}`),
  getByUsername: (username: string) => api.get(`/api/users/username/${username}`),
  update: (id: number, data: any) => api.put(`/api/users/${id}`, data),
  follow: (userId: number) => api.post(`/api/users/${userId}/follow`),
  unfollow: (userId: number) => api.delete(`/api/users/${userId}/follow`),
  getFollowers: (userId: number) => api.get(`/api/users/${userId}/followers`),
  getFollowing: (userId: number) => api.get(`/api/users/${userId}/following`),
  getStats: (userId: number) => api.get(`/api/users/${userId}/stats`),
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

// Feed Services (Personalized feed, trending, discover)
export const feedService = {
  getPersonalized: (skip?: number, limit?: number) =>
    api.get('/api/feed/personalized', { params: { skip, limit } }),
  getTrending: (skip?: number, limit?: number) =>
    api.get('/api/feed/trending', { params: { skip, limit } }),
  getDiscover: (skip?: number, limit?: number) =>
    api.get('/api/feed/discover', { params: { skip, limit } }),
  getFollowingFeed: (skip?: number, limit?: number) =>
    api.get('/api/feed/following', { params: { skip, limit } }),
};

// Pact Advanced Services
export const pactAdvancedService = {
  getPublicPacts: (skip?: number, limit?: number) =>
    api.get('/api/pacts/public', { params: { skip, limit } }),
  getPactsByUser: (userId: number, skip?: number, limit?: number) =>
    api.get(`/api/users/${userId}/pacts`, { params: { skip, limit } }),
  getPactsByCircle: (circleId: number, skip?: number, limit?: number) =>
    api.get(`/api/circles/${circleId}/pacts`, { params: { skip, limit } }),
  searchPacts: (query: string, skip?: number, limit?: number) =>
    api.get('/api/pacts/search', { params: { q: query, skip, limit } }),
  getProofHistory: (pactId: number) =>
    api.get(`/api/pacts/${pactId}/proof-history`),
};

// Verification Advanced Services
export const verificationAdvancedService = {
  listByPact: (pactId: number) =>
    api.get(`/api/pacts/${pactId}/verifications`),
  listByUser: (userId: number) =>
    api.get(`/api/users/${userId}/verifications`),
  submitVerification: (pactId: number, data: any) =>
    api.post(`/api/pacts/${pactId}/verify`, data),
  getStats: (pactId: number) =>
    api.get(`/api/pacts/${pactId}/verification-stats`),
};

// Circle Advanced Services
export const circleAdvancedService = {
  getPublicCircles: (skip?: number, limit?: number) =>
    api.get('/api/circles/public', { params: { skip, limit } }),
  searchCircles: (query: string, skip?: number, limit?: number) =>
    api.get('/api/circles/search', { params: { q: query, skip, limit } }),
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
  getBalance: () => api.get('/api/wallet/balance'),
  getLocked: () => api.get('/api/wallet/locked'),
  getRewards: () => api.get('/api/wallet/rewards'),
  getHistory: (skip?: number, limit?: number) =>
    api.get('/api/wallet/history', { params: { skip, limit } }),
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
