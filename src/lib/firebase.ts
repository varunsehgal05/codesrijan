import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

/**
 * Unified CodeSrijan Firebase Web Configuration
 * Spark Free Tier — Zero-Budget Compliant ($0/month)
 */
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDGopQeGYjr8VpCJabp-awqMggU0QQIQBA",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "codesrijan-450d0.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "codesrijan-450d0",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "codesrijan-450d0.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "317367993311",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:317367993311:web:3a57a91fe219428eedfa6a",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9QG67L359H"
};

let app: FirebaseApp | null = null;

/**
 * Returns the singleton FirebaseApp instance with SSR safety and duplicate initialization guards.
 */
export function getFirebaseApp(): FirebaseApp | null {
    if (typeof window === "undefined") {
        return null;
    }

    if (!app) {
        const existing = getApps();
        if (existing.length > 0) {
            app = existing[0];
        } else {
            app = initializeApp(firebaseConfig);
        }
    }
    return app;
}

export default getFirebaseApp();
