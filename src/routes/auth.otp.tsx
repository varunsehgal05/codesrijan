import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";
import { roleHome } from '../lib/role-home';

export const Route = createFileRoute("/auth/otp")({
    component: OTPVerification,
});

function OTPVerification() {
    const { verifyEmail } = useAppStore();
    const navigate = useNavigate();

    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60); // 60s cooldown matching server rate limit
    const [isLocked, setIsLocked] = useState(false);

    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    // Read URL search params
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get("uid");
        const email = params.get("email") || "";

        if (!uid) {
            navigate({ to: "/login" });
            return;
        }

        setPendingId(uid);
        setUserEmail(email);
    }, [navigate]);

    // Resend countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Helper: Mask email for privacy (e.g. j***e@domain.com)
    const formatMaskedEmail = (email: string) => {
        if (!email || !email.includes("@")) return "your registered inbox";
        const [local = "", domain = ""] = email.split("@");
        if (!local || !domain) return "your registered inbox";
        if (local.length <= 2) {
            return `${local[0]}***@${domain}`;
        }
        const masked = `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}`;
        return `${masked}@${domain}`;
    };

    // Handle single digit input and focus progression
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value.replace(/\D/g, "");
        if (!val) {
            setCode((prev) => {
                const next = [...prev];
                next[index] = "";
                return next;
            });
            return;
        }

        // Take only the last entered digit
        const digit = val.slice(-1);
        setCode((prev) => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });

        // Auto-advance to next input slot
        if (index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    // Handle keyboard navigation (backspace, arrows)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            if (!code[index] && index > 0) {
                inputs.current[index - 1]?.focus();
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    // Full clipboard paste support: auto-distribute across all 6 inputs
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        const digits = pastedData.replace(/\D/g, "").slice(0, 6);

        if (digits.length > 0) {
            const newCode = ["", "", "", "", "", ""];
            for (let i = 0; i < digits.length; i++) {
                newCode[i] = digits.charAt(i);
            }
            setCode(newCode);

            // Focus the last filled box or 6th box
            const focusIndex = Math.min(digits.length, 5);
            inputs.current[focusIndex]?.focus();
        }
    };

    // Submit OTP for server verification
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const fullCode = code.join("");
        if (fullCode.length !== 6 || !pendingId || loading || isLocked) return;

        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await verifyEmail(pendingId, fullCode);
            setSuccessMsg("Account verified successfully! Redirecting...");
            setTimeout(() => {
                navigate({ to: roleHome(res.user?.role) });
            }, 800);
        } catch (err: any) {
            const rawMsg = err.message || "";
            if (rawMsg.includes("expired")) {
                setErrorMsg("This verification code has expired. Request a new code to continue.");
            } else if (rawMsg.includes("Maximum verification") || rawMsg.includes("locked") || rawMsg.includes("429")) {
                setIsLocked(true);
                setErrorMsg("Too many attempts. Verification session is locked. Please wait before trying again.");
            } else if (rawMsg.includes("Invalid verification code")) {
                setErrorMsg(rawMsg); // Contains remaining attempts info from backend
            } else {
                setErrorMsg(rawMsg || "The code doesn't match. Check the six digits and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Resend fresh OTP via Resend HTTPS API
    const handleResendCode = async () => {
        if (!pendingId || countdown > 0 || resending) return;

        setResending(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await axios.post(`${API_BASE}/auth/resend-otp`, {
                userId: pendingId,
                email: userEmail
            });

            if (res.data.emailDispatchFailed) {
                setErrorMsg("We couldn't send your verification code. Please try again. If the problem continues, contact support.");
            } else {
                setSuccessMsg("A new 6-digit verification code has been dispatched to your email.");
            }

            // Start 60-second cooldown
            setCountdown(60);
            // Clear previous inputs
            setCode(["", "", "", "", "", ""]);
            inputs.current[0]?.focus();
        } catch (err: any) {
            if (err.response?.status === 429) {
                const retryAfter = err.response.data.retryAfter || 60;
                setCountdown(retryAfter);
                setErrorMsg(`Rate limit exceeded. Please wait ${retryAfter} seconds before requesting another code.`);
            } else {
                setErrorMsg(err.response?.data?.message || "Failed to resend code. Please try again later.");
            }
        } finally {
            setResending(false);
        }
    };

    const isCodeComplete = code.every((digit) => digit.length === 1);

    return (
        <div className="min-h-screen bg-surface-container-lowest bg-pattern flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            {/* Decorative blurred background elements */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-electric-blue opacity-10 transform rotate-12 blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg bg-pure-white brutal-border brutal-shadow-lg relative z-10 flex flex-col my-8">
                {/* Header Ribbon */}
                <div className="bg-electric-blue border-b-2 border-stark-black px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-pure-white font-headline-md italic uppercase text-base sm:text-lg">
                        <span className="material-symbols-outlined">mark_email_unread</span>
                        Email Verification
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 bg-pure-white text-stark-black font-bold uppercase border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        OTP Security
                    </span>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 flex flex-col items-center bg-pure-white">
                    <div className="w-14 h-14 bg-surface-container border-2 border-stark-black flex items-center justify-center mb-5 text-electric-blue shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span className="material-symbols-outlined text-3xl">verified_user</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-display-lg uppercase text-stark-black text-center mb-2 tracking-tight">
                        Verify Your Email
                    </h1>

                    <p className="text-xs sm:text-sm text-on-surface-variant text-center mb-6 leading-relaxed max-w-sm font-body-md font-bold uppercase tracking-wider">
                        Enter the 6-digit confirmation code dispatched to{" "}
                        <strong className="text-electric-blue font-black underline">
                            {formatMaskedEmail(userEmail)}
                        </strong>.
                    </p>

                    {/* Actionable Error Alert */}
                    {errorMsg && (
                        <div
                            role="alert"
                            className="bg-error text-pure-white p-3.5 mb-6 w-full flex items-start gap-2.5 text-xs sm:text-sm font-label-bold uppercase brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">error</span>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Success Notice */}
                    {successMsg && (
                        <div
                            role="status"
                            className="bg-success text-pure-white p-3.5 mb-6 w-full flex items-start gap-2.5 text-xs sm:text-sm font-label-bold uppercase brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">check_circle</span>
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* 6-Digit OTP Inputs */}
                    <div className="w-full mb-6">
                        <label className="sr-only" htmlFor="otp-slot-0">Enter 6-digit verification code</label>
                        <div className="flex justify-between gap-2 sm:gap-2.5 w-full">
                            {code.map((val, idx) => (
                                <input
                                    key={idx}
                                    id={`otp-slot-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                                    value={val}
                                    onChange={(e) => handleChange(e, idx)}
                                    onKeyDown={(e) => handleKeyDown(e, idx)}
                                    onPaste={handlePaste}
                                    ref={(el) => {
                                        inputs.current[idx] = el;
                                    }}
                                    disabled={loading || isLocked}
                                    className={`w-11 h-14 sm:w-12 sm:h-16 bg-surface text-center text-xl sm:text-2xl font-code-snippet font-black text-stark-black brutal-border focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform disabled:opacity-50 ${
                                        val ? "border-electric-blue bg-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-stark-black"
                                    }`}
                                />
                            ))}
                        </div>
                        <p className="text-[11px] font-mono text-zinc-600 text-center mt-2.5">
                            Tip: You can paste the complete 6-digit code directly into any box.
                        </p>
                    </div>

                    {/* Primary Verify Button */}
                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={loading || !isCodeComplete || isLocked}
                        className={`w-full py-4 px-6 font-label-bold uppercase text-sm sm:text-base brutal-border brutal-shadow flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            loading || !isCodeComplete || isLocked
                                ? "bg-surface-container-high text-text-muted border-zinc-400 shadow-none cursor-not-allowed"
                                : "bg-electric-blue hover:bg-black text-pure-white hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                        }`}
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                <span>Verifying Code...</span>
                            </>
                        ) : (
                            <>
                                <span>Confirm & Activate Account</span>
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </>
                        )}
                    </button>

                    {/* Resend Action with Server-Synchronized Countdown */}
                    <div className="mt-6 flex flex-col items-center gap-3 w-full border-t-2 border-stark-black/15 pt-5">
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={countdown > 0 || resending || loading}
                            className={`text-xs sm:text-sm font-label-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                                countdown > 0 || resending
                                    ? "text-zinc-400"
                                    : "text-ink-black hover:text-electric-blue"
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">
                                {resending ? "sync" : "refresh"}
                            </span>
                            {resending ? (
                                "Sending new passkey..."
                            ) : countdown > 0 ? (
                                `Resend code available in ${countdown}s`
                            ) : (
                                "Resend 6-Digit Code"
                            )}
                        </button>

                        {/* Change Email Option */}
                        <Link
                            to="/register"
                            className="text-xs font-mono font-bold uppercase text-zinc-600 hover:text-electric-blue underline underline-offset-4 transition-colors"
                        >
                            Incorrect email address? Change email
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
