// MyFrequentRewards member area service worker (Nov 2026).
// - Offline: if a page in the member area can't load, show /member/offline.html. Nothing else is cached, so members
//   always see fresh points and surveys; API calls are never cached.
// - Push: shows notifications sent by the API (only when push is switched on there). Clicks open a page on this site.
const CACHE = "mfr-member-v1";
const OFFLINE = "/member/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/member/pwa-192.png"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.mode !== "navigate") return; // only page loads; everything else goes straight to the network
  e.respondWith(fetch(r).catch(() => caches.match(OFFLINE)));
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "MyFrequentRewards", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "MyFrequentRewards", {
    body: d.body || "",
    icon: "/member/pwa-192.png",
    badge: "/member/pwa-192.png",
    data: { url: typeof d.url === "string" && d.url.startsWith("/") && !d.url.startsWith("//") ? d.url : "/member/dashboard" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || "/member/dashboard", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url === url && "focus" in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
