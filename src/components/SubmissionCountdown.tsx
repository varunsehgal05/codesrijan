import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { calculateRemainingTime } from "../lib/countdown.js";

export { calculateRemainingTime };

export interface CountdownCalculation {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalHours: number;
    isExpired: boolean;
    isConfigured: boolean;
    urgency: 'normal' | 'warning' | 'critical' | 'expired' | 'unconfigured';
}

export interface SubmissionCountdownProps {
    targetEvent?: {
        id?: string;
        name?: string;
        submissionDeadline?: string;
        endDate?: string;
        status?: string;
    } | null;
    className?: string;
}

export function SubmissionCountdown({ targetEvent, className = "" }: SubmissionCountdownProps) {
    const rawDeadline = targetEvent?.submissionDeadline || targetEvent?.endDate || null;
    const eventName = targetEvent?.name || "CodeSrijan Hackathon";

    const [countdown, setCountdown] = useState<CountdownCalculation>(() => 
        calculateRemainingTime(rawDeadline)
    );

    useEffect(() => {
        const update = () => {
            setCountdown(calculateRemainingTime(rawDeadline));
        };

        update();
        const intervalId = setInterval(update, 1000);

        // Immediate resync when browser tab becomes active again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                update();
            }
        };
        const handleFocus = () => update();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [rawDeadline]);

    // Format absolute deadline for display with timezone
    let formattedDeadline: string | null = null;
    let formattedDeadlineUtc: string | null = null;
    let isoString: string | undefined = undefined;

    if (rawDeadline) {
        const d = new Date(rawDeadline);
        if (!isNaN(d.getTime())) {
            isoString = d.toISOString();
            formattedDeadline = d.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            });
            formattedDeadlineUtc = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
        }
    }

    // Dynamic styling tokens based on urgency state
    let borderClass = "border-ink-black";
    let badgeClass = "bg-electric-blue/20 text-electric-blue border-electric-blue";
    let badgeText = "HACKATHON ACTIVE";
    let headingText = "SUBMISSIONS CLOSE IN";
    let statusSummary = "Payload submission gateway active.";

    if (!countdown.isConfigured) {
        borderClass = "border-zinc-700";
        badgeClass = "bg-zinc-800 text-zinc-300 border-zinc-600";
        badgeText = "SCHEDULE PENDING";
        headingText = "DEADLINE NOT CONFIGURED";
        statusSummary = "Awaiting official tournament cutoff broadcast.";
    } else if (countdown.isExpired) {
        borderClass = "border-error";
        badgeClass = "bg-error text-pure-white border-error";
        badgeText = "SUBMISSION WINDOW CLOSED";
        headingText = "SUBMISSION DEADLINE ELAPSED";
        statusSummary = "Mainframe submission gateway locked. Evaluation engine running.";
    } else if (countdown.urgency === 'critical') {
        borderClass = "border-error animate-pulse";
        badgeClass = "bg-error text-pure-white border-error";
        badgeText = "FINAL TRANSMISSION PHASE";
        headingText = "SUBMISSION CLOSING IMMINENT";
        statusSummary = "Critical deadline: Less than 1 hour remaining! Finalize links immediately.";
    } else if (countdown.urgency === 'warning') {
        borderClass = "border-amber-500";
        badgeClass = "bg-amber-400 text-ink-black border-amber-500";
        badgeText = "CLOSING SOON";
        headingText = "SUBMISSIONS CLOSE IN";
        statusSummary = "Approaching submission cutoff. Reconcile code and demo links.";
    }

    // Accessibility label
    const accessibleLabel = countdown.isExpired
        ? "Submission deadline has passed. Submissions are closed."
        : !countdown.isConfigured
        ? "Submission deadline is not configured."
        : `Submission deadline countdown: ${countdown.totalHours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds remaining for ${eventName}`;

    return (
        <div
            className={`bg-ink-black text-on-primary p-5 sm:p-6 brutal-border brutal-shadow relative flex flex-col w-full max-w-md ${borderClass} ${className}`}
            role="region"
            aria-label="Hackathon Submission Deadline Clock"
        >
            {/* Top Status HUD Badge */}
            <div className="flex items-center justify-between gap-2 border-b-2 border-zinc-800 pb-3 mb-4">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 border ${badgeClass}`}>
                    {badgeText}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px]" title={eventName}>
                    {eventName}
                </span>
            </div>

            {/* Semantic Header */}
            <h2 className="font-label-bold text-xs uppercase tracking-widest text-electric-blue text-center mb-4">
                {headingText}
            </h2>

            {/* 3 Equal-Width Column Grid with Tabular Numerals */}
            <div
                className="grid grid-cols-3 gap-2 sm:gap-3 my-2 items-center text-center font-mono"
                aria-label={accessibleLabel}
            >
                {/* Hours Unit */}
                <div className="bg-[#0b101c] border-2 border-zinc-800 p-3 sm:p-4 flex flex-col items-center justify-center">
                    <span className="font-display-lg text-3xl sm:text-4xl text-surface-bright tabular-nums leading-none font-bold">
                        {countdown.isConfigured ? String(countdown.totalHours).padStart(2, '0') : '--'}
                    </span>
                    <span className="font-label-sm text-[10px] sm:text-xs text-surface-variant uppercase mt-1 tracking-wider">
                        HOURS
                    </span>
                </div>

                {/* Minutes Unit */}
                <div className="bg-[#0b101c] border-2 border-zinc-800 p-3 sm:p-4 flex flex-col items-center justify-center">
                    <span className="font-display-lg text-3xl sm:text-4xl text-surface-bright tabular-nums leading-none font-bold">
                        {countdown.isConfigured ? String(countdown.minutes).padStart(2, '0') : '--'}
                    </span>
                    <span className="font-label-sm text-[10px] sm:text-xs text-surface-variant uppercase mt-1 tracking-wider">
                        MINUTES
                    </span>
                </div>

                {/* Seconds Unit */}
                <div className="bg-[#0b101c] border-2 border-zinc-800 p-3 sm:p-4 flex flex-col items-center justify-center">
                    <span className={`font-display-lg text-3xl sm:text-4xl tabular-nums leading-none font-bold ${countdown.urgency === 'critical' ? 'text-error animate-pulse' : 'text-surface-bright'}`}>
                        {countdown.isConfigured ? String(countdown.seconds).padStart(2, '0') : '--'}
                    </span>
                    <span className="font-label-sm text-[10px] sm:text-xs text-surface-variant uppercase mt-1 tracking-wider">
                        SECONDS
                    </span>
                </div>
            </div>

            {/* Days Context Note if > 0 */}
            {countdown.days > 0 && (
                <div className="mt-2 text-center">
                    <span className="inline-block text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5">
                        Span: {countdown.days} day{countdown.days > 1 ? 's' : ''}, {countdown.hours} hr{countdown.hours !== 1 ? 's' : ''} total remaining
                    </span>
                </div>
            )}

            {/* Status Summary */}
            <p className="text-[11px] font-mono text-zinc-400 text-center mt-3">
                {statusSummary}
            </p>

            {/* Exact Deadline Timestamp & Timezone */}
            {formattedDeadline && (
                <div className="mt-3 pt-3 border-t border-zinc-800 text-[10px] font-mono text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-1">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-electric-blue">schedule</span>
                        <span>Cutoff:</span>
                        {isoString ? (
                            <time dateTime={isoString} className="text-white font-bold">
                                {formattedDeadline}
                            </time>
                        ) : null}
                    </span>
                    {formattedDeadlineUtc && (
                        <span className="text-zinc-400 text-[9px]">
                            ({formattedDeadlineUtc})
                        </span>
                    )}
                </div>
            )}

            {/* Direct Workspace / Submission CTA */}
            <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-center">
                <Link
                    to="/workspace"
                    className="w-full text-center bg-electric-blue text-black font-mono font-bold text-xs uppercase py-2.5 px-4 border-2 border-transparent hover:bg-white hover:text-black hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    {countdown.isExpired ? "View Submission Dossier" : "Transmit Payload In Workspace →"}
                </Link>
            </div>
        </div>
    );
}
