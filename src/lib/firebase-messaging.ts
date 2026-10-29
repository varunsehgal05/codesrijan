import { getFirebaseApp } from "./firebase";
import axios from "axios";
import { API_BASE } from "./utils";

export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

let messagingInstance: any = null;

/**
 * Checks if browser supports Web Push and Firebase Cloud Messaging.
 */
export async function isPushSupported(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        return false;
    }
    try {
        const { isSupported } = await import("firebase/messaging");
        return await isSupported();
    } catch {
        return false;
    }
}

/**
 * Initializes Firebase Cloud Messaging for Web Push.
 */
export async function initMessaging() {
    if (messagingInstance) return messagingInstance;
    const supported = await isPushSupported();
    if (!supported) return null;

    try {
        const app = getFirebaseApp();
        if (!app) return null;
        const { getMessaging } = await import("firebase/messaging");
        messagingInstance = getMessaging(app);
        return messagingInstance;
    } catch (err) {
        console.warn("[FCM] Messaging initialization skipped:", err);
        return null;
    }
}

/**
 * Requests browser push notification permission following explicit user interaction.
 * Spark Plan — Zero cost.
 */
export async function requestNotificationPermission(): Promise<{ granted: boolean; token?: string; error?: string }> {
    if (typeof window === "undefined" || !("Notification" in window)) {
        return { granted: false, error: "Notifications not supported on this platform" };
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            return { granted: false, error: "Notification permission denied by user" };
        }

        const messaging = await initMessaging();
        if (!messaging) {
            return { granted: false, error: "Firebase Messaging could not be initialized" };
        }

        // Register Service Worker
        let swRegistration: ServiceWorkerRegistration | undefined;
        if ("serviceWorker" in navigator) {
            swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
                scope: "/"
            });
            await navigator.serviceWorker.ready;
        }

        const { getToken } = await import("firebase/messaging");
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BOH7E_Vapid_Mock_Key_For_Zero_Budget_Dev";

        let token: string | undefined;
        try {
            token = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: swRegistration
            });
        } catch (tokenErr: any) {
            console.warn("[FCM] Token retrieval note:", tokenErr.message);
        }

        if (token) {
            await syncTokenWithBackend(token);
            localStorage.setItem("codesrijan_fcm_token", token);
            localStorage.setItem("codesrijan_push_enabled", "true");
            return { granted: true, token };
        }

        return { granted: true };
    } catch (e: any) {
        console.error("[FCM] Error requesting notification permission:", e);
        return { granted: false, error: e.message || "Failed to enable notifications" };
    }
}

/**
 * Syncs the FCM device push token with the authenticated user profile in MongoDB.
 */
export async function syncTokenWithBackend(fcmToken: string): Promise<boolean> {
    try {
        const token = localStorage.getItem("codesrijan_auth_token");
        if (!token) return false;

        await axios.post(
            `${API_BASE}/notifications/fcm-token`,
            { fcmToken },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return true;
    } catch (err) {
        console.warn("[FCM] Failed to sync token with backend:", err);
        return false;
    }
}

/**
 * Unregisters the push token when user logs out or disables notifications.
 */
export async function unregisterPushToken(): Promise<void> {
    const existingToken = localStorage.getItem("codesrijan_fcm_token");
    if (!existingToken) return;

    try {
        const token = localStorage.getItem("codesrijan_auth_token");
        if (token) {
            await axios.delete(`${API_BASE}/notifications/fcm-token`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { fcmToken: existingToken }
            });
        }
    } catch (e) {
        // quiet ignore
    } finally {
        localStorage.removeItem("codesrijan_fcm_token");
        localStorage.setItem("codesrijan_push_enabled", "false");
    }
}

/**
 * Listens for incoming push messages while the application is in foreground.
 */
export async function onForegroundMessage(handler: (payload: PushNotificationPayload) => void) {
    const messaging = await initMessaging();
    if (!messaging) return () => {};

    try {
        const { onMessage } = await import("firebase/messaging");
        return onMessage(messaging, (payload) => {
            const title = payload.notification?.title || payload.data?.title || "CodeSrijan Alert";
            const body = payload.notification?.body || payload.data?.body || "";
            handler({ title, body, data: payload.data as any });
        });
    } catch {
        return () => {};
    }
}
