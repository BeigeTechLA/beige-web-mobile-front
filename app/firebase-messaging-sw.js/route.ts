export const dynamic = "force-dynamic";

// Legacy root-scope Firebase worker. The web app now registers separate,
// configured workers for admin, creator and client dashboards. Existing
// browsers may still have this worker installed; retire it without loading
// Firebase with the removed generic NEXT_PUBLIC_FIREBASE_* configuration.
export function GET() {
  return new Response(`self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister());
});`, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Service-Worker-Allowed': '/',
    },
  });
}
