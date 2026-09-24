export const dynamic = "force-dynamic";

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const script = `
    importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');
    firebase.initializeApp(${JSON.stringify(config)});
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || 'New notification';
      const options = {
        body: payload.notification?.body || 'You have a new notification.',
        icon: '/icon.png',
        data: payload.data || {},
      };
      self.registration.showNotification(title, options);
    });
    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      event.waitUntil((async () => {
        const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        if (windows.length) return windows[0].focus();
        return clients.openWindow('/');
      })());
    });
  `;

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Service-Worker-Allowed': '/',
    },
  });
}
