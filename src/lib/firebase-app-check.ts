import { getFirebaseApp } from "./firebase";

let appCheckInstance: any = null;

/**
 * Initializes Firebase App Check with zero-cost provider support.
 * In development / preview: uses CustomProvider / ReCaptchaV3Provider or debug tokens.
 * Zero-budget: Does NOT use billable reCAPTCHA Enterprise.
 */
export async function initAppCheck() {
    if (typeof window === "undefined") return null;
    if (appCheckInstance) return appCheckInstance;

    try {
        const app = getFirebaseApp();
        if (!app) return null;

        const { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } = await import("firebase/app-check");

        const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // standard test key

        // Controlled Rollout Mode
        if (import.meta.env.DEV) {
            // Self-hosted debug token for non-production environments
            (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }

        try {
            appCheckInstance = initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(siteKey),
                isTokenAutoRefreshEnabled: true
            });
        } catch {
            // Fallback to custom no-cost token provider if reCAPTCHA script blocked
            appCheckInstance = initializeAppCheck(app, {
                provider: new CustomProvider({
                    getToken: async () => ({
                        token: "codesrijan_dev_appcheck_token",
                        expireTimeMillis: Date.now() + 3600000
                    })
                }),
                isTokenAutoRefreshEnabled: true
            });
        }

        return appCheckInstance;
    } catch (err) {
        console.warn("[APP CHECK] App Check initialization deferred:", err);
        return null;
    }
}

/**
 * Retrieves the current App Check token string to attach to backend API requests.
 */
export async function getAppCheckToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;

    try {
        const appCheck = await initAppCheck();
        if (!appCheck) return null;

        const { getToken } = await import("firebase/app-check");
        const result = await getToken(appCheck, /* forceRefresh */ false);
        return result.token || null;
    } catch {
        return null;
    }
}
