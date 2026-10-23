import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/admin/payments")({
    component: AdminPaymentsPage,
});

interface RosterMember {
    userId: string;
    name: string;
    email: string;
    college?: string;
    role: string;
}

interface PaymentRegistration {
    id: string;
    hackathonId: string;
    hackathonName?: string;
    userId: string;
    teamId?: string;
    teamName?: string;
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
    reviewedBy?: string;
    reviewedAt?: string;
    rosterMembers?: RosterMember[];
    reviewHistory?: Array<{ status: string; reason: string; reviewedBy?: string; timestamp: string }>;
    createdAt: string;
    isTest?: boolean;
}

function AdminPaymentsPage() {
    const [registrations, setRegistrations] = useState<PaymentRegistration[]>([]);
    const [summary, setSummary] = useState({
        total: 0,
        pendingCount: 0,
        verifiedCount: 0,
        rejectedCount: 0,
        pendingProofCount: 0,
        testCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'payment_under_review' | 'verified' | 'rejected' | 'pending_proof'>('payment_under_review');
    const [searchQuery, setSearchQuery] = useState("");

    const filteredRegistrations = useMemo(() => {
        if (!searchQuery.trim()) return registrations;
        const q = searchQuery.toLowerCase().trim();
        return registrations.filter(reg => {
            const matchesUtr = reg.transactionReference?.toLowerCase().includes(q);
            const matchesTeamName = reg.teamName?.toLowerCase().includes(q);
            const matchesTeamId = reg.teamId?.toLowerCase().includes(q);
            const matchesUserId = reg.userId?.toLowerCase().includes(q);
            const matchesHackathon = (reg.hackathonName || reg.hackathonId)?.toLowerCase().includes(q);
            const matchesRoster = reg.rosterMembers?.some(m => 
                m.name?.toLowerCase().includes(q) || 
                m.email?.toLowerCase().includes(q) || 
                m.userId?.toLowerCase().includes(q)
            );
            const matchesReason = reg.reviewReason?.toLowerCase().includes(q);
            return !!(matchesUtr || matchesTeamName || matchesTeamId || matchesUserId || matchesHackathon || matchesRoster || matchesReason);
        });
    }, [registrations, searchQuery]);
    
    // Modals
    const [activeReceipt, setActiveReceipt] = useState<{ url: string; utr: string; regId: string; reg: PaymentRegistration } | null>(null);
    const [receiptViewTab, setReceiptViewTab] = useState<'visual' | 'voucher' | 'raw'>('visual');
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [zoomActual, setZoomActual] = useState(false);
    const [rejectingReg, setRejectingReg] = useState<PaymentRegistration | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [editingNoteReg, setEditingNoteReg] = useState<PaymentRegistration | null>(null);
    const [editNoteText, setEditNoteText] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (activeReceipt) {
            setImgLoading(true);
            setZoomActual(false);
            const isMock = !activeReceipt.url || 
                activeReceipt.url.length < 200 || 
                activeReceipt.url === 'data:image/png;base64,aGVsbG8=' ||
                activeReceipt.url.startsWith('test') ||
                activeReceipt.url === 'placeholder';
            setImgError(isMock);
            setReceiptViewTab(isMock ? 'voucher' : 'visual');
        }
    }, [activeReceipt?.regId, activeReceipt?.url]);

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.get(`${API_URL}/admin/payments?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegistrations(res.data.registrations || []);
            if (res.data.summary) {
                setSummary(res.data.summary);
            }
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            toast.error(msg || "Failed to load payment review queue.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [filter]);

    const handleApprove = async (reg: PaymentRegistration) => {
        if (!confirm(`Confirm approval of payment for ${reg.teamName || reg.userId}? Amount: ₹${reg.feeAmount}`)) return;

        setProcessingId(reg.id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_URL}/admin/payments/${reg.id}/review`, {
                decision: 'approve',
                reason: 'Payment verified and cleared by Administrator'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Payment verified! Squad clearance granted.`);
            fetchPayments();
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            toast.error(msg || "Failed to approve payment.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingReg) return;
        if (!rejectReason.trim()) {
            toast.error("A rejection reason is strictly required.");
            return;
        }

        setProcessingId(rejectingReg.id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_URL}/admin/payments/${rejectingReg.id}/review`, {
                decision: 'reject',
                reason: rejectReason.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Payment marked as rejected. Student notified.");
            setRejectingReg(null);
            setRejectReason("");
            fetchPayments();
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            toast.error(msg || "Failed to reject payment.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleSaveAuditNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingNoteReg) return;
        if (!editNoteText.trim()) {
            toast.error("Audit note text is required.");
            return;
        }

        setProcessingId(editingNoteReg.id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_URL}/admin/payments/${editingNoteReg.id}/review`, {
                noteOnly: true,
                reason: editNoteText.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Audit note updated successfully.");
            if (activeReceipt && activeReceipt.reg.id === editingNoteReg.id) {
                setActiveReceipt({
                    ...activeReceipt,
                    reg: { ...activeReceipt.reg, reviewReason: editNoteText.trim() }
                });
            }
            setEditingNoteReg(null);
            setEditNoteText("");
            fetchPayments();
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
            toast.error(msg || "Failed to update audit note.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-mono">
            {/* Header */}
            <div className="border-b-4 border-electric-blue pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-stark-black flex items-center gap-3">
                        <span className="material-symbols-outlined text-electric-blue text-4xl">receipt_long</span>
                        PAYMENT REVIEW QUEUE
                    </h1>
                    <p className="text-zinc-600 font-semibold text-sm mt-1">
                        Cryptographic audit terminal for tournament entry fee verification &amp; UTR tracking.
                    </p>
                </div>
                <button
                    onClick={fetchPayments}
                    className="flex items-center gap-2 bg-stark-black border-2 border-stark-black hover:bg-electric-blue hover:border-stark-black text-white px-4 py-2.5 font-bold uppercase text-xs transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    REFRESH TRANSMISSIONS
                </button>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                    onClick={() => setFilter('payment_under_review')}
                    className={`p-5 border-4 cursor-pointer transition-all bg-zinc-950 ${filter === 'payment_under_review' ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[4px_4px_0px_0px_#FBBF24]' : 'border-zinc-800 hover:border-zinc-700'}`}
                >
                    <p className={`text-xs uppercase tracking-wider ${filter === 'payment_under_review' ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}>Awaiting Audit</p>
                    <p className="text-3xl font-black text-amber-400 mt-2">{summary.pendingCount}</p>
                </div>
                <div 
                    onClick={() => setFilter('verified')}
                    className={`p-5 border-4 cursor-pointer transition-all bg-zinc-950 ${filter === 'verified' ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-[4px_4px_0px_0px_#34D399]' : 'border-zinc-800 hover:border-zinc-700'}`}
                >
                    <p className={`text-xs uppercase tracking-wider ${filter === 'verified' ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>Verified &amp; Cleared</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">{summary.verifiedCount}</p>
                </div>
                <div 
                    onClick={() => setFilter('rejected')}
                    className={`p-5 border-4 cursor-pointer transition-all bg-zinc-950 ${filter === 'rejected' ? 'border-rose-400 ring-2 ring-rose-400/50 shadow-[4px_4px_0px_0px_#FB7185]' : 'border-zinc-800 hover:border-zinc-700'}`}
                >
                    <p className={`text-xs uppercase tracking-wider ${filter === 'rejected' ? 'text-rose-400 font-bold' : 'text-zinc-400'}`}>Rejected</p>
                    <p className="text-3xl font-black text-rose-400 mt-2">{summary.rejectedCount}</p>
                </div>
                <div 
                    onClick={() => setFilter('pending_proof')}
                    className={`p-5 border-4 cursor-pointer transition-all bg-zinc-950 ${filter === 'pending_proof' ? 'border-electric-blue ring-2 ring-electric-blue/50 shadow-[4px_4px_0px_0px_#22D3EE]' : 'border-zinc-800 hover:border-zinc-700'}`}
                >
                    <p className={`text-xs uppercase tracking-wider ${filter === 'pending_proof' ? 'text-electric-blue font-bold' : 'text-zinc-400'}`}>Awaiting Proof</p>
                    <p className="text-3xl font-black text-electric-blue mt-2">{summary.pendingProofCount}</p>
                </div>
            </div>

            {/* Controls Bar: Filter Tabs & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-zinc-800 pb-3">
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                    {[
                        { id: 'payment_under_review', label: 'Pending Review' },
                        { id: 'verified', label: 'Verified' },
                        { id: 'rejected', label: 'Rejected' },
                        { id: 'pending_proof', label: 'Awaiting Proof' },
                        { id: 'all', label: 'All Registrations' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFilter(t.id as typeof filter)}
                            className={`px-4 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap brutal-border ${
                                filter === t.id 
                                    ? 'bg-electric-blue text-white border-2 border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
                                    : 'bg-zinc-900 text-zinc-300 border-2 border-zinc-700 hover:border-zinc-500 hover:text-white'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <div className="flex items-center bg-pure-white border-2 border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5">
                        <span className="material-symbols-outlined text-stark-black text-lg mr-2 select-none">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH UTR, SQUAD, ID..."
                            className="w-full bg-transparent font-mono text-xs uppercase font-bold text-stark-black placeholder:text-zinc-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-zinc-500 hover:text-stark-black text-xs font-bold px-1 ml-1"
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Search Query Indicator */}
            {searchQuery.trim() && (
                <div className="flex items-center justify-between bg-zinc-950 border-2 border-zinc-700 px-4 py-2 text-xs">
                    <span className="text-zinc-300">
                        SEARCH FILTER: <strong className="text-electric-blue uppercase">"{searchQuery}"</strong> — {filteredRegistrations.length} record(s) found
                    </span>
                    <button
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase transition-colors"
                    >
                        Clear Filter [✕]
                    </button>
                </div>
            )}

            {/* Content Table / Cards */}
            {loading ? (
                <div className="p-12 text-center text-electric-blue border-2 border-zinc-800 bg-zinc-950 animate-pulse font-bold">
                    QUERYING MAIN-NETWORK PAYMENT LEDGER...
                </div>
            ) : registrations.length === 0 ? (
                <div className="p-12 text-center border-4 border-dashed border-zinc-800 bg-zinc-950">
                    <span className="material-symbols-outlined text-zinc-600 text-5xl mb-2">inbox</span>
                    <p className="text-zinc-400 uppercase text-sm font-bold">No payment records located under current filter ({filter.replace(/_/g, ' ')}).</p>
                </div>
            ) : filteredRegistrations.length === 0 ? (
                <div className="p-12 text-center border-4 border-dashed border-zinc-800 bg-zinc-950 space-y-3">
                    <span className="material-symbols-outlined text-zinc-500 text-5xl">search_off</span>
                    <p className="text-white uppercase text-sm font-black tracking-wide">No payment records match "{searchQuery}"</p>
                    <p className="text-zinc-400 text-xs">Search scans across transaction UTRs, squad names, operative IDs, tournaments, and squad members.</p>
                    <button
                        onClick={() => setSearchQuery("")}
                        className="inline-block mt-2 px-4 py-2 bg-electric-blue text-white text-xs font-bold uppercase brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-stark-black transition-all"
                    >
                        Clear Search Query
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRegistrations.map(reg => (
                        <div key={reg.id} className="bg-zinc-950 border-4 border-zinc-800 hover:border-zinc-600 transition-all p-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-zinc-900 pb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-white uppercase">{reg.teamName || (reg.type === 'solo' ? 'SOLO OPERATIVE' : 'SQUAD ENTRY')}</span>
                                        <span className="text-xs bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-400 font-mono">ID: {reg.teamId || reg.userId}</span>
                                        {reg.isTest && (
                                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500 px-2 py-0.5 font-bold uppercase tracking-wider">
                                                TEST DATA
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-electric-blue mt-1 uppercase tracking-wider">Tournament: {reg.hackathonName || reg.hackathonId}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider border-2 ${
                                        reg.paymentStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' :
                                        reg.paymentStatus === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500' :
                                        reg.paymentStatus === 'payment_under_review' ? 'bg-amber-500/10 text-amber-400 border-amber-500 animate-pulse' :
                                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    }`}>
                                        {reg.paymentStatus.replace(/_/g, ' ')}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-400 uppercase">Authoritative Fee</p>
                                        <p className="text-xl font-black text-white">₹{reg.feeAmount} <span className="text-xs text-zinc-400">({reg.feeBasis})</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="bg-zinc-900/60 p-3 border border-zinc-800">
                                    <span className="text-zinc-500 uppercase block mb-1">Transaction Ref / UTR</span>
                                    <span className="font-bold text-white text-sm select-all">
                                        {reg.transactionReference ? (
                                            <span className="text-emerald-400 font-mono tracking-wider">{reg.transactionReference}</span>
                                        ) : (
                                            <span className="text-zinc-600 italic">Not submitted</span>
                                        )}
                                    </span>
                                </div>
                                <div className="bg-zinc-900/60 p-3 border border-zinc-800">
                                    <span className="text-zinc-500 uppercase block mb-1">Submission Timestamp</span>
                                    <span className="text-zinc-300">
                                        {reg.paymentSubmittedAt ? new Date(reg.paymentSubmittedAt).toLocaleString() : 'Pending Operative Submission'}
                                    </span>
                                </div>
                                <div className="bg-zinc-900/60 p-3 border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <span className="text-zinc-500 uppercase block mb-1">Payment Proof File</span>
                                        <span className="text-zinc-300">{reg.paymentProofUrl ? 'Attachment on file' : 'None'}</span>
                                    </div>
                                    {reg.paymentProofUrl && (
                                        <button
                                            onClick={() => setActiveReceipt({ url: reg.paymentProofUrl!, utr: reg.transactionReference || 'N/A', regId: reg.id, reg })}
                                            className="bg-electric-blue hover:bg-white text-black px-3 py-1 font-bold text-xs uppercase transition-colors flex items-center gap-1.5 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        >
                                            <span className="material-symbols-outlined text-xs">visibility</span>
                                            View Proof
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Roster Summary */}
                            {reg.rosterMembers && reg.rosterMembers.length > 0 && (
                                <div className="bg-zinc-900/30 p-3 border border-zinc-850">
                                    <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Locked Squad Roster ({reg.rosterMembers.length} Operatives):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {reg.rosterMembers.map(m => (
                                            <span key={m.userId} className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 text-zinc-300">
                                                <strong className={m.role === 'leader' ? 'text-electric-blue' : 'text-white'}>{m.name}</strong> ({m.role}) - {m.email}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rejection Reason if any */}
                            {reg.reviewReason && (
                                <div className="bg-rose-500/10 border-l-4 border-rose-500 p-3 text-xs">
                                    <span className="text-rose-400 font-bold uppercase block">Audit Note / Rejection Reason:</span>
                                    <p className="text-zinc-300 mt-1">{reg.reviewReason}</p>
                                    {reg.reviewedBy && <span className="text-zinc-500 text-[10px] mt-1 block">Reviewed by: {reg.reviewedBy} on {new Date(reg.reviewedAt || '').toLocaleString()}</span>}
                                </div>
                            )}

                            {/* Action Buttons for All States */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-900">
                                {reg.paymentStatus === 'payment_under_review' && (
                                    <>
                                        <button
                                            disabled={processingId === reg.id}
                                            onClick={() => handleApprove(reg)}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs py-2.5 px-3 border-2 border-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">check</span>
                                            VERIFY & CLEAR
                                        </button>
                                        <button
                                            disabled={processingId === reg.id}
                                            onClick={() => { setRejectingReg(reg); setRejectReason(""); }}
                                            className="flex-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 font-black uppercase text-xs py-2.5 px-3 border-2 border-rose-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                            DECLINE PAYMENT
                                        </button>
                                    </>
                                )}

                                {reg.paymentStatus === 'verified' && (
                                    <>
                                        <button
                                            disabled={processingId === reg.id}
                                            onClick={() => { setRejectingReg(reg); setRejectReason(reg.reviewReason || ""); }}
                                            className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 font-bold uppercase text-xs py-2 px-3 border border-rose-500 transition-colors flex items-center gap-1.5"
                                            title="Reverse verification and reject this payment"
                                        >
                                            <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                            RE-AUDIT: DECLINE
                                        </button>
                                        <button
                                            disabled={processingId === reg.id}
                                            onClick={() => { setEditingNoteReg(reg); setEditNoteText(reg.reviewReason || ""); }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs py-2 px-3 border border-zinc-700 transition-colors flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit_note</span>
                                            EDIT AUDIT NOTE
                                        </button>
                                    </>
                                )}

                                {reg.paymentStatus === 'rejected' && (
                                    <>
                                        <button
                                            disabled={processingId === reg.id}
                                            onClick={() => handleApprove(reg)}
                                            className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 font-bold uppercase text-xs py-2 px-3 border border-emerald-500 transition-colors flex items-center gap-1.5"
                                            title="Reverse rejection and verify this payment"
                                        >
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            RE-AUDIT: VERIFY & CLEAR
                                        </button>
                                        <button
                                            disabled={processingId === reg.id}
                                            onClick={() => { setEditingNoteReg(reg); setEditNoteText(reg.reviewReason || ""); }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs py-2 px-3 border border-zinc-700 transition-colors flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit_note</span>
                                            EDIT REJECTION REASON
                                        </button>
                                    </>
                                )}

                                {reg.paymentStatus === 'pending_proof' && (
                                    <button
                                        disabled={processingId === reg.id}
                                        onClick={() => handleApprove(reg)}
                                        className="bg-electric-blue/20 hover:bg-electric-blue/40 text-electric-blue font-bold uppercase text-xs py-2 px-3 border border-electric-blue transition-colors flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-sm">verified</span>
                                        MANUAL OVERRIDE: VERIFY
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Receipt Modal */}
            {activeReceipt && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border-4 border-electric-blue max-w-3xl w-full max-h-[94vh] flex flex-col p-6 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,53,213,1)]">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b-2 border-zinc-800 pb-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-electric-blue text-xl">verified_user</span>
                                    <h3 className="font-black text-white uppercase text-base tracking-wide">
                                        Protected Payment Receipt
                                    </h3>
                                    {activeReceipt.reg.isTest && (
                                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500 px-2 py-0.5 font-bold uppercase tracking-wider">
                                            TEST DATA
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <span className="text-zinc-400">
                                        UTR: <strong className="text-emerald-400 font-mono tracking-wider">{activeReceipt.utr}</strong>
                                    </span>
                                    <span className="text-zinc-600">|</span>
                                    <span className="text-zinc-400">
                                        SQUAD: <strong className="text-white uppercase">{activeReceipt.reg.teamName || 'SOLO'}</strong>
                                    </span>
                                    <span className="text-zinc-600">|</span>
                                    <span className="text-zinc-400">
                                        FEE: <strong className="text-electric-blue font-bold">₹{activeReceipt.reg.feeAmount}</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(activeReceipt.utr);
                                        toast.success(`UTR ${activeReceipt.utr} copied to clipboard!`);
                                    }}
                                    className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-2.5 py-1 text-[11px] font-bold uppercase transition-all flex items-center gap-1"
                                    title="Copy UTR Reference"
                                >
                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                    Copy UTR
                                </button>
                                <button
                                    onClick={() => setActiveReceipt(null)}
                                    className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1 transition-all text-xl font-bold flex items-center justify-center w-8 h-8"
                                    title="Close Modal"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Inspector Navigation Tabs */}
                        <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setReceiptViewTab('visual')}
                                    className={`px-3 py-1 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                                        receiptViewTab === 'visual'
                                            ? 'bg-electric-blue text-black border border-electric-blue'
                                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">image</span>
                                    Visual Image
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReceiptViewTab('voucher')}
                                    className={`px-3 py-1 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                                        receiptViewTab === 'voucher'
                                            ? 'bg-electric-blue text-black border border-electric-blue'
                                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">receipt_long</span>
                                    Transaction Voucher
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReceiptViewTab('raw')}
                                    className={`px-3 py-1 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                                        receiptViewTab === 'raw'
                                            ? 'bg-electric-blue text-black border border-electric-blue'
                                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">data_object</span>
                                    Raw Payload
                                </button>
                            </div>

                            {receiptViewTab === 'visual' && !imgError && (
                                <div className="flex items-center gap-3 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setZoomActual(!zoomActual)}
                                        className="text-zinc-400 hover:text-white font-mono flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">{zoomActual ? 'zoom_out' : 'zoom_in'}</span>
                                        {zoomActual ? 'Fit to View' : 'Actual Size'}
                                    </button>
                                    <span className="text-zinc-700">|</span>
                                    <button
                                        type="button"
                                        onClick={() => window.open(activeReceipt.url, '_blank')}
                                        className="text-electric-blue hover:underline font-mono"
                                    >
                                        Open Tab ↗
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Receipt Content Canvas */}
                        <div className="relative min-h-[340px] max-h-[58vh] overflow-auto bg-black p-4 border-2 border-zinc-800 flex flex-col items-center justify-center">
                            {/* TAB 1: VISUAL IMAGE */}
                            {receiptViewTab === 'visual' && (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    {imgLoading && !imgError && (
                                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-10">
                                            <span className="material-symbols-outlined text-electric-blue text-4xl animate-spin">progress_activity</span>
                                            <span className="text-xs text-electric-blue font-mono font-bold tracking-wider animate-pulse uppercase">
                                                Decoding Receipt Attachment...
                                            </span>
                                        </div>
                                    )}

                                    {!imgError ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <img
                                                src={activeReceipt.url}
                                                alt="Payment Proof Receipt"
                                                onLoad={(e) => {
                                                    const img = e.currentTarget;
                                                    if (img.naturalWidth <= 15 || img.naturalHeight <= 15) {
                                                        setImgLoading(false);
                                                        setImgError(true);
                                                        setReceiptViewTab('voucher');
                                                    } else {
                                                        setImgLoading(false);
                                                    }
                                                }}
                                                onError={() => {
                                                    setImgLoading(false);
                                                    setImgError(true);
                                                    setReceiptViewTab('voucher');
                                                }}
                                                className={`transition-all select-all ${
                                                    zoomActual 
                                                        ? 'max-w-none cursor-zoom-out' 
                                                        : 'max-w-full max-h-[48vh] object-contain cursor-zoom-in shadow-lg'
                                                }`}
                                                onClick={() => setZoomActual(!zoomActual)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full p-6 bg-zinc-950 border-2 border-amber-500/80 text-left space-y-4 max-w-xl">
                                            <div className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-amber-400 text-3xl shrink-0 mt-0.5">warning</span>
                                                <div>
                                                    <h4 className="text-white font-black text-sm uppercase tracking-wide">
                                                        Attachment Is Not a Renderable Image Raster
                                                    </h4>
                                                    <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                                                        The uploaded proof file is a placeholder test string (or corrupt data) that cannot be displayed as a graphic image. Switch to the <strong>Transaction Voucher</strong> tab to inspect full ledger details.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setReceiptViewTab('voucher')}
                                                    className="bg-electric-blue text-black font-black uppercase text-xs px-4 py-2 hover:bg-white transition-all flex items-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">receipt_long</span>
                                                    View Transaction Voucher
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setReceiptViewTab('raw')}
                                                    className="bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold uppercase text-xs px-4 py-2 hover:text-white transition-all"
                                                >
                                                    Inspect Raw Payload
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: STRUCTURED LEDGER TRANSACTION VOUCHER */}
                            {receiptViewTab === 'voucher' && (
                                <div className="w-full max-w-2xl bg-zinc-950 border-2 border-zinc-700 p-6 space-y-5 text-left shadow-2xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-800 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white text-black font-black flex items-center justify-center text-xl neo-border border-2 border-black">
                                                CS
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black text-base uppercase tracking-tight">
                                                    Official Transaction Voucher
                                                </h4>
                                                <p className="text-xs text-electric-blue font-mono">
                                                    CodeSrijan Financial Audit Protocol
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider border-2 inline-block ${
                                                activeReceipt.reg.paymentStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' :
                                                activeReceipt.reg.paymentStatus === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500' :
                                                'bg-amber-500/10 text-amber-400 border-amber-500'
                                            }`}>
                                                {activeReceipt.reg.paymentStatus.replace(/_/g, ' ')}
                                            </span>
                                            <p className="text-[11px] text-zinc-500 font-mono mt-1">
                                                {activeReceipt.reg.paymentSubmittedAt ? new Date(activeReceipt.reg.paymentSubmittedAt).toLocaleDateString() : 'Awaiting Audit'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Voucher Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                                        <div className="bg-zinc-900/80 p-3 border border-zinc-800 space-y-1">
                                            <span className="text-zinc-500 uppercase text-[10px] block">Tournament Arena</span>
                                            <span className="text-white font-bold block truncate">{activeReceipt.reg.hackathonName || activeReceipt.reg.hackathonId}</span>
                                        </div>

                                        <div className="bg-zinc-900/80 p-3 border border-zinc-800 space-y-1">
                                            <span className="text-zinc-500 uppercase text-[10px] block">Cleared / Due Amount</span>
                                            <span className="text-electric-blue font-black text-lg block">₹{activeReceipt.reg.feeAmount} <span className="text-xs text-zinc-400">({activeReceipt.reg.feeBasis})</span></span>
                                        </div>

                                        <div className="bg-zinc-900/80 p-3 border border-zinc-800 space-y-1">
                                            <span className="text-zinc-500 uppercase text-[10px] block">Registered Squad</span>
                                            <span className="text-emerald-400 font-bold block">{activeReceipt.reg.teamName || 'SOLO OPERATIVE'}</span>
                                            <span className="text-[10px] text-zinc-500 block truncate">ID: {activeReceipt.reg.teamId || activeReceipt.reg.userId}</span>
                                        </div>

                                        <div className="bg-zinc-900/80 p-3 border border-zinc-800 space-y-1">
                                            <span className="text-zinc-500 uppercase text-[10px] block">Transaction Reference (UTR)</span>
                                            <span className="text-white font-mono font-bold block select-all tracking-wider">{activeReceipt.utr}</span>
                                        </div>
                                    </div>

                                    {/* Squad Roster in Voucher */}
                                    {activeReceipt.reg.rosterMembers && activeReceipt.reg.rosterMembers.length > 0 && (
                                        <div className="bg-zinc-900/50 p-3 border border-zinc-850 space-y-1.5 text-xs">
                                            <span className="text-zinc-400 uppercase text-[10px] font-bold block">Squad Roster ({activeReceipt.reg.rosterMembers.length} Operatives):</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                {activeReceipt.reg.rosterMembers.map(m => (
                                                    <div key={m.userId} className="flex items-center justify-between bg-black/40 px-2.5 py-1 border border-zinc-800 text-[11px]">
                                                        <span className="text-white font-mono">{m.name}</span>
                                                        <span className="text-zinc-500 uppercase text-[10px]">({m.role})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Test Data Banner if applicable */}
                                    {(activeReceipt.reg.isTest || activeReceipt.url.length < 200) && (
                                        <div className="bg-amber-500/10 border border-amber-500/40 p-3 text-[11px] text-amber-300 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base shrink-0">info</span>
                                            <span>
                                                <strong>QA / Verification Record:</strong> Attached proof is a simulated test payload generated during end-to-end audit procedures.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: RAW PAYLOAD INSPECTOR */}
                            {receiptViewTab === 'raw' && (
                                <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-4 text-left">
                                    <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                                        <span className="text-zinc-400 uppercase font-bold">Proof Attachment String</span>
                                        <span className="text-zinc-500 font-mono">{activeReceipt.url.length} Characters</span>
                                    </div>

                                    <pre className="bg-black border border-zinc-800 p-4 font-mono text-xs text-emerald-400 break-all select-all max-h-56 overflow-y-auto leading-relaxed">
                                        {activeReceipt.url}
                                    </pre>

                                    <div className="flex items-center justify-between pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(activeReceipt.url);
                                                toast.success("Proof attachment copied to clipboard!");
                                            }}
                                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-1.5 text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">content_copy</span>
                                            Copy Raw Payload
                                        </button>

                                        {activeReceipt.url.startsWith('http') && (
                                            <button
                                                type="button"
                                                onClick={() => window.open(activeReceipt.url, '_blank')}
                                                className="bg-electric-blue text-black px-3 py-1.5 text-xs font-black uppercase hover:bg-white transition-all flex items-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                Open Target URL
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-zinc-800">
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <span>Registration ID:</span>
                                <span className="text-white font-mono">{activeReceipt.reg.id}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveReceipt(null)}
                                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 px-4 py-2 text-xs font-bold uppercase transition-all"
                                >
                                    Close
                                </button>

                                {/* Modal Action Buttons */}
                                {activeReceipt.reg.paymentStatus === 'payment_under_review' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const regToReject = activeReceipt.reg;
                                                setActiveReceipt(null);
                                                setRejectingReg(regToReject);
                                                setRejectReason(imgError ? "Unreadable or corrupt transaction receipt. Please re-upload a clear image file." : "");
                                            }}
                                            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-black uppercase border-2 border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                            Decline Payment
                                        </button>
                                        <button
                                            type="button"
                                            disabled={processingId === activeReceipt.reg.id}
                                            onClick={() => {
                                                const regToApprove = activeReceipt.reg;
                                                setActiveReceipt(null);
                                                handleApprove(regToApprove);
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 text-xs font-black uppercase border-2 border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-sm">check</span>
                                            Verify & Clear
                                        </button>
                                    </>
                                )}

                                {activeReceipt.reg.paymentStatus === 'verified' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const regToReject = activeReceipt.reg;
                                                setActiveReceipt(null);
                                                setRejectingReg(regToReject);
                                                setRejectReason(regToReject.reviewReason || "");
                                            }}
                                            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-black uppercase border-2 border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1"
                                            title="Re-audit: Reverse verification and reject"
                                        >
                                            <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                            Re-Audit: Decline
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingNoteReg(activeReceipt.reg);
                                                setEditNoteText(activeReceipt.reg.reviewReason || "");
                                            }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 text-xs font-bold uppercase border border-zinc-700 transition-all flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit_note</span>
                                            Edit Audit Note
                                        </button>
                                    </>
                                )}

                                {activeReceipt.reg.paymentStatus === 'rejected' && (
                                    <>
                                        <button
                                            type="button"
                                            disabled={processingId === activeReceipt.reg.id}
                                            onClick={() => {
                                                const regToApprove = activeReceipt.reg;
                                                setActiveReceipt(null);
                                                handleApprove(regToApprove);
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 text-xs font-black uppercase border-2 border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1 disabled:opacity-50"
                                            title="Re-audit: Reverse rejection and clear"
                                        >
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            Re-Audit: Verify & Clear
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingNoteReg(activeReceipt.reg);
                                                setEditNoteText(activeReceipt.reg.reviewReason || "");
                                            }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 text-xs font-bold uppercase border border-zinc-700 transition-all flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit_note</span>
                                            Edit Rejection Reason
                                        </button>
                                    </>
                                )}

                                {activeReceipt.reg.paymentStatus === 'pending_proof' && (
                                    <button
                                        type="button"
                                        disabled={processingId === activeReceipt.reg.id}
                                        onClick={() => {
                                            const regToApprove = activeReceipt.reg;
                                            setActiveReceipt(null);
                                            handleApprove(regToApprove);
                                        }}
                                        className="bg-electric-blue text-black px-4 py-2 text-xs font-black uppercase border-2 border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-sm">verified</span>
                                        Manual Override: Verify
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {rejectingReg && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleRejectSubmit} className="bg-zinc-950 border-4 border-rose-500 max-w-md w-full p-6 space-y-4">
                        <h3 className="font-black text-white uppercase text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-rose-500">cancel</span>
                            Decline Payment Submission
                        </h3>
                        <p className="text-xs text-zinc-400">
                            Provide a specific explanation for the participant (e.g. invalid UTR, incorrect amount, illegible screenshot). An automated email and in-app transmission will be dispatched immediately.
                        </p>
                        <div>
                            <label className="text-xs font-bold text-zinc-300 uppercase block mb-1">Rejection Reason *</label>
                            <textarea
                                required
                                rows={4}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="State clearly why payment verification was declined..."
                                className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white text-xs focus:border-rose-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setRejectingReg(null)}
                                className="bg-zinc-800 text-zinc-300 px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processingId === rejectingReg.id}
                                className="bg-rose-500 hover:bg-rose-400 text-black px-4 py-2 text-xs font-black uppercase disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Audit Note Modal */}
            {editingNoteReg && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveAuditNote} className="bg-zinc-950 border-4 border-electric-blue max-w-md w-full p-6 space-y-4">
                        <h3 className="font-black text-white uppercase text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-electric-blue">edit_note</span>
                            {editingNoteReg.paymentStatus === 'rejected' ? 'Edit Rejection Reason' : 'Edit Audit Note'}
                        </h3>
                        <p className="text-xs text-zinc-400">
                            Update administrative record for UTR <strong className="text-white font-mono">{editingNoteReg.transactionReference || 'N/A'}</strong>.
                        </p>
                        <div>
                            <label className="text-xs font-bold text-zinc-300 uppercase block mb-1">Audit Record Text *</label>
                            <textarea
                                required
                                rows={4}
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                placeholder="Enter updated audit notes or review explanation..."
                                className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white text-xs focus:border-electric-blue outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setEditingNoteReg(null)}
                                className="bg-zinc-800 text-zinc-300 px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processingId === editingNoteReg.id}
                                className="bg-electric-blue hover:bg-white text-black px-4 py-2 text-xs font-black uppercase disabled:opacity-50"
                            >
                                Save Note
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
