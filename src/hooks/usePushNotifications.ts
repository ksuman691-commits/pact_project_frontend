'use client';

import { useCallback, useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import toast from 'react-hot-toast';
import {
  FCM_VAPID_KEY,
  getFirebaseMessaging,
  getServiceWorkerRegistrationUrl,
  isPushConfigured,
} from '@/lib/firebase';
import { pushService } from '@/services/api';

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

function readPermission(): PushPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }
  return Notification.permission as PushPermissionState;
}

/**
 * Orchestrates the FCM web-push permission flow: request permission,
 * register the service worker, get a token, and best-effort hand it to the
 * backend. Every step no-ops (rather than throwing) until a real Firebase
 * project's env vars exist — see src/lib/firebase.ts.
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('unsupported');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    setPermission(readPermission());
  }, []);

  const enablePush = useCallback(async () => {
    const currentPermission = readPermission();
    if (currentPermission === 'unsupported') {
      toast.error('Push notifications are not supported in this browser.');
      return false;
    }

    if (!isPushConfigured()) {
      // No Firebase project connected yet — surface this quietly rather
      // than pretending the subscription worked.
      console.log('[v0] Push notifications requested but Firebase is not configured yet.');
      toast.error('Push notifications are coming soon.');
      return false;
    }

    setIsSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);
      if (result !== 'granted') return false;

      const registration = await navigator.serviceWorker.register(getServiceWorkerRegistrationUrl());
      const messaging = await getFirebaseMessaging();
      if (!messaging) return false;

      const fcmToken = await getToken(messaging, {
        vapidKey: FCM_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      if (!fcmToken) return false;

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        await pushService.subscribe(fcmToken, timezone);
      } catch (error: any) {
        // Endpoint isn't deployed yet (see BACKEND_SPEC_PUSH_NOTIFICATIONS.md)
        // — the permission grant and token are still real, only the
        // server-side persistence is missing, so this stays silent to the
        // user rather than reading as a broken feature.
        console.log('[v0] pushService.subscribe not available yet:', error?.response?.status);
      }

      toast.success("You're set — we'll remind you to keep your streak alive.");
      return true;
    } catch (error) {
      console.log('[v0] Failed to enable push notifications:', error);
      toast.error('Could not turn on reminders. Try again later.');
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  // Foreground messages (app open + tab focused) don't trigger the service
  // worker's onBackgroundMessage — FCM delivers those via onMessage instead.
  useEffect(() => {
    if (permission !== 'granted' || !isPushConfigured()) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    getFirebaseMessaging().then((messaging) => {
      if (!messaging || cancelled) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload?.notification?.title;
        const body = payload?.notification?.body;
        if (title) toast(body ? `${title} — ${body}` : title);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [permission]);

  return { permission, isSubscribing, enablePush };
}
