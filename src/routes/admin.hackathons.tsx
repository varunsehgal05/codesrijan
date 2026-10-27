import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/hackathons")({
    component: AdminHackathons,
});

function AdminHackathons() {
    const { hackathons, refetchData } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHackathon, setEditingHackathon] = useState<any | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const openCreateModal = () => {
        setEditingHackathon({
            id: "new",
            name: "",
            theme: "",
            startDate: "",
            endDate: "",
            registrationStart: "",
            registrationEnd: "",
            status: "draft",
            teamSizeMin: 1,
            teamSizeMax: 4
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingId("saving");
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const payload = { ...editingHackathon };
            delete payload._id;
            if (editingHackathon.id === "new") {
                delete payload.id;
                await axios.post(`${API_BASE}/hackathons`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.put(`${API_BASE}/hackathons/${editingHackathon.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            setStatusMsg({ type: 'success', text: 'Hackathon saved successfully.' });
            await refetchData();
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save hackathon.' });
        } finally {
            setLoadingId(null);
        }
    };

    const changeState = async (id: string, action: string) => {
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_BASE}/hackathons/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({ type: 'success', text: `Action ${action} executed successfully.` });
            await refetchData();
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: err.response?.data?.message || 'State transition failed.' });
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Disqualify this hackathon permanently?")) return;
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.delete(`${API_BASE}/hackathons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({ type: 'success', text: 'Hackathon deleted.' });
            await refetchData();
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'Failed to delete.' });
        } finally {
            setLoadingId(null);
        }
    };

    const toggleProblemReveal = async (id: string, currentlyRevealed: boolean) => {
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const action = currentlyRevealed ? 'hide-problems' : 'reveal-problems';
            await axios.patch(`${API_BASE}/admin/hackathons/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({
                type: 'success',
                text: currentlyRevealed ? 'Problem statements classified & locked.' : '🚨 Problem statements officially revealed to all participants!'
            });
            await refetchData();
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to toggle problem reveal state.' });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
            <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
                        EVENT MATRICES
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        Hackathon Deployment Configurations
                    </p>
                </div>
                <button 
                    onClick={openCreateModal} 
                    className="bg-stark-black text-pure-white px-6 py-3 font-label-bold border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Initialize Event
                </button>
            </div>

            {statusMsg && (
                <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
                    <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
                    <span>{statusMsg.text}</span>
                </div>
            )}

            <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-stark-black text-pure-white">
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">ID</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Designation &amp; Format</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Dates</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Status &amp; Problems</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hackathons.map((h) => (
                            <tr key={h.id} className="border-b-2 border-stark-black hover:bg-surface-container transition-colors group">
                                <td className="p-4 font-code-snippet text-sm border-r-2 border-stark-black">{h.id}</td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <div className="font-label-bold text-stark-black uppercase text-sm">{h.name}</div>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stark-black text-white uppercase">
                                            {h.mode || 'ONLINE'}
                                        </span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 uppercase ${h.entryType === 'paid' ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'}`}>
                                            {h.entryType === 'paid' ? `₹${h.fee} / ${h.feeBasis === 'per_participant' ? 'MEMBER' : 'SQUAD'}` : 'FREE ENTRY'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black font-code-snippet text-xs text-on-surface-variant">
                                    {(!h.startDate || !h.endDate || isNaN(new Date(h.startDate).getTime()) || isNaN(new Date(h.endDate).getTime())) 
                                        ? 'Not configured' 
                                        : `${new Date(h.startDate).toLocaleDateString()} - ${new Date(h.endDate).toLocaleDateString()}`
                                    }
                                </td>
                                <td className="p-4 border-r-2 border-stark-black space-y-1">
                                    <span className={`inline-flex items-center gap-2 px-2 py-1 font-label-bold text-[10px] uppercase brutal-border ${h.status === 'registration_open' ? 'bg-electric-blue text-pure-white' :
                                            h.status === 'active' ? 'bg-[#FFD700] text-stark-black' :
                                                h.status === 'completed' ? 'bg-stark-black text-pure-white' :
                                                    'bg-surface-variant text-on-surface-variant'
                                        }`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current block"></span>
                                        {h.status.replace('_', ' ')}
                                    </span>
                                    <div>
                                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border ${
                                            h.problemStatementsRevealed
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500'
                                                : 'bg-rose-500/10 text-rose-600 border-rose-500'
                                        }`}>
                                            {h.problemStatementsRevealed ? 'PS: REVEALED' : 'PS: CLASSIFIED'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-center flex flex-wrap justify-center gap-1.5">
                                    <button onClick={() => { setEditingHackathon({...h}); setIsModalOpen(true); }} className="bg-surface-bright text-stark-black px-2.5 py-1 font-label-caps text-xs brutal-border hover:bg-electric-blue hover:text-pure-white transition-all font-bold">
                                        EDIT
                                    </button>
                                    {h.problemStatementsRevealed ? (
                                        <button
                                            disabled={loadingId === h.id}
                                            onClick={() => toggleProblemReveal(h.id, true)}
                                            className="bg-zinc-800 text-white px-2 py-1 font-label-caps text-[11px] brutal-border hover:bg-black transition-all flex items-center gap-1"
                                            title="Hide problem statements from participants"
                                        >
                                            <span className="material-symbols-outlined text-[13px]">visibility_off</span>
                                            HIDE PS
                                        </button>
                                    ) : (
                                        <button
                                            disabled={loadingId === h.id}
                                            onClick={() => toggleProblemReveal(h.id, false)}
                                            className="bg-electric-blue text-white px-2 py-1 font-label-caps text-[11px] brutal-border hover:bg-black transition-all flex items-center gap-1 font-bold"
                                            title="Reveal problem statements to all participants"
                                        >
                                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                                            REVEAL PS
                                        </button>
                                    )}
                                    {(h.status === 'draft' || h.status === 'Upcoming' || h.status === 'upcoming') && (
                                        <button onClick={() => changeState(h.id, 'publish')} className="bg-electric-blue text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-1 transition-all font-bold">PUBLISH</button>
                                    )}
                                    {h.status === 'registration_open' && (
                                        <button onClick={() => changeState(h.id, 'close-registration')} className="bg-[#FFA500] text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-1 transition-all font-bold">CLOSE REG</button>
                                    )}
                                    {h.status === 'registration_closed' && (
                                        <>
                                            <button onClick={() => changeState(h.id, 'open-registration')} className="bg-[#FFA500] text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-1 transition-all font-bold">OPEN REG</button>
                                            <button onClick={() => changeState(h.id, 'open-submissions')} className="bg-success text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-1 transition-all font-bold">START HACK</button>
                                        </>
                                    )}
                                    {(h.status === 'submission_open' || h.status === 'active' || h.status === 'Active') && (
                                        <button onClick={() => changeState(h.id, 'close-submissions')} className="bg-[#FFD700] text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-1 transition-all font-bold">EVAL PHASE</button>
                                    )}
                                    {h.status === 'evaluation' && (
                                        <button onClick={() => changeState(h.id, 'complete')} className="bg-success text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-1 transition-all font-bold">CONCLUDE</button>
                                    )}
                                    {(h.status === 'completed' || h.status === 'Completed') && (
                                        <button onClick={() => changeState(h.id, 'open-registration')} className="bg-electric-blue text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-1 transition-all font-bold">REOPEN</button>
                                    )}
                                    <button onClick={() => handleDelete(h.id)} className="bg-error text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:bg-stark-black transition-all font-bold">DEL</button>
                                </td>
                            </tr>
                        ))}
                        {hackathons.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 font-label-bold uppercase tracking-widest">
                                    [NO ACTIVE EVENT VECTORS IDENTIFIED]
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Editor */}
            {isModalOpen && editingHackathon && (
                <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="bg-electric-blue text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-headline-md uppercase tracking-widest">{editingHackathon.id === "new" ? "INITIALIZE HACKATHON" : "MODIFY HACKATHON"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="font-label-bold uppercase text-xs">Hackathon Designation</label>
                                <input required type="text" value={editingHackathon.name || ''} onChange={(e) => setEditingHackathon({...editingHackathon, name: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="e.g. CodeSrijan 2026"/>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-label-bold uppercase text-xs">Event Lifecycle Status</label>
                                <select
                                    value={editingHackathon.status || 'draft'}
                                    onChange={(e) => setEditingHackathon({...editingHackathon, status: e.target.value})}
                                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="registration_open">Registration Open</option>
                                    <option value="registration_closed">Registration Closed</option>
                                    <option value="submission_open">Submissions Open (Hacking)</option>
                                    <option value="evaluation">Evaluation Phase</option>
                                    <option value="completed">Completed / Concluded</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold uppercase text-xs">Start Date</label>
                                    <input required type="date" value={editingHackathon.startDate ? new Date(editingHackathon.startDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingHackathon({...editingHackathon, startDate: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold uppercase text-xs">End Date</label>
                                    <input required type="date" value={editingHackathon.endDate ? new Date(editingHackathon.endDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingHackathon({...editingHackathon, endDate: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold uppercase text-xs">Registration Start</label>
                                    <input required type="date" value={editingHackathon.registrationStart ? new Date(editingHackathon.registrationStart).toISOString().split('T')[0] : ''} onChange={(e) => setEditingHackathon({...editingHackathon, registrationStart: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold uppercase text-xs">Registration End</label>
                                    <input required type="date" value={editingHackathon.registrationEnd ? new Date(editingHackathon.registrationEnd).toISOString().split('T')[0] : ''} onChange={(e) => setEditingHackathon({...editingHackathon, registrationEnd: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold uppercase text-xs">Team Size (Min)</label>
                                    <input required type="number" min="1" value={editingHackathon.teamSizeMin || 1} onChange={(e) => setEditingHackathon({...editingHackathon, teamSizeMin: Number(e.target.value)})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold uppercase text-xs">Team Size (Max)</label>
                                    <input required type="number" min="1" value={editingHackathon.teamSizeMax || 4} onChange={(e) => setEditingHackathon({...editingHackathon, teamSizeMax: Number(e.target.value)})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-label-bold uppercase text-xs">Description / Rules</label>
                                <textarea value={editingHackathon.description || ''} onChange={(e) => setEditingHackathon({...editingHackathon, description: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet min-h-[100px] focus:outline-none"></textarea>
                            </div>

                            <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors">
                                    CANCEL
                                </button>
                                <button type="submit" disabled={loadingId === "saving"} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50">
                                    <span className="material-symbols-outlined">save</span>
                                    {loadingId === "saving" ? 'SAVING...' : 'COMMIT EVENT'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
