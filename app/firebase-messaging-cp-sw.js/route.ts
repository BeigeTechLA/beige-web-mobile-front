export const dynamic = "force-dynamic";

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_CP_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_CP_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_CP_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_CP_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_CP_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_CP_APP_ID,
  };

  return new Response(`self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const roomId = String(event.notification.data?.roomId || event.notification.data?.chatRoomId || "").trim();
  event.waitUntil((async () => {
    const openUrl = "/creator/dashboard/messages" + (roomId ? "?roomId=" + encodeURIComponent(roomId) : "");
    const clientWindows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const chatWindow = clientWindows.find((client) => new URL(client.url).pathname === "/creator/dashboard/messages");
    if (chatWindow) {
      const navigatedWindow = await chatWindow.navigate(openUrl);
      return (navigatedWindow || chatWindow).focus();
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
