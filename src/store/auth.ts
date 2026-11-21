import { create } from 'zustand';
import { User } from '@/types';
import { authService, cacheProfile, clearToken, getRefreshToken, readCachedProfile, setAuthTokens, setToken } from '@/services/api';
import { isTransientError, retryBackoff } from '@/lib/transient';
import { consentPayload, type ConsentChoices } from '@/lib/consent';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  register: (username: string, email: string, full_name: string, password: string, date_of_birth: string, consent: ConsentChoices) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  /** consent is needed only when the Google account is new; without it a new account gets 409 consent_required. */
  loginWithGoogle: (idToken: string, consent?: ConsentChoices) => Promise<void>;
  /** Existing accounts accepting the current Terms and Privacy Policy (/consent). */
  acceptConsent: (consent: ConsentChoices) => Promise<void>;
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

  register: async (username, email, full_name, password, date_of_birth, consent) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({
        username,
        email,
        full_name,
        password,
        date_of_birth,
        ...consentPayload(consent),
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

  loginWithGoogle: async (idToken, consent) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.googleLogin({ id_token: idToken, ...(consent ? consentPayload(consent) : {}) });
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

  acceptConsent: async (consent) => {
    await authService.acceptConsent(consentPayload(consent));
    const profile = await authService.getProfile();
    set({ user: profile.data });
  },

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

  // Opens from the saved profile straight away when there is one, then checks the
  // session with the server. A slow or unreachable server is retried and never
  // signs anyone out; only the server rejecting the session does (the API client
  // refreshes an expired access token on its own and sends people to log in when
  // the refresh token is no longer valid).
  initAuth: async () => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const storedRefreshToken = getRefreshToken();

    if (!storedToken && !storedRefreshToken) {
      set({ user: null, token: null, isLoading: false, isInitialized: true });
      return;
    }
    if (storedToken) setToken(storedToken);

    const cached = readCachedProfile<User>();
    if (cached) set({ user: cached, token: storedToken, isLoading: false, isInitialized: true });
    else set({ isLoading: true });

    const ATTEMPTS = 4;
    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
      try {
        const profile = await authService.getProfile(20000);
        set({
          user: profile.data,
          token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
          isLoading: false,
          isInitialized: true,
        });
        return;
      } catch (err) {
        if (!isTransientError(err)) {
          clearToken();
          set({ user: null, token: null, isLoading: false, isInitialized: true });
          return;
        }
        if (attempt === ATTEMPTS - 1) {
          // Still can't reach the server. Keep the tokens: with a saved profile the app
          // carries on (its screens retry); without one, sign-in is the only way forward.
          set({ isLoading: false, isInitialized: true });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, retryBackoff(attempt)));
      }
    }
  },
}));

// Keep the saved profile in step with every sign-in and profile change.
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state, previous) => {
    if (state.user && state.user !== previous.user) cacheProfile(state.user);
  });
}
