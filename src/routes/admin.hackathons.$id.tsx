import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { toast } from "react-hot-toast";

const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

export const Route = createFileRoute("/admin/hackathons/$id")({
    component: AdminHackathonDetail,
});

function AdminHackathonDetail() {
    const { id } = useParams({ from: "/admin/hackathons/$id" });
    const { teams: storeTeams, problems: storeProblems, refetchData } = useAppStore();
    const [hackathon, setHackathon] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("Overview");

    const tabs = ["Overview", "Teams", "Problems", "Timeline", "Payment Config", "Actions"];

    const loadData = async () => {
        try {
            const token = localStorage.getItem('codesrijan_auth_token') || localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/hackathons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHackathon(res.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "Unable to load hackathon data.");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const changeStatus = async (endpoint: string) => {
        try {
            const token = localStorage.getItem('codesrijan_auth_token') || localStorage.getItem('token');
            await axios.post(`${API_URL}/hackathons/${id}/${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`State updated: ${endpoint.toUpperCase()}`);
            await loadData();
            await refetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Action failed.");
        }
    };

    if (loading) return <div className="p-12 text-center font-display-md text-electric-blue animate-pulse">Scanning Hackathon Node...</div>;

    if (error) return (
        <div className="p-12 text-center flex flex-col items-center gap-4">
            <h2 className="font-display-lg text-error uppercase">{error}</h2>
            <Link to="/admin/hackathons" className="px-6 py-2 bg-stark-black text-pure-white font-label-caps brutal-border">
                ← Back to Hackathon List
            </Link>
        </div>
    );

    if (!hackathon) return <div className="p-12">Hackathon record not found.</div>;

    const hackathonTeams = storeTeams.filter((t: any) => t.hackathonId === id);
    const hackathonProblems = storeProblems.filter((p: any) => p.hackathonId === id);

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8 pb-20 font-mono text-xs">
            {/* Master Header */}
            <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link to="/admin/hackathons" className="font-bold underline text-xs text-zinc-600 hover:text-black">
                            ← HACKATHONS
                        </Link>
                        <span className="text-zinc-400">/</span>
                        <span className="font-bold text-zinc-500 uppercase">{hackathon.id}</span>
                    </div>
                    <h1 className="font-display-lg text-2xl md:text-3xl uppercase text-stark-black tracking-tight leading-none bg-[#00E5FF] text-stark-black px-3 py-1 inline-block transform -skew-x-6 brutal-border">
                        {hackathon.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-stark-black text-pure-white font-bold uppercase text-[10px]">
                            State: {hackathon.status?.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 bg-zinc-200 text-zinc-800 font-bold uppercase text-[10px]">
                            {hackathon.mode?.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-300 text-black font-bold uppercase text-[10px]">
                            {hackathon.entryType === 'paid' ? `₹${hackathon.fee}` : 'FREE'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 font-label-bold uppercase text-xs flex-wrap">
                    {hackathon.status === 'draft' && (
                        <button onClick={() => changeStatus('publish')} className="bg-success text-stark-black px-4 py-2 brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer font-black">
                            Publish Live
                        </button>
                    )}
                    {hackathon.status === 'registration_open' && (
                        <button onClick={() => changeStatus('close-registration')} className="bg-amber-400 text-stark-black px-4 py-2 brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform cursor-pointer font-bold">
                            Close Reg
                        </button>
                    )}
                    {hackathon.status === 'registration_closed' && (
                        <>
                            <button onClick={() => changeStatus('open-registration')} className="bg-[#00E5FF] text-stark-black px-3 py-2 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer font-bold">
                                Reopen Reg
                            </button>
                            <button onClick={() => changeStatus('open-submissions')} className="bg-success text-stark-black px-4 py-2 brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer font-black">
                                Start Hackathon
                            </button>
                        </>
                    )}
                    {(hackathon.status === 'submission_open' || hackathon.status === 'active') && (
                        <button onClick={() => changeStatus('close-submissions')} className="bg-[#FFD700] text-stark-black px-4 py-2 brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer font-black">
                            Move to Evaluation
                        </button>
                    )}
                    {hackathon.status === 'evaluation' && (
                        <button onClick={() => changeStatus('complete')} className="bg-stark-black text-pure-white px-4 py-2 brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer font-black">
                            Conclude Event
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto no-scrollbar border-b-4 border-stark-black gap-1">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 font-label-bold uppercase whitespace-nowrap transition-all cursor-pointer brutal-border ${
                            activeTab === tab
                                ? 'bg-stark-black text-pure-white shadow-[3px_3px_0px_0px_rgba(0,229,255,1)]'
                                : 'bg-surface-bright text-zinc-700 hover:bg-zinc-200'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'Overview' && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-pure-white p-5 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
                            <span className="font-bold text-xs uppercase text-on-surface-variant">Associated Squads</span>
                            <span className="font-display-lg text-3xl text-stark-black">{hackathonTeams.length}</span>
                        </div>
                        <div className="bg-pure-white p-5 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
                            <span className="font-bold text-xs uppercase text-on-surface-variant">Problem Tracks</span>
                            <span className="font-display-lg text-3xl text-stark-black">{hackathonProblems.length}</span>
                        </div>
                        <div className="bg-pure-white p-5 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
                            <span className="font-bold text-xs uppercase text-on-surface-variant">Fee Policy</span>
                            <span className="font-display-lg text-2xl text-stark-black">
                                {hackathon.entryType === 'paid' ? `₹${hackathon.fee}` : 'FREE'}
                            </span>
                        </div>
                        <div className="bg-pure-white p-5 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1">
                            <span className="font-bold text-xs uppercase text-on-surface-variant">Problem Statements</span>
                            <span className="font-display-lg text-2xl text-[#00E5FF]">
                                {hackathon.problemStatementsRevealed ? "REVEALED" : "CLASSIFIED"}
                            </span>
                        </div>
                    </div>

                    <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
                        <h3 className="font-bold uppercase text-sm text-stark-black">Event Abstract & Directives</h3>
                        <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{hackathon.description || 'No description provided.'}</p>
                    </div>
                </div>
            )}

            {/* Tab 2: Teams */}
            {activeTab === 'Teams' && (
                <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold uppercase text-sm text-stark-black">Registered Squads ({hackathonTeams.length})</h3>
                        <Link to="/admin/teams" className="px-3 py-1 bg-stark-black text-pure-white font-bold uppercase text-xs">
                            Manage All Squads →
                        </Link>
                    </div>

                    {hackathonTeams.length === 0 ? (
                        <p className="text-zinc-500 py-6 text-center">No squads have registered for this hackathon yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {hackathonTeams.map((t: any) => (
                                <div key={t.id} className="p-3 bg-surface-container-lowest brutal-border flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-stark-black uppercase">{t.name}</div>
                                        <div className="text-[10px] text-zinc-500">ID: {t.id} • {t.memberIds?.length || 1} members</div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-zinc-200 text-zinc-800 font-bold uppercase text-[10px]">
                                        {t.status || 'Active'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 3: Problems */}
            {activeTab === 'Problems' && (
                <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold uppercase text-sm text-stark-black">Problem Statements & Tracks ({hackathonProblems.length})</h3>
                        <Link to="/admin/problems" className="px-3 py-1 bg-[#00E5FF] text-stark-black font-bold uppercase text-xs brutal-border">
                            + Add Problem Statement →
                        </Link>
                    </div>

                    {hackathonProblems.length === 0 ? (
                        <p className="text-zinc-500 py-6 text-center">No problem statements have been linked to this hackathon yet.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {hackathonProblems.map((p: any) => (
                                <div key={p.id} className="p-4 bg-surface-container-lowest brutal-border flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-stark-black uppercase text-sm">{p.title}</div>
                                        <div className="flex gap-2 mt-1">
                                            <span className="px-1.5 py-0.5 bg-stark-black text-white text-[9px] uppercase font-bold">{p.domain || 'General'}</span>
                                            <span className="px-1.5 py-0.5 bg-amber-300 text-black text-[9px] uppercase font-bold">{p.difficulty}</span>
                                        </div>
                                        <p className="text-zinc-600 mt-2 text-xs">{p.description}</p>
                                    </div>
                                    <Link to={`/admin/problems`} className="px-3 py-1 bg-surface-bright text-black font-bold uppercase text-[10px] brutal-border">
                                        Edit Spec
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 4: Timeline */}
            {activeTab === 'Timeline' && (
                <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                    <h3 className="font-bold uppercase text-sm text-stark-black">Timeline Milestones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-surface-container-lowest brutal-border">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Registration Window</span>
                            <div className="font-bold text-stark-black text-sm mt-1">
                                {new Date(hackathon.registrationStart || Date.now()).toLocaleDateString()} – {new Date(hackathon.registrationEnd || Date.now()).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-4 bg-surface-container-lowest brutal-border">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Competition Run Window</span>
                            <div className="font-bold text-stark-black text-sm mt-1">
                                {new Date(hackathon.startDate || Date.now()).toLocaleDateString()} – {new Date(hackathon.endDate || Date.now()).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-4 bg-surface-container-lowest brutal-border">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Submission Deadline</span>
                            <div className="font-bold text-stark-black text-sm mt-1">
                                {hackathon.submissionDeadline ? new Date(hackathon.submissionDeadline).toLocaleDateString() : 'At Event Close'}
                            </div>
                        </div>
                        <div className="p-4 bg-surface-container-lowest brutal-border">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Team Composition Rules</span>
                            <div className="font-bold text-stark-black text-sm mt-1">
                                Min {hackathon.teamSizeMin || 1} — Max {hackathon.teamSizeMax || 4} Operatives
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 5: Payment Config */}
            {activeTab === 'Payment Config' && (
                <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-6">
                    <div className="flex-1 flex flex-col gap-3">
                        <h3 className="font-bold uppercase text-sm text-stark-black">Payment Parameters</h3>
                        <div><span className="font-bold text-zinc-500 uppercase">Policy:</span> {hackathon.entryType === 'paid' ? 'Paid Admission' : 'Free Access'}</div>
                        {hackathon.entryType === 'paid' && (
                            <>
                                <div><span className="font-bold text-zinc-500 uppercase">Fee:</span> ₹{hackathon.fee} ({hackathon.feeBasis === 'per_participant' ? 'Per Participant' : 'Per Squad'})</div>
                                <div><span className="font-bold text-zinc-500 uppercase">UPI VPA:</span> {hackathon.upiId || 'Not configured'}</div>
                                <div><span className="font-bold text-zinc-500 uppercase">Payee Name:</span> {hackathon.payeeName || 'CodeSrijan Society'}</div>
                            </>
                        )}
                    </div>
                    {hackathon.entryType === 'paid' && hackathon.qrImageUrl && (
                        <div className="w-48 flex flex-col items-center p-3 bg-surface-container brutal-border">
                            <span className="text-[10px] font-bold uppercase mb-2">Configured UPI QR</span>
                            <img src={hackathon.qrImageUrl} alt="QR Code" className="w-36 h-36 object-contain bg-white p-1 brutal-border" />
                        </div>
                    )}
                </div>
            )}

            {/* Tab 6: Actions */}
            {activeTab === 'Actions' && (
                <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                    <h3 className="font-bold uppercase text-sm text-stark-black">Direct Hub Navigators</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Link to="/admin/submissions" className="p-4 bg-surface-container brutal-border text-center font-bold uppercase hover:bg-[#00E5FF]/20">
                            Submissions Pipeline →
                        </Link>
                        <Link to="/admin/certificates" className="p-4 bg-surface-container brutal-border text-center font-bold uppercase hover:bg-[#00E5FF]/20">
                            Issue Certificates →
                        </Link>
                        <Link to="/admin/evaluations" className="p-4 bg-surface-container brutal-border text-center font-bold uppercase hover:bg-[#00E5FF]/20">
                            Judge Rubrics →
                        </Link>
                        <Link to="/admin/announcements" className="p-4 bg-surface-container brutal-border text-center font-bold uppercase hover:bg-[#00E5FF]/20">
                            Broadcast Updates →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
