export const dynamic = "force-dynamic";

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_APP_ID,
  };

  return new Response(`self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(config)});
firebase.messaging().onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title || 'New notification', {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/icon.png',
    data: payload.data || {},
  });
});`, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Service-Worker-Allowed': '/' },
  });
}
