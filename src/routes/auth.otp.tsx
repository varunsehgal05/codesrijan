import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/auth/otp")({
    component: OTPVerification,
});

function OTPVerification() {
    const { verifyEmail } = useAppStore();
    const navigate = useNavigate();
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const pendingId = localStorage.getItem("codesrijan_pending_verification_id");
        if (!pendingId) {
            navigate({ to: "/login" });
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
        const newCode = [...code];
        newCode[index] = val;
        setCode(newCode);

        if (val && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async () => {
        const pendingId = localStorage.getItem("codesrijan_pending_verification_id");
        const fullCode = code.join("");
        if (fullCode.length !== 6 || !pendingId) return;

        setLoading(true);
        setErrorMsg("");

        try {
            await verifyEmail(pendingId, fullCode);
            // After successful verification, user goes to login to grab their secure JWT session
            navigate({ to: "/login" });
        } catch (e: any) {
            setErrorMsg(e.message || "Invalid or expired verification packet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-container-lowest bg-pattern flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-pure-white brutal-border brutal-shadow-lg flex flex-col pt-8">
                {/* Header Ribbon */}
                <div className="bg-electric-blue text-pure-white p-4 brutal-border-b flex justify-between items-center -mt-8 mb-6 border-b-2 border-stark-black">
                    <h1 className="font-headline-md italic uppercase tracking-tighter">Identity Config</h1>
                    <span className="material-symbols-outlined sync-pulse">fingerprint</span>
                </div>

                <div className="px-8 pb-8 flex flex-col items-center">
                    <h2 className="font-display-lg text-headline-md leading-none text-stark-black text-center uppercase mb-2">
                        VERIFY EMAIL
                    </h2>
                    <p className="font-body-md text-on-surface-variant text-center mb-6">
                        Enter the 6-digit confirmation code sent to your email to activate your account.
                    </p>

                    {errorMsg && (
                        <div className="bg-error text-white p-3 mb-6 w-full brutal-border flex items-center gap-2 font-label-bold text-sm">
                            <span className="material-symbols-outlined">warning</span> {errorMsg}
                        </div>
                    )}

                    {/* Brutalist OTP Inputs */}
                    <div className="flex gap-2 justify-between w-full mb-8">
                        {code.map((v, i) => (
                            <input
                                key={i}
                                type="text"
                                maxLength={1}
                                value={v}
                                onChange={(e) => handleChange(e, i)}
                                onKeyDown={(e) => handleKeyDown(e, i)}
                                ref={(el) => { inputs.current[i] = el; }}
                                className="w-12 h-14 bg-surface text-center font-display-lg text-2xl text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:border-electric-blue transition-transform focus:-translate-y-1"
                                placeholder="0"
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || code.join("").length !== 6}
                        className={`w-full text-pure-white py-4 font-label-caps text-lg brutal-border brutal-shadow transition-all duration-200 ${loading || code.join("").length !== 6 ? 'bg-surface-variant' : 'bg-stark-black hover:bg-electric-blue'}`}
                    >
                        {loading ? 'VERIFYING...' : 'AUTHORIZE OVERRIDE'}
                    </button>

                    <div className="mt-6 text-center">
                        <Link to="/" className="font-label-bold text-electric-blue hover:underline underline-offset-4 uppercase text-sm">
                            Re-transmit Code
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
