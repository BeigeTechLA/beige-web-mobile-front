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
 self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const notificationId = String(data.notification_id || '').trim();
  const roomId = String(data.room_id || data.chat_room_id || data.roomId || data.chatRoomId || '').trim();
  const meetingId = String(data.meeting_id || data.meetingId || '').trim();
  const topic = String(data.topic || data.category || '').toLowerCase();
  const target = notificationId
    ? '/admin/notifications?notificationId=' + encodeURIComponent(notificationId)
    : roomId ? '/admin/messages?roomId=' + encodeURIComponent(roomId)
    : meetingId ? '/admin/meetings?meetingId=' + encodeURIComponent(meetingId)
    : topic === 'shoots' ? '/admin/shoots' : '/admin/notifications';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      const navigated = await existing.navigate(target);
      return (navigated || existing).focus();
    }
    return self.clients.openWindow(target);
  })());
});
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
