import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/hackathons")({
    component: AdminHackathons,
});

function toInputDate(val: any): string {
    if (!val) return "";
    try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
    } catch {
        return "";
    }
}

function AdminHackathons() {
    const { hackathons: storeHackathons, refetchData } = useAppStore();
    const [adminHackathons, setAdminHackathons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHackathon, setEditingHackathon] = useState<any | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchAdminHackathons = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            let res;
            try {
                res = await axios.get(`${API_BASE}/admin/hackathons`, { headers });
            } catch {
                res = await axios.get(`${API_BASE}/hackathons`, { headers });
            }
            if (Array.isArray(res.data)) {
                setAdminHackathons(res.data);
            }
        } catch (err) {
            console.error("Failed to load admin hackathons", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminHackathons();
    }, []);

    const hackathonsList = useMemo(() => {
        if (adminHackathons.length > 0) return adminHackathons;
        return storeHackathons;
    }, [adminHackathons, storeHackathons]);

    const openCreateModal = () => {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
        const twoWeeksStr = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

        setEditingHackathon({
            id: "new",
            name: "",
            theme: "General Innovation",
            description: "",
            mode: "online",
            venue: "",
            entryType: "free",
            fee: 0,
            feeBasis: "per_team",
            upiId: "codesrijan@okhdfcbank",
            payeeName: "CodeSrijan Hackathon Society",
            startDate: nextWeekStr,
            endDate: twoWeeksStr,
            registrationStart: todayStr,
            registrationEnd: nextWeekStr,
            submissionDeadline: twoWeeksStr,
            status: "draft",
            problemRevealMode: "manual",
            problemStatementsRevealed: false,
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
            const payload: any = {
                ...editingHackathon,
                fee: editingHackathon.entryType === "paid" ? Number(editingHackathon.fee) || 0 : 0,
                teamSizeMin: Number(editingHackathon.teamSizeMin) || 1,
                teamSizeMax: Number(editingHackathon.teamSizeMax) || 4,
            };
            delete payload._id;

            if (editingHackathon.id === "new") {
                delete payload.id;
                await axios.post(`${API_BASE}/hackathons`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatusMsg({ type: "success", text: "New hackathon initialized successfully." });
            } else {
                await axios.put(`${API_BASE}/hackathons/${editingHackathon.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatusMsg({ type: "success", text: "Hackathon parameters committed successfully." });
            }
            setIsModalOpen(false);
            await Promise.all([fetchAdminHackathons(), refetchData()]);
        } catch (err: any) {
            setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to commit hackathon." });
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
            setStatusMsg({ type: "success", text: `Action [${action.toUpperCase()}] executed successfully.` });
            await Promise.all([fetchAdminHackathons(), refetchData()]);
        } catch (err: any) {
            setStatusMsg({ type: "error", text: err.response?.data?.message || "State transition failed." });
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(`Disqualify hackathon [${id}] permanently from the database?`)) return;
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.delete(`${API_BASE}/hackathons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({ type: "success", text: `Hackathon [${id}] purged successfully.` });
            await Promise.all([fetchAdminHackathons(), refetchData()]);
        } catch (err: any) {
            setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to delete hackathon." });
        } finally {
            setLoadingId(null);
        }
    };

    const toggleProblemReveal = async (id: string, currentlyRevealed: boolean) => {
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const action = currentlyRevealed ? "hide-problems" : "reveal-problems";
            await axios.patch(`${API_BASE}/admin/hackathons/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({
                type: "success",
                text: currentlyRevealed
                    ? "Problem statements locked and classified."
                    : "🚨 Problem statements unlocked and revealed to all participants!"
            });
            await Promise.all([fetchAdminHackathons(), refetchData()]);
        } catch (err: any) {
            setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to toggle reveal state." });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
            {/* Header Banner */}
            <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-3 py-1.5 inline-block transform -skew-x-6">
                        EVENT MATRICES
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        Active Hackathon Deployment &amp; Arena Orchestration
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAdminHackathons}
                        disabled={isLoading}
                        className="bg-surface-bright text-stark-black px-4 py-3 font-label-bold border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
                        title="Reload latest catalog from server"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${isLoading ? "animate-spin" : ""}`}>
                            sync
                        </span>
                        SYNC
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="bg-stark-black text-pure-white px-6 py-3 font-label-bold border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        INITIALIZE EVENT
                    </button>
                </div>
            </div>

            {/* Notification alert banner */}
            {statusMsg && (
                <div
                    className={`p-4 brutal-border font-label-bold uppercase flex items-center justify-between gap-3 ${
                        statusMsg.type === "error" ? "bg-error text-white" : "bg-success text-stark-black"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined">
                            {statusMsg.type === "error" ? "error" : "check_circle"}
                        </span>
                        <span>{statusMsg.text}</span>
                    </div>
                    <button onClick={() => setStatusMsg(null)} className="font-bold text-sm uppercase hover:opacity-75 cursor-pointer">
                        DISMISS
                    </button>
                </div>
            )}

            {/* Hackathons Table */}
            <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                        <tr className="bg-stark-black text-pure-white">
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">
                                Identifier
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">
                                Designation &amp; Format
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">
                                Schedule Matrix
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">
                                Status &amp; Directives
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue text-center">
                                Operations
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {hackathonsList.map((h) => {
                            const normalizedStatus = (h.status || "draft").toLowerCase();
                            const hasValidDates =
                                h.startDate &&
                                h.endDate &&
                                !isNaN(new Date(h.startDate).getTime()) &&
                                !isNaN(new Date(h.endDate).getTime());

                            return (
                                <tr
                                    key={h.id}
                                    className="border-b-2 border-stark-black hover:bg-surface-container transition-colors group"
                                >
                                    <td className="p-4 font-code-snippet text-xs font-bold border-r-2 border-stark-black text-zinc-700">
                                        {h.id}
                                    </td>
                                    <td className="p-4 border-r-2 border-stark-black">
                                        <div className="font-label-bold text-stark-black uppercase text-sm">
                                            {h.name || h.title || h.id}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stark-black text-white uppercase">
                                                {h.mode ? h.mode.toUpperCase() : "ONLINE"}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-1.5 py-0.5 uppercase brutal-border ${
                                                    h.entryType === "paid"
                                                        ? "bg-amber-400 text-black"
                                                        : "bg-emerald-400 text-black"
                                                }`}
                                            >
                                                {h.entryType === "paid"
                                                    ? `₹${h.fee || 0} / ${
                                                          h.feeBasis === "per_participant" ? "MEMBER" : "SQUAD"
                                                      }`
                                                    : "FREE ENTRY"}
                                            </span>
                                            {h.venue && h.mode !== "online" && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-200 text-zinc-800 uppercase">
                                                    📍 {h.venue}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 border-r-2 border-stark-black font-code-snippet text-xs text-on-surface-variant">
                                        {hasValidDates ? (
                                            <div>
                                                <div>
                                                    <span className="font-bold text-black">Run:</span>{" "}
                                                    {new Date(h.startDate).toLocaleDateString()} -{" "}
                                                    {new Date(h.endDate).toLocaleDateString()}
                                                </div>
                                                {h.registrationEnd && !isNaN(new Date(h.registrationEnd).getTime()) && (
                                                    <div className="text-[11px] text-zinc-600 mt-0.5">
                                                        <span className="font-bold">Reg Closes:</span>{" "}
                                                        {new Date(h.registrationEnd).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-zinc-500 font-bold uppercase text-[11px]">
                                                Dates Open / Flexible
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 border-r-2 border-stark-black space-y-1.5">
                                        <div>
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-label-bold text-[10px] uppercase brutal-border ${
                                                    normalizedStatus === "registration_open"
                                                        ? "bg-electric-blue text-pure-white"
                                                        : normalizedStatus === "active" ||
                                                          normalizedStatus === "submission_open"
                                                        ? "bg-[#FFD700] text-stark-black"
                                                        : normalizedStatus === "completed"
                                                        ? "bg-stark-black text-pure-white"
                                                        : normalizedStatus === "registration_closed"
                                                        ? "bg-amber-300 text-stark-black"
                                                        : "bg-surface-variant text-on-surface-variant"
                                                }`}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-current block"></span>
                                                {normalizedStatus.replace("_", " ")}
                                            </span>
                                        </div>
                                        <div>
                                            <span
                                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border ${
                                                    h.problemStatementsRevealed
                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500"
                                                        : "bg-rose-500/10 text-rose-600 border-rose-500"
                                                }`}
                                            >
                                                {h.problemStatementsRevealed ? "PS: REVEALED" : "PS: CLASSIFIED"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    setEditingHackathon({
                                                        ...h,
                                                        mode: h.mode || "online",
                                                        entryType: h.entryType || "free",
                                                        fee: h.fee || 0,
                                                        feeBasis: h.feeBasis || "per_team",
                                                        problemRevealMode: h.problemRevealMode || "manual"
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                                className="bg-surface-bright text-stark-black px-2.5 py-1 font-label-caps text-xs brutal-border hover:bg-electric-blue hover:text-pure-white transition-all font-bold cursor-pointer"
                                            >
                                                EDIT
                                            </button>

                                            {/* Problem reveal button */}
                                            {h.problemStatementsRevealed ? (
                                                <button
                                                    disabled={loadingId === h.id}
                                                    onClick={() => toggleProblemReveal(h.id, true)}
                                                    className="bg-zinc-800 text-white px-2 py-1 font-label-caps text-[11px] brutal-border hover:bg-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                    title="Lock and classify problem statements"
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">
                                                        visibility_off
                                                    </span>
                                                    HIDE PS
                                                </button>
                                            ) : (
                                                <button
                                                    disabled={loadingId === h.id}
                                                    onClick={() => toggleProblemReveal(h.id, false)}
                                                    className="bg-electric-blue text-white px-2 py-1 font-label-caps text-[11px] brutal-border hover:bg-black transition-all flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
                                                    title="Release problem statements to all participants"
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">
                                                        visibility
                                                    </span>
                                                    REVEAL PS
                                                </button>
                                            )}

                                            {/* Lifecycle Transitions */}
                                            {(normalizedStatus === "draft" ||
                                                normalizedStatus === "upcoming") && (
                                                <button
                                                    disabled={loadingId === h.id}
                                                    onClick={() => changeState(h.id, "publish")}
                                                    className="bg-electric-blue text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all font-bold cursor-pointer disabled:opacity-50"
                                                >
                                                    PUBLISH
                                                </button>
                                            )}
                                            {normalizedStatus === "registration_open" && (
                                                <button
                                                    disabled={loadingId === h.id}
                                                    onClick={() => changeState(h.id, "close-registration")}
                                                    className="bg-[#FFA500] text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all font-bold cursor-pointer disabled:opacity-50"
                                                >
                                                    CLOSE REG
                                                </button>
                                            )}
                                            {normalizedStatus === "registration_closed" && (
                                                <>
                                                    <button
                                                        disabled={loadingId === h.id}
                                                        onClick={() => changeState(h.id, "open-registration")}
                                                        className="bg-[#FFA500] text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all font-bold cursor-pointer disabled:opacity-50"
                                                    >
                                                        OPEN REG
                                                    </button>
                                                    <button
                                                        disabled={loadingId === h.id}
                                                        onClick={() => changeState(h.id, "open-submissions")}
                                                        className="bg-success text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all font-bold cursor-pointer disabled:opacity-50"
                                                    >
                                                        START HACK
                                                    </button>
                                                </>
                                            )}
                                            {(normalizedStatus === "submission_open" ||
                                                normalizedStatus === "active") && (
                                                <button
                                                    disabled={loadingId === h.id}
                                                    onClick={() => changeState(h.id, "close-submissions")}
                                                    className="bg-[#FFD700] text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all font-bold cursor-pointer disabled:opacity-50"
                                                >
                                                    EVAL PHASE
                                                </button>
                                            )}
                                            {normalizedStatus === "evaluation" && (
                                                <button
                                                    disabled={loadingId === h.id}
                                                    onClick={() => changeState(h.id, "complete")}
                                                    className="bg-success text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all font-bold cursor-pointer disabled:opacity-50"
                                                >
                                                    CONCLUDE
                                                </button>
                                            )}
                                            {normalizedStatus === "completed" && (
                                                <button
                                                    disabled={loadingId === h.id}
                                                    onClick={() => changeState(h.id, "open-registration")}
                                                    className="bg-electric-blue text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:-translate-y-0.5 transition-all font-bold cursor-pointer disabled:opacity-50"
                                                >
                                                    REOPEN
                                                </button>
                                            )}

                                            <button
                                                disabled={loadingId === h.id}
                                                onClick={() => handleDelete(h.id)}
                                                className="bg-error text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:bg-stark-black transition-all font-bold cursor-pointer disabled:opacity-50"
                                            >
                                                DEL
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {hackathonsList.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 font-label-bold uppercase tracking-widest">
                                    [NO ACTIVE EVENT VECTORS IDENTIFIED]
                                </td>
                            </tr>
                        )}
                        {isLoading && hackathonsList.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500 font-label-bold uppercase tracking-widest animate-pulse">
                                    [SYNCHRONIZING SECURE HACKATHON CATALOG...]
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Editor / Creator */}
            {isModalOpen && editingHackathon && (
                <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col">
                        <div className="bg-electric-blue text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-headline-md uppercase tracking-widest font-bold">
                                {editingHackathon.id === "new" ? "INITIALIZE NEW HACKATHON" : "MODIFY HACKATHON VECTORS"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-pure-white hover:text-error transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
                            {/* Designation & Theme */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Hackathon Designation</label>
                                    <input
                                        required
                                        type="text"
                                        value={editingHackathon.name || ""}
                                        onChange={(e) =>
                                            setEditingHackathon({ ...editingHackathon, name: e.target.value })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue"
                                        placeholder="e.g. CodeSrijan 2026 — Track Alpha"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Theme / Category</label>
                                    <input
                                        type="text"
                                        value={editingHackathon.theme || ""}
                                        onChange={(e) =>
                                            setEditingHackathon({ ...editingHackathon, theme: e.target.value })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue"
                                        placeholder="e.g. Smart Campus Ecosystem"
                                    />
                                </div>
                            </div>

                            {/* Lifecycle Status & Mode */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Lifecycle Status</label>
                                    <select
                                        value={editingHackathon.status || "draft"}
                                        onChange={(e) =>
                                            setEditingHackathon({ ...editingHackathon, status: e.target.value })
                                        }
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
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Format Mode</label>
                                    <select
                                        value={editingHackathon.mode || "online"}
                                        onChange={(e) =>
                                            setEditingHackathon({ ...editingHackathon, mode: e.target.value })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    >
                                        <option value="online">Online Arena</option>
                                        <option value="offline">In-Person Campus Arena</option>
                                        <option value="hybrid">Hybrid Arena</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Problem Reveal Mode</label>
                                    <select
                                        value={editingHackathon.problemRevealMode || "manual"}
                                        onChange={(e) =>
                                            setEditingHackathon({
                                                ...editingHackathon,
                                                problemRevealMode: e.target.value
                                            })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    >
                                        <option value="manual">Manual Admin Release</option>
                                        <option value="immediate">Immediate on Registration</option>
                                    </select>
                                </div>
                            </div>

                            {/* Venue (if not online) */}
                            {editingHackathon.mode !== "online" && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Venue Location</label>
                                    <input
                                        type="text"
                                        value={editingHackathon.venue || ""}
                                        onChange={(e) =>
                                            setEditingHackathon({ ...editingHackathon, venue: e.target.value })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                        placeholder="e.g. CodeSrijan Main Auditorium, Block C"
                                    />
                                </div>
                            )}

                            {/* Entry Type & Fee Configuration */}
                            <div className="p-4 bg-zinc-50 border-2 border-stark-black">
                                <span className="font-label-bold uppercase text-xs text-electric-blue block mb-3">
                                    Entry Fee &amp; Payment Credentials
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label-bold uppercase text-xs">Entry Policy</label>
                                        <select
                                            value={editingHackathon.entryType || "free"}
                                            onChange={(e) =>
                                                setEditingHackathon({
                                                    ...editingHackathon,
                                                    entryType: e.target.value
                                                })
                                            }
                                            className="bg-surface-bright border-2 border-stark-black p-2.5 font-code-snippet focus:outline-none"
                                        >
                                            <option value="free">Free Access</option>
                                            <option value="paid">Paid Admission</option>
                                        </select>
                                    </div>

                                    {editingHackathon.entryType === "paid" && (
                                        <>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="font-label-bold uppercase text-xs">Fee (₹ INR)</label>
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    value={editingHackathon.fee || ""}
                                                    onChange={(e) =>
                                                        setEditingHackathon({
                                                            ...editingHackathon,
                                                            fee: e.target.value
                                                        })
                                                    }
                                                    className="bg-surface-bright border-2 border-stark-black p-2.5 font-code-snippet focus:outline-none"
                                                    placeholder="e.g. 600"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="font-label-bold uppercase text-xs">Fee Assessment Basis</label>
                                                <select
                                                    value={editingHackathon.feeBasis || "per_team"}
                                                    onChange={(e) =>
                                                        setEditingHackathon({
                                                            ...editingHackathon,
                                                            feeBasis: e.target.value
                                                        })
                                                    }
                                                    className="bg-surface-bright border-2 border-stark-black p-2.5 font-code-snippet focus:outline-none"
                                                >
                                                    <option value="per_team">Per Squad / Team</option>
                                                    <option value="per_participant">Per Member / Participant</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {editingHackathon.entryType === "paid" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-zinc-300">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs">UPI Virtual Payment Address (VPA)</label>
                                            <input
                                                type="text"
                                                value={editingHackathon.upiId || ""}
                                                onChange={(e) =>
                                                    setEditingHackathon({
                                                        ...editingHackathon,
                                                        upiId: e.target.value
                                                    })
                                                }
                                                className="bg-surface-bright border-2 border-stark-black p-2.5 font-code-snippet focus:outline-none"
                                                placeholder="e.g. codesrijan@okhdfcbank"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs">Payee / Account Name</label>
                                            <input
                                                type="text"
                                                value={editingHackathon.payeeName || ""}
                                                onChange={(e) =>
                                                    setEditingHackathon({
                                                        ...editingHackathon,
                                                        payeeName: e.target.value
                                                    })
                                                }
                                                className="bg-surface-bright border-2 border-stark-black p-2.5 font-code-snippet focus:outline-none"
                                                placeholder="e.g. CodeSrijan Society"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Event Dates Matrix */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Hackathon Start Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={toInputDate(editingHackathon.startDate)}
                                        onChange={(e) =>
                                            setEditingHackathon({
                                                ...editingHackathon,
                                                startDate: e.target.value
                                            })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Hackathon End Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={toInputDate(editingHackathon.endDate)}
                                        onChange={(e) =>
                                            setEditingHackathon({
                                                ...editingHackathon,
                                                endDate: e.target.value
                                            })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Registration Window */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Registration Start Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={toInputDate(editingHackathon.registrationStart)}
                                        onChange={(e) =>
                                            setEditingHackathon({
                                                ...editingHackathon,
                                                registrationStart: e.target.value
                                            })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Registration End Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={toInputDate(editingHackathon.registrationEnd)}
                                        onChange={(e) =>
                                            setEditingHackathon({
                                                ...editingHackathon,
                                                registrationEnd: e.target.value
                                            })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Submission Deadline & Team Sizes */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Submission Deadline</label>
                                    <input
                                        type="date"
                                        value={toInputDate(editingHackathon.submissionDeadline)}
                                        onChange={(e) =>
                                            setEditingHackathon({
                                                ...editingHackathon,
                                                submissionDeadline: e.target.value
                                            })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Squad Size (Min)</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={editingHackathon.teamSizeMin ?? 1}
                                        onChange={(e) =>
                                            setEditingHackathon({
                                                ...editingHackathon,
                                                teamSizeMin: e.target.value
                                            })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold uppercase text-xs">Squad Size (Max)</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={editingHackathon.teamSizeMax ?? 4}
                                        onChange={(e) =>
                                            setEditingHackathon({
                                                ...editingHackathon,
                                                teamSizeMax: e.target.value
                                            })
                                        }
                                        className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Description / Rules */}
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-bold uppercase text-xs">Description &amp; Directives</label>
                                <textarea
                                    rows={3}
                                    value={editingHackathon.description || ""}
                                    onChange={(e) =>
                                        setEditingHackathon({
                                            ...editingHackathon,
                                            description: e.target.value
                                        })
                                    }
                                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                                    placeholder="Enter competition guidelines, eligibility parameters, and sprint goals..."
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors cursor-pointer"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingId === "saving"}
                                    className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">save</span>
                                    {loadingId === "saving" ? "COMMITTING..." : "COMMIT VECTORS"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
