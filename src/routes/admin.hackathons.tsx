import { createFileRoute, Link } from "@tanstack/react-router";
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

interface ProblemDraft {
    title: string;
    domain: string;
    description: string;
    fullDescription: string;
    attachmentUrl?: string;
    difficulty: "easy" | "medium" | "hard";
}

export default function AdminHackathons() {
    const { hackathons: storeHackathons, refetchData } = useAppStore();
    const [adminHackathons, setAdminHackathons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Search, Filter, Sort State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [sortBy, setSortBy] = useState<"startDateAsc" | "startDateDesc" | "recentlyCreated">("recentlyCreated");

    // 5-Step Wizard State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [wizardData, setWizardData] = useState<any>({
        id: "new",
        name: "",
        theme: "General Innovation",
        description: "",
        mode: "online",
        venue: "",
        bannerUrl: "",
        entryType: "free",
        fee: 0,
        feeBasis: "per_team",
        upiId: "codesrijan@okhdfcbank",
        payeeName: "CodeSrijan Hackathon Society",
        qrImageUrl: "",
        startDate: "",
        endDate: "",
        registrationStart: "",
        registrationEnd: "",
        submissionDeadline: "",
        status: "draft",
        problemRevealMode: "manual",
        problemStatementsRevealed: false,
        teamSizeMin: 1,
        teamSizeMax: 4,
        problemDrafts: [] as ProblemDraft[],
        rubric: {
            innovation: 30,
            technicalExecution: 30,
            feasibility: 20,
            presentation: 20
        }
    });

    // Temporary single problem statement authoring state inside Wizard Step 3
    const [currentProblemDraft, setCurrentProblemDraft] = useState<ProblemDraft>({
        title: "",
        domain: "AI & Autonomous Systems",
        description: "",
        fullDescription: "",
        attachmentUrl: "",
        difficulty: "medium"
    });

    // Dedicated Event Management Modal State
    const [managingHackathon, setManagingHackathon] = useState<any | null>(null);

    // Destructive Confirmation Modal
    const [deleteConfirmHackathon, setDeleteConfirmHackathon] = useState<any | null>(null);

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

    // Filtered & Sorted Hackathons
    const filteredHackathons = useMemo(() => {
        return hackathonsList
            .filter((h) => {
                const q = searchQuery.toLowerCase();
                const matchesQuery =
                    !searchQuery ||
                    (h.name || "").toLowerCase().includes(q) ||
                    (h.theme || "").toLowerCase().includes(q) ||
                    (h.id || "").toLowerCase().includes(q) ||
                    (h.mode || "").toLowerCase().includes(q);

                const normalizedStatus = (h.status || "draft").toLowerCase();
                const matchesStatus =
                    statusFilter === "all" ||
                    (statusFilter === "draft" && normalizedStatus === "draft") ||
                    (statusFilter === "registration_open" && normalizedStatus === "registration_open") ||
                    (statusFilter === "registration_closed" && normalizedStatus === "registration_closed") ||
                    (statusFilter === "active" && (normalizedStatus === "submission_open" || normalizedStatus === "active")) ||
                    (statusFilter === "evaluation" && normalizedStatus === "evaluation") ||
                    (statusFilter === "completed" && normalizedStatus === "completed");

                const matchesPayment =
                    paymentFilter === "all" ||
                    (paymentFilter === "free" && h.entryType !== "paid") ||
                    (paymentFilter === "paid" && h.entryType === "paid");

                return matchesQuery && matchesStatus && matchesPayment;
            })
            .sort((a, b) => {
                if (sortBy === "startDateAsc") {
                    return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
                }
                if (sortBy === "startDateDesc") {
                    return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
                }
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
    }, [hackathonsList, searchQuery, statusFilter, paymentFilter, sortBy]);

    // Open Wizard in "Create New" Mode
    const openCreateWizard = () => {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
        const twoWeeksStr = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

        setWizardData({
            id: "new",
            name: "",
            theme: "General Innovation",
            description: "",
            mode: "online",
            venue: "",
            bannerUrl: "",
            entryType: "free",
            fee: 0,
            feeBasis: "per_team",
            upiId: "codesrijan@okhdfcbank",
            payeeName: "CodeSrijan Hackathon Society",
            qrImageUrl: "",
            startDate: nextWeekStr,
            endDate: twoWeeksStr,
            registrationStart: todayStr,
            registrationEnd: nextWeekStr,
            submissionDeadline: twoWeeksStr,
            status: "draft",
            problemRevealMode: "manual",
            problemStatementsRevealed: false,
            teamSizeMin: 1,
            teamSizeMax: 4,
            problemDrafts: [],
            rubric: {
                innovation: 30,
                technicalExecution: 30,
                feasibility: 20,
                presentation: 20
            }
        });
        setCurrentProblemDraft({
            title: "",
            domain: "AI & Autonomous Systems",
            description: "",
            fullDescription: "",
            attachmentUrl: "",
            difficulty: "medium"
        });
        setWizardStep(1);
        setIsWizardOpen(true);
    };

    // Open Wizard in "Edit" Mode
    const openEditWizard = (hackathon: any) => {
        setWizardData({
            ...hackathon,
            mode: hackathon.mode || "online",
            entryType: hackathon.entryType || "free",
            fee: hackathon.fee || 0,
            feeBasis: hackathon.feeBasis || "per_team",
            upiId: hackathon.upiId || "codesrijan@okhdfcbank",
            payeeName: hackathon.payeeName || "CodeSrijan Hackathon Society",
            qrImageUrl: hackathon.qrImageUrl || "",
            problemRevealMode: hackathon.problemRevealMode || "manual",
            problemDrafts: hackathon.problemStatements || [],
            rubric: hackathon.rubric || {
                innovation: 30,
                technicalExecution: 30,
                feasibility: 20,
                presentation: 20
            }
        });
        setWizardStep(1);
        setIsWizardOpen(true);
    };

    // Generate UPI QR Code URL
    const handleGenerateQr = () => {
        if (!wizardData.upiId || !wizardData.payeeName) {
            setStatusMsg({ type: "error", text: "Please provide a valid UPI VPA ID and Payee Name." });
            return;
        }
        const amount = wizardData.entryType === "paid" ? Number(wizardData.fee) || 0 : 0;
        const upiPayload = `upi://pay?pa=${encodeURIComponent(wizardData.upiId)}&pn=${encodeURIComponent(wizardData.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`${wizardData.name || "CodeSrijan"} Registration Fee`)}`;
        const generatedQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiPayload)}`;
        setWizardData({ ...wizardData, qrImageUrl: generatedQr });
        setStatusMsg({ type: "success", text: "UPI Payment QR generated successfully from configured parameters." });
    };

    // Add a problem statement draft to wizard
    const handleAddProblemDraft = () => {
        if (!currentProblemDraft.title.trim()) {
            setStatusMsg({ type: "error", text: "Problem Statement Title is required." });
            return;
        }
        setWizardData({
            ...wizardData,
            problemDrafts: [...wizardData.problemDrafts, { ...currentProblemDraft }]
        });
        setCurrentProblemDraft({
            title: "",
            domain: "AI & Autonomous Systems",
            description: "",
            fullDescription: "",
            attachmentUrl: "",
            difficulty: "medium"
        });
        setStatusMsg({ type: "success", text: "Problem Statement challenge added to draft." });
    };

    const handleRemoveProblemDraft = (index: number) => {
        setWizardData({
            ...wizardData,
            problemDrafts: wizardData.problemDrafts.filter((_: any, i: number) => i !== index)
        });
    };

    // Validation for Steps
    const validateStep = (step: number): boolean => {
        if (step === 1) {
            if (!wizardData.name.trim()) {
                setStatusMsg({ type: "error", text: "Event Name is required." });
                return false;
            }
            if (wizardData.mode !== "online" && !wizardData.venue.trim()) {
                setStatusMsg({ type: "error", text: "Venue is required for in-person or hybrid events." });
                return false;
            }
        }
        if (step === 2) {
            if (!wizardData.startDate || !wizardData.endDate) {
                setStatusMsg({ type: "error", text: "Event start and end dates are required." });
                return false;
            }
            if (new Date(wizardData.startDate) > new Date(wizardData.endDate)) {
                setStatusMsg({ type: "error", text: "Event Start Date cannot be after Event End Date." });
                return false;
            }
            if (wizardData.registrationStart && wizardData.registrationEnd && new Date(wizardData.registrationStart) > new Date(wizardData.registrationEnd)) {
                setStatusMsg({ type: "error", text: "Registration Start Date cannot be after Registration End Date." });
                return false;
            }
            if (Number(wizardData.teamSizeMin) > Number(wizardData.teamSizeMax)) {
                setStatusMsg({ type: "error", text: "Minimum Squad Size cannot exceed Maximum Squad Size." });
                return false;
            }
        }
        if (step === 4) {
            if (wizardData.entryType === "paid") {
                if (!wizardData.fee || Number(wizardData.fee) <= 0) {
                    setStatusMsg({ type: "error", text: "Please enter a valid entry fee greater than ₹0." });
                    return false;
                }
                if (!wizardData.upiId || !wizardData.upiId.includes("@")) {
                    setStatusMsg({ type: "error", text: "A valid UPI VPA ID (e.g. org@bank) is required for paid events." });
                    return false;
                }
            }
        }
        return true;
    };

    const handleNextStep = () => {
        if (validateStep(wizardStep)) {
            setStatusMsg(null);
            setWizardStep((prev) => Math.min(prev + 1, 5) as any);
        }
    };

    const handlePrevStep = () => {
        setStatusMsg(null);
        setWizardStep((prev) => Math.max(prev - 1, 1) as any);
    };

    // Commit Wizard Data (Save Draft or Publish)
    const handleCommitWizard = async (targetStatus?: "draft" | "registration_open") => {
        if (!validateStep(1) || !validateStep(2) || !validateStep(4)) return;

        setLoadingId("wizard-saving");
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const statusToSave = targetStatus || wizardData.status || "draft";

            const payload: any = {
                ...wizardData,
                status: statusToSave,
                fee: wizardData.entryType === "paid" ? Number(wizardData.fee) || 0 : 0,
                teamSizeMin: Number(wizardData.teamSizeMin) || 1,
                teamSizeMax: Number(wizardData.teamSizeMax) || 4,
                problemStatements: wizardData.problemDrafts
            };
            delete payload._id;

            if (wizardData.id === "new") {
                delete payload.id;
                await axios.post(`${API_BASE}/hackathons`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatusMsg({
                    type: "success",
                    text: statusToSave === "registration_open"
                        ? "🎉 Hackathon created and published to participants!"
                        : "Hackathon saved as draft."
                });
            } else {
                await axios.put(`${API_BASE}/hackathons/${wizardData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatusMsg({
                    type: "success",
                    text: statusToSave === "registration_open"
                        ? "Hackathon updated and published!"
                        : "Hackathon updates committed successfully."
                });
            }

            setIsWizardOpen(false);
            await Promise.all([fetchAdminHackathons(), refetchData()]);
        } catch (err: any) {
            setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to commit hackathon." });
        } finally {
            setLoadingId(null);
        }
    };

    // State Transitions
    const changeState = async (id: string, action: string) => {
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_BASE}/hackathons/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({ type: "success", text: `Action [${action.toUpperCase()}] executed successfully.` });
            await Promise.all([fetchAdminHackathons(), refetchData()]);
            if (managingHackathon && managingHackathon.id === id) {
                const updated = hackathonsList.find((h) => h.id === id);
                if (updated) setManagingHackathon(updated);
            }
        } catch (err: any) {
            setStatusMsg({ type: "error", text: err.response?.data?.message || "State transition failed." });
        } finally {
            setLoadingId(null);
        }
    };

    // Safe Delete
    const handleExecuteDelete = async () => {
        if (!deleteConfirmHackathon) return;
        const id = deleteConfirmHackathon.id;
        setLoadingId(id);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.delete(`${API_BASE}/hackathons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusMsg({ type: "success", text: `Hackathon "${deleteConfirmHackathon.name}" permanently deleted.` });
            setDeleteConfirmHackathon(null);
            if (managingHackathon?.id === id) setManagingHackathon(null);
            await Promise.all([fetchAdminHackathons(), refetchData()]);
        } catch (err: any) {
            setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to delete hackathon." });
        } finally {
            setLoadingId(null);
        }
    };

    // Toggle problem reveal
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
                    : "🚨 Problem statements revealed to all registered participants!"
            });
            await Promise.all([fetchAdminHackathons(), refetchData()]);
        } catch (err: any) {
            setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to toggle reveal state." });
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8 pb-24">
            {/* Header Banner */}
            <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display-lg text-2xl md:text-3xl uppercase text-stark-black tracking-tight leading-none bg-[#00E5FF] text-stark-black px-3 py-1.5 inline-block transform -skew-x-6 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        HACKATHON MANAGEMENT
                    </h1>
                    <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-xs uppercase">
                        Create events, configure challenges, manage registrations, and control the competition lifecycle.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={fetchAdminHackathons}
                        disabled={isLoading}
                        className="bg-surface-bright text-stark-black px-4 py-2.5 font-label-bold text-xs border-2 border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer uppercase font-bold"
                        title="Reload latest catalog from server"
                    >
                        <span className={`material-symbols-outlined text-[16px] ${isLoading ? "animate-spin" : ""}`}>
                            sync
                        </span>
                        REFRESH
                    </button>
                    <button
                        onClick={openCreateWizard}
                        className="bg-stark-black text-pure-white px-5 py-2.5 font-label-bold text-xs border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-[#00E5FF] hover:text-stark-black transition-all flex items-center gap-2 cursor-pointer uppercase font-black"
                    >
                        <span className="material-symbols-outlined text-sm font-black">add_circle</span>
                        + CREATE HACKATHON
                    </button>
                </div>
            </div>

            {/* Notification alert banner */}
            {statusMsg && (
                <div
                    className={`p-4 brutal-border font-label-bold uppercase flex items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                        statusMsg.type === "error" ? "bg-error text-white" : "bg-success text-stark-black"
                    }`}
                >
                    <div className="flex items-center gap-3 text-xs md:text-sm">
                        <span className="material-symbols-outlined">
                            {statusMsg.type === "error" ? "error" : "check_circle"}
                        </span>
                        <span>{statusMsg.text}</span>
                    </div>
                    <button onClick={() => setStatusMsg(null)} className="font-bold text-xs uppercase hover:underline cursor-pointer">
                        DISMISS
                    </button>
                </div>
            )}

            {/* Search, Filter, and Sort Toolbar */}
            <div className="bg-pure-white p-4 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-96">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Search hackathons by name, theme, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest brutal-border font-mono text-xs uppercase tracking-wider focus:outline-none focus:bg-pure-white"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold uppercase text-on-surface-variant text-[11px]">Lifecycle:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="p-1.5 bg-surface-container-lowest brutal-border font-mono text-xs uppercase"
                        >
                            <option value="all">All States</option>
                            <option value="draft">Draft</option>
                            <option value="registration_open">Registration Open</option>
                            <option value="registration_closed">Registration Closed</option>
                            <option value="active">Active / Hacking</option>
                            <option value="evaluation">Evaluation Phase</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="font-bold uppercase text-on-surface-variant text-[11px]">Payment:</span>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="p-1.5 bg-surface-container-lowest brutal-border font-mono text-xs uppercase"
                        >
                            <option value="all">All Policies</option>
                            <option value="free">Free Only</option>
                            <option value="paid">Paid Only</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="font-bold uppercase text-on-surface-variant text-[11px]">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e: any) => setSortBy(e.target.value)}
                            className="p-1.5 bg-surface-container-lowest brutal-border font-mono text-xs uppercase"
                        >
                            <option value="recentlyCreated">Recently Updated</option>
                            <option value="startDateAsc">Start Date (Earliest)</option>
                            <option value="startDateDesc">Start Date (Latest)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Hackathons Table */}
            <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-stark-black text-pure-white">
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">
                                Hackathon
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">
                                Schedule
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">
                                Registration
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">
                                Problem Statements
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">
                                Payment
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-[#00E5FF] border-b-4 text-xs">
                                Lifecycle
                            </th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-[#00E5FF] text-center text-xs">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHackathons.map((h) => {
                            const normalizedStatus = (h.status || "draft").toLowerCase();
                            const hasValidDates =
                                h.startDate &&
                                h.endDate &&
                                !isNaN(new Date(h.startDate).getTime()) &&
                                !isNaN(new Date(h.endDate).getTime());

                            const statementCount = Array.isArray(h.problemStatements) ? h.problemStatements.length : 0;

                            return (
                                <tr
                                    key={h.id}
                                    className="border-b-2 border-stark-black hover:bg-surface-container transition-colors group"
                                >
                                    {/* 1. Hackathon Column */}
                                    <td className="p-4 border-r-2 border-stark-black">
                                        <div className="font-label-bold text-stark-black uppercase text-sm font-black">
                                            {h.name || h.title || h.id}
                                        </div>
                                        <div className="font-code-snippet text-[11px] text-zinc-500 font-bold mt-0.5">
                                            Theme: {h.theme || "General Innovation"}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stark-black text-white uppercase brutal-border">
                                                {h.mode ? h.mode.toUpperCase() : "ONLINE"}
                                            </span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-container-high text-zinc-700 font-bold brutal-border">
                                                ID: {h.id}
                                            </span>
                                            {h.venue && h.mode !== "online" && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-200 text-zinc-800 uppercase">
                                                    📍 {h.venue}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* 2. Schedule Column */}
                                    <td className="p-4 border-r-2 border-stark-black font-code-snippet text-xs text-on-surface-variant">
                                        {hasValidDates ? (
                                            <div className="flex flex-col gap-0.5">
                                                <div>
                                                    <span className="font-bold text-black uppercase">Run:</span>{" "}
                                                    {new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}
                                                </div>
                                                {h.registrationEnd && (
                                                    <div className="text-[11px] text-zinc-600">
                                                        <span className="font-bold uppercase">Reg Closes:</span>{" "}
                                                        {new Date(h.registrationEnd).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {h.submissionDeadline && (
                                                    <div className="text-[11px] text-[#00E5FF] font-bold">
                                                        <span className="uppercase">Deadline:</span>{" "}
                                                        {new Date(h.submissionDeadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-zinc-500 font-bold uppercase text-[11px]">
                                                Flexible Schedule
                                            </span>
                                        )}
                                    </td>

                                    {/* 3. Registration Status Column */}
                                    <td className="p-4 border-r-2 border-stark-black">
                                        {normalizedStatus === "registration_open" ? (
                                            <span className="px-2 py-1 text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border-2 border-emerald-600 flex items-center gap-1 w-fit">
                                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                                                OPEN
                                            </span>
                                        ) : normalizedStatus === "draft" || normalizedStatus === "upcoming" ? (
                                            <span className="px-2 py-1 text-xs font-bold uppercase bg-amber-100 text-amber-800 border-2 border-amber-600 w-fit block">
                                                UPCOMING
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-bold uppercase bg-zinc-200 text-zinc-700 border-2 border-zinc-500 w-fit block">
                                                CLOSED
                                            </span>
                                        )}
                                        <div className="font-code-snippet text-[10px] text-zinc-500 mt-1">
                                            Squads: {h.teamSizeMin || 1}-{h.teamSizeMax || 4} members
                                        </div>
                                    </td>

                                    {/* 4. Problem Statements Column */}
                                    <td className="p-4 border-r-2 border-stark-black">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 brutal-border ${
                                                    h.problemStatementsRevealed
                                                        ? "bg-emerald-400 text-stark-black"
                                                        : "bg-rose-400 text-stark-black"
                                                }`}>
                                                    {h.problemStatementsRevealed ? "REVEALED" : "CLASSIFIED"}
                                                </span>
                                                <span className="text-xs font-bold text-stark-black font-mono">
                                                    {statementCount} {statementCount === 1 ? "track" : "tracks"}
                                                </span>
                                            </div>
                                            <button
                                                disabled={loadingId === h.id}
                                                onClick={() => toggleProblemReveal(h.id, !!h.problemStatementsRevealed)}
                                                className="text-[10px] font-bold uppercase text-zinc-700 hover:text-black hover:underline cursor-pointer flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[12px]">
                                                    {h.problemStatementsRevealed ? "visibility_off" : "visibility"}
                                                </span>
                                                {h.problemStatementsRevealed ? "Hide from students" : "Reveal to students"}
                                            </button>
                                        </div>
                                    </td>

                                    {/* 5. Payment Column */}
                                    <td className="p-4 border-r-2 border-stark-black">
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className={`text-[10px] font-black px-2 py-0.5 uppercase brutal-border w-fit ${
                                                    h.entryType === "paid"
                                                        ? "bg-[#FFD700] text-stark-black"
                                                        : "bg-emerald-300 text-stark-black"
                                                }`}
                                            >
                                                {h.entryType === "paid"
                                                    ? `PAID: ₹${h.fee || 0} / ${h.feeBasis === "per_participant" ? "MEMBER" : "SQUAD"}`
                                                    : "FREE ENTRY"}
                                            </span>
                                            {h.entryType === "paid" && (
                                                <div className="font-code-snippet text-[10px] text-zinc-600 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">
                                                        {h.qrImageUrl ? "qr_code_2" : "warning"}
                                                    </span>
                                                    {h.qrImageUrl ? "QR Configured" : "QR Missing"}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* 6. Lifecycle Column */}
                                    <td className="p-4 border-r-2 border-stark-black">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-label-bold text-xs uppercase brutal-border ${
                                                normalizedStatus === "registration_open"
                                                    ? "bg-[#00E5FF] text-stark-black"
                                                    : normalizedStatus === "active" || normalizedStatus === "submission_open"
                                                    ? "bg-[#FFD700] text-stark-black font-black"
                                                    : normalizedStatus === "completed"
                                                    ? "bg-stark-black text-pure-white"
                                                    : normalizedStatus === "registration_closed"
                                                    ? "bg-amber-300 text-stark-black"
                                                    : "bg-zinc-200 text-zinc-800"
                                            }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current block"></span>
                                            {normalizedStatus.replace("_", " ")}
                                        </span>
                                    </td>

                                    {/* 7. Actions Column */}
                                    <td className="p-4 text-center">
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            <button
                                                onClick={() => setManagingHackathon(h)}
                                                className="bg-[#00E5FF] text-stark-black px-2.5 py-1 font-label-caps text-xs brutal-border hover:bg-[#00c4db] transition-all font-bold cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-xs">settings</span>
                                                MANAGE
                                            </button>
                                            <button
                                                onClick={() => openEditWizard(h)}
                                                className="bg-surface-bright text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:bg-zinc-300 transition-all font-bold cursor-pointer"
                                            >
                                                EDIT
                                            </button>
                                            <Link
                                                to={`/workspace`}
                                                className="bg-surface-bright text-stark-black px-2 py-1 font-label-caps text-xs brutal-border hover:bg-zinc-300 transition-all font-bold cursor-pointer"
                                                title="Preview participant view"
                                            >
                                                PREVIEW
                                            </Link>
                                            <button
                                                onClick={() => setDeleteConfirmHackathon(h)}
                                                className="bg-error text-pure-white px-2 py-1 font-label-caps text-xs brutal-border hover:bg-stark-black transition-all font-bold cursor-pointer"
                                                title="Safely delete this hackathon"
                                            >
                                                DEL
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {filteredHackathons.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-gray-500 font-label-bold uppercase tracking-widest">
                                    <span className="material-symbols-outlined text-4xl block mb-2 text-zinc-400">event_busy</span>
                                    NO HACKATHONS FOUND MATCHING THE SELECTED CRITERIA
                                </td>
                            </tr>
                        )}
                        {isLoading && filteredHackathons.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-zinc-500 font-label-bold uppercase tracking-widest animate-pulse">
                                    SYNCHRONIZING HACKATHON CATALOG...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* =========================================================================
                PHASE 3 & 4 & 5: FIVE-STEP HACKATHON CREATION & EDITING WIZARD MODAL
               ========================================================================= */}
            {isWizardOpen && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsWizardOpen(false);
                    }}
                    className="fixed inset-0 bg-stark-black/85 z-50 flex items-center justify-center p-3 md:p-6 backdrop-blur-sm animate-fade-in"
                >
                    <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col">
                        {/* Wizard Header Bar */}
                        <div className="bg-[#00E5FF] text-stark-black p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-20 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                            <div>
                                <h2 className="font-display-lg text-xl md:text-2xl uppercase tracking-tight font-black">
                                    {wizardData.id === "new" ? "CREATE HACKATHON" : "EDIT HACKATHON VECTORS"}
                                </h2>
                                <p className="font-code-snippet text-xs text-stark-black font-bold uppercase tracking-wider">
                                    Configure your event, challenges, registration, and launch settings.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsWizardOpen(false)}
                                className="w-8 h-8 flex items-center justify-center brutal-border bg-pure-white hover:bg-error hover:text-white transition-colors cursor-pointer font-black"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Step Progress Indicators */}
                        <div className="bg-stark-black text-pure-white p-3 border-b-2 border-stark-black overflow-x-auto flex items-center justify-between gap-2">
                            {[
                                { step: 1, title: "1. Basic Info" },
                                { step: 2, title: "2. Schedule & Rules" },
                                { step: 3, title: "3. Problems & Rubric" },
                                { step: 4, title: "4. Payment & QR" },
                                { step: 5, title: "5. Review & Publish" }
                            ].map((s) => (
                                <button
                                    key={s.step}
                                    type="button"
                                    onClick={() => {
                                        if (validateStep(wizardStep)) setWizardStep(s.step as any);
                                    }}
                                    className={`px-3 py-1 font-label-caps text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer brutal-border ${
                                        wizardStep === s.step
                                            ? "bg-[#00E5FF] text-stark-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                                            : wizardStep > s.step
                                            ? "bg-emerald-400 text-stark-black"
                                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    {s.title}
                                </button>
                            ))}
                        </div>

                        {/* Wizard Step Body */}
                        <div className="p-6 flex flex-col gap-6 flex-1 font-mono text-xs">
                            {/* STEP 1: BASIC INFORMATION */}
                            {wizardStep === 1 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-display-lg text-lg uppercase text-stark-black border-b-2 border-stark-black pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#00E5FF]">info</span>
                                        STEP 1: BASIC EVENT INFORMATION
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Hackathon Name <span className="text-error">*</span>
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={wizardData.name}
                                                onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none focus:bg-pure-white"
                                                placeholder="e.g. CodeSrijan 2026: Grand Campus Hackathon"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Theme / Category
                                            </label>
                                            <input
                                                type="text"
                                                value={wizardData.theme}
                                                onChange={(e) => setWizardData({ ...wizardData, theme: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none focus:bg-pure-white"
                                                placeholder="e.g. AI & Smart Cities, Autonomous Mesh Systems"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Format Mode
                                            </label>
                                            <select
                                                value={wizardData.mode}
                                                onChange={(e: any) => setWizardData({ ...wizardData, mode: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs uppercase"
                                            >
                                                <option value="online">Online Arena</option>
                                                <option value="offline">In-Person Campus Arena</option>
                                                <option value="hybrid">Hybrid Arena</option>
                                            </select>
                                        </div>

                                        {wizardData.mode !== "online" && (
                                            <div className="flex flex-col gap-1.5">
                                                <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                    Campus Venue Location <span className="text-error">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={wizardData.venue}
                                                    onChange={(e) => setWizardData({ ...wizardData, venue: e.target.value })}
                                                    className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none focus:bg-pure-white"
                                                    placeholder="e.g. CS Auditorium, Block C"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                            Cover Banner Image URL
                                        </label>
                                        <input
                                            type="url"
                                            value={wizardData.bannerUrl}
                                            onChange={(e) => setWizardData({ ...wizardData, bannerUrl: e.target.value })}
                                            className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none focus:bg-pure-white"
                                            placeholder="https://images.unsplash.com/photo-..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                            Event Description & Competition Directives
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={wizardData.description}
                                            onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                                            className="bg-surface-container-lowest border-2 border-stark-black p-3 font-mono text-xs focus:outline-none focus:bg-pure-white"
                                            placeholder="Outline the hackathon focus, eligibility criteria, and expectations..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: SCHEDULE & PARTICIPATION */}
                            {wizardStep === 2 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-display-lg text-lg uppercase text-stark-black border-b-2 border-stark-black pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#00E5FF]">calendar_month</span>
                                        STEP 2: SCHEDULE & PARTICIPATION RULES
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Event Start Date & Time <span className="text-error">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={toInputDate(wizardData.startDate)}
                                                onChange={(e) => setWizardData({ ...wizardData, startDate: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Event End Date & Time <span className="text-error">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={toInputDate(wizardData.endDate)}
                                                onChange={(e) => setWizardData({ ...wizardData, endDate: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Registration Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={toInputDate(wizardData.registrationStart)}
                                                onChange={(e) => setWizardData({ ...wizardData, registrationStart: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Registration End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={toInputDate(wizardData.registrationEnd)}
                                                onChange={(e) => setWizardData({ ...wizardData, registrationEnd: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Submission Deadline
                                            </label>
                                            <input
                                                type="date"
                                                value={toInputDate(wizardData.submissionDeadline)}
                                                onChange={(e) => setWizardData({ ...wizardData, submissionDeadline: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Squad Size (Min)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={wizardData.teamSizeMin}
                                                onChange={(e) => setWizardData({ ...wizardData, teamSizeMin: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Squad Size (Max)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={wizardData.teamSizeMax}
                                                onChange={(e) => setWizardData({ ...wizardData, teamSizeMax: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: PROBLEM STATEMENTS & JUDGING */}
                            {wizardStep === 3 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-display-lg text-lg uppercase text-stark-black border-b-2 border-stark-black pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#00E5FF]">code_blocks</span>
                                        STEP 3: PROBLEM STATEMENT BUILDER & JUDGING RUBRIC
                                    </h3>

                                    {/* Problem Statements List */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold uppercase text-xs text-stark-black">
                                                Configured Problem Statements ({wizardData.problemDrafts.length})
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <label className="font-bold uppercase text-[11px] text-zinc-600">Release Mode:</label>
                                                <select
                                                    value={wizardData.problemRevealMode}
                                                    onChange={(e: any) => setWizardData({ ...wizardData, problemRevealMode: e.target.value })}
                                                    className="p-1 bg-surface-container-lowest brutal-border font-mono text-xs uppercase"
                                                >
                                                    <option value="manual">Manual Admin Release</option>
                                                    <option value="immediate">Immediate on Registration</option>
                                                    <option value="at_start">Automatic at Hackathon Start</option>
                                                </select>
                                            </div>
                                        </div>

                                        {wizardData.problemDrafts.map((ps: ProblemDraft, idx: number) => (
                                            <div key={idx} className="p-3 bg-surface-container-lowest brutal-border flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-stark-black text-xs uppercase flex items-center gap-2">
                                                        <span>{ps.title}</span>
                                                        <span className="px-1.5 py-0.5 bg-stark-black text-pure-white text-[9px] uppercase font-mono">
                                                            {ps.domain}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 bg-amber-300 text-stark-black text-[9px] uppercase font-mono">
                                                            {ps.difficulty}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-600 mt-1">{ps.description}</p>
                                                    {ps.attachmentUrl && (
                                                        <a href={ps.attachmentUrl} target="_blank" rel="noreferrer" className="text-[10px] text-electric-blue underline font-bold mt-1 inline-block">
                                                            View Spec PDF Document
                                                        </a>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveProblemDraft(idx)}
                                                    className="text-error hover:bg-error hover:text-white p-1 brutal-border cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-xs">delete</span>
                                                </button>
                                            </div>
                                        ))}

                                        {/* New Problem Statement Creator Form */}
                                        <div className="p-4 bg-surface-container brutal-border flex flex-col gap-3">
                                            <span className="font-bold uppercase text-xs text-stark-black flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">add</span>
                                                Author Problem Statement Challenge
                                            </span>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="md:col-span-2">
                                                    <label className="font-bold uppercase text-[10px] block mb-1">Problem Title</label>
                                                    <input
                                                        type="text"
                                                        value={currentProblemDraft.title}
                                                        onChange={(e) => setCurrentProblemDraft({ ...currentProblemDraft, title: e.target.value })}
                                                        placeholder="e.g. Autonomous Traffic Intelligence Mesh"
                                                        className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="font-bold uppercase text-[10px] block mb-1">Domain / Track</label>
                                                    <input
                                                        type="text"
                                                        value={currentProblemDraft.domain}
                                                        onChange={(e) => setCurrentProblemDraft({ ...currentProblemDraft, domain: e.target.value })}
                                                        placeholder="e.g. AI / Web3 / IoT"
                                                        className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="font-bold uppercase text-[10px] block mb-1">Short Summary & Objectives</label>
                                                <textarea
                                                    rows={2}
                                                    value={currentProblemDraft.description}
                                                    onChange={(e) => setCurrentProblemDraft({ ...currentProblemDraft, description: e.target.value })}
                                                    placeholder="Brief 2-line summary explaining the problem challenge..."
                                                    className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="font-bold uppercase text-[10px] block mb-1">Specification Document / PDF URL</label>
                                                    <input
                                                        type="url"
                                                        value={currentProblemDraft.attachmentUrl}
                                                        onChange={(e) => setCurrentProblemDraft({ ...currentProblemDraft, attachmentUrl: e.target.value })}
                                                        placeholder="https://storage.googleapis.com/.../spec.pdf"
                                                        className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddProblemDraft}
                                                        className="w-full bg-stark-black text-pure-white py-2 px-4 font-bold uppercase brutal-border hover:bg-[#00E5FF] hover:text-stark-black transition-colors cursor-pointer"
                                                    >
                                                        + ADD STATEMENT TO HACKATHON
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Judging Rubric Weights */}
                                    <div className="p-4 bg-surface-container-lowest brutal-border flex flex-col gap-3">
                                        <span className="font-bold uppercase text-xs text-stark-black">
                                            Evaluation Scoring Weights (Rubric)
                                        </span>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <label className="font-bold text-[10px] uppercase block mb-1">Innovation (30%)</label>
                                                <input
                                                    type="number"
                                                    value={wizardData.rubric.innovation}
                                                    onChange={(e) => setWizardData({ ...wizardData, rubric: { ...wizardData.rubric, innovation: Number(e.target.value) } })}
                                                    className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="font-bold text-[10px] uppercase block mb-1">Tech Execution (30%)</label>
                                                <input
                                                    type="number"
                                                    value={wizardData.rubric.technicalExecution}
                                                    onChange={(e) => setWizardData({ ...wizardData, rubric: { ...wizardData.rubric, technicalExecution: Number(e.target.value) } })}
                                                    className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="font-bold text-[10px] uppercase block mb-1">Impact / Feasibility (20%)</label>
                                                <input
                                                    type="number"
                                                    value={wizardData.rubric.feasibility}
                                                    onChange={(e) => setWizardData({ ...wizardData, rubric: { ...wizardData.rubric, feasibility: Number(e.target.value) } })}
                                                    className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="font-bold text-[10px] uppercase block mb-1">Presentation (20%)</label>
                                                <input
                                                    type="number"
                                                    value={wizardData.rubric.presentation}
                                                    onChange={(e) => setWizardData({ ...wizardData, rubric: { ...wizardData.rubric, presentation: Number(e.target.value) } })}
                                                    className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: REGISTRATION & PAYMENT QR */}
                            {wizardStep === 4 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-display-lg text-lg uppercase text-stark-black border-b-2 border-stark-black pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#00E5FF]">qr_code_2</span>
                                        STEP 4: REGISTRATION POLICY & PAYMENT QR WORKFLOW
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                Entry Policy
                                            </label>
                                            <select
                                                value={wizardData.entryType}
                                                onChange={(e: any) => setWizardData({ ...wizardData, entryType: e.target.value })}
                                                className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs uppercase"
                                            >
                                                <option value="free">Free Access (No Payment Required)</option>
                                                <option value="paid">Paid Admission (UPI Payment Required)</option>
                                            </select>
                                        </div>

                                        {wizardData.entryType === "paid" && (
                                            <div className="flex flex-col gap-1.5">
                                                <label className="font-label-bold uppercase text-xs text-stark-black font-black">
                                                    Fee Assessment Basis
                                                </label>
                                                <select
                                                    value={wizardData.feeBasis}
                                                    onChange={(e: any) => setWizardData({ ...wizardData, feeBasis: e.target.value })}
                                                    className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs uppercase"
                                                >
                                                    <option value="per_team">Per Squad / Team</option>
                                                    <option value="per_participant">Per Member / Participant</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {wizardData.entryType === "paid" ? (
                                        <div className="p-4 bg-surface-container-lowest brutal-border flex flex-col md:flex-row gap-6">
                                            <div className="flex-1 flex flex-col gap-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="font-bold uppercase text-[10px] block mb-1">
                                                            Entry Fee (₹ INR) <span className="text-error">*</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={wizardData.fee}
                                                            onChange={(e) => setWizardData({ ...wizardData, fee: e.target.value })}
                                                            placeholder="e.g. 500"
                                                            className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="font-bold uppercase text-[10px] block mb-1">
                                                            UPI VPA ID <span className="text-error">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={wizardData.upiId}
                                                            onChange={(e) => setWizardData({ ...wizardData, upiId: e.target.value })}
                                                            placeholder="codesrijan@okhdfcbank"
                                                            className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="font-bold uppercase text-[10px] block mb-1">Payee / Account Name</label>
                                                    <input
                                                        type="text"
                                                        value={wizardData.payeeName}
                                                        onChange={(e) => setWizardData({ ...wizardData, payeeName: e.target.value })}
                                                        placeholder="CodeSrijan Hackathon Society"
                                                        className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="font-bold uppercase text-[10px] block mb-1">Custom Official QR Image URL (Optional)</label>
                                                    <input
                                                        type="url"
                                                        value={wizardData.qrImageUrl}
                                                        onChange={(e) => setWizardData({ ...wizardData, qrImageUrl: e.target.value })}
                                                        placeholder="https://.../upi-qr.png"
                                                        className="w-full p-2 bg-pure-white brutal-border font-mono text-xs"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleGenerateQr}
                                                    className="bg-[#00E5FF] text-stark-black py-2.5 px-4 font-bold uppercase brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">qr_code</span>
                                                    GENERATE PAYMENT QR AUTOMATICALLY
                                                </button>
                                            </div>

                                            {/* Live QR Preview Box */}
                                            <div className="w-full md:w-64 bg-pure-white p-4 brutal-border flex flex-col items-center justify-center text-center gap-2">
                                                <span className="font-bold uppercase text-[10px] text-zinc-500">Live Participant QR Preview</span>
                                                {wizardData.qrImageUrl ? (
                                                    <img
                                                        src={wizardData.qrImageUrl}
                                                        alt="Payment QR"
                                                        className="w-44 h-44 object-contain brutal-border p-1 bg-white"
                                                    />
                                                ) : (
                                                    <div className="w-44 h-44 bg-surface-container flex flex-col items-center justify-center brutal-border text-zinc-400">
                                                        <span className="material-symbols-outlined text-4xl">qr_code_2</span>
                                                        <span className="text-[10px] mt-1 font-bold uppercase">No QR Generated</span>
                                                    </div>
                                                )}
                                                <div className="font-bold text-xs uppercase text-stark-black mt-1">
                                                    ₹{wizardData.fee || 0} / {wizardData.feeBasis === "per_participant" ? "MEMBER" : "SQUAD"}
                                                </div>
                                                <div className="font-mono text-[10px] text-zinc-600">
                                                    {wizardData.upiId}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-emerald-50 brutal-border border-emerald-600 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
                                            <div>
                                                <div className="font-bold text-emerald-900 uppercase text-xs">FREE ACCESS CONFIGURED</div>
                                                <div className="text-emerald-700 text-[11px] mt-0.5">
                                                    Participants will be registered instantly without requiring payment proof or transaction verification.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 5: REVIEW & PUBLISH */}
                            {wizardStep === 5 && (
                                <div className="flex flex-col gap-5">
                                    <h3 className="font-display-lg text-lg uppercase text-stark-black border-b-2 border-stark-black pb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#00E5FF]">verified</span>
                                        STEP 5: REVIEW & PUBLISH HACKATHON
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Event Details Card */}
                                        <div className="p-4 bg-surface-container-lowest brutal-border flex flex-col gap-2">
                                            <span className="font-bold text-zinc-500 uppercase text-[10px]">Event Specification</span>
                                            <div className="font-black text-sm uppercase text-stark-black">{wizardData.name || "Untitled"}</div>
                                            <div className="text-[11px] text-zinc-600">Theme: {wizardData.theme}</div>
                                            <div className="text-[11px] text-zinc-600">Format: {wizardData.mode.toUpperCase()} {wizardData.venue ? `(${wizardData.venue})` : ""}</div>
                                            <div className="text-[11px] text-zinc-600">Squad Size: {wizardData.teamSizeMin} to {wizardData.teamSizeMax} members</div>
                                        </div>

                                        {/* Schedule Card */}
                                        <div className="p-4 bg-surface-container-lowest brutal-border flex flex-col gap-2">
                                            <span className="font-bold text-zinc-500 uppercase text-[10px]">Timeline & Windows</span>
                                            <div className="text-[11px] text-zinc-700"><span className="font-bold">Run Dates:</span> {wizardData.startDate} to {wizardData.endDate}</div>
                                            <div className="text-[11px] text-zinc-700"><span className="font-bold">Registration:</span> {wizardData.registrationStart || "Immediate"} to {wizardData.registrationEnd || "Open"}</div>
                                            <div className="text-[11px] text-zinc-700"><span className="font-bold">Submission Deadline:</span> {wizardData.submissionDeadline || "At Event End"}</div>
                                        </div>

                                        {/* Problem Statements Card */}
                                        <div className="p-4 bg-surface-container-lowest brutal-border flex flex-col gap-2">
                                            <span className="font-bold text-zinc-500 uppercase text-[10px]">Problem Statements</span>
                                            <div className="font-bold text-xs uppercase text-stark-black">
                                                {wizardData.problemDrafts.length} Challenge(s) Configured
                                            </div>
                                            <div className="text-[11px] text-zinc-600">
                                                Release Mode: {wizardData.problemRevealMode.toUpperCase()}
                                            </div>
                                        </div>

                                        {/* Payment Policy Card */}
                                        <div className="p-4 bg-surface-container-lowest brutal-border flex flex-col gap-2">
                                            <span className="font-bold text-zinc-500 uppercase text-[10px]">Payment Configuration</span>
                                            <div className="font-bold text-xs uppercase text-stark-black">
                                                {wizardData.entryType === "paid" ? `₹${wizardData.fee} / ${wizardData.feeBasis === "per_participant" ? "MEMBER" : "SQUAD"}` : "FREE REGISTRATION"}
                                            </div>
                                            {wizardData.entryType === "paid" && (
                                                <div className="text-[11px] text-zinc-600">
                                                    UPI VPA: {wizardData.upiId} ({wizardData.qrImageUrl ? "QR Ready" : "QR Missing"})
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Validation Checklist */}
                                    <div className="p-4 bg-surface-container brutal-border">
                                        <span className="font-bold uppercase text-xs text-stark-black block mb-2">Readiness Checklist:</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`material-symbols-outlined text-sm ${wizardData.name ? "text-success" : "text-error"}`}>
                                                    {wizardData.name ? "check_circle" : "cancel"}
                                                </span>
                                                <span>Event Name Provided</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`material-symbols-outlined text-sm ${wizardData.startDate && wizardData.endDate ? "text-success" : "text-error"}`}>
                                                    {wizardData.startDate && wizardData.endDate ? "check_circle" : "cancel"}
                                                </span>
                                                <span>Start & End Timelines Specified</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`material-symbols-outlined text-sm ${wizardData.entryType === "free" || (wizardData.fee > 0 && wizardData.upiId) ? "text-success" : "text-error"}`}>
                                                    {wizardData.entryType === "free" || (wizardData.fee > 0 && wizardData.upiId) ? "check_circle" : "cancel"}
                                                </span>
                                                <span>Payment Policy Formatted</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`material-symbols-outlined text-sm ${wizardData.problemDrafts.length > 0 ? "text-success" : "text-amber-500"}`}>
                                                    {wizardData.problemDrafts.length > 0 ? "check_circle" : "info"}
                                                </span>
                                                <span>{wizardData.problemDrafts.length > 0 ? "Problem Statements Included" : "No Problem Statements (Can add later)"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Wizard Bottom Navigation Bar */}
                        <div className="p-4 bg-surface-container border-t-4 border-stark-black flex justify-between items-center sticky bottom-0 z-20">
                            <div>
                                {wizardStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevStep}
                                        className="bg-pure-white text-stark-black font-label-bold uppercase px-4 py-2 brutal-border hover:bg-zinc-200 transition-colors cursor-pointer text-xs font-bold"
                                    >
                                        ← BACK
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleCommitWizard("draft")}
                                    disabled={loadingId === "wizard-saving"}
                                    className="bg-zinc-800 text-pure-white font-label-bold uppercase px-4 py-2 brutal-border hover:bg-black transition-colors cursor-pointer text-xs font-bold disabled:opacity-50"
                                >
                                    SAVE AS DRAFT
                                </button>

                                {wizardStep < 5 ? (
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="bg-[#00E5FF] text-stark-black font-label-bold uppercase px-5 py-2 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer text-xs font-black flex items-center gap-1"
                                    >
                                        NEXT STEP →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleCommitWizard("registration_open")}
                                        disabled={loadingId === "wizard-saving"}
                                        className="bg-success text-stark-black font-label-bold uppercase px-6 py-2.5 brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer text-xs font-black flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">rocket_launch</span>
                                        {loadingId === "wizard-saving" ? "PUBLISHING..." : "PUBLISH HACKATHON LIVE"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                PHASE 6: DEDICATED HACKATHON MANAGEMENT MODAL
               ========================================================================= */}
            {managingHackathon && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setManagingHackathon(null);
                    }}
                    className="fixed inset-0 bg-stark-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
                >
                    <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-5 p-6">
                        <div className="flex justify-between items-center border-b-2 border-stark-black pb-3">
                            <div>
                                <span className="font-code-snippet text-[10px] bg-stark-black text-pure-white px-2 py-0.5 font-bold uppercase">
                                    ID: {managingHackathon.id}
                                </span>
                                <h2 className="font-display-lg text-2xl uppercase text-stark-black mt-1 font-black">
                                    {managingHackathon.name}
                                </h2>
                            </div>
                            <button
                                onClick={() => setManagingHackathon(null)}
                                className="w-8 h-8 flex items-center justify-center brutal-border hover:bg-error hover:text-white transition-colors cursor-pointer font-black"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Lifecycle Status & Controls */}
                        <div className="p-4 bg-surface-container brutal-border flex flex-col gap-3 font-mono text-xs">
                            <div className="flex justify-between items-center">
                                <span className="font-bold uppercase text-zinc-600">Current Arena State:</span>
                                <span className="font-black px-2.5 py-1 bg-stark-black text-[#00E5FF] uppercase brutal-border">
                                    {managingHackathon.status?.replace("_", " ")}
                                </span>
                            </div>

                            <span className="font-bold uppercase text-xs text-stark-black mt-2">Trigger Lifecycle Transition:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <button
                                    onClick={() => changeState(managingHackathon.id, "open-registration")}
                                    className="p-2 bg-emerald-400 text-stark-black font-bold uppercase brutal-border hover:bg-emerald-500 cursor-pointer text-center"
                                >
                                    OPEN REG
                                </button>
                                <button
                                    onClick={() => changeState(managingHackathon.id, "close-registration")}
                                    className="p-2 bg-amber-400 text-stark-black font-bold uppercase brutal-border hover:bg-amber-500 cursor-pointer text-center"
                                >
                                    CLOSE REG
                                </button>
                                <button
                                    onClick={() => changeState(managingHackathon.id, "open-submissions")}
                                    className="p-2 bg-[#00E5FF] text-stark-black font-bold uppercase brutal-border hover:bg-[#00c4db] cursor-pointer text-center"
                                >
                                    START HACK
                                </button>
                                <button
                                    onClick={() => changeState(managingHackathon.id, "close-submissions")}
                                    className="p-2 bg-[#FFD700] text-stark-black font-bold uppercase brutal-border hover:bg-amber-300 cursor-pointer text-center"
                                >
                                    EVAL PHASE
                                </button>
                                <button
                                    onClick={() => changeState(managingHackathon.id, "complete")}
                                    className="p-2 bg-stark-black text-pure-white font-bold uppercase brutal-border hover:bg-zinc-800 cursor-pointer text-center"
                                >
                                    CONCLUDE
                                </button>
                                <button
                                    onClick={() => toggleProblemReveal(managingHackathon.id, !!managingHackathon.problemStatementsRevealed)}
                                    className={`p-2 font-bold uppercase brutal-border cursor-pointer text-center ${
                                        managingHackathon.problemStatementsRevealed ? "bg-rose-400 text-black" : "bg-emerald-400 text-black"
                                    }`}
                                >
                                    {managingHackathon.problemStatementsRevealed ? "HIDE PS" : "REVEAL PS"}
                                </button>
                            </div>
                        </div>

                        {/* Direct Hub Links */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                            <Link
                                to="/admin/teams"
                                className="p-3 bg-surface-container-lowest brutal-border text-center hover:bg-[#00E5FF]/20 font-bold uppercase"
                            >
                                <span className="material-symbols-outlined text-lg block mb-1">groups</span>
                                Squads
                            </Link>
                            <Link
                                to="/admin/submissions"
                                className="p-3 bg-surface-container-lowest brutal-border text-center hover:bg-[#00E5FF]/20 font-bold uppercase"
                            >
                                <span className="material-symbols-outlined text-lg block mb-1">code</span>
                                Submissions
                            </Link>
                            <Link
                                to="/admin/problems"
                                className="p-3 bg-surface-container-lowest brutal-border text-center hover:bg-[#00E5FF]/20 font-bold uppercase"
                            >
                                <span className="material-symbols-outlined text-lg block mb-1">psychology</span>
                                Problems
                            </Link>
                            <Link
                                to="/admin/certificates"
                                className="p-3 bg-surface-container-lowest brutal-border text-center hover:bg-[#00E5FF]/20 font-bold uppercase"
                            >
                                <span className="material-symbols-outlined text-lg block mb-1">workspace_premium</span>
                                Certificates
                            </Link>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t-2 border-stark-black">
                            <button
                                onClick={() => {
                                    setManagingHackathon(null);
                                    openEditWizard(managingHackathon);
                                }}
                                className="px-4 py-2 bg-surface-bright text-stark-black font-label-bold uppercase brutal-border text-xs cursor-pointer hover:bg-zinc-200"
                            >
                                EDIT ALL PARAMETERS
                            </button>
                            <button
                                onClick={() => setManagingHackathon(null)}
                                className="px-5 py-2 bg-stark-black text-pure-white font-label-bold uppercase brutal-border text-xs cursor-pointer hover:bg-zinc-800"
                            >
                                CLOSE HUB
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                DESTRUCTIVE CONFIRMATION MODAL (NO WINDOW.CONFIRM)
               ========================================================================= */}
            {deleteConfirmHackathon && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setDeleteConfirmHackathon(null);
                    }}
                    className="fixed inset-0 bg-stark-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
                >
                    <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-error">
                            <span className="material-symbols-outlined text-3xl font-black">warning</span>
                            <h3 className="font-display-lg uppercase text-xl text-stark-black">CONFIRM DELETION</h3>
                        </div>

                        <p className="font-mono text-xs text-zinc-700 leading-relaxed uppercase">
                            Are you sure you want to permanently delete hackathon{" "}
                            <span className="font-bold text-stark-black bg-zinc-200 px-1">
                                "{deleteConfirmHackathon.name}"
                            </span>
                            ? This action will remove the event record from the database.
                        </p>

                        <div className="flex justify-end gap-3 pt-3 border-t-2 border-stark-black">
                            <button
                                onClick={() => setDeleteConfirmHackathon(null)}
                                className="px-4 py-2 font-mono text-xs uppercase font-bold brutal-border hover:bg-zinc-200 cursor-pointer"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleExecuteDelete}
                                disabled={loadingId === deleteConfirmHackathon.id}
                                className="px-5 py-2 font-mono text-xs uppercase font-black bg-error text-pure-white brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                            >
                                {loadingId === deleteConfirmHackathon.id ? "DELETING..." : "CONFIRM PURGE"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
