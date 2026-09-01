import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pact-project-backend-v2.onrender.com';

/**
 * A deliberately bare axios instance for public, unauthenticated routes
 * (e.g. the Circle Wall). It must NEVER attach an Authorization header and
 * must NEVER share the `api` instance's response interceptor — that
 * interceptor redirects to /auth/login on a 401, which would incorrectly
 * bounce a logged-out visitor away from a page that is supposed to work
 * without an account. Keep this instance's request/response pipeline
 * completely plain.
 */
export const publicApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
