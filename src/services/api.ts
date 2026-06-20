import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      token = storedToken;
    }
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
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

// Shorts Services
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

// Health Check
export const healthService = {
  check: () => api.get('/health'),
};

export default api;
