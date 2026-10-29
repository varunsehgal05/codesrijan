import { getFirebaseApp } from "./firebase";

export interface RemoteConfigDefaults {
    srijanbot_ui_enabled: boolean;
    new_admin_hackathon_wizard_enabled: boolean;
    recruitment_hint_enabled: boolean;
    homepage_announcement_enabled: boolean;
    homepage_announcement_text: string;
    optional_onboarding_enabled: boolean;
}

export const REMOTE_CONFIG_DEFAULTS: RemoteConfigDefaults = {
    srijanbot_ui_enabled: true,
    new_admin_hackathon_wizard_enabled: true,
    recruitment_hint_enabled: true,
    homepage_announcement_enabled: false,
    homepage_announcement_text: "",
    optional_onboarding_enabled: true
};

let remoteConfigInstance: any = null;

/**
 * Initializes Firebase Remote Config with Spark-compliant caching interval.
 * Uses 1 hour fetch interval in production (Spark quota compliance < 100k requests/day).
 */
export async function initRemoteConfig() {
    if (typeof window === "undefined") return null;
    if (remoteConfigInstance) return remoteConfigInstance;

    try {
        const { isSupported, getRemoteConfig, fetchAndActivate } = await import("firebase/remote-config");
        const supported = await isSupported();
        if (!supported) return null;

        const app = getFirebaseApp();
        if (!app) return null;

        const rc = getRemoteConfig(app);
        
        // Strict Spark Free Tier Safeguard:
        // Cache for 3600 seconds (1 hour) to guarantee < 100,000 fetch requests per day.
        rc.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 60000 : 3600000;
        rc.defaultConfig = REMOTE_CONFIG_DEFAULTS as any;

        try {
            await fetchAndActivate(rc);
        } catch (fetchErr) {
            console.warn("[REMOTE CONFIG] Network fetch deferred, using safe defaults:", fetchErr);
        }

        remoteConfigInstance = rc;
        return remoteConfigInstance;
    } catch (err) {
        console.warn("[REMOTE CONFIG] Remote Config initialization skipped:", err);
        return null;
    }
}

/**
 * Safely reads a non-sensitive feature flag value.
 * Never use for authorization, payment verification, or security rules.
 */
export async function getRemoteConfigFlag<K extends keyof RemoteConfigDefaults>(
    key: K
): Promise<RemoteConfigDefaults[K]> {
    if (typeof window === "undefined") return REMOTE_CONFIG_DEFAULTS[key];

    try {
        const rc = await initRemoteConfig();
        if (!rc) return REMOTE_CONFIG_DEFAULTS[key];

        const { getValue } = await import("firebase/remote-config");
        const val = getValue(rc, key);

        if (typeof REMOTE_CONFIG_DEFAULTS[key] === "boolean") {
            return val.asBoolean() as any;
        } else if (typeof REMOTE_CONFIG_DEFAULTS[key] === "number") {
            return val.asNumber() as any;
        }
        return val.asString() as any;
    } catch {
        return REMOTE_CONFIG_DEFAULTS[key];
    }
}
