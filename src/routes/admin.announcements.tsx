import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/announcements")({
    component: AdminAnnouncements,
});

function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnn, setEditingAnn] = useState<any | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.get(`${API_BASE}/admin/announcements`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Could not fetch announcements", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const openCreateModal = () => {
        setEditingAnn({
            id: `new-${Date.now()}`,
            title: "",
            content: "",
            type: "global",
            targetId: "",
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingId("saving");
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            if (editingAnn.id.startsWith("new-")) {
                const payload = { ...editingAnn };
                delete payload.id;
                await axios.post(`${API_BASE}/admin/announcements`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.put(`${API_BASE}/admin/announcements/${editingAnn.id}`, editingAnn, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            setStatusMsg({ type: 'success', text: 'Announcement successfully broadcasted.' });
            fetchAnnouncements();
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to broadcast announcement.' });
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Purge this broadcast permanently?")) return;
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.delete(`${API_BASE}/admin/announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({ type: 'success', text: 'Broadcast purged.' });
            fetchAnnouncements();
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'Failed to purge broadcast.' });
        } finally {
            setLoadingId(null);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.put(`${API_BASE}/admin/announcements/${id}`, { isActive: !isActive }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({ type: 'success', text: `Broadcast ${!isActive ? 'activated' : 'deactivated'}.` });
            fetchAnnouncements();
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'Failed to toggle broadcast status.' });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
            <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
                        BROADCAST LOGS
                    </h2>
                    <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        Global & Targeted Announcements
                    </p>
                </div>
                <button onClick={openCreateModal} className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined">campaign</span> NEW BROADCAST
                </button>
            </div>

            {statusMsg && (
                <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${statusMsg.type === 'error' ? 'bg-error text-pure-white' : 'bg-success text-stark-black'}`}>
                    <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
                    <span>{statusMsg.text}</span>
                </div>
            )}

            {loading ? (
                <div className="bg-surface-container p-16 brutal-border text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-code-snippet uppercase tracking-widest animate-pulse">Syncing broadcast logs...</p>
                </div>
            ) : announcements.length === 0 ? (
                <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant">campaign</span>
                    <h3 className="font-display-lg uppercase text-2xl text-stark-black">ZERO BROADCASTS FOUND</h3>
                    <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">You have not transmitted any announcements yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {announcements.map(ann => (
                        <div key={ann.id} className={`bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group ${!ann.isActive ? 'opacity-70' : ''}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`font-label-bold uppercase text-[10px] tracking-widest px-2 py-1 border-2 border-stark-black inline-block ${ann.type === 'global' ? 'bg-stark-black text-pure-white' : 'bg-surface-bright text-stark-black'}`}>
                                        {ann.type} {ann.targetId ? `> ${ann.targetId}` : ''}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingAnn({ ...ann }); setIsModalOpen(true); }} className="p-1 bg-surface-bright border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors">
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(ann.id)} disabled={loadingId === ann.id} className="p-1 bg-surface-bright border-2 border-stark-black text-error hover:bg-error hover:text-pure-white transition-colors disabled:opacity-50">
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-headline-md uppercase text-xl text-stark-black mb-2">{ann.title}</h3>
                                <p className="font-body-md text-on-surface-variant line-clamp-3">{ann.content}</p>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t-2 border-stark-black flex justify-between items-center">
                                <div className="font-code-snippet text-[10px] uppercase text-on-surface-variant">
                                    {new Date(ann.createdAt).toLocaleDateString()}
                                </div>
                                <button
                                    onClick={() => handleToggleActive(ann.id, ann.isActive)}
                                    disabled={loadingId === ann.id}
                                    className={`px-3 py-1 font-label-bold uppercase text-xs border-2 border-stark-black transition-colors disabled:opacity-50 ${ann.isActive ? 'bg-success text-stark-black' : 'bg-surface-container text-stark-black'}`}
                                >
                                    {ann.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor Modal */}
            {isModalOpen && editingAnn && (
                <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="bg-stark-black text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center shrink-0">
                            <h3 className="font-headline-md uppercase tracking-widest">{editingAnn.id.startsWith("new-") ? "NEW BROADCAST" : "EDIT BROADCAST"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6 overflow-y-auto flex-grow">
                            
                            <div className="flex flex-col gap-2">
                                <label className="font-label-bold uppercase text-xs">Broadcast Header *</label>
                                <input required type="text" value={editingAnn.title} onChange={(e) => setEditingAnn({...editingAnn, title: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-headline-sm focus:outline-none focus:border-electric-blue" placeholder="URGENT: Submission Deadline Extended"/>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="font-label-bold uppercase text-xs">Message Payload *</label>
                                <textarea required rows={5} value={editingAnn.content} onChange={(e) => setEditingAnn({...editingAnn, content: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-sm focus:outline-none focus:border-electric-blue" placeholder="All squads must submit by..."></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold uppercase text-xs">Target Scope</label>
                                    <select value={editingAnn.type} onChange={(e) => setEditingAnn({...editingAnn, type: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase text-xs focus:outline-none focus:border-electric-blue">
                                        <option value="global">GLOBAL (Everyone)</option>
                                        <option value="hackathon">SPECIFIC HACKATHON</option>
                                        <option value="team">SPECIFIC SQUAD</option>
                                    </select>
                                </div>
                                {editingAnn.type !== 'global' && (
                                    <div className="flex flex-col gap-2">
                                        <label className="font-label-bold uppercase text-xs">Target ID</label>
                                        <input required type="text" value={editingAnn.targetId || ''} onChange={(e) => setEditingAnn({...editingAnn, targetId: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase focus:outline-none focus:border-electric-blue" placeholder="e.g. hack-123"/>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input type="checkbox" id="isActive" checked={editingAnn.isActive} onChange={(e) => setEditingAnn({...editingAnn, isActive: e.target.checked})} className="w-5 h-5 accent-electric-blue cursor-pointer" />
                                <label htmlFor="isActive" className="font-label-bold uppercase text-xs cursor-pointer">Activate broadcast immediately</label>
                            </div>

                            <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-4 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors">
                                    CANCEL
                                </button>
                                <button type="submit" disabled={loadingId === "saving"} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50">
                                    <span className="material-symbols-outlined">send</span>
                                    {loadingId === "saving" ? 'TRANSMITTING...' : 'TRANSMIT BROADCAST'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
