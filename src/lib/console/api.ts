'use client';

import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * The console's own API client. It never sends the app's login, and the app's
 * client never sends this one: a console session lives only in this tab
 * (sessionStorage), so closing the tab signs you out.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pact-project-backend-v2.onrender.com';
const KEY = 'cp_console_session';

export type TeamRole = 'owner' | 'staff' | 'moderator' | 'creator';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: TeamRole;
  status: 'invited' | 'active' | 'removed';
  two_step: boolean;
  backup_codes_left: number;
  last_sign_in_at: string | null;
  invite_expires_at: string | null;
  created_at: string;
}

export interface ActivityRow {
  id: number;
  at: string;
  actor_name: string | null;
  actor_role: TeamRole | null;
  category: 'sign_in' | 'team' | 'dares' | 'drafts' | 'reports';
  action: string;
  summary: string;
  ok: boolean;
  ip: string | null;
  user_agent: string | null;
}

export type DayState = 'live' | 'scheduled' | 'ended' | 'ended_early' | 'empty' | 'none';

export interface ScheduleDay {
  date: string;
  today: boolean;
  state: DayState;
  dare_id: number | null;
  title: string | null;
  description: string | null;
  curated_content_id: number | null;
  verification_method: 'photo' | 'video' | null;
  joined: number;
  took: number;
}

export interface Draft {
  id: number;
  type: 'dare' | 'pact';
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'approved' | 'rejected';
  source: 'ai_generated' | 'manual';
  created_at: string;
  updated_at: string;
  created_by_member_id: number | null;
  created_by_name: string | null;
  reviewed_by_name: string | null;
  review_note: string | null;
  mine: boolean;
  used_on: string | null;
}

export interface ReportItem {
  dare_id: number;
  title: string;
  description: string;
  creator_username: string | null;
  is_official: boolean;
  hidden: boolean;
  open_reports: number;
  reasons: Record<string, number>;
  notes: string[];
  first_reported_at: string;
  created_at: string | null;
  audience: string | null;
  recipients: number;
  accepted: number;
  reward_amount: number | null;
  resolved_at: string | null;
}

export type Proof = 'photo' | 'video';

export const consoleSession = {
  get: (): string | null => {
    try {
      return window.sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      window.sessionStorage.setItem(KEY, token);
    } catch {
      // Private mode without storage: the session lasts until the page reloads.
    }
  },
  clear: () => {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

const client = axios.create({ baseURL: `${API_URL}/api/console`, headers: { 'Content-Type': 'application/json' } });

client.interceptors.request.use((config) => {
  const token = consoleSession.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Set by ConsoleFrame: asks for a fresh code and resolves true once it's accepted. */
let askForCode: (() => Promise<boolean>) | null = null;
export function setCodePrompt(prompt: (() => Promise<boolean>) | null) {
  askForCode = prompt;
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string }>) => {
    const config = error.config as (AxiosRequestConfig & { _reauthed?: boolean }) | undefined;
    if (error.response?.status === 403 && error.response.data?.detail === 'reauth_required' && config && !config._reauthed && askForCode) {
      if (await askForCode()) {
        config._reauthed = true;
        return client.request(config);
      }
    }
    if (error.response?.status === 401 && consoleSession.get() && !config?.url?.startsWith('/auth/')) {
      consoleSession.clear();
      if (typeof window !== 'undefined') window.location.assign('/console/sign-in?expired=1');
    }
    return Promise.reject(error);
  },
);

export function errorText(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  const detail = (error as AxiosError<{ detail?: unknown }>)?.response?.data?.detail;
  if (typeof detail === 'string' && detail !== 'reauth_required') return detail;
  if (Array.isArray(detail)) return 'Check the details and try again.';
  return fallback;
}

export const consoleApi = {
  signIn: (email: string, password: string) => client.post<{ challenge: string }>('/auth/sign-in', { email, password }).then((r) => r.data),
  verify: (challenge: string, code: { code?: string; backup_code?: string }) =>
    client.post<{ token: string; member: TeamMember }>('/auth/verify', { challenge, ...code }).then((r) => r.data),
  reauth: (code: string) => client.post('/auth/reauth', { code }).then((r) => r.data),
  signOut: () => client.post('/auth/sign-out').then((r) => r.data),
  me: () => client.get<{ member: TeamMember; session_expires_at: string }>('/me').then((r) => r.data),

  setupInfo: (token: string) => client.get<{ name: string; email: string; role: TeamRole; step: 'password' | 'authenticator' }>(`/setup/${token}`).then((r) => r.data),
  setupPassword: (token: string, password: string) =>
    client.post<{ secret: string; otpauth_uri: string }>(`/setup/${token}/password`, { password }).then((r) => r.data),
  setupAuthenticator: (token: string, code: string) =>
    client.post<{ token: string; member: TeamMember; backup_codes: string[] }>(`/setup/${token}/authenticator`, { code }).then((r) => r.data),

  team: () => client.get<TeamMember[]>('/team').then((r) => r.data),
  invite: (body: { name: string; email: string; role: TeamRole }) =>
    client.post<{ member: TeamMember; invite_link: string; emailed: boolean }>('/team', body).then((r) => r.data),
  resend: (id: number) => client.post<{ member: TeamMember; invite_link: string; emailed: boolean }>(`/team/${id}/resend`).then((r) => r.data),
  changeRole: (id: number, role: TeamRole) => client.patch<TeamMember>(`/team/${id}`, { role }).then((r) => r.data),
  resetAccess: (id: number) => client.post<{ member: TeamMember; invite_link: string; emailed: boolean }>(`/team/${id}/reset`).then((r) => r.data),
  remove: (id: number) => client.delete(`/team/${id}`).then((r) => r.data),

  activity: (params: { category?: string; days?: number }) => client.get<ActivityRow[]>('/activity', { params }).then((r) => r.data),

  schedule: () => client.get<ScheduleDay[]>('/schedule').then((r) => r.data),
  scheduleDay: (body: { live_on: string; curated_content_id?: number; title?: string; description?: string; verification_method: Proof }) =>
    client.post('/dares/official', body).then((r) => r.data),
  swapDay: (dareId: number, body: { curated_content_id?: number; title?: string; description?: string; verification_method: Proof }) =>
    client.put(`/dares/${dareId}`, body).then((r) => r.data),
  clearDay: (dareId: number) => client.delete(`/dares/${dareId}`).then((r) => r.data),
  endEarly: (dareId: number) => client.post(`/dares/${dareId}/end`).then((r) => r.data),

  drafts: (status?: Draft['status']) => client.get<Draft[]>('/drafts', { params: { type: 'dare', ...(status ? { status } : {}) } }).then((r) => r.data),
  writeDraft: (body: { title: string; description: string; category: string }) =>
    client.post<Draft>('/drafts', { type: 'dare', source: 'manual', ...body }).then((r) => r.data),
  editDraft: (id: number, body: { title?: string; description?: string; category?: string }) => client.patch<Draft>(`/drafts/${id}`, body).then((r) => r.data),
  approve: (id: number) => client.post<Draft>(`/drafts/${id}/approve`).then((r) => r.data),
  reject: (id: number, reason: string) => client.post<Draft>(`/drafts/${id}/reject`, { reason }).then((r) => r.data),

  reports: (status: 'open' | 'dismissed' | 'removed' = 'open') => client.get<ReportItem[]>('/reports', { params: { status } }).then((r) => r.data),
  dismissReports: (dareId: number) => client.post(`/reports/${dareId}/dismiss`).then((r) => r.data),
  removeReported: (dareId: number) => client.post(`/reports/${dareId}/remove`).then((r) => r.data),
};
