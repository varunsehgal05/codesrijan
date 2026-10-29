import { getFirebaseApp } from "./firebase";

let performanceInstance: any = null;

/**
 * Initializes Firebase Performance Monitoring for web browsers.
 * Browser-only, Spark tier zero-cost.
 */
export async function initPerformance() {
    if (typeof window === "undefined") return null;
    if (performanceInstance) return performanceInstance;

    try {
        const { getPerformance } = await import("firebase/performance");
        const app = getFirebaseApp();
        if (!app) return null;

        performanceInstance = getPerformance(app);
        return performanceInstance;
    } catch (err) {
        // Safe skip on unsupported environments
        return null;
    }
}

/**
 * Creates a focused custom trace for important application workflows.
 */
export async function createPerformanceTrace(traceName: string) {
    if (typeof window === "undefined") {
        return { start: () => {}, stop: () => {}, putMetric: () => {} };
    }

    try {
        const perf = await initPerformance();
        if (!perf) {
            return { start: () => {}, stop: () => {}, putMetric: () => {} };
        }

        const { trace } = await import("firebase/performance");
        const t = trace(perf, traceName);
        return {
            start: () => t.start(),
            stop: () => t.stop(),
            putMetric: (metricName: string, num: number) => t.putMetric(metricName, num)
        };
    } catch {
        return { start: () => {}, stop: () => {}, putMetric: () => {} };
    }
}
