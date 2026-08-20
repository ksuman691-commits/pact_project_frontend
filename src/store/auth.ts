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
  logout: () => void;
  setUser: (user: User | null) => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
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
