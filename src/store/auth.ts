import { create } from 'zustand';
import { User } from '@/types';
import { authService, setToken, clearToken } from '@/services/api';

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
      const { access_token } = response.data;
      setToken(access_token);
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
      const { access_token } = response.data;
      setToken(access_token);
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

      if (!storedToken) {
        set({ user: null, token: null, isLoading: false, isInitialized: true });
        return;
      }

      setToken(storedToken);
      await authService.verify();
      const profile = await authService.getProfile();

      set({
        user: profile.data,
        token: storedToken,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err: any) {
      clearToken();
      set({ user: null, token: null, isLoading: false, isInitialized: true });
    }
  },
}));
