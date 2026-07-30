const FIREBASE_COMPAT_VERSION = "10.13.2";

export const dynamic = "force-dynamic";

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export async function GET() {
  const config = getFirebaseConfig();
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    return new Response(
      `console.error(${JSON.stringify(
        `UntapGo Firebase config is missing: ${missing.join(", ")}`,
      )});`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
          "Service-Worker-Allowed": "/",
        },
      },
    );
  }

  const source = `
function untapgoSafeHref(data) {
  const explicit = typeof data?.href === "string" ? data.href.trim() : "";
  if (explicit.startsWith("/") && !explicit.startsWith("//")) return explicit;
  const eventId = typeof data?.event_id === "string" ? data.event_id.trim() : "";
  return eventId ? "/events/" + encodeURIComponent(eventId) : "/notifications";
}

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener("notificationclick", function (event) {
  event.stopImmediatePropagation();
  event.notification.close();
  const message = event.notification.data?.FCM_MSG;
  const href = untapgoSafeHref(message?.data || event.notification.data);
  const target = new URL(href, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windows) {
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          return client.focus().then(function (focused) {
            return "navigate" in focused ? focused.navigate(target) : focused;
          });
        }
      }
      return clients.openWindow(target);
    })
  );
});

importScripts("https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});
firebase.messaging();
`;

  return new Response(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Service-Worker-Allowed": "/",
    },
  });
}
