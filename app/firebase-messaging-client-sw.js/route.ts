export const dynamic = "force-dynamic";

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_APP_ID,
  };

  return new Response(`self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const roomId = String(event.notification.data?.roomId || event.notification.data?.chatRoomId || "").trim();
  const meetingId = String(event.notification.data?.meetingId || "").trim();
  event.waitUntil((async () => {
    const targetPath = meetingId ? "/affiliate/meetings" : "/affiliate/messages";
    const openUrl = targetPath + (meetingId ? "?meetingId=" + encodeURIComponent(meetingId) : roomId ? "?roomId=" + encodeURIComponent(roomId) : "");
    const clientWindows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const targetWindow = clientWindows.find((client) => new URL(client.url).pathname === targetPath);
    if (targetWindow) {
      const navigatedWindow = await targetWindow.navigate(openUrl);
      return (navigatedWindow || targetWindow).focus();
    }
    return self.clients.openWindow(openUrl);
  })());
});
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
