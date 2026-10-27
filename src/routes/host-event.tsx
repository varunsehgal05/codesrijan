import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/host-event")({
    component: HostEventPage,
});

interface ProblemDraft {
    title: string;
    track: string;
    difficulty: string;
    description: string;
    requirements: string;
}

export function HostEventPage() {
    const navigate = useNavigate();
    const { currentUser } = useAppStore();
    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<any | null>(null);

    // Institution & Coordinator info
    const [institutionName, setInstitutionName] = useState("");
    const [coordinatorName, setCoordinatorName] = useState(currentUser?.name || "");
    const [coordinatorEmail, setCoordinatorEmail] = useState(currentUser?.email || "");
    const [coordinatorPhone, setCoordinatorPhone] = useState("");

    // Core Hackathon Configuration
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [theme, setTheme] = useState("");
    const [description, setDescription] = useState("");
    const [mode, setMode] = useState<'offline' | 'online' | 'hybrid'>('offline');
    const [venue, setVenue] = useState("");
    const [teamSizeMin, setTeamSizeMin] = useState(1);
    const [teamSizeMax, setTeamSizeMax] = useState(4);

    // Dates
    const [registrationStart, setRegistrationStart] = useState("");
    const [registrationEnd, setRegistrationEnd] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [submissionDeadline, setSubmissionDeadline] = useState("");
    const [resultDate, setResultDate] = useState("");

    // Amenities (Tick Boxes)
    const [amenities, setAmenities] = useState<string[]>([
        'meals', 'wifi', 'power_backup', 'swag_kits', 'physical_certificates'
    ]);

    // Paid Hackathon Configuration
    const [entryType, setEntryType] = useState<'free' | 'paid'>('free');
    const [fee, setFee] = useState<number>(500);
    const [feeBasis, setFeeBasis] = useState<'per_team' | 'per_participant'>('per_team');
    const [upiId, setUpiId] = useState("codesrijan@okhdfcbank");
    const [payeeName, setPayeeName] = useState("CodeSrijan Hackathon Society");
    const [qrImageUrl, setQrImageUrl] = useState("");
    const [paymentInstructions, setPaymentInstructions] = useState("Pay authoritative fee via UPI, save payment screenshot & submit the 12-digit UTR reference.");

    // Problem Statements & Reveal Control
    const [problemRevealMode, setProblemRevealMode] = useState<'manual' | 'immediate' | 'at_start'>('manual');
    const [problems, setProblems] = useState<ProblemDraft[]>([
        {
            title: "Autonomous AI Agent Mesh for Disaster Response",
            track: "AI / ML & Autonomous Systems",
            difficulty: "intermediate",
            description: "Design decentralized, multi-agent cooperative workflows that orchestrate emergency supply chains and drone navigation in connectivity-compromised environments.",
            requirements: "Must include local-first state synchronization, offline fallback, and reproducible demo script."
        }
    ]);

    const offlineAmenitiesList = [
        { id: 'meals', label: 'Free Meals & Midnight Fuel', desc: 'Hot breakfast, lunch, dinner & midnight snacks provided.', icon: 'restaurant' },
        { id: 'accommodation', label: 'Overnight Stay & Resting Dorms', desc: 'Secure air-conditioned sleeping rooms & rest lounges.', icon: 'bed' },
        { id: 'wifi', label: 'Gigabit WiFi & LAN Drops', desc: 'Dedicated high-bandwidth low-latency connectivity.', icon: 'wifi' },
        { id: 'power_backup', label: '24x7 Power Backup & Workstations', desc: 'Individual power sockets & uninterrupted power supply.', icon: 'bolt' },
        { id: 'hardware_lab', label: 'Hardware & IoT Prototype Lab', desc: 'Access to Arduinos, ESP32s, sensors & 3D printers.', icon: 'memory' },
        { id: 'swag_kits', label: 'Official Swag Kits & Custom Merch', desc: 'Custom event t-shirts, stickers, notebooks & lanyards.', icon: 'inventory_2' },
        { id: 'refreshments', label: 'Unlimited Coffee & Energy Drinks', desc: 'Continuous espresso, tea & energy drink stations.', icon: 'coffee' },
        { id: 'physical_certificates', label: 'Verified Certificates & Trophies', desc: 'Engraved medals, winner trophies & print certificates.', icon: 'workspace_premium' },
    ];

    const onlineAmenitiesList = [
        { id: 'cloud_credits', label: 'Cloud Compute Credits ($500+)', desc: 'Sponsored credits for AWS, Google Cloud, or Azure compute.', icon: 'cloud' },
        { id: 'api_keys', label: 'API Keys & Developer Licenses', desc: 'Complimentary access to LLM APIs, Postman & GitHub Pro.', icon: 'key' },
        { id: 'mentor_rooms', label: '24/7 Discord / Slack Mentorship', desc: 'Dedicated breakout rooms with industry tech leads.', icon: 'forum' },
        { id: 'workshops', label: 'Live Masterclasses & Workshops', desc: 'Interactive streaming sessions led by software architects.', icon: 'live_tv' },
        { id: 'digital_badges', label: 'Verifiable Digital Badges', desc: 'Cryptographically verifiable completion certificates.', icon: 'military_tech' },
        { id: 'sponsor_perks', label: 'Software Sponsor Perks & Deals', desc: 'Extended trial licenses and SaaS perks for participants.', icon: 'redeem' },
        { id: 'virtual_demo', label: 'Virtual Demo Day with VCs', desc: 'Live pitch session with angel investors and tech founders.', icon: 'rocket_launch' },
    ];

    const toggleAmenity = (id: string) => {
        if (amenities.includes(id)) {
            setAmenities(amenities.filter(a => a !== id));
        } else {
            setAmenities([...amenities, id]);
        }
    };

    const handleAddProblem = () => {
        setProblems([
            ...problems,
            {
                title: "",
                track: "Open Innovation",
                difficulty: "intermediate",
                description: "",
                requirements: ""
            }
        ]);
    };

    const handleRemoveProblem = (idx: number) => {
        setProblems(problems.filter((_, i) => i !== idx));
    };

    const handleProblemChange = (idx: number, field: keyof ProblemDraft, val: string) => {
        const next = [...problems];
        next[idx] = { ...next[idx], [field]: val };
        setProblems(next);
    };

    const handleNameChange = (val: string) => {
        setName(val);
        if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
            setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
        const token = localStorage.getItem("codesrijan_auth_token") || localStorage.getItem("token");

        // Format problem statements payload
        const formattedProblems = problems.filter(p => p.title.trim()).map(p => ({
            title: p.title.trim(),
            track: p.track,
            difficulty: p.difficulty,
            description: p.description.trim(),
            requirements: p.requirements.trim() ? [p.requirements.trim()] : []
        }));

        const payload = {
            name,
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            theme,
            description,
            mode,
            venue: mode === 'online' ? 'Online Arena' : venue,
            teamSizeMin,
            teamSizeMax,
            registrationStart: registrationStart || new Date().toISOString(),
            registrationEnd: registrationEnd || new Date(Date.now() + 86400000 * 14).toISOString(),
            startDate: startDate || new Date(Date.now() + 86400000 * 15).toISOString(),
            endDate: endDate || new Date(Date.now() + 86400000 * 17).toISOString(),
            submissionDeadline: submissionDeadline || new Date(Date.now() + 86400000 * 17).toISOString(),
            resultDate: resultDate || new Date(Date.now() + 86400000 * 18).toISOString(),
            amenities,
            entryType,
            fee: entryType === 'paid' ? fee : 0,
            feeBasis,
            currency: 'INR',
            upiId: entryType === 'paid' ? upiId : undefined,
            payeeName: entryType === 'paid' ? payeeName : undefined,
            qrImageUrl: entryType === 'paid' ? qrImageUrl : undefined,
            paymentInstructions: entryType === 'paid' ? paymentInstructions : undefined,
            problemRevealMode,
            problemStatements: formattedProblems,
            institutionName,
            coordinatorName,
            coordinatorEmail,
            coordinatorPhone
        };

        try {
            const res = await axios.post(`${API_URL}/hackathons`, payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            toast.success("Hackathon Arena deployed successfully!");
            setSuccessData(res.data);
        } catch (err: any) {
            console.error("Hosting failed", err);
            const msg = err.response?.data?.message || err.message || "Failed to host hackathon.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (successData) {
        return (
            <div className="min-h-screen bg-background text-on-background flex flex-col p-8 font-mono">
                <div className="max-w-2xl mx-auto w-full bg-pure-white brutal-border brutal-shadow-lg p-8 space-y-6">
                    <div className="bg-success text-stark-black p-4 brutal-border flex items-center gap-3">
                        <span className="material-symbols-outlined text-3xl font-black">check_circle</span>
                        <div>
                            <h2 className="font-display-lg text-xl uppercase font-black">HACKATHON DEPLOYED SUCCESSFULLY!</h2>
                            <p className="text-xs font-bold mt-0.5">The hackathon arena protocols have been committed to the neural mesh.</p>
                        </div>
                    </div>

                    <div className="space-y-3 bg-surface-container p-4 brutal-border text-xs">
                        <div className="flex justify-between border-b border-zinc-300 pb-2">
                            <span className="text-zinc-600 font-bold uppercase">Hackathon ID:</span>
                            <span className="font-bold text-stark-black">{successData.id}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-300 pb-2">
                            <span className="text-zinc-600 font-bold uppercase">Arena Title:</span>
                            <span className="font-bold text-electric-blue uppercase">{successData.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-300 pb-2">
                            <span className="text-zinc-600 font-bold uppercase">Format Mode:</span>
                            <span className="font-bold uppercase bg-stark-black text-white px-2 py-0.5">{successData.mode || mode}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-300 pb-2">
                            <span className="text-zinc-600 font-bold uppercase">Entry Type:</span>
                            <span className={`font-bold uppercase px-2 py-0.5 ${successData.entryType === 'paid' ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'}`}>
                                {successData.entryType === 'paid' ? `PAID (₹${successData.fee} ${successData.feeBasis?.replace('_', ' ')})` : 'FREE ENTRY'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-600 font-bold uppercase">Problem Statements:</span>
                            <span className="font-bold uppercase text-stark-black">
                                {successData.problemRevealMode === 'immediate' ? 'REVEALED IMMEDIATELY' : 'CLASSIFIED (ADMIN LAUNCH REQUIRED)'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={() => navigate({ to: "/hackathons" })}
                            className="flex-1 bg-stark-black text-white hover:bg-electric-blue py-3 px-4 font-bold uppercase text-xs brutal-border transition-colors text-center"
                        >
                            View in Hackathons Hub
                        </button>
                        {currentUser?.role === 'admin' ? (
                            <button
                                onClick={() => navigate({ to: "/admin/hackathons" })}
                                className="flex-1 bg-electric-blue text-white hover:bg-black py-3 px-4 font-bold uppercase text-xs brutal-border transition-colors text-center"
                            >
                                Admin Event Control Node
                            </button>
                        ) : (
                            <button
                                onClick={() => setSuccessData(null)}
                                className="flex-1 bg-surface-container text-stark-black hover:bg-surface-variant py-3 px-4 font-bold uppercase text-xs brutal-border transition-colors text-center"
                            >
                                Host Another Event
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col font-mono pb-24">
            <main className="flex-grow max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-12 flex flex-col gap-10">

                {/* Global Back Link */}
                <div className="w-full flex justify-between items-center">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 font-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer border-2 border-stark-black px-3 py-1.5 bg-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1 text-sm">arrow_back</span>
                        BACK
                    </button>
                    <span className="text-xs uppercase font-bold tracking-widest text-zinc-500 bg-surface-container px-3 py-1 brutal-border">
                        OFFICIAL CODESRIJAN HOSTING MATRIX
                    </span>
                </div>

                {/* Hero Header */}
                <div className="bg-pure-white p-8 brutal-border brutal-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-block bg-electric-blue text-pure-white px-3 py-1 uppercase font-black text-xs transform -skew-x-6 brutal-border">
                            HOSTING &amp; HACKATHON STUDIO
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black uppercase text-stark-black tracking-tight leading-none">
                            HOST A <span className="text-electric-blue underline">HACKATHON</span>
                        </h1>
                        <p className="text-zinc-600 font-semibold text-sm">
                            Configure physical campus rounds, virtual hackathons, verified amenities, prize structures, and automated challenge reveal protocols on the CodeSrijan neural matrix.
                        </p>
                    </div>
                    <div className="flex bg-stark-black p-4 brutal-border text-electric-blue">
                        <span className="material-symbols-outlined text-4xl animate-pulse">hub</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">

                    {/* SECTION 1: ORGANIZER & CAMPUS IDENTITY */}
                    <div className="bg-pure-white brutal-border brutal-shadow-lg p-6 sm:p-8 space-y-6">
                        <div className="border-b-2 border-stark-black pb-3 flex items-center gap-3">
                            <span className="material-symbols-outlined text-electric-blue text-2xl">school</span>
                            <h2 className="font-display-lg text-xl uppercase font-black text-stark-black">
                                01. Host Institution &amp; Coordinator
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Institution / University / Organization Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={institutionName}
                                    onChange={(e) => setInstitutionName(e.target.value)}
                                    placeholder="e.g. National Institute of Technology / Tech Society"
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Lead Coordinator Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={coordinatorName}
                                    onChange={(e) => setCoordinatorName(e.target.value)}
                                    placeholder="Prof. / Lead Coordinator Name"
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Official Coordinator Email *</label>
                                <input
                                    required
                                    type="email"
                                    value={coordinatorEmail}
                                    onChange={(e) => setCoordinatorEmail(e.target.value)}
                                    placeholder="coordinator@institute.edu"
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Contact Mobile / WhatsApp Phone *</label>
                                <input
                                    required
                                    type="tel"
                                    value={coordinatorPhone}
                                    onChange={(e) => setCoordinatorPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: EVENT DESIGNATION & FORMAT */}
                    <div className="bg-pure-white brutal-border brutal-shadow-lg p-6 sm:p-8 space-y-6">
                        <div className="border-b-2 border-stark-black pb-3 flex items-center gap-3">
                            <span className="material-symbols-outlined text-electric-blue text-2xl">event</span>
                            <h2 className="font-display-lg text-xl uppercase font-black text-stark-black">
                                02. Event Matrix &amp; Arena Format
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Hackathon Arena Title *</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="e.g. SrijanHack 2026 / NeoHack Innovation"
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">System Slug (URL Key) *</label>
                                <input
                                    required
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="e.g. srijanhack-2026"
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-stark-black">Theme / Focus Vector *</label>
                            <input
                                required
                                type="text"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                placeholder="e.g. Decentralized Intelligence, Autonomous Robotics & FinTech"
                                className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-stark-black">Comprehensive Overview / Rules *</label>
                            <textarea
                                required
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="State hackathon vision, eligibility criteria, judging benchmarks, and guidelines..."
                                className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                            />
                        </div>

                        {/* Format Mode Selector */}
                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-black uppercase text-stark-black block">Arena Format Mode *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { id: 'offline', label: 'OFFLINE / IN-PERSON', desc: 'On-campus arena with food, sleeping dorms & physical stages', icon: 'domain' },
                                    { id: 'online', label: 'ONLINE / VIRTUAL', desc: 'Remote global hackathon via Discord mesh & cloud servers', icon: 'language' },
                                    { id: 'hybrid', label: 'HYBRID ARENA', desc: 'Combined on-campus physical teams + remote satellite tracks', icon: 'cell_tower' }
                                ].map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => setMode(m.id as any)}
                                        className={`p-4 brutal-border cursor-pointer transition-all flex flex-col justify-between ${
                                            mode === m.id
                                                ? 'bg-stark-black text-white shadow-[4px_4px_0px_0px_rgba(0,53,213,1)]'
                                                : 'bg-surface-container text-stark-black hover:bg-surface-variant'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`material-symbols-outlined ${mode === m.id ? 'text-electric-blue' : 'text-zinc-600'}`}>
                                                {m.icon}
                                            </span>
                                            <span className="font-black text-xs uppercase">{m.label}</span>
                                        </div>
                                        <p className="text-[11px] opacity-80">{m.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Physical Venue Input (if Offline or Hybrid) */}
                        {mode !== 'online' && (
                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-black uppercase text-stark-black">Campus Physical Venue Address &amp; Hall *</label>
                                <input
                                    required={mode !== 'online'}
                                    type="text"
                                    value={venue}
                                    onChange={(e) => setVenue(e.target.value)}
                                    placeholder="e.g. Main Auditorium & Innovation Hub, North Campus Block B"
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                />
                            </div>
                        )}

                        {/* Squad Size Caps */}
                        <div className="grid grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Squad Min Operatives</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={6}
                                    value={teamSizeMin}
                                    onChange={(e) => setTeamSizeMin(parseInt(e.target.value) || 1)}
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Squad Max Operatives</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={6}
                                    value={teamSizeMax}
                                    onChange={(e) => setTeamSizeMax(parseInt(e.target.value) || 4)}
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: TIMELINE PROTOCOLS */}
                    <div className="bg-pure-white brutal-border brutal-shadow-lg p-6 sm:p-8 space-y-6">
                        <div className="border-b-2 border-stark-black pb-3 flex items-center gap-3">
                            <span className="material-symbols-outlined text-electric-blue text-2xl">schedule</span>
                            <h2 className="font-display-lg text-xl uppercase font-black text-stark-black">
                                03. Timeline &amp; Deadlines
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Registration Opening *</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={registrationStart}
                                    onChange={(e) => setRegistrationStart(e.target.value)}
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Registration Closing *</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={registrationEnd}
                                    onChange={(e) => setRegistrationEnd(e.target.value)}
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Hackathon Kickoff *</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-stark-black">Grand Finale &amp; Submissions *</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: AMENITIES & PROVISIONS (TICK BOXES) */}
                    <div className="bg-pure-white brutal-border brutal-shadow-lg p-6 sm:p-8 space-y-6">
                        <div className="border-b-2 border-stark-black pb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-electric-blue text-2xl">checklist</span>
                                <h2 className="font-display-lg text-xl uppercase font-black text-stark-black">
                                    04. Perks, Amenities &amp; Provisions
                                </h2>
                            </div>
                            <span className="text-[11px] font-bold uppercase bg-electric-blue text-white px-2.5 py-1 brutal-border">
                                {amenities.length} Selected
                            </span>
                        </div>

                        <p className="text-xs text-zinc-600">
                            Select all provisions you are officially supplying to operatives. These badges will appear on the public hackathon card and hackathon details page.
                        </p>

                        {/* Offline Provisions Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase text-stark-black tracking-wide flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-electric-blue">apartment</span>
                                Physical &amp; In-Person Amenities (Campus Provisions):
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {offlineAmenitiesList.map(a => {
                                    const isChecked = amenities.includes(a.id);
                                    return (
                                        <div
                                            key={a.id}
                                            onClick={() => toggleAmenity(a.id)}
                                            className={`p-3 brutal-border cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                isChecked ? 'bg-zinc-950 text-white' : 'bg-surface-container hover:bg-surface-variant text-stark-black'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 mt-0.5 border-2 flex items-center justify-center ${
                                                isChecked ? 'bg-electric-blue border-white text-black' : 'border-stark-black bg-white'
                                            }`}>
                                                {isChecked && <span className="material-symbols-outlined text-xs font-black">check</span>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1.5 font-bold text-xs uppercase">
                                                    <span className="material-symbols-outlined text-sm text-electric-blue">{a.icon}</span>
                                                    <span>{a.label}</span>
                                                </div>
                                                <p className="text-[10px] opacity-75 mt-0.5">{a.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Online Provisions Section */}
                        <div className="space-y-3 pt-4 border-t border-zinc-200">
                            <h3 className="text-xs font-black uppercase text-stark-black tracking-wide flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-electric-blue">terminal</span>
                                Digital &amp; Remote Amenities (Developer Cloud Perks):
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {onlineAmenitiesList.map(a => {
                                    const isChecked = amenities.includes(a.id);
                                    return (
                                        <div
                                            key={a.id}
                                            onClick={() => toggleAmenity(a.id)}
                                            className={`p-3 brutal-border cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                isChecked ? 'bg-zinc-950 text-white' : 'bg-surface-container hover:bg-surface-variant text-stark-black'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 mt-0.5 border-2 flex items-center justify-center ${
                                                isChecked ? 'bg-electric-blue border-white text-black' : 'border-stark-black bg-white'
                                            }`}>
                                                {isChecked && <span className="material-symbols-outlined text-xs font-black">check</span>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1.5 font-bold text-xs uppercase">
                                                    <span className="material-symbols-outlined text-sm text-electric-blue">{a.icon}</span>
                                                    <span>{a.label}</span>
                                                </div>
                                                <p className="text-[10px] opacity-75 mt-0.5">{a.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: HACKATHON ENTRY & PAID HACKATHON SETUP */}
                    <div className="bg-pure-white brutal-border brutal-shadow-lg p-6 sm:p-8 space-y-6">
                        <div className="border-b-2 border-stark-black pb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-electric-blue text-2xl">payments</span>
                                <h2 className="font-display-lg text-xl uppercase font-black text-stark-black">
                                    05. Hackathon Entry &amp; Paid Hackathon Model
                                </h2>
                            </div>
                            <span className={`text-[11px] font-bold uppercase px-3 py-1 brutal-border ${
                                entryType === 'paid' ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'
                            }`}>
                                {entryType === 'paid' ? 'PAID HACKATHON' : 'FREE ENTRY'}
                            </span>
                        </div>

                        {/* Model Switch */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                                onClick={() => setEntryType('free')}
                                className={`p-4 brutal-border cursor-pointer transition-all flex items-center justify-between ${
                                    entryType === 'free' ? 'bg-stark-black text-white' : 'bg-surface-container text-stark-black hover:bg-surface-variant'
                                }`}
                            >
                                <div>
                                    <h4 className="font-black text-xs uppercase">Free Entry Hackathon</h4>
                                    <p className="text-[11px] opacity-75 mt-1">Zero barrier to entry. Free for all approved student hackers.</p>
                                </div>
                                <span className="material-symbols-outlined text-2xl text-emerald-400">check_circle</span>
                            </div>

                            <div
                                onClick={() => setEntryType('paid')}
                                className={`p-4 brutal-border cursor-pointer transition-all flex items-center justify-between ${
                                    entryType === 'paid' ? 'bg-stark-black text-white' : 'bg-surface-container text-stark-black hover:bg-surface-variant'
                                }`}
                            >
                                <div>
                                    <h4 className="font-black text-xs uppercase">Paid Entry Hackathon</h4>
                                    <p className="text-[11px] opacity-75 mt-1">Collect entry fee via UPI QR. Automated audit &amp; UTR verification.</p>
                                </div>
                                <span className="material-symbols-outlined text-2xl text-amber-400">currency_rupee</span>
                            </div>
                        </div>

                        {/* Paid Hackathon Fields */}
                        {entryType === 'paid' && (
                            <div className="space-y-6 pt-4 border-t-2 border-dashed border-zinc-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-stark-black">Authoritative Fee Amount (INR ₹) *</label>
                                        <input
                                            required
                                            type="number"
                                            min={1}
                                            value={fee}
                                            onChange={(e) => setFee(parseInt(e.target.value) || 0)}
                                            className="w-full bg-surface-container border-2 border-stark-black p-3 text-sm font-black text-electric-blue focus:border-electric-blue outline-none"
                                            placeholder="500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-stark-black">Fee Calculation Basis *</label>
                                        <select
                                            value={feeBasis}
                                            onChange={(e) => setFeeBasis(e.target.value as any)}
                                            className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold"
                                        >
                                            <option value="per_team">Per Squad / Team (Fixed Rate)</option>
                                            <option value="per_participant">Per Participant (Multiplied by Roster Size)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-stark-black">Official Merchant UPI ID *</label>
                                        <input
                                            required
                                            type="text"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            placeholder="e.g. codesrijan@okhdfcbank"
                                            className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-stark-black">Registered Payee / Beneficiary Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={payeeName}
                                            onChange={(e) => setPayeeName(e.target.value)}
                                            placeholder="e.g. CodeSrijan Hackathon Society"
                                            className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-stark-black">Official Payment QR Code Image URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={qrImageUrl}
                                        onChange={(e) => setQrImageUrl(e.target.value)}
                                        placeholder="https://example.com/upi-qr-code.png (or leave blank for auto-generated UPI intent)"
                                        className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-stark-black">Payment Instructions for Participants</label>
                                    <textarea
                                        rows={2}
                                        value={paymentInstructions}
                                        onChange={(e) => setPaymentInstructions(e.target.value)}
                                        className="w-full bg-surface-container border-2 border-stark-black p-3 text-xs font-bold focus:border-electric-blue outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 6: PROBLEM STATEMENTS & REVEAL DIRECTIVE */}
                    <div className="bg-pure-white brutal-border brutal-shadow-lg p-6 sm:p-8 space-y-6">
                        <div className="border-b-2 border-stark-black pb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-electric-blue text-2xl">psychology</span>
                                <h2 className="font-display-lg text-xl uppercase font-black text-stark-black">
                                    06. Problem Statements &amp; Launch Reveal Control
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddProblem}
                                className="bg-electric-blue text-white hover:bg-black px-3 py-1.5 text-xs font-bold uppercase brutal-border transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Challenge
                            </button>
                        </div>

                        {/* Reveal Policy Selector */}
                        <div className="bg-surface-container p-4 brutal-border space-y-3">
                            <label className="text-xs font-black uppercase text-stark-black flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-electric-blue">lock</span>
                                Problem Statement Reveal Directive (Admin Controlled):
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 'manual', label: 'CLASSIFIED / MANUAL RELEASE', desc: 'Hidden until Admin presses "Reveal Problem Statements" button in Admin Panel' },
                                    { id: 'immediate', label: 'REVEAL IMMEDIATELY', desc: 'Visible to all participants as soon as hackathon arena is published' },
                                    { id: 'at_start', label: 'AUTO REVEAL AT START', desc: 'Automatically decrypts when official Hackathon Start timestamp arrives' }
                                ].map(r => (
                                    <div
                                        key={r.id}
                                        onClick={() => setProblemRevealMode(r.id as any)}
                                        className={`p-3 brutal-border cursor-pointer transition-all ${
                                            problemRevealMode === r.id ? 'bg-stark-black text-white' : 'bg-white text-stark-black hover:bg-zinc-100'
                                        }`}
                                    >
                                        <p className="font-bold text-xs uppercase">{r.label}</p>
                                        <p className="text-[10px] opacity-75 mt-1">{r.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* List of Problem Statements */}
                        <div className="space-y-4">
                            {problems.map((prob, idx) => (
                                <div key={idx} className="bg-surface-container p-5 brutal-border space-y-4 relative">
                                    <div className="flex justify-between items-center border-b border-zinc-300 pb-2">
                                        <span className="font-black text-xs uppercase text-electric-blue">
                                            CHALLENGE VECTOR #{idx + 1}
                                        </span>
                                        {problems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProblem(idx)}
                                                className="text-rose-500 hover:text-rose-700 text-xs font-bold uppercase flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-2 space-y-1">
                                            <label className="text-[11px] font-black uppercase text-stark-black">Challenge Title *</label>
                                            <input
                                                required
                                                type="text"
                                                value={prob.title}
                                                onChange={(e) => handleProblemChange(idx, 'title', e.target.value)}
                                                placeholder="e.g. Next-Gen Decentralized Identity Verification"
                                                className="w-full bg-white border border-stark-black p-2.5 text-xs font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-black uppercase text-stark-black">Track / Domain *</label>
                                            <select
                                                value={prob.track}
                                                onChange={(e) => handleProblemChange(idx, 'track', e.target.value)}
                                                className="w-full bg-white border border-stark-black p-2.5 text-xs font-bold"
                                            >
                                                <option value="AI / ML & Autonomous Systems">AI / ML &amp; Autonomous Systems</option>
                                                <option value="Web3, Crypto & Decentralized Mesh">Web3, Crypto &amp; Decentralized Mesh</option>
                                                <option value="FinTech, Payments & Security">FinTech, Payments &amp; Security</option>
                                                <option value="HealthTech & Bio-Informatics">HealthTech &amp; Bio-Informatics</option>
                                                <option value="Smart Cities & Clean Energy">Smart Cities &amp; Clean Energy</option>
                                                <option value="EdTech & Accessibility">EdTech &amp; Accessibility</option>
                                                <option value="Open Innovation">Open Innovation</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black uppercase text-stark-black">Problem Brief &amp; Statement *</label>
                                        <textarea
                                            required
                                            rows={2}
                                            value={prob.description}
                                            onChange={(e) => handleProblemChange(idx, 'description', e.target.value)}
                                            placeholder="Detail the technical pain point, constraints, and target objective..."
                                            className="w-full bg-white border border-stark-black p-2.5 text-xs font-bold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black uppercase text-stark-black">Key Deliverables &amp; Requirements</label>
                                        <input
                                            type="text"
                                            value={prob.requirements}
                                            onChange={(e) => handleProblemChange(idx, 'requirements', e.target.value)}
                                            placeholder="e.g. Working prototype repository, demo video, architectural diagram"
                                            className="w-full bg-white border border-stark-black p-2.5 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="bg-pure-white brutal-border brutal-shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-zinc-600">
                            By deploying this event, you certify that amenities will be delivered and authoritative payment transactions audit-ready.
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto bg-electric-blue hover:bg-black text-white font-black uppercase px-8 py-4 brutal-border text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span className="material-symbols-outlined">rocket_launch</span>
                            {submitting ? "INITIALIZING ARENA MATRIX..." : "DEPLOY HACKATHON ARENA"}
                        </button>
                    </div>

                </form>
            </main>
        </div>
    );
}
export default HostEventPage;
