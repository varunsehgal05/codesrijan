import { getFirebaseApp } from "./firebase";

let analyticsInstance: any = null;

const CONSENT_STORAGE_KEY = "codesrijan_analytics_consent";

/**
 * Checks user consent for telemetry/analytics. Defaults to granted unless explicitly opted out.
 */
export function hasAnalyticsConsent(): boolean {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored !== "declined";
}

/**
 * Updates user consent preference.
 */
export function setAnalyticsConsent(granted: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(CONSENT_STORAGE_KEY, granted ? "granted" : "declined");
}

/**
 * Initializes Firebase Analytics conditionally based on browser capability and consent.
 * Zero-budget Spark plan compliant.
 */
export async function initAnalytics() {
    if (typeof window === "undefined" || !hasAnalyticsConsent()) return null;
    if (analyticsInstance) return analyticsInstance;

    try {
        const { isSupported, getAnalytics } = await import("firebase/analytics");
        const supported = await isSupported();
        if (!supported) return null;

        const app = getFirebaseApp();
        if (!app) return null;

        analyticsInstance = getAnalytics(app);
        return analyticsInstance;
    } catch (err) {
        console.warn("[ANALYTICS] Google Analytics initialization skipped:", err);
        return null;
    }
}

/**
 * Permitted high-level platform events.
 * Strictly avoids PII, passwords, emails, submission code, or raw chat messages.
 */
export type PermittedAnalyticsEvent =
    | "hackathon_viewed"
    | "registration_started"
    | "registration_completed"
    | "team_recruitment_opened"
    | "workspace_viewed"
    | "submission_completed"
    | "srijanbot_opened"
    | "srijanbot_action_clicked";

/**
 * Logs a privacy-safe, sanitized event.
 */
export async function logPlatformEvent(eventName: PermittedAnalyticsEvent, params: Record<string, string | number | boolean> = {}) {
    if (!hasAnalyticsConsent()) return;

    try {
        const analytics = await initAnalytics();
        if (!analytics) return;

        const { logEvent } = await import("firebase/analytics");
        
        // Strict PII Sanitization filter: removes any accidental email/token/passwords
        const sanitizedParams: Record<string, any> = {};
        for (const [key, val] of Object.entries(params)) {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey.includes("password") ||
                lowerKey.includes("token") ||
                lowerKey.includes("secret") ||
                lowerKey.includes("email") ||
                lowerKey.includes("code") ||
                lowerKey.includes("source")
            ) {
                continue;
            }
            sanitizedParams[key] = val;
        }

        logEvent(analytics, eventName, sanitizedParams);
    } catch (err) {
        // Silent failure so analytics never breaks core application functionality
    }
}
