/**
 * Pure calculation function for remaining time.
 * Exported for both frontend UI components and backend/Node automated test suites.
 * 
 * @param {string|Date|null} deadlineInput
 * @param {number|Date} [nowInput]
 * @returns {{
 *   days: number,
 *   hours: number,
 *   minutes: number,
 *   seconds: number,
 *   totalHours: number,
 *   isExpired: boolean,
 *   isConfigured: boolean,
 *   urgency: 'normal'|'warning'|'critical'|'expired'|'unconfigured'
 * }}
 */
export function calculateRemainingTime(deadlineInput, nowInput) {
    if (!deadlineInput) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalHours: 0,
            isExpired: false,
            isConfigured: false,
            urgency: 'unconfigured'
        };
    }

    const target = new Date(deadlineInput).getTime();
    if (isNaN(target)) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalHours: 0,
            isExpired: false,
            isConfigured: false,
            urgency: 'unconfigured'
        };
    }

    const now = nowInput ? new Date(nowInput).getTime() : Date.now();
    const diff = target - now;

    if (diff <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalHours: 0,
            isExpired: true,
            isConfigured: true,
            urgency: 'expired'
        };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    let urgency = 'normal';
    if (totalHours < 1) {
        urgency = 'critical'; // < 1 hour left
    } else if (totalHours < 6) {
        urgency = 'warning'; // < 6 hours left
    }

    return {
        days,
        hours,
        minutes,
        seconds,
        totalHours,
        isExpired: false,
        isConfigured: true,
        urgency
    };
}
