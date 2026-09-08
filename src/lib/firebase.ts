import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

/**
 * Firebase Web SDK config for FCM (Firebase Cloud Messaging).
 *
 * These are all NEXT_PUBLIC_* because the Firebase web config values are
 * meant to ship to the browser — they identify the project, they are not
 * secrets (see https://firebase.google.com/docs/projects/api-keys).
 *
 * No real Firebase project exists yet — the user has not created one. Every
 * function below treats a missing config value as "push not configured"
 * and no-ops instead of throwing, so the rest of the app keeps working
 * unmodified. Once a project exists, set these env vars and everything
 * here starts working with no code changes:
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_VAPID_KEY (Web Push certificate key pair)
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
    : '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const FCM_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

/** True once a real Firebase project's config has been provided via env vars. */
export function isPushConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      FCM_VAPID_KEY
  );
}

let appInstance: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (!isPushConfigured()) return null;
  if (appInstance) return appInstance;
  appInstance = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  return appInstance;
}

/** Resolves to null when unconfigured, unsupported (SSR, old browser), or FCM isn't available. */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const app = getFirebaseApp();
  if (!app) return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  return getMessaging(app);
}

/**
 * firebase-messaging-sw.js (public/) is a static file — Next.js does not
 * run it through webpack/babel, so it can't read process.env or import npm
 * packages the normal way. The (non-secret) config values are passed as
 * query params on the registration URL and parsed back out inside the
 * worker itself.
 */
export function getServiceWorkerRegistrationUrl(): string {
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}
