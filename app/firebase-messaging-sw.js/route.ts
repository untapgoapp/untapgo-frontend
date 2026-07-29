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