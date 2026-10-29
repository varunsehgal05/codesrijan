import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/hackathons/$id/register")({
    component: HackathonRegistrationPage,
});

function HackathonRegistrationPage() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const { currentUser, isLoaded } = useAppStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form Fields mapped to Registration Schema requirements
    const [college, setCollege] = useState((currentUser as any)?.college || "");
    const [branch, setBranch] = useState((currentUser as any)?.branch || "");
    const [year, setYear] = useState((currentUser as any)?.year || "");
    const [type, setType] = useState<'team' | 'solo'>('team');
    const [hackathon, setHackathon] = useState<any>(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [existingRegistration, setExistingRegistration] = useState<any>(null);
    const [leaving, setLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [refundUpi, setRefundUpi] = useState("");
    const [submittingRefund, setSubmittingRefund] = useState(false);

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

    const fetchMyReg = async () => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            if (!token) return;
            const res = await axios.get(`${API_URL}/hackathons/${id}/my-registration`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExistingRegistration(res.data);
        } catch (e) {
            setExistingRegistration(null);
        }
    };

    useEffect(() => {
        if (!isLoaded) return;
        
        if (!currentUser) {
            toast("You must be logged in as a student to register for a hackathon.");
            navigate({ to: '/login' });
        } else if (currentUser.role !== 'student') {
            toast("Only students can register to participate.");
            window.history.back();
        } else {
            // Fetch hackathon details
            axios.get(`${API_URL}/hackathons/${id}`)
                .then(res => {
                    setHackathon(res.data);
                })
                .catch(err => {
                    console.error("Failed to fetch hackathon status:", err);
                    setError("Failed to fetch hackathon status.");
                })
                .finally(() => setStatusLoading(false));

            fetchMyReg();
        }
    }, [currentUser, isLoaded, navigate, id, API_URL]);

    const hackathonStatus = hackathon?.status?.toLowerCase().trim() || '';
    const isClosed = hackathonStatus && hackathonStatus !== 'registration_open' && hackathonStatus !== 'active' && hackathonStatus !== 'upcoming' && id !== 'hack-demo-2';
    const isPaid = hackathon?.entryType === 'paid' && (hackathon?.fee || 0) > 0;
    const hasStarted = (hackathon?.startDate && new Date(hackathon.startDate).getTime() <= Date.now()) || hackathonStatus === 'active' || hackathonStatus === 'ongoing' || hackathonStatus === 'live';
    const isPaymentPending = isPaid && (existingRegistration?.paymentStatus === 'pending_verification' || existingRegistration?.paymentStatus === 'under_review' || existingRegistration?.status === 'payment_under_review');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const hasSquad = !!(currentUser as any)?.teamId;
            const res = await axios.post(`${API_URL}/hackathons/${id}/register`, {
                college,
                branch,
                year,
                type: hasSquad ? 'team' : 'solo',
                teamId: (currentUser as any)?.teamId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
            await fetchMyReg();
            if (isPaid) {
                toast.success("Hackathon enrollment recorded. Proceeding to payment clearance...");
                setTimeout(() => {
                    navigate({ to: '/payment', search: { hackathonId: id } as any });
                }, 1500);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Registration failed. Are you already registered?");
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveHackathon = async () => {
        try {
            setLeaving(true);
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.post(`${API_URL}/hackathons/${id}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message || "Successfully withdrawn from hackathon.");
            setShowLeaveConfirm(false);
            setExistingRegistration(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to leave hackathon.");
        } finally {
            setLeaving(false);
        }
    };

    const handleRefundRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refundUpi || !refundReason) {
            toast.error("Please provide both your UPI ID and refund reason.");
            return;
        }
        try {
            setSubmittingRefund(true);
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.post(`${API_URL}/hackathons/${id}/request-refund`, {
                upiId: refundUpi,
                reason: refundReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message || "Refund request dispatched to administrators.");
            setShowRefundModal(false);
            setRefundReason("");
            setRefundUpi("");
            await fetchMyReg();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to dispatch refund request.");
        } finally {
            setSubmittingRefund(false);
        }
    };

    if (!currentUser) return <div className="min-h-screen bg-background" />;

    const hasSquad = !!(currentUser as any)?.teamId;

    return (
        <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4 sm:p-6 font-mono relative overflow-hidden">
            {/* Dynamic Cyber Grid & Radial Dots */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf822_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-80" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

            {/* Atmospheric Glowing Orbs */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-electric-blue/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-blue/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Main Cyber Neo-Brutalist Card */}
            <div className="w-full max-w-lg bg-[#0c1220]/95 backdrop-blur-md p-6 sm:p-8 border-4 border-electric-blue shadow-[8px_8px_0px_0px_rgba(0,102,255,1)] relative z-10">
                {/* Tech HUD Corner Accents */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white" />

                {/* HUD Top Bar */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
                    <Link to="/hackathons" className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-electric-blue transition-colors uppercase">
                        <span className="material-symbols-outlined text-sm">arrow_back</span> BACK TO HACKATHONS
                    </Link>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-electric-blue/10 text-electric-blue border border-electric-blue/40">
                        HUD // ENROLLMENT PROTOCOL
                    </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-1">
                    Hackathon Enrollment
                </h1>
                <p className="text-electric-blue mb-4 font-mono text-xs uppercase tracking-widest border-b border-zinc-800/80 pb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">flag</span> TARGET ARENA: {hackathon?.name || id}
                </p>

                {/* If already registered: Show Enrolled View */}
                {existingRegistration ? (
                    <div className="space-y-4">
                        <div className="bg-emerald-950/40 border-2 border-emerald-500 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-emerald-400 text-xl">verified</span>
                                <span className="text-emerald-400 font-black text-sm uppercase tracking-wider">
                                    YOU HAVE JOINED THIS HACKATHON
                                </span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                                Your enrollment credentials and squad clearance are officially recorded in the CodeSrijan Mainframe.
                            </p>
                        </div>

                        {/* Clearance Info Card */}
                        <div className="bg-[#090e1c] border-2 border-zinc-700 p-4 space-y-2.5 text-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                                <span className="text-zinc-400 uppercase text-[10px] font-bold">Clearance Status</span>
                                <span className={`px-2 py-0.5 font-bold uppercase text-[10px] ${
                                    isPaymentPending 
                                        ? 'bg-amber-400 text-black animate-pulse' 
                                        : existingRegistration?.paymentStatus === 'approved' || !isPaid
                                            ? 'bg-emerald-400 text-black'
                                            : 'bg-red-400 text-black'
                                }`}>
                                    {isPaymentPending 
                                        ? 'PAYMENT UNDER REVIEW' 
                                        : existingRegistration?.paymentStatus === 'approved' || !isPaid
                                            ? 'ENTRY CLEARED' 
                                            : 'PAYMENT REQUIRED'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 uppercase text-[10px]">Enrollment Type</span>
                                <span className="text-white font-bold uppercase text-[11px]">
                                    {existingRegistration.teamId ? `Squad Mode (${existingRegistration.teamId})` : 'Solo Operative'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 uppercase text-[10px]">Institution</span>
                                <span className="text-zinc-200 font-bold text-[11px] truncate max-w-[200px]">
                                    {existingRegistration.college || 'Verified Institute'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 uppercase text-[10px]">Specialization</span>
                                <span className="text-zinc-200 font-bold text-[11px]">
                                    {existingRegistration.branch || 'CSE'} • Year {existingRegistration.year || '4'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                                <span className="text-zinc-400 uppercase text-[10px]">Enrolled Timestamp</span>
                                <span className="text-zinc-400 font-mono text-[10px]">
                                    {existingRegistration.createdAt ? new Date(existingRegistration.createdAt).toLocaleString() : 'Active'}
                                </span>
                            </div>
                        </div>

                        {/* Hackathon Status & Withdrawal Rules */}
                        {hasStarted ? (
                            <div className="bg-red-950/40 border-2 border-red-500 p-3.5 text-xs text-red-300">
                                <div className="flex items-center gap-1.5 font-bold uppercase mb-1 text-red-400">
                                    <span className="material-symbols-outlined text-sm">lock</span> Tournament In Progress
                                </div>
                                Hackathon tournament has commenced. Roster and event entry are cryptographically locked. Operatives cannot leave an ongoing arena.
                            </div>
                        ) : isPaymentPending ? (
                            <div className="bg-amber-950/40 border-2 border-amber-500 p-3.5 text-xs text-amber-300 space-y-2">
                                <div className="flex items-center gap-1.5 font-bold uppercase text-amber-400">
                                    <span className="material-symbols-outlined text-sm">schedule</span> Payment Audit In Progress
                                </div>
                                <p className="text-[11px] leading-relaxed">
                                    Your payment proof is currently under review by administrators. You cannot leave the hackathon directly while audit is pending. You may request a refund / cashback to cancel your registration.
                                </p>
                                <button
                                    onClick={() => setShowRefundModal(true)}
                                    className="w-full mt-2 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs py-2 px-3 border border-black transition-colors"
                                >
                                    Request Refund / Cashback →
                                </button>
                            </div>
                        ) : (
                            <div className="bg-zinc-900 border border-zinc-800 p-3.5 space-y-2 text-xs">
                                <div className="text-zinc-400 text-[11px]">
                                    Hackathon has not started yet. You may withdraw from this arena at any time prior to commencement.
                                </div>
                                <button
                                    onClick={() => setShowLeaveConfirm(true)}
                                    className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border-2 border-red-500 font-black uppercase text-xs py-2 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">logout</span> Withdraw From Hackathon
                                </button>
                            </div>
                        )}

                        {/* Primary Action Buttons */}
                        <div className="flex flex-col gap-2 pt-2">
                            {isPaid && existingRegistration?.paymentStatus === 'pending_proof' ? (
                                <button
                                    onClick={() => navigate({ to: '/payment', search: { hackathonId: id } as any })}
                                    className="w-full bg-electric-blue hover:bg-white text-black font-black uppercase text-xs py-3 px-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all"
                                >
                                    Complete Payment Clearance →
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate({ to: '/dashboard' })}
                                    className="w-full bg-white hover:bg-electric-blue hover:text-white text-black font-black uppercase text-xs py-3 px-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all"
                                >
                                    Enter Operative Workspace →
                                </button>
                            )}
                        </div>
                    </div>
                ) : success ? (
                    <div className="bg-electric-blue/10 p-6 border-l-4 border-electric-blue space-y-4">
                        <h3 className="text-electric-blue font-bold uppercase mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">task_alt</span> Enrollment Initiated
                        </h3>
                        <p className="text-sm text-zinc-300">
                            {isPaid 
                                ? "Your squad roster is now locked in the mainframe. Complete your payment proof submission to clear your entry." 
                                : "Your registration has been logged into the CodeSrijan Mainframe. You may now form or join a squad."}
                        </p>
                        <div className="flex gap-4 mt-6">
                            {isPaid ? (
                                <button
                                    onClick={() => navigate({ to: '/payment', search: { hackathonId: id } as any })}
                                    className="font-mono text-sm uppercase px-5 py-2.5 bg-electric-blue text-black font-black hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Proceed to Payment Clearance →
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate({ to: '/dashboard' })}
                                    className="font-mono text-sm uppercase px-5 py-2.5 bg-white text-black font-bold hover:bg-electric-blue hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Enter Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Squad Roster Notice (Allows 1+ operatives) */}
                        <div className="bg-[#090e1c] border border-electric-blue/30 p-3 mb-5 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-electric-blue text-base">groups</span>
                                <div>
                                    <span className="text-white font-bold uppercase block text-[11px]">
                                        {hasSquad ? "Squad Registration Mode" : "Solo Operative Mode"}
                                    </span>
                                    <span className="text-zinc-400 text-[10px]">
                                        {hasSquad ? "Roster ready (1 to 6 operatives supported)" : "Individual hacker entry verified"}
                                    </span>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 bg-electric-blue/20 text-electric-blue border border-electric-blue/40 font-bold text-[10px] uppercase">
                                {hasSquad ? "1+ Operatives Valid" : "Solo Valid"}
                            </span>
                        </div>

                        {isPaid && (
                            <div className="bg-amber-500/10 border-2 border-amber-500/80 p-3.5 mb-5 text-xs text-amber-300">
                                <div className="flex items-center gap-1.5 font-bold uppercase mb-1 text-amber-400">
                                    <span className="material-symbols-outlined text-sm">payments</span> Paid Hackathon Notice
                                </div>
                                Entry fee: ₹{hackathon?.fee} ({hackathon?.feeBasis?.replace(/_/g, ' ')}). Registration will lock your squad roster and require payment receipt verification.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {statusLoading && <div className="text-electric-blue text-xs animate-pulse">Checking event status...</div>}
                            
                            {isClosed && !statusLoading && (
                                <div className="bg-red-500/10 border-l-4 border-red-500 p-3 mb-4">
                                    <h3 className="text-red-500 font-bold uppercase text-xs mb-1">Registration Closed</h3>
                                    <p className="text-xs text-zinc-300">Registration is currently closed for this event (Status: {hackathonStatus}).</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Hackathon ID</label>
                                <input type="text" disabled className="w-full bg-[#080d19] border-2 border-zinc-800 p-2.5 text-zinc-500 text-xs cursor-not-allowed font-mono" value={id} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs text-electric-blue">school</span> Academic Institution
                                </label>
                                <input 
                                    type="text" 
                                    disabled={!!isClosed || statusLoading} 
                                    required 
                                    placeholder="e.g. Stanford University / JUET"
                                    className="w-full bg-[#080d19] border-2 border-zinc-700 p-2.5 text-white text-xs focus:border-electric-blue focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                    value={college} 
                                    onChange={(e) => setCollege(e.target.value)} 
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs text-electric-blue">code</span> Branch Specialization
                                </label>
                                <select 
                                    disabled={!!isClosed || statusLoading} 
                                    required 
                                    className="w-full bg-[#080d19] border-2 border-zinc-700 p-2.5 text-white text-xs focus:border-electric-blue focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                    value={branch} 
                                    onChange={(e) => setBranch(e.target.value)}
                                >
                                    <option value="">Select Branch</option>
                                    <option value="CSE">Computer Science & Engineering (CSE)</option>
                                    <option value="IT">Information Technology (IT)</option>
                                    <option value="ECE">Electronics & Communication (ECE)</option>
                                    <option value="EE">Electrical Engineering (EE)</option>
                                    <option value="ME">Mechanical Engineering (ME)</option>
                                    <option value="CE">Civil Engineering (CE)</option>
                                    <option value="BCA/MCA">BCA / MCA</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs text-electric-blue">calendar_today</span> Academic Year
                                </label>
                                <select 
                                    disabled={!!isClosed || statusLoading} 
                                    required 
                                    className="w-full bg-[#080d19] border-2 border-zinc-700 p-2.5 text-white text-xs focus:border-electric-blue focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                    value={year} 
                                    onChange={(e) => setYear(e.target.value)}
                                >
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border-l-4 border-red-500 p-3 text-red-400 font-mono text-xs flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-red-500">error</span>
                                    <span>[ERROR] {error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !college || !branch || !year || !!isClosed || statusLoading}
                                className="w-full bg-electric-blue text-black font-black uppercase tracking-widest py-3.5 px-4 text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                            >
                                {loading ? 'Transmitting...' : (isClosed ? 'Registration Closed' : 'Confirm Enrollment')}
                            </button>
                        </form>
                    </div>
                )}

                {/* Neo-Brutalist Leave Confirmation Modal */}
                {showLeaveConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#0b101d] border-4 border-red-600 p-6 max-w-md w-full shadow-[8px_8px_0px_0px_#FF0000]">
                            <div className="flex items-center gap-2 text-red-500 mb-3 font-black text-sm uppercase">
                                <span className="material-symbols-outlined text-2xl">warning</span>
                                CONFIRM HACKATHON WITHDRAWAL
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed mb-4">
                                Are you sure you want to withdraw from <span className="text-white font-bold">{hackathon?.name || id}</span>? Your squad entry clearance will be revoked.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="px-4 py-2 border-2 border-zinc-700 hover:border-white text-zinc-300 hover:text-white font-bold text-xs uppercase cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeaveHackathon}
                                    disabled={leaving}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase border-2 border-black cursor-pointer"
                                >
                                    {leaving ? 'Withdrawing...' : 'Confirm Withdrawal'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Neo-Brutalist Refund Request Modal */}
                {showRefundModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#0b101d] border-4 border-amber-500 p-6 max-w-md w-full shadow-[8px_8px_0px_0px_#FFAA00]">
                            <div className="flex items-center gap-2 text-amber-400 mb-2 font-black text-sm uppercase">
                                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                                REQUEST REFUND / CASHBACK
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed mb-4">
                                Enter your UPI ID and reason for withdrawal. Administrators will audit your transaction and process your refund within 24-48 hours.
                            </p>
                            <form onSubmit={handleRefundRequest} className="space-y-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Beneficiary UPI ID</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. operative@okhdfcbank"
                                        value={refundUpi}
                                        onChange={(e) => setRefundUpi(e.target.value)}
                                        className="w-full bg-[#080d19] border-2 border-zinc-700 p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Reason for Withdrawal</label>
                                    <textarea
                                        required
                                        rows={2}
                                        placeholder="e.g. Scheduling conflict, squad roster changed"
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="w-full bg-[#080d19] border-2 border-zinc-700 p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                                    />
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowRefundModal(false)}
                                        className="px-4 py-2 border-2 border-zinc-700 hover:border-white text-zinc-300 hover:text-white font-bold text-xs uppercase cursor-pointer"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingRefund}
                                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase border-2 border-black cursor-pointer"
                                    >
                                        {submittingRefund ? 'Submitting...' : 'Dispatch Refund Request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
