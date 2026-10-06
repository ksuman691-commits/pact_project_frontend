import { create } from 'zustand';
import { User } from '@/types';
import { authService, clearToken, getRefreshToken, setAuthTokens, setToken } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  register: (username: string, email: string, full_name: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  initAuth: () => Promise<void>;
  completeAgeVerification: (dateOfBirth: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  register: async (username, email, full_name, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({
        username,
        email,
        full_name,
        password,
      });
      const { access_token, refresh_token } = response.data;
      setAuthTokens(access_token, refresh_token);
      const profile = await authService.getProfile();
      set({ user: profile.data, token: access_token, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Registration failed',
        isLoading: false,
      });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      const { access_token, refresh_token } = response.data;
      setAuthTokens(access_token, refresh_token);
      const profile = await authService.getProfile();
      set({ user: profile.data, token: access_token, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Login failed',
        isLoading: false,
      });
      throw err;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.googleLogin({ id_token: idToken });
      const { access_token, refresh_token } = response.data;
      setAuthTokens(access_token, refresh_token);
      const profile = await authService.getProfile();
      set({ user: profile.data, token: access_token, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Google sign-in failed',
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearToken();
      set({ user: null, token: null, error: null });
    }
  },

  setUser: (user) => set({ user }),

  // Called once, right after a first-time user passes the client-side
  // 18+ check on /verify-age — never before that check, so this action
  // never has to re-validate age itself. PATCH /api/users/me is the source
  // of truth: the user only counts as verified once the backend returned
  // their saved date of birth. Failures are never papered over locally —
  // a local-only "verified" state made every later create call 403 with
  // missing_date_of_birth. Transient failures (the free Render backend can
  // take 50s+ to wake) are retried; if it still fails the error propagates
  // so VerifyAgePage can tell the user to try again. An underage_user 403
  // is the backend's real rejection and is never retried.
  completeAgeVerification: async (dateOfBirth) => {
    const ATTEMPTS = 3;
    const ATTEMPT_TIMEOUT_MS = 20000;
    const RETRY_DELAY_MS = 2000;

    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
      try {
        const response = await authService.verifyAge(dateOfBirth, ATTEMPT_TIMEOUT_MS);
        set({ user: response.data });
        return;
      } catch (err: any) {
        const status = err?.response?.status;
        const isUnderage = status === 403 && err?.response?.data?.detail?.code === 'underage_user';
        const isTransient = !status || status >= 500 || status === 408 || status === 429;
        if (isUnderage || !isTransient || attempt === ATTEMPTS) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const storedToken =
        typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const storedRefreshToken = getRefreshToken();

      if (!storedToken && !storedRefreshToken) {
        set({ user: null, token: null, isLoading: false, isInitialized: true });
        return;
      }

      if (storedToken) {
        setToken(storedToken);
      }

      try {
        await authService.verify();
      } catch {
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshed = await authService.refresh(storedRefreshToken);
        const newAccessToken = refreshed.data?.access_token;
        const newRefreshToken = refreshed.data?.refresh_token;
        if (!newAccessToken || !newRefreshToken) {
          throw new Error('Invalid refresh response');
        }
        setAuthTokens(newAccessToken, newRefreshToken);
      }

      const profile = await authService.getProfile();
      const activeToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      set({
        user: profile.data,
        token: activeToken,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err: any) {
      clearToken();
      set({ user: null, token: null, isLoading: false, isInitialized: true });
    }
  },
}));
