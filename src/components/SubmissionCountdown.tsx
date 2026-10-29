import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { calculateRemainingTime } from "../lib/countdown.js";
import { useAppStore } from "../lib/store";

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
        startDate?: string;
        endDate?: string;
        registrationStart?: string;
        registrationEnd?: string;
        registrationDeadline?: string;
        submissionDeadline?: string;
        status?: string;
        entryType?: 'free' | 'paid';
        fee?: number;
        problemStatementsRevealed?: boolean;
    } | null;
    className?: string;
}

export function SubmissionCountdown({ targetEvent, className = "" }: SubmissionCountdownProps) {
    const eventName = targetEvent?.name || "CodeSrijan Hackathon";

    let currentUser: any = null;
    let registrations: any[] = [];
    try {
        const store = useAppStore();
        currentUser = store.currentUser;
        registrations = store.registrations || [];
    } catch {
        // Safe fallback outside provider
    }

    // Match registration for this specific user & hackathon
    const userReg = (registrations || []).find((r: any) =>
        (r.userId === currentUser?.id || r.userId === currentUser?._id) &&
        (r.hackathonId === targetEvent?.id || !targetEvent?.id)
    ) || (registrations || []).find((r: any) => (r.userId === currentUser?.id || r.userId === currentUser?._id));

    // Payment state
    const isAdmin = currentUser?.role === 'admin';
    const isPaidEvent = !isAdmin && (targetEvent?.entryType === 'paid' ||
                        (targetEvent?.fee && targetEvent.fee > 0) ||
                        (userReg && userReg.entryType === 'paid' && userReg.feeAmount > 0));

    const feeAmount = userReg?.feeAmount ?? targetEvent?.fee ?? 1500;
    const paymentStatus = userReg?.paymentStatus;
    const regStatus = userReg?.status;

    const isPaymentUnderReview = !isAdmin && (paymentStatus === 'payment_under_review' || regStatus === 'payment_under_review');
    const isPaymentRejected = !isAdmin && (paymentStatus === 'rejected' || regStatus === 'rejected');
    const isPaymentVerified = isAdmin || !isPaidEvent || paymentStatus === 'verified' || paymentStatus === 'not_required' || regStatus === 'registered';
    const isPaymentPending = !isAdmin && isPaidEvent && !isPaymentVerified && !isPaymentUnderReview && !isPaymentRejected;

    // Resolve multi-phase lifecycle
    const resolvePhase = () => {
        const now = Date.now();
        const regEnd = targetEvent?.registrationEnd || (targetEvent as any)?.registrationDeadline;
        const start = targetEvent?.startDate;
        const subDeadline = targetEvent?.submissionDeadline || targetEvent?.endDate;
        const status = (targetEvent?.status || '').toLowerCase();

        const regEndTime = regEnd ? new Date(regEnd).getTime() : 0;
        const startTime = start ? new Date(start).getTime() : 0;
        const subDeadlineTime = subDeadline ? new Date(subDeadline).getTime() : 0;

        if (status === 'completed' || status === 'evaluation' || (subDeadlineTime > 0 && now >= subDeadlineTime)) {
            return {
                phase: 'concluded' as const,
                target: subDeadline || null,
                badge: 'HACKATHON CONCLUDED',
                badgeStyle: 'bg-zinc-800 text-zinc-300 border-zinc-600',
                heading: 'DEADLINE CONCLUDED',
                summary: 'Submissions locked. Evaluation matrix processing scores.'
            };
        }

        if (status === 'active' || status === 'submission_open' || (startTime > 0 && now >= startTime)) {
            return {
                phase: 'hacking' as const,
                target: subDeadline || targetEvent?.endDate || null,
                badge: 'HACKATHON LIVE',
                badgeStyle: 'bg-[#FFD700] text-black border-[#FFD700] font-bold',
                heading: 'SUBMISSIONS CLOSE IN',
                summary: 'Hacking matrix live. Transmit team payload before cutoff.'
            };
        }

        if (status === 'registration_open' || (regEndTime > 0 && now < regEndTime)) {
            return {
                phase: 'registration' as const,
                target: regEnd || null,
                badge: 'REGISTRATION OPEN',
                badgeStyle: 'bg-electric-blue text-white border-electric-blue',
                heading: 'REGISTRATION CLOSES IN',
                summary: 'Enrollment window active. Form your squad before timer finishes.'
            };
        }

        if (startTime > 0 && now < startTime) {
            return {
                phase: 'upcoming' as const,
                target: start || null,
                badge: 'STARTING SOON',
                badgeStyle: 'bg-emerald-400 text-black border-emerald-500 font-bold',
                heading: 'HACKATHON COMMENCES IN',
                summary: 'Registration closed. Challenges unlock when countdown hits zero.'
            };
        }

        return {
            phase: 'hacking' as const,
            target: subDeadline || null,
            badge: 'HACKATHON ACTIVE',
            badgeStyle: 'bg-electric-blue/20 text-electric-blue border-electric-blue',
            heading: 'SUBMISSIONS CLOSE IN',
            summary: 'Submission portal active.'
        };
    };

    const currentPhaseInfo = resolvePhase();
    const rawDeadline = currentPhaseInfo.target;

    const [countdown, setCountdown] = useState<CountdownCalculation>(() => 
        calculateRemainingTime(rawDeadline)
    );

    useEffect(() => {
        const update = () => {
            setCountdown(calculateRemainingTime(currentPhaseInfo.target));
        };

        update();
        const intervalId = setInterval(update, 1000);

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
    }, [currentPhaseInfo.target]);

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
    let badgeClass = currentPhaseInfo.badgeStyle;
    let badgeText = currentPhaseInfo.badge;
    let headingText = currentPhaseInfo.heading;
    let statusSummary = currentPhaseInfo.summary;

    if (!countdown.isConfigured) {
        borderClass = "border-zinc-700";
        badgeClass = "bg-zinc-800 text-zinc-300 border-zinc-600";
        badgeText = "SCHEDULE PENDING";
        headingText = "DEADLINE NOT CONFIGURED";
        statusSummary = "Awaiting official hackathon cutoff broadcast.";
    } else if (countdown.isExpired) {
        borderClass = "border-error";
        badgeClass = "bg-error text-pure-white border-error";
        badgeText = currentPhaseInfo.phase === 'registration' ? "REGISTRATION CLOSED" : "SUBMISSIONS CLOSED";
        headingText = "DEADLINE ELAPSED";
        statusSummary = currentPhaseInfo.phase === 'registration' 
            ? "Registration window has ended. Preparing competition start."
            : "Mainframe submission gateway locked. Evaluation running.";
    } else if (countdown.urgency === 'critical') {
        borderClass = "border-error animate-pulse";
        badgeClass = "bg-error text-pure-white border-error";
        badgeText = "CRITICAL: FINAL MINUTES";
        headingText = `${currentPhaseInfo.heading} (IMMINENT)`;
        statusSummary = "Less than 1 hour remaining! Finalize immediately.";
    } else if (countdown.urgency === 'warning') {
        borderClass = "border-amber-500";
        badgeClass = "bg-amber-400 text-ink-black border-amber-500";
        badgeText = "CLOSING SOON";
        headingText = currentPhaseInfo.heading;
        statusSummary = "Approaching cutoff. Reconcile details.";
    }

    // Dynamic Phase & Payment-Aware Call to Action
    const renderActionCTA = () => {
        if (currentUser?.role === 'admin') {
            return (
                <div className="flex flex-col items-center lg:items-end gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                        <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
                        <span>Admin Oversight Directorate</span>
                    </div>
                    <Link
                        to="/admin/hackathons"
                        className="w-full sm:w-auto text-center bg-cyan-400 hover:bg-white text-black font-mono font-bold text-xs uppercase py-2.5 px-5 border-2 border-black hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                        title="Manage Hackathons, Rosters & Registrations"
                    >
                        <span className="material-symbols-outlined text-sm">tune</span>
                        Manage Event Roster & Governance →
                    </Link>
                    <span className="text-[10px] font-mono text-zinc-400">Review participants, fees & governance</span>
                </div>
            );
        }

        if (isPaymentPending) {
            return (
                <div className="flex flex-col items-center lg:items-end gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                        <span className="material-symbols-outlined text-xs">payments</span>
                        <span>Payment Clearance Required</span>
                    </div>
                    <Link
                        to="/payment"
                        className="w-full sm:w-auto text-center bg-amber-400 hover:bg-white text-black font-mono font-bold text-xs uppercase py-2.5 px-5 border-2 border-amber-500 hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                        title="Complete Hackathon Entry Fee"
                    >
                        <span className="material-symbols-outlined text-sm">credit_card</span>
                        Complete Payment (₹{feeAmount}) →
                    </Link>
                    <span className="text-[10px] font-mono text-zinc-400">Entry fee pending • Submit proof</span>
                </div>
            );
        }

        if (isPaymentUnderReview) {
            return (
                <div className="flex flex-col items-center lg:items-end gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-yellow-300 uppercase tracking-widest font-bold">
                        <span className="material-symbols-outlined text-xs animate-spin">autorenew</span>
                        <span>Audit In Progress</span>
                    </div>
                    <Link
                        to="/payment"
                        className="w-full sm:w-auto text-center bg-yellow-400 hover:bg-white text-black font-mono font-bold text-xs uppercase py-2.5 px-5 border-2 border-yellow-500 hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                        title="View Payment Review Status"
                    >
                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                        Payment Under Audit (View Status) →
                    </Link>
                    <span className="text-[10px] font-mono text-zinc-400">Proof submitted • Awaiting admin clearance</span>
                </div>
            );
        }

        if (isPaymentRejected) {
            return (
                <div className="flex flex-col items-center lg:items-end gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-error uppercase tracking-widest font-bold">
                        <span className="material-symbols-outlined text-xs">error</span>
                        <span>Payment Proof Declined</span>
                    </div>
                    <Link
                        to="/payment"
                        className="w-full sm:w-auto text-center bg-error hover:bg-white text-white hover:text-black font-mono font-bold text-xs uppercase py-2.5 px-5 border-2 border-error hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                        title="Resubmit Payment Proof"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Resubmit Payment Proof →
                    </Link>
                    <span className="text-[10px] font-mono text-zinc-400">Check rejection reason and resubmit</span>
                </div>
            );
        }

        // Phase-specific actions
        if (currentPhaseInfo.phase === 'registration') {
            return (
                <div className="flex flex-col items-center lg:items-end gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                        <span className="material-symbols-outlined text-xs">how_to_reg</span>
                        <span>{userReg ? "Registration Active" : "Registration Open"}</span>
                    </div>
                    {userReg ? (
                        <Link
                            to="/team"
                            className="w-full sm:w-auto text-center bg-electric-blue hover:bg-white text-black font-mono font-bold text-xs uppercase py-2.5 px-6 border-2 border-black hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">groups</span>
                            Manage Team & Squad →
                        </Link>
                    ) : (
                        <Link
                            to="/hackathons"
                            className="w-full sm:w-auto text-center bg-electric-blue hover:bg-white text-black font-mono font-bold text-xs uppercase py-2.5 px-6 border-2 border-black hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">app_registration</span>
                            Register For Hackathon →
                        </Link>
                    )}
                    <span className="text-[10px] font-mono text-zinc-400">Solo or Team enrollment allowed</span>
                </div>
            );
        }

        if (currentPhaseInfo.phase === 'upcoming') {
            return (
                <div className="flex flex-col items-center lg:items-end gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                        <span className="material-symbols-outlined text-xs">hourglass_top</span>
                        <span>Stand By for Hacking Launch</span>
                    </div>
                    <Link
                        to="/problems"
                        className="w-full sm:w-auto text-center bg-white hover:bg-electric-blue hover:text-white text-black font-mono font-bold text-xs uppercase py-2.5 px-6 border-2 border-black hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">extension</span>
                        View Challenge Briefings →
                    </Link>
                    <span className="text-[10px] font-mono text-zinc-400">Problem statements unlock at zero</span>
                </div>
            );
        }

        if (currentPhaseInfo.phase === 'concluded') {
            return (
                <div className="flex flex-col items-center lg:items-end gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                        <span className="material-symbols-outlined text-xs">emoji_events</span>
                        <span>Evaluation Active</span>
                    </div>
                    <Link
                        to="/leaderboard"
                        className="w-full sm:w-auto text-center bg-white hover:bg-[#FFD700] text-black font-mono font-bold text-xs uppercase py-2.5 px-6 border-2 border-black hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">leaderboard</span>
                        View Public Standings →
                    </Link>
                    <span className="text-[10px] font-mono text-zinc-400">Live points leaderboard</span>
                </div>
            );
        }

        // Live Hacking Flow
        return (
            <div className="flex flex-col items-center lg:items-end gap-1.5 w-full">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>Submission Gateway Open</span>
                </div>
                <Link
                    to="/workspace"
                    className="w-full sm:w-auto text-center bg-electric-blue hover:bg-white text-black font-mono font-bold text-xs uppercase py-2.5 px-6 border-2 border-black hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    {countdown.isExpired ? "View Submission Dossier" : "Transmit Payload In Workspace →"}
                </Link>
                <span className="text-[10px] font-mono text-zinc-400">Kanban HUD & Payload Gateway Active</span>
            </div>
        );
    };

    // Accessibility label
    const accessibleLabel = countdown.isExpired
        ? `${currentPhaseInfo.heading} has passed.`
        : !countdown.isConfigured
        ? "Deadline is not configured."
        : `Timer: ${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds remaining for ${eventName}`;

    return (
        <div
            className={`bg-ink-black text-on-primary p-5 sm:p-6 brutal-border brutal-shadow relative w-full ${borderClass} ${className}`}
            role="region"
            aria-label="Hackathon Countdown Clock"
        >
            {/* Horizontal Layout Container */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

                {/* Left Segment: Event Badges & Schedule Meta */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-1.5 w-full lg:w-1/3 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-start">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 border ${badgeClass}`}>
                            {badgeText}
                        </span>
                        {isPaidEvent && (
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border ${
                                isPaymentVerified ? 'bg-emerald-950 text-emerald-400 border-emerald-500' :
                                isPaymentUnderReview ? 'bg-yellow-950 text-yellow-300 border-yellow-500' :
                                isPaymentRejected ? 'bg-rose-950 text-rose-400 border-rose-500' :
                                'bg-amber-950 text-amber-300 border-amber-500'
                            }`}>
                                {isPaymentVerified ? 'FEE CLEARED' : isPaymentUnderReview ? 'FEE IN AUDIT' : isPaymentRejected ? 'PAYMENT DECLINED' : `FEE DUE: ₹${feeAmount}`}
                            </span>
                        )}
                    </div>

                    <h2 className="font-display-md text-lg sm:text-xl text-white uppercase tracking-tight mt-1 line-clamp-1" title={eventName}>
                        {eventName}
                    </h2>

                    {formattedDeadline && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 flex-wrap justify-center lg:justify-start">
                            <span className="material-symbols-outlined text-[14px] text-electric-blue">schedule</span>
                            <span>Target:</span>
                            {isoString ? (
                                <time dateTime={isoString} className="text-white font-bold">
                                    {formattedDeadline}
                                </time>
                            ) : null}
                            {formattedDeadlineUtc && (
                                <span className="text-zinc-500 text-[9px] hidden sm:inline">
                                    ({formattedDeadlineUtc})
                                </span>
                            )}
                        </div>
                    )}

                    <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {statusSummary}
                    </p>
                </div>

                {/* Center Segment: 4-Box Countdown Digits Row (DAYS : HOURS : MIN : SEC) */}
                <div className="flex flex-col items-center justify-center py-1 w-full lg:w-auto">
                    <span className="font-label-bold text-[11px] uppercase tracking-widest text-electric-blue text-center mb-2">
                        {headingText}
                    </span>

                    <div
                        className="flex items-center justify-center gap-1.5 sm:gap-2.5 font-mono"
                        aria-label={accessibleLabel}
                    >
                        {/* Days Unit */}
                        <div className="bg-[#0b101c] border-2 border-zinc-800 px-2.5 sm:px-3.5 py-2 sm:py-3 flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px]">
                            <span className="font-display-lg text-xl sm:text-3xl text-surface-bright tabular-nums leading-none font-bold">
                                {countdown.isConfigured ? String(countdown.days).padStart(2, '0') : '--'}
                            </span>
                            <span className="font-label-sm text-[8px] sm:text-[9px] text-surface-variant uppercase mt-1 tracking-wider font-bold">
                                DAYS
                            </span>
                        </div>

                        <span className="text-lg sm:text-2xl text-zinc-600 font-bold -mt-2 select-none">:</span>

                        {/* Hours Unit */}
                        <div className="bg-[#0b101c] border-2 border-zinc-800 px-2.5 sm:px-3.5 py-2 sm:py-3 flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px]">
                            <span className="font-display-lg text-xl sm:text-3xl text-surface-bright tabular-nums leading-none font-bold">
                                {countdown.isConfigured ? String(countdown.hours).padStart(2, '0') : '--'}
                            </span>
                            <span className="font-label-sm text-[8px] sm:text-[9px] text-surface-variant uppercase mt-1 tracking-wider font-bold">
                                HOURS
                            </span>
                        </div>

                        <span className="text-lg sm:text-2xl text-zinc-600 font-bold -mt-2 select-none">:</span>

                        {/* Minutes Unit */}
                        <div className="bg-[#0b101c] border-2 border-zinc-800 px-2.5 sm:px-3.5 py-2 sm:py-3 flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px]">
                            <span className="font-display-lg text-xl sm:text-3xl text-surface-bright tabular-nums leading-none font-bold">
                                {countdown.isConfigured ? String(countdown.minutes).padStart(2, '0') : '--'}
                            </span>
                            <span className="font-label-sm text-[8px] sm:text-[9px] text-surface-variant uppercase mt-1 tracking-wider font-bold">
                                MINS
                            </span>
                        </div>

                        <span className="text-lg sm:text-2xl text-zinc-600 font-bold -mt-2 select-none">:</span>

                        {/* Seconds Unit */}
                        <div className="bg-[#0b101c] border-2 border-zinc-800 px-2.5 sm:px-3.5 py-2 sm:py-3 flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px]">
                            <span className={`font-display-lg text-xl sm:text-3xl tabular-nums leading-none font-bold ${countdown.urgency === 'critical' ? 'text-error animate-pulse' : 'text-surface-bright'}`}>
                                {countdown.isConfigured ? String(countdown.seconds).padStart(2, '0') : '--'}
                            </span>
                            <span className="font-label-sm text-[8px] sm:text-[9px] text-surface-variant uppercase mt-1 tracking-wider font-bold">
                                SECS
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Segment: Payment Status & Dynamic Action CTA */}
                <div className="flex flex-col items-center lg:items-end justify-center w-full lg:w-1/3 min-w-[220px]">
                    {renderActionCTA()}
                </div>

            </div>
        </div>
    );
}
