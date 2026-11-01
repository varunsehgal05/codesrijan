export interface CountdownResult { days: number; hours: number; minutes: number; seconds: number; totalHours: number; isExpired: boolean; isConfigured: boolean; urgency: 'normal' | 'warning' | 'critical' | 'expired' | 'unconfigured'; }
export function calculateRemainingTime(deadlineInput: string | Date | null | undefined, nowInput?: number | Date): CountdownResult;
