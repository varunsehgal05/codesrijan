import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/payment")({
    component: PaymentPage,
});

interface RosterMember {
    userId: string;
    name: string;
    email: string;
    college?: string;
    role: string;
}

interface RegistrationData {
    id: string;
    hackathonId: string;
    userId: string;
    teamId?: string;
    type: 'solo' | 'team';
    entryType: 'free' | 'paid';
    feeAmount: number;
    feeBasis: string;
    currency: string;
    paymentStatus: 'not_required' | 'pending_proof' | 'payment_under_review' | 'verified' | 'rejected';
    status: string;
    transactionReference?: string;
    paymentProofUrl?: string;
    paymentSubmittedAt?: string;
    reviewReason?: string;
    rosterMembers?: RosterMember[];
}

interface HackathonData {
    id: string;
    name: string;
    theme?: string;
    entryType?: 'free' | 'paid';
    fee?: number;
    feeBasis?: string;
    currency?: string;
    upiId?: string;
    payeeName?: string;
    qrImageUrl?: string;
    paymentInstructions?: string;
}

function PaymentPage() {
    const navigate = useNavigate();
    const { currentUser, isLoaded } = useAppStore();

    const [registration, setRegistration] = useState<RegistrationData | null>(null);
    const [hackathon, setHackathon] = useState<HackathonData | null>(null);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [utr, setUtr] = useState("");
    const [proofBase64, setProofBase64] = useState<string | null>(null);
    const [proofFileName, setProofFileName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [retrying, setRetrying] = useState(false);

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

    const loadData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            if (!token) {
                navigate({ to: '/login' });
                return;
            }

            // Check URL search params for hackathonId
            const params = new URLSearchParams(window.location.search);
            let targetHackathonId = params.get('hackathonId');

            // If not in query, check student registrations
            if (!targetHackathonId) {
                const regRes = await axios.get(`${API_URL}/student/registrations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const regs: RegistrationData[] = regRes.data || [];
                const paidPending = regs.find(r => r.entryType === 'paid' || r.paymentStatus !== 'not_required');
                if (paidPending) {
                    targetHackathonId = paidPending.hackathonId;
                } else if (regs[0]) {
                    targetHackathonId = regs[0].hackathonId;
                }
            }

            if (!targetHackathonId) {
                // Fallback demo tournament
                targetHackathonId = 'hack-1';
            }

            // Fetch registration
            try {
                const myRegRes = await axios.get(`${API_URL}/hackathons/${targetHackathonId}/my-registration`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRegistration(myRegRes.data);
                if (myRegRes.data.transactionReference) {
                    setUtr(myRegRes.data.transactionReference);
                }
            } catch (regErr: any) {
                // No registration yet
                setRegistration(null);
            }

            // Fetch hackathon details
            try {
                const hackRes = await axios.get(`${API_URL}/hackathons/${targetHackathonId}`);
                setHackathon(hackRes.data);
            } catch (hErr) {}

        } catch (err: any) {
            console.error("Payment load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            if (!currentUser) {
                navigate({ to: '/login' });
            } else {
                loadData();
            }
        }
    }, [isLoaded, currentUser]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Receipt screenshot must be under 5MB.");
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error("Only image files (.png, .jpg, .jpeg, .webp) are accepted.");
            return;
        }

        setProofFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            setProofBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitProof = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registration && !hackathon) return;
        const targetHackId = registration?.hackathonId || hackathon?.id;

        if (!utr.trim()) {
            toast.error("Transaction Reference / UTR is required.");
            return;
        }

        if (!proofBase64) {
            toast.error("Please attach a screenshot of your payment receipt.");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.post(`${API_URL}/hackathons/${targetHackId}/payment-proof`, {
                transactionReference: utr.trim(),
                paymentProofUrl: proofBase64
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Payment proof transmitted! Status: Under Review.");
            setRegistration(res.data.registration);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit payment proof.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = async () => {
        if (!registration) return;
        setRetrying(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.post(`${API_URL}/hackathons/${registration.hackathonId}/retry-payment`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Payment submission reopened. Input your updated UTR and proof.");
            setRegistration(res.data.registration);
            setProofBase64(null);
            setProofFileName("");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reset payment submission.");
        } finally {
            setRetrying(false);
        }
    };

    const copyUpi = () => {
        const upi = hackathon?.upiId || "codesrijan@upi";
        navigator.clipboard.writeText(upi);
        toast.success("UPI ID copied to clipboard!");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 font-mono">
                <div className="text-electric-blue text-sm uppercase tracking-widest animate-pulse flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
                    RETRIEVING SECURE PAYMENT MANIFEST...
                </div>
            </div>
        );
    }

    const feeToDisplay = registration?.feeAmount ?? hackathon?.fee ?? 1500;
    const feeBasisDisplay = registration?.feeBasis ?? hackathon?.feeBasis ?? 'per_team';
    const upiIdDisplay = hackathon?.upiId || "codesrijan@okhdfcbank";
    const payeeDisplay = hackathon?.payeeName || "CodeSrijan Organization";
    const isUnderReview = registration?.paymentStatus === 'payment_under_review';
    const isVerified = registration?.paymentStatus === 'verified' || registration?.status === 'registered';
    const isRejected = registration?.paymentStatus === 'rejected';

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-mono">
            <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12 flex flex-col gap-8">
                {/* Global Go Back Navigation */}
                <div className="w-full">
                    <button
                        onClick={() => navigate({ to: '/workspace' })}
                        className="flex items-center gap-2 font-bold text-zinc-400 hover:text-electric-blue transition-colors text-xs uppercase"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        RETURN TO WORKSPACE
                    </button>
                </div>

                <header className="border-b-4 border-electric-blue pb-6">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-pure-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-electric-blue text-4xl">payments</span>
                        TOURNAMENT ENROLLMENT CLEARANCE
                    </h1>
                    <p className="text-zinc-400 text-sm mt-2">
                        {hackathon?.name || "CodeSrijan Tournament"} — Official Entry Clearance Protocol.
                    </p>
                </header>

                {/* Status Banners */}
                {isUnderReview && (
                    <div className="bg-amber-500/10 border-4 border-amber-500 p-6 space-y-2">
                        <div className="flex items-center gap-3 text-amber-400 font-black uppercase text-base">
                            <span className="material-symbols-outlined animate-spin text-2xl">autorenew</span>
                            TRANSMISSION UNDER AUDIT — ADMIN REVIEW PENDING
                        </div>
                        <p className="text-xs text-zinc-300">
                            Your payment proof and UTR (<strong className="text-amber-400">{registration?.transactionReference}</strong>) have been submitted to the CodeSrijan Admin Control Center.
                        </p>
                        <p className="text-xs text-zinc-400">
                            Submitted at: {new Date(registration?.paymentSubmittedAt || '').toLocaleString()}. Squad roster is locked in the tournament queue.
                        </p>
                    </div>
                )}

                {isVerified && (
                    <div className="bg-emerald-500/10 border-4 border-emerald-500 p-6 space-y-3">
                        <div className="flex items-center gap-3 text-emerald-400 font-black uppercase text-base">
                            <span className="material-symbols-outlined text-2xl">verified</span>
                            ACCESS GRANTED — PAYMENT VERIFIED & SQUAD CLEARED
                        </div>
                        <p className="text-xs text-zinc-300">
                            Your entry fee has been cleared by the tournament administration. Your squad is fully confirmed for competition.
                        </p>
                        <button
                            onClick={() => navigate({ to: '/workspace' })}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 font-black uppercase text-xs transition-colors"
                        >
                            Enter Competition Workspace
                        </button>
                    </div>
                )}

                {isRejected && (
                    <div className="bg-rose-500/10 border-4 border-rose-500 p-6 space-y-3">
                        <div className="flex items-center gap-3 text-rose-400 font-black uppercase text-base">
                            <span className="material-symbols-outlined text-2xl">error</span>
                            PAYMENT CLEARANCE DECLINED
                        </div>
                        <div className="bg-black/50 p-3 border border-rose-900 text-xs text-zinc-200">
                            <strong className="text-rose-400 uppercase block mb-1">Reason provided by Admin:</strong>
                            {registration?.reviewReason || "Transaction could not be verified."}
                        </div>
                        <button
                            disabled={retrying}
                            onClick={handleRetry}
                            className="bg-rose-500 hover:bg-rose-400 text-black px-4 py-2 font-black uppercase text-xs transition-colors disabled:opacity-50"
                        >
                            {retrying ? 'RESETTING...' : 'RETRY PAYMENT SUBMISSION'}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Authoritative Order Summary */}
                    <section className="bg-zinc-950 border-4 border-zinc-800 p-6 space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h2 className="text-lg font-black uppercase text-white border-b-2 border-zinc-800 pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-electric-blue text-xl">receipt</span>
                                Authoritative Fee Summary
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-zinc-300">
                                    <span>Target Event</span>
                                    <span className="font-bold text-white uppercase">{hackathon?.name || "CodeSrijan '24"}</span>
                                </div>
                                <div className="flex justify-between text-zinc-300">
                                    <span>Fee Structure</span>
                                    <span className="font-bold text-white uppercase">{feeBasisDisplay.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between text-zinc-300">
                                    <span>Squad Registration Type</span>
                                    <span className="font-bold text-white uppercase">{registration?.type || 'Squad Entry'}</span>
                                </div>
                                <div className="flex justify-between text-zinc-300 pt-3 border-t-2 border-dashed border-zinc-800 text-base">
                                    <span className="font-bold text-electric-blue uppercase">Total Fee Due</span>
                                    <span className="font-black text-2xl text-electric-blue">₹{feeToDisplay}</span>
                                </div>
                            </div>

                            {/* Squad Roster */}
                            {registration?.rosterMembers && registration.rosterMembers.length > 0 && (
                                <div className="bg-zinc-900 p-3 border border-zinc-800 space-y-2 mt-4">
                                    <p className="text-xs font-bold text-zinc-400 uppercase">Enrolled Roster ({registration.rosterMembers.length} Operatives):</p>
                                    <div className="space-y-1">
                                        {registration.rosterMembers.map(m => (
                                            <div key={m.userId} className="flex justify-between text-xs text-zinc-300">
                                                <span>{m.name} ({m.role})</span>
                                                <span className="text-emerald-400">✓ Verified</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 italic mt-1">* Squad roster is cryptographically locked for this event.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900 p-4 border border-zinc-800 text-xs space-y-1">
                            <p className="text-zinc-400 uppercase">Team ID: <span className="text-white font-mono">{registration?.teamId || "Assigned on Confirmation"}</span></p>
                            <p className="text-zinc-400 uppercase">Clearance Status: <span className="text-electric-blue font-bold uppercase">{registration?.paymentStatus || 'Pending Proof'}</span></p>
                        </div>
                    </section>

                    {/* Right Column: Payment Instructions & Submission */}
                    <section className="bg-zinc-950 border-4 border-zinc-800 p-6 space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-black uppercase text-white border-b-2 border-zinc-800 pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-electric-blue text-xl">qr_code_2</span>
                                Official UPI Instructions
                            </h2>

                            {/* Official QR and UPI string */}
                            <div className="bg-zinc-900 p-4 border border-zinc-800 flex items-center gap-4">
                                <div className="bg-white p-2 border-2 border-zinc-700 w-28 h-28 shrink-0 flex items-center justify-center">
                                    <img
                                        src={hackathon?.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${encodeURIComponent(upiIdDisplay)}%26pn=${encodeURIComponent(payeeDisplay)}%26am=${feeToDisplay}%26cu=INR`}
                                        alt="UPI QR Code"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="space-y-1 text-xs overflow-hidden">
                                    <p className="text-zinc-400 uppercase">Payee Name:</p>
                                    <p className="font-bold text-white text-sm">{payeeDisplay}</p>
                                    <p className="text-zinc-400 uppercase mt-2">UPI ID:</p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-electric-blue font-bold truncate select-all">{upiIdDisplay}</span>
                                        <button
                                            type="button"
                                            onClick={copyUpi}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-white p-1 text-[10px] uppercase font-bold"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Proof Form */}
                        {!isVerified && !isUnderReview && (
                            <form onSubmit={handleSubmitProof} className="space-y-4 pt-2 border-t-2 border-zinc-900">
                                <div>
                                    <label className="text-xs font-bold text-zinc-300 uppercase block mb-1">
                                        Transaction Reference / 12-Digit UTR *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={utr}
                                        onChange={(e) => setUtr(e.target.value)}
                                        placeholder="e.g. 428901234567 or UPI Ref ID"
                                        className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white text-xs font-mono focus:border-electric-blue outline-none"
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">Found in your payment app receipt (Google Pay, PhonePe, Paytm, BHIM).</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-zinc-300 uppercase block mb-1">
                                        Payment Receipt Screenshot *
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        onChange={handleFileUpload}
                                        className="w-full bg-zinc-900 border-2 border-zinc-700 p-2 text-white text-xs file:mr-4 file:py-1 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-electric-blue file:text-black cursor-pointer"
                                    />
                                    {proofFileName && (
                                        <p className="text-xs text-emerald-400 mt-1 font-mono">✓ Attached: {proofFileName}</p>
                                    )}
                                </div>

                                {proofBase64 && (
                                    <div className="border border-zinc-800 p-2 bg-black">
                                        <p className="text-[10px] text-zinc-500 uppercase mb-1">Proof Preview:</p>
                                        <img src={proofBase64} alt="Receipt preview" className="max-h-32 object-contain mx-auto" />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-electric-blue hover:bg-white text-black font-black uppercase py-3 text-xs tracking-wider transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'TRANSMITTING PROOF TO MAINFRAME...' : 'SUBMIT PAYMENT PROOF FOR AUDIT'}
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
