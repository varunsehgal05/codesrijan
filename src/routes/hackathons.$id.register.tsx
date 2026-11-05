import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAppStore, resolveUserTeam } from "../lib/store";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/hackathons/$id/register")({
    component: HackathonRegistrationPage,
});

function HackathonRegistrationPage() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const { currentUser, isLoaded, teams, registrations, refetchData } = useAppStore();

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

    // Squad and Leadership Resolution
    const userTeam = useMemo(() => resolveUserTeam(teams, currentUser), [teams, currentUser]);
    const hasSquad = Boolean(userTeam);
    const isSquadLeader = Boolean(
        userTeam && currentUser && (
            userTeam.leaderId === currentUser.id ||
            userTeam.leaderId === (currentUser as any)._id ||
            userTeam.leaderId === (currentUser as any).email ||
            (!userTeam.leaderId && Array.isArray(userTeam.memberIds) && userTeam.memberIds[0] === currentUser.id)
        )
    );
    const isSquadMemberOnly = hasSquad && !isSquadLeader;

    // 1-Hackathon Limit Enforcement
    const otherActiveRegistration = useMemo(() => {
        return (registrations || []).find((r: any) => 
            r.hackathonId !== id &&
            (r.userId === currentUser?.id || (userTeam && r.teamId === userTeam.id)) &&
            ['registered', 'confirmed', 'active', 'payment_under_review', 'verified', 'awaiting_payment_proof'].includes(r.status)
        );
    }, [registrations, id, currentUser, userTeam]);

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

    // Auto-fill registration details from currentUser profile
    useEffect(() => {
        if (currentUser) {
            if (!college && (currentUser as any)?.college) setCollege((currentUser as any).college);
            if (!branch && (currentUser as any)?.branch) setBranch((currentUser as any).branch);
            if (!year && (currentUser as any)?.year) setYear((currentUser as any).year);
        }
    }, [currentUser]);

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
            const res = await axios.post(`${API_URL}/hackathons/${id}/leave`, {
                reason: refundReason || "Squad departure prior to tournament commencement",
                refundUpi: refundUpi || ""
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message || "Successfully withdrawn from hackathon.");
            setShowLeaveConfirm(false);
            setExistingRegistration(null);
            setRefundReason("");
            setRefundUpi("");
            if (refetchData) await refetchData();
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

    return (
        <div className="min-h-screen bg-surface-container-lowest bg-pattern text-stark-black flex items-center justify-center p-4 sm:p-6 font-mono relative overflow-hidden">
            {/* Subtle cyber decorative glow */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-electric-blue opacity-10 transform rotate-12 blur-3xl pointer-events-none" />

            {/* Main Neo-Brutalist Enrollment Card */}
            <div className="w-full max-w-lg bg-pure-white p-6 sm:p-8 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
                {/* Tech HUD Corner Accents */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-stark-black" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-stark-black" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-stark-black" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-stark-black" />

                {/* HUD Top Bar */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-stark-black">
                    <Link to="/hackathons" className="flex items-center gap-1.5 text-xs font-label-bold text-ink-black hover:text-electric-blue transition-colors uppercase">
                        <span className="material-symbols-outlined text-sm">arrow_back</span> BACK TO HACKATHONS
                    </Link>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-surface-container text-stark-black border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        HUD // ENROLLMENT PROTOCOL
                    </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-display-lg uppercase tracking-tight text-stark-black mb-1">
                    Hackathon Enrollment
                </h1>
                <p className="text-electric-blue mb-4 font-mono text-xs font-bold uppercase tracking-widest border-b-2 border-stark-black pb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">flag</span> TARGET ARENA: {hackathon?.name || id}
                </p>

                {/* If already registered: Show Enrolled View */}
                {existingRegistration ? (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border-2 border-emerald-600 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-emerald-700 text-xl">verified</span>
                                <span className="text-emerald-800 font-display-md text-sm uppercase tracking-wider">
                                    YOU HAVE JOINED THIS HACKATHON
                                </span>
                            </div>
                            <p className="text-xs text-emerald-950 font-body-md font-bold leading-relaxed">
                                Your enrollment credentials and squad clearance are officially recorded in the CodeSrijan Mainframe.
                            </p>
                        </div>

                        {/* Clearance Info Card */}
                        <div className="bg-surface border-2 border-stark-black p-4 space-y-2.5 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-center pb-2 border-b-2 border-stark-black/15">
                                <span className="text-zinc-600 uppercase text-[10px] font-label-bold">Clearance Status</span>
                                <span className={`px-2.5 py-1 font-bold uppercase text-[10px] border border-stark-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                                    isPaymentPending 
                                        ? 'bg-amber-300 text-black animate-pulse' 
                                        : existingRegistration?.paymentStatus === 'approved' || !isPaid
                                            ? 'bg-emerald-300 text-black' 
                                            : 'bg-red-300 text-black'
                                }`}>
                                    {isPaymentPending 
                                        ? 'PAYMENT UNDER REVIEW' 
                                        : existingRegistration?.paymentStatus === 'approved' || !isPaid
                                            ? 'ENTRY CLEARED' 
                                            : 'PAYMENT REQUIRED'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-zinc-600 uppercase text-[10px] font-label-bold">Enrollment Type</span>
                                <span className="text-stark-black font-bold uppercase text-[11px]">
                                    {existingRegistration.teamId ? `Squad Mode (${existingRegistration.teamId})` : 'Solo Operative'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-zinc-600 uppercase text-[10px] font-label-bold">Institution</span>
                                <span className="text-stark-black font-bold text-[11px] truncate max-w-[200px]">
                                    {existingRegistration.college || 'Verified Institute'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-zinc-600 uppercase text-[10px] font-label-bold">Specialization</span>
                                <span className="text-stark-black font-bold text-[11px]">
                                    {existingRegistration.branch || 'CSE'} • Year {existingRegistration.year || '4'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t-2 border-stark-black/15">
                                <span className="text-zinc-600 uppercase text-[10px] font-label-bold">Enrolled Timestamp</span>
                                <span className="text-zinc-700 font-mono text-[10px]">
                                    {existingRegistration.createdAt ? new Date(existingRegistration.createdAt).toLocaleString() : 'Active'}
                                </span>
                            </div>
                        </div>

                        {/* Hackathon Status & Withdrawal Rules */}
                        {hasStarted ? (
                            <div className="bg-red-50 border-2 border-red-600 p-3.5 text-xs text-red-950 font-label-bold uppercase">
                                <div className="flex items-center gap-1.5 font-bold uppercase mb-1 text-red-800">
                                    <span className="material-symbols-outlined text-sm">lock</span> Tournament In Progress
                                </div>
                                Hackathon tournament has commenced. Roster and event entry are locked.
                            </div>
                        ) : isSquadMemberOnly ? (
                            <div className="bg-zinc-100 border-2 border-zinc-400 p-3.5 space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 font-bold uppercase text-zinc-900 font-label-bold">
                                    <span className="material-symbols-outlined text-sm">shield</span> Enrolled With Squad
                                </div>
                                <p className="text-zinc-700 text-[11px] font-body-md font-bold">
                                    You are enrolled as an operative in squad <strong>{userTeam?.name}</strong>. Only the Squad Leader ({userTeam?.leaderName || 'Leader'}) can manage withdrawal or refund requests.
                                </p>
                            </div>
                        ) : isPaymentPending ? (
                            <div className="bg-amber-50 border-2 border-amber-600 p-3.5 text-xs text-amber-950 space-y-2">
                                <div className="flex items-center gap-1.5 font-bold uppercase text-amber-800 font-label-bold">
                                    <span className="material-symbols-outlined text-sm">schedule</span> Payment Audit In Progress
                                </div>
                                <p className="text-[11px] leading-relaxed font-body-md font-bold">
                                    Your payment proof is under review. You may request a refund / cashback to cancel your registration.
                                </p>
                                <button
                                    onClick={() => setShowRefundModal(true)}
                                    className="w-full mt-2 bg-amber-400 hover:bg-amber-300 text-black font-label-bold uppercase text-xs py-2 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
                                >
                                    Request Refund / Cashback →
                                </button>
                            </div>
                        ) : (
                            <div className="bg-surface-container border-2 border-stark-black p-3.5 space-y-2 text-xs">
                                <div className="text-zinc-700 text-[11px] font-body-md font-bold">
                                    Hackathon has not started yet. Squad Leader may withdraw from this arena at any time prior to commencement.
                                </div>
                                <button
                                    onClick={() => setShowLeaveConfirm(true)}
                                    className="w-full bg-red-100 hover:bg-red-500 hover:text-white text-red-700 border-2 border-red-600 font-label-bold uppercase text-xs py-2 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                                    className="w-full bg-electric-blue hover:bg-black text-pure-white font-label-bold uppercase text-xs py-3.5 px-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-y-0.5"
                                >
                                    Complete Payment Clearance →
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate({ to: '/dashboard' })}
                                    className="w-full bg-white hover:bg-electric-blue hover:text-white text-black font-label-bold uppercase text-xs py-3.5 px-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-y-0.5"
                                >
                                    Enter Operative Workspace →
                                </button>
                            )}
                        </div>
                    </div>
                ) : success ? (
                    <div className="bg-emerald-50 p-6 border-l-4 border-emerald-600 space-y-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="text-emerald-800 font-display-md text-base uppercase mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">task_alt</span> Enrollment Initiated
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-800 font-body-md font-bold">
                            {isPaid 
                                ? "Your squad roster is now locked in the mainframe. Complete your payment proof submission to clear your entry." 
                                : "Your registration has been logged into the CodeSrijan Mainframe. You may now form or join a squad."}
                        </p>
                        <div className="flex gap-4 mt-6">
                            {isPaid ? (
                                <button
                                    onClick={() => navigate({ to: '/payment', search: { hackathonId: id } as any })}
                                    className="font-label-bold text-xs uppercase px-5 py-3 bg-electric-blue text-pure-white border-2 border-black hover:bg-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Proceed to Payment Clearance →
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate({ to: '/dashboard' })}
                                    className="font-label-bold text-xs uppercase px-5 py-3 bg-white text-black border-2 border-black hover:bg-electric-blue hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                >
                                    Enter Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Squad Roster Notice */}
                        <div className="bg-surface-container-low border-2 border-stark-black p-3 mb-5 text-xs flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-electric-blue text-base">groups</span>
                                <div>
                                    <span className="text-stark-black font-label-bold uppercase block text-[11px]">
                                        {hasSquad ? "Squad Registration Mode" : "Solo Operative Mode"}
                                    </span>
                                    <span className="text-zinc-600 text-[10px] font-mono">
                                        {hasSquad ? "Roster ready (1 to 6 operatives supported)" : "Individual hacker entry verified"}
                                    </span>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 bg-electric-blue text-pure-white border border-stark-black font-bold text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                {hasSquad ? "1+ Operatives Valid" : "Solo Valid"}
                            </span>
                        </div>

                        {isPaid && (
                            <div className="bg-amber-50 border-2 border-amber-600 p-3.5 mb-5 text-xs text-amber-950 font-body-md font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-1.5 font-bold uppercase mb-1 text-amber-800 font-label-bold">
                                    <span className="material-symbols-outlined text-sm">payments</span> Paid Hackathon Notice
                                </div>
                                Entry fee: ₹{hackathon?.fee} ({hackathon?.feeBasis?.replace(/_/g, ' ')}). Registration will lock your squad roster and require payment receipt verification.
                            </div>
                        )}

                        {isSquadMemberOnly && (
                            <div className="bg-rose-50 border-4 border-rose-600 p-4 mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-2 text-rose-800 font-label-bold text-xs uppercase mb-1">
                                    <span className="material-symbols-outlined text-sm">lock</span> SQUAD LEADER AUTHORIZATION REQUIRED
                                </div>
                                <p className="text-xs text-rose-950 font-mono leading-relaxed">
                                    You are enlisted in squad <strong>{userTeam?.name}</strong>. Only the designated Squad Leader ({userTeam?.leaderName || 'Leader'}) can enroll the squad into this event. Squad operatives cannot apply or join independently.
                                </p>
                            </div>
                        )}

                        {otherActiveRegistration && (
                            <div className="bg-amber-50 border-4 border-amber-600 p-4 mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-2 text-amber-900 font-label-bold text-xs uppercase mb-1">
                                    <span className="material-symbols-outlined text-sm">warning</span> 1-HACKATHON PARTICIPATION LIMIT
                                </div>
                                <p className="text-xs text-amber-950 font-mono leading-relaxed">
                                    You or your squad are already actively participating in another hackathon. Platform policy allows participation in only 1 active hackathon at a time. Withdraw from your active event before registering for a new one.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {statusLoading && <div className="text-electric-blue text-xs font-bold animate-pulse">Checking event status...</div>}
                            
                            {isClosed && !statusLoading && (
                                <div className="bg-red-50 border-2 border-red-600 p-3 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <h3 className="text-red-700 font-label-bold uppercase text-xs mb-1">Registration Closed</h3>
                                    <p className="text-xs text-red-950 font-body-md font-bold">Registration is currently closed for this event (Status: {hackathonStatus}).</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-label-bold uppercase tracking-wider text-zinc-700">Hackathon ID</label>
                                <input type="text" disabled className="w-full bg-surface-container-high border-2 border-zinc-400 p-3 text-zinc-700 text-xs cursor-not-allowed font-mono font-bold" value={id} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-label-bold uppercase tracking-wider text-stark-black flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs text-electric-blue">school</span> Academic Institution
                                </label>
                                <input 
                                    type="text" 
                                    disabled={!!isClosed || statusLoading || isSquadMemberOnly || Boolean(otherActiveRegistration)} 
                                    required 
                                    placeholder="e.g. Stanford University / JUET"
                                    className="w-full bg-white border-2 border-stark-black p-3 text-stark-black text-xs font-code-snippet focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:outline-none transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                    value={college} 
                                    onChange={(e) => setCollege(e.target.value)} 
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-label-bold uppercase tracking-wider text-stark-black flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs text-electric-blue">code</span> Branch Specialization
                                </label>
                                <select 
                                    disabled={!!isClosed || statusLoading || isSquadMemberOnly || Boolean(otherActiveRegistration)} 
                                    required 
                                    className="w-full bg-white border-2 border-stark-black p-3 text-stark-black text-xs font-code-snippet focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:outline-none transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
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
                                <label className="text-xs font-label-bold uppercase tracking-wider text-stark-black flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs text-electric-blue">calendar_today</span> Academic Year
                                </label>
                                <select 
                                    disabled={!!isClosed || statusLoading || isSquadMemberOnly || Boolean(otherActiveRegistration)} 
                                    required 
                                    className="w-full bg-white border-2 border-stark-black p-3 text-stark-black text-xs font-code-snippet focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:outline-none transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
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
                                <div className="bg-red-50 border-2 border-red-600 p-3 text-red-700 font-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">
                                    <span className="material-symbols-outlined text-sm text-red-600">error</span>
                                    <span>[ERROR] {error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !college || !branch || !year || !!isClosed || statusLoading || isSquadMemberOnly || Boolean(otherActiveRegistration)}
                                className="w-full bg-electric-blue text-pure-white font-label-bold uppercase tracking-wider py-4 px-4 text-xs sm:text-sm border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
                            >
                                {loading ? 'Transmitting...' : isSquadMemberOnly ? '🔒 Leader Clearance Required' : otherActiveRegistration ? '⚠️ 1 Hackathon Limit Active' : (isClosed ? 'Registration Closed' : 'Confirm Enrollment')}
                            </button>
                        </form>
                    </div>
                )}

                {/* Modals for Leave and Refund */}
                {showLeaveConfirm && (
                    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
                        <div className="bg-white border-4 border-black p-6 max-w-sm w-full space-y-4 text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-display-lg uppercase text-lg text-red-600 flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span> Confirm Withdrawal
                            </h3>
                            <p className="text-xs text-zinc-700 font-body-md font-bold">
                                Are you sure you want to withdraw from this hackathon? Your registration slot will be relinquished immediately.
                            </p>
                            {isPaid && (
                                <div className="space-y-2 pt-2 border-t-2 border-zinc-200">
                                    <div className="bg-amber-100 p-2 text-[10px] font-mono text-amber-900 border border-amber-300">
                                        💰 Paid Event (₹{hackathon?.fee || 0}): A refund ticket will be dispatched to the admin payment ledger.
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Your UPI ID for refund (e.g. user@okhdfcbank)"
                                        value={refundUpi}
                                        onChange={e => setRefundUpi(e.target.value)}
                                        className="w-full border-2 border-black p-2 text-xs font-mono"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Reason for withdrawal..."
                                        value={refundReason}
                                        onChange={e => setRefundReason(e.target.value)}
                                        className="w-full border-2 border-black p-2 text-xs font-mono"
                                    />
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="flex-1 py-2 border-2 border-black font-label-bold text-xs uppercase hover:bg-zinc-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeaveHackathon}
                                    disabled={leaving}
                                    className="flex-1 py-2 bg-red-600 text-white border-2 border-black font-label-bold text-xs uppercase hover:bg-red-700"
                                >
                                    {leaving ? 'Processing...' : 'Withdraw'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showRefundModal && (
                    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
                        <div className="bg-white border-4 border-black p-6 max-w-sm w-full space-y-4 text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-display-lg uppercase text-lg text-amber-600 flex items-center gap-2">
                                <span className="material-symbols-outlined">payments</span> Refund Request
                            </h3>
                            <p className="text-xs text-zinc-700 font-body-md font-bold">
                                Enter your UPI ID and reason for cashback review.
                            </p>
                            <input
                                type="text"
                                placeholder="UPI ID (e.g. user@okhdfcbank)"
                                value={refundUpi}
                                onChange={e => setRefundUpi(e.target.value)}
                                className="w-full border-2 border-black p-2 text-xs font-mono"
                            />
                            <textarea
                                placeholder="Reason for refund..."
                                value={refundReason}
                                onChange={e => setRefundReason(e.target.value)}
                                className="w-full border-2 border-black p-2 text-xs font-mono h-20"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowRefundModal(false)}
                                    className="flex-1 py-2 border-2 border-black font-label-bold text-xs uppercase hover:bg-zinc-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRefundRequest}
                                    disabled={submittingRefund || !refundUpi.trim()}
                                    className="flex-1 py-2 bg-amber-500 text-black border-2 border-black font-label-bold text-xs uppercase hover:bg-amber-400"
                                >
                                    {submittingRefund ? 'Sending...' : 'Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
