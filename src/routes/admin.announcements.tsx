import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/announcements")({
    component: AdminAnnouncements,
});

export function AdminAnnouncements() {
    const { hackathons, teams } = useAppStore();
    const safeHackathons = Array.isArray(hackathons) ? hackathons : [];
    const safeTeams = Array.isArray(teams) ? teams : [];

    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [scopeFilter, setScopeFilter] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnn, setEditingAnn] = useState<any | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [targetSearch, setTargetSearch] = useState("");

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const res = await axios.get(`${API_BASE}/admin/announcements`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(Array.isArray(res.data) ? res.data : []);
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
        setTargetSearch("");
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
                toast.success("Broadcast dispatched globally!");
            } else {
                await axios.put(`${API_BASE}/admin/announcements/${editingAnn.id}`, editingAnn, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Broadcast updated successfully.");
            }
            setIsModalOpen(false);
            setStatusMsg({ type: 'success', text: 'Announcement successfully broadcasted.' });
            fetchAnnouncements();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to broadcast announcement.');
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
            toast.success("Broadcast purged.");
            setStatusMsg({ type: 'success', text: 'Broadcast purged.' });
            fetchAnnouncements();
        } catch (err: any) {
            toast.error('Failed to purge broadcast.');
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
            toast.success(`Broadcast ${!isActive ? 'activated' : 'deactivated'}.`);
            fetchAnnouncements();
        } catch (err: any) {
            toast.error('Failed to toggle broadcast status.');
        } finally {
            setLoadingId(null);
        }
    };

    // Filtered announcements
    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(ann => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                (ann.title && ann.title.toLowerCase().includes(q)) ||
                (ann.content && ann.content.toLowerCase().includes(q)) ||
                (ann.targetId && ann.targetId.toLowerCase().includes(q));

            const matchesScope = scopeFilter === "all" || ann.type === scopeFilter;
            return matchesSearch && matchesScope;
        });
    }, [announcements, searchQuery, scopeFilter]);

    // Filtered suggestions for target hackathons
    const suggestedHackathons = useMemo(() => {
        if (!targetSearch) return safeHackathons;
        const q = targetSearch.toLowerCase();
        return safeHackathons.filter(h => (h.name || '').toLowerCase().includes(q) || (h.id || '').toLowerCase().includes(q));
    }, [safeHackathons, targetSearch]);

    // Filtered suggestions for target teams
    const suggestedTeams = useMemo(() => {
        if (!targetSearch) return safeTeams;
        const q = targetSearch.toLowerCase();
        return safeTeams.filter(t => (t.name || '').toLowerCase().includes(q) || (t.id || '').toLowerCase().includes(q));
    }, [safeTeams, targetSearch]);

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20 p-4 md:p-6">
            {/* Header */}
            <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
                        BROADCAST LOGS
                    </h2>
                    <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        Global &amp; Targeted Hackathon Announcements
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
                >
                    <span className="material-symbols-outlined">campaign</span> NEW BROADCAST
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-pure-white p-4 brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-1/2 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search broadcasts by title, content, or target ID..."
                        className="w-full bg-surface-container-lowest p-3 pr-10 font-code-snippet text-xs brutal-border focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-3 text-surface-variant text-sm">search</span>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="font-label-bold text-xs uppercase text-surface-variant">Scope:</span>
                    <select
                        value={scopeFilter}
                        onChange={(e) => setScopeFilter(e.target.value)}
                        className="bg-surface-container-lowest p-3 font-code-snippet text-xs brutal-border focus:outline-none"
                    >
                        <option value="all">All Scopes</option>
                        <option value="global">Global Only</option>
                        <option value="hackathon">Hackathon Targeted</option>
                        <option value="team">Squad Targeted</option>
                    </select>
                </div>
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
            ) : filteredAnnouncements.length === 0 ? (
                <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant">campaign</span>
                    <h3 className="font-display-lg uppercase text-2xl text-stark-black">NO BROADCASTS FOUND</h3>
                    <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">
                        {announcements.length === 0 ? "You have not transmitted any announcements yet." : "No announcements match your search query."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAnnouncements.map(ann => (
                        <div key={ann.id} className={`bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group ${!ann.isActive ? 'opacity-70' : ''}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`font-label-bold uppercase text-[10px] tracking-widest px-2.5 py-1 border-2 border-stark-black inline-flex items-center gap-1.5 ${ann.type === 'global' ? 'bg-stark-black text-pure-white' : 'bg-surface-bright text-stark-black'}`}>
                                        <span className="material-symbols-outlined text-xs">
                                            {ann.type === 'global' ? 'public' : ann.type === 'hackathon' ? 'military_tech' : 'groups'}
                                        </span>
                                        {ann.type} {ann.targetId ? `> ${ann.targetId}` : ''}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => { setEditingAnn({ ...ann }); setTargetSearch(ann.targetId || ""); setIsModalOpen(true); }} className="p-1.5 bg-surface-bright border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors cursor-pointer" title="Edit broadcast">
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(ann.id)} disabled={loadingId === ann.id} className="p-1.5 bg-surface-bright border-2 border-stark-black text-error hover:bg-error hover:text-pure-white transition-colors disabled:opacity-50 cursor-pointer" title="Purge broadcast">
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-headline-md uppercase text-xl text-stark-black mb-2">{ann.title}</h3>
                                <p className="font-body-md text-on-surface-variant line-clamp-3 text-sm leading-relaxed">{ann.content}</p>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t-2 border-stark-black flex justify-between items-center">
                                <div className="font-code-snippet text-[10px] uppercase text-on-surface-variant">
                                    {new Date(ann.createdAt).toLocaleDateString()}
                                </div>
                                <button
                                    onClick={() => handleToggleActive(ann.id, ann.isActive)}
                                    disabled={loadingId === ann.id}
                                    className={`px-3 py-1 font-label-bold uppercase text-xs border-2 border-stark-black transition-colors disabled:opacity-50 cursor-pointer ${ann.isActive ? 'bg-success text-stark-black' : 'bg-surface-container text-stark-black'}`}
                                >
                                    {ann.isActive ? 'ACTIVE ✓' : 'INACTIVE'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Broadcast Editor Modal with Hackathon Suggestions */}
            {isModalOpen && editingAnn && (
                <div
                    onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                    className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
                >
                    <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl flex flex-col max-h-[90vh] cursor-default">
                        <div className="bg-stark-black text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center shrink-0">
                            <h3 className="font-headline-md uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-electric-blue">campaign</span>
                                {editingAnn.id.startsWith("new-") ? "NEW BROADCAST" : "EDIT BROADCAST"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5 overflow-y-auto flex-grow">
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-bold uppercase text-xs">Broadcast Header / Title *</label>
                                <input required type="text" value={editingAnn.title} onChange={(e) => setEditingAnn({...editingAnn, title: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-headline-sm focus:outline-none focus:border-electric-blue" placeholder="URGENT: Submission Deadline Extended"/>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-bold uppercase text-xs">Message Payload / Content *</label>
                                <textarea required rows={4} value={editingAnn.content} onChange={(e) => setEditingAnn({...editingAnn, content: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-sm focus:outline-none focus:border-electric-blue" placeholder="All squads must submit by 23:59 IST..."></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Target Scope</label>
                                    <select
                                        value={editingAnn.type}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            setEditingAnn({...editingAnn, type: newType, targetId: newType === 'global' ? '' : editingAnn.targetId});
                                        }}
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase text-xs focus:outline-none focus:border-electric-blue"
                                    >
                                        <option value="global">GLOBAL (Everyone)</option>
                                        <option value="hackathon">SPECIFIC HACKATHON</option>
                                        <option value="team">SPECIFIC SQUAD</option>
                                    </select>
                                </div>

                                {editingAnn.type === 'hackathon' && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label-bold uppercase text-xs">Select Target Hackathon *</label>
                                        <select
                                            required
                                            value={editingAnn.targetId || ''}
                                            onChange={(e) => setEditingAnn({...editingAnn, targetId: e.target.value})}
                                            className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue"
                                        >
                                            <option value="">-- Choose Target Hackathon --</option>
                                            {suggestedHackathons.map(h => (
                                                <option key={h.id} value={h.id}>
                                                    {h.name} [{h.id}]
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {editingAnn.type === 'team' && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label-bold uppercase text-xs">Select Target Squad *</label>
                                        <select
                                            required
                                            value={editingAnn.targetId || ''}
                                            onChange={(e) => setEditingAnn({...editingAnn, targetId: e.target.value})}
                                            className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue"
                                        >
                                            <option value="">-- Choose Target Squad --</option>
                                            {suggestedTeams.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} [{t.id}]
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Autocomplete Quick Search Helper */}
                            {editingAnn.type !== 'global' && (
                                <div className="bg-zinc-50 border border-zinc-300 p-3 flex flex-col gap-2">
                                    <span className="text-[11px] font-mono text-zinc-500 uppercase font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">search</span>
                                        Filter {editingAnn.type === 'hackathon' ? 'Hackathon' : 'Squad'} Suggestions:
                                    </span>
                                    <input
                                        type="text"
                                        value={targetSearch}
                                        onChange={(e) => setTargetSearch(e.target.value)}
                                        placeholder={`Filter ${editingAnn.type} list by name or ID...`}
                                        className="bg-white border border-zinc-400 p-2 text-xs font-mono"
                                    />
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                        {editingAnn.type === 'hackathon' ? (
                                            suggestedHackathons.slice(0, 8).map(h => (
                                                <button
                                                    type="button"
                                                    key={h.id}
                                                    onClick={() => setEditingAnn({ ...editingAnn, targetId: h.id })}
                                                    className={`text-[10px] px-2 py-0.5 border font-mono ${editingAnn.targetId === h.id ? 'bg-electric-blue text-white border-black font-bold' : 'bg-white hover:bg-zinc-100 text-black border-zinc-300'}`}
                                                >
                                                    {h.name}
                                                </button>
                                            ))
                                        ) : (
                                            suggestedTeams.slice(0, 8).map(t => (
                                                <button
                                                    type="button"
                                                    key={t.id}
                                                    onClick={() => setEditingAnn({ ...editingAnn, targetId: t.id })}
                                                    className={`text-[10px] px-2 py-0.5 border font-mono ${editingAnn.targetId === t.id ? 'bg-electric-blue text-white border-black font-bold' : 'bg-white hover:bg-zinc-100 text-black border-zinc-300'}`}
                                                >
                                                    {t.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-1">
                                <input type="checkbox" id="isActive" checked={editingAnn.isActive} onChange={(e) => setEditingAnn({...editingAnn, isActive: e.target.checked})} className="w-5 h-5 accent-electric-blue cursor-pointer" />
                                <label htmlFor="isActive" className="font-label-bold uppercase text-xs cursor-pointer">Activate broadcast immediately</label>
                            </div>

                            <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-4 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors cursor-pointer">
                                    CANCEL
                                </button>
                                <button type="submit" disabled={loadingId === "saving"} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer">
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
