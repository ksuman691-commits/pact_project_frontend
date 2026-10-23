/* CirclePact service worker: shows push reminders and opens the right screen on tap.
 * Standard Web Push (no Firebase). The payload is JSON from the backend:
 * { kind, title, body, url, tag }.
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'CirclePact', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'CirclePact'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      // One reminder per day replaces the previous one instead of stacking.
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || '/feed' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL((event.notification.data && event.notification.data.url) || '/feed', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue
        try {
          // A full navigation, so the page reads ?checkin= fresh and opens the camera.
          const navigated = 'navigate' in client ? await client.navigate(target) : null
          const shown = navigated || client
          try {
            await shown.focus()
          } catch (e) {
            // Focus can be refused; the navigation already happened.
          }
          if (navigated) return undefined
        } catch (e) {
          // An app window we don't control yet can't be navigated: open a fresh one below.
        }
        break
      }
      return self.clients.openWindow(target)
    })(),
  )
})
