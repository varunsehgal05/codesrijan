import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
}

function AdminPaymentsPage() {
    const [registrations, setRegistrations] = useState<PaymentRegistration[]>([]);
    const [summary, setSummary] = useState({
        total: 0,
        pendingCount: 0,
        verifiedCount: 0,
        rejectedCount: 0,
        pendingProofCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'payment_under_review' | 'verified' | 'rejected' | 'pending_proof'>('payment_under_review');
    
    // Modals
    const [activeReceipt, setActiveReceipt] = useState<{ url: string; utr: string; regId: string } | null>(null);
    const [rejectingReg, setRejectingReg] = useState<PaymentRegistration | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

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
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load payment review queue.");
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
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve payment.");
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
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject payment.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-mono">
            {/* Header */}
            <div className="border-b-4 border-electric-blue pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-pure-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-electric-blue text-4xl">receipt_long</span>
                        PAYMENT REVIEW QUEUE
                    </h1>
                    <p className="text-surface-variant text-sm mt-1">
                        Cryptographic audit terminal for tournament entry fee verification & UTR tracking.
                    </p>
                </div>
                <button
                    onClick={fetchPayments}
                    className="flex items-center gap-2 bg-zinc-900 border-2 border-zinc-700 hover:border-electric-blue text-white px-4 py-2 font-bold uppercase text-xs transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    REFRESH TRANSMISSIONS
                </button>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                    onClick={() => setFilter('payment_under_review')}
                    className={`p-5 border-4 cursor-pointer transition-all ${filter === 'payment_under_review' ? 'border-amber-400 bg-amber-400/10 shadow-[4px_4px_0px_0px_#FBBF24]' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                >
                    <p className="text-xs uppercase text-zinc-400 tracking-wider">Awaiting Audit</p>
                    <p className="text-3xl font-black text-amber-400 mt-2">{summary.pendingCount}</p>
                </div>
                <div 
                    onClick={() => setFilter('verified')}
                    className={`p-5 border-4 cursor-pointer transition-all ${filter === 'verified' ? 'border-emerald-400 bg-emerald-400/10 shadow-[4px_4px_0px_0px_#34D399]' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                >
                    <p className="text-xs uppercase text-zinc-400 tracking-wider">Verified & Cleared</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">{summary.verifiedCount}</p>
                </div>
                <div 
                    onClick={() => setFilter('rejected')}
                    className={`p-5 border-4 cursor-pointer transition-all ${filter === 'rejected' ? 'border-rose-400 bg-rose-400/10 shadow-[4px_4px_0px_0px_#FB7185]' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                >
                    <p className="text-xs uppercase text-zinc-400 tracking-wider">Rejected</p>
                    <p className="text-3xl font-black text-rose-400 mt-2">{summary.rejectedCount}</p>
                </div>
                <div 
                    onClick={() => setFilter('pending_proof')}
                    className={`p-5 border-4 cursor-pointer transition-all ${filter === 'pending_proof' ? 'border-electric-blue bg-electric-blue/10 shadow-[4px_4px_0px_0px_#22D3EE]' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                >
                    <p className="text-xs uppercase text-zinc-400 tracking-wider">Awaiting Proof</p>
                    <p className="text-3xl font-black text-electric-blue mt-2">{summary.pendingProofCount}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b-2 border-zinc-800 pb-2 overflow-x-auto">
                {[
                    { id: 'payment_under_review', label: 'Pending Review' },
                    { id: 'verified', label: 'Verified' },
                    { id: 'rejected', label: 'Rejected' },
                    { id: 'pending_proof', label: 'Awaiting Proof' },
                    { id: 'all', label: 'All Registrations' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setFilter(t.id as any)}
                        className={`px-4 py-2 text-xs font-bold uppercase transition-all ${filter === t.id ? 'bg-electric-blue text-black border-2 border-electric-blue' : 'bg-zinc-900 text-zinc-400 border-2 border-transparent hover:text-white'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content Table / Cards */}
            {loading ? (
                <div className="p-12 text-center text-electric-blue border-2 border-zinc-800 animate-pulse">
                    QUERYING MAIN-NETWORK PAYMENT LEDGER...
                </div>
            ) : registrations.length === 0 ? (
                <div className="p-12 text-center border-4 border-dashed border-zinc-800 bg-zinc-950/50">
                    <span className="material-symbols-outlined text-zinc-600 text-5xl mb-2">inbox</span>
                    <p className="text-zinc-400 uppercase text-sm">No payment records located under current filter ({filter}).</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {registrations.map(reg => (
                        <div key={reg.id} className="bg-zinc-950 border-4 border-zinc-800 hover:border-zinc-600 transition-all p-6 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-zinc-900 pb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-white uppercase">{reg.teamName || (reg.type === 'solo' ? 'SOLO OPERATIVE' : 'SQUAD ENTRY')}</span>
                                        <span className="text-xs bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-400 font-mono">ID: {reg.teamId || reg.userId}</span>
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
                                            onClick={() => setActiveReceipt({ url: reg.paymentProofUrl!, utr: reg.transactionReference || 'N/A', regId: reg.id })}
                                            className="bg-electric-blue text-black px-3 py-1 font-bold text-xs uppercase hover:bg-white transition-colors"
                                        >
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

                            {/* Action Buttons */}
                            {reg.paymentStatus === 'payment_under_review' && (
                                <div className="flex gap-4 pt-2 border-t border-zinc-900">
                                    <button
                                        disabled={processingId === reg.id}
                                        onClick={() => handleApprove(reg)}
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs py-3 px-4 border-2 border-emerald-400 transition-colors disabled:opacity-50"
                                    >
                                        VERIFY & CLEAR REGISTRATION
                                    </button>
                                    <button
                                        disabled={processingId === reg.id}
                                        onClick={() => { setRejectingReg(reg); setRejectReason(""); }}
                                        className="flex-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 font-black uppercase text-xs py-3 px-4 border-2 border-rose-500 transition-colors disabled:opacity-50"
                                    >
                                        DECLINE PAYMENT
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Receipt Modal */}
            {activeReceipt && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border-4 border-electric-blue max-w-2xl w-full max-h-[90vh] flex flex-col p-6 space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
                            <div>
                                <h3 className="font-black text-white uppercase">Protected Payment Receipt</h3>
                                <p className="text-xs text-electric-blue">UTR: {activeReceipt.utr}</p>
                            </div>
                            <button
                                onClick={() => setActiveReceipt(null)}
                                className="text-zinc-400 hover:text-white text-xl font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-black p-2 border border-zinc-800 flex items-center justify-center">
                            <img src={activeReceipt.url} alt="Payment Proof" className="max-w-full max-h-[60vh] object-contain" />
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
                            <button
                                onClick={() => setActiveReceipt(null)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-xs font-bold uppercase"
                            >
                                Close
                            </button>
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
                            Provide a specific explanation for the participant (e.g. invalid UTR, incorrect amount, illegible screenshot).
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
        </div>
    );
}
