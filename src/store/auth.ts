import { create } from 'zustand';
import { User } from '@/types';
import { authService, clearToken, getRefreshToken, setAuthTokens, setToken } from '@/services/api';
import { markAgeVerifiedLocally } from '@/lib/ageVerification';

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
  // never has to re-validate age itself. POST /api/auth/verify-age isn't
  // live yet (see BACKEND_SPEC_CONTENT_MODERATION.md), so a 404/network
  // failure here still counts as "verified" locally rather than trapping
  // every user behind a gate the backend can't yet satisfy; once the
  // endpoint ships, its response becomes the source of truth and this
  // fallback stops mattering.
  completeAgeVerification: async (dateOfBirth) => {
    const currentUser = get().user;
    set({ user: currentUser ? { ...currentUser, date_of_birth: dateOfBirth } : currentUser });
    markAgeVerifiedLocally(currentUser?.user_uuid);

    try {
      const response = await authService.verifyAge(dateOfBirth);
      set({ user: response.data });
    } catch (err) {
      console.log('[v0] /api/auth/verify-age not available yet — proceeding with local-only verification', err);
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
