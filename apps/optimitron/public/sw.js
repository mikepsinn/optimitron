/// <reference lib="webworker" />

// Push notification service worker for Optimitron PWA

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();

  const options = {
    body: payload.body ?? "Time for a quick check-in!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: payload.tag ?? "daily-checkin",
    renotify: true,
    data: { url: payload.url ?? "/profile" },
    actions: payload.actions ?? [
      { action: "rate", title: "Rate Now" },
      { action: "chat", title: "Open Chat" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      payload.title ?? "How are you feeling?",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let targetUrl = "/profile";

  if (event.action === "chat") {
    targetUrl = "/chat";
  } else if (event.notification.data?.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if one is open
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
