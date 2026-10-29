// CodeSrijan Firebase Cloud Messaging Background Service Worker
// Spark Free Tier — Zero-Budget Compliant ($0/month)

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyDGopQeGYjr8VpCJabp-awqMggU0QQIQBA",
    authDomain: "codesrijan-450d0.firebaseapp.com",
    projectId: "codesrijan-450d0",
    storageBucket: "codesrijan-450d0.firebasestorage.app",
    messagingSenderId: "317367993311",
    appId: "1:317367993311:web:3a57a91fe219428eedfa6a"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("[FCM-SW] Received background message:", payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || "CodeSrijan Platform Alert";
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || "New update regarding your hackathon squad or competition.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: payload.data || {},
        tag: payload.data?.tag || "codesrijan-notification"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/dashboard";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(targetUrl) && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
