/* eslint-disable no-undef */
// Firebase Cloud Messaging background service worker.
//
// This is a static asset served from the public root — Next.js does not
// run it through webpack/babel, so it can't read process.env or `import`
// npm packages the normal way. Firebase's own docs solve this with the
// compat SDK loaded via importScripts(), and the (non-secret) web config
// values are passed in as query params on the registration URL by
// getServiceWorkerRegistrationUrl() in src/lib/firebase.ts, then parsed
// back out below.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const params = new URL(self.location.href).searchParams;
const firebaseConfig = {
  apiKey: params.get('apiKey') || '',
  authDomain: params.get('projectId') ? `${params.get('projectId')}.firebaseapp.com` : '',
  projectId: params.get('projectId') || '',
  messagingSenderId: params.get('messagingSenderId') || '',
  appId: params.get('appId') || '',
};

// No real Firebase project exists yet, so these params are all empty
// strings on install. initializeApp() with blank config is harmless — the
// worker installs cleanly and simply never receives a push — so dropping in
// real values later just works with no changes here.
firebase.initializeApp(firebaseConfig);

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || 'CirclePact';
    const options = {
      body: payload?.notification?.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload?.data || {},
    };
    self.registration.showNotification(title, options);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
