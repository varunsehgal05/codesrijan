import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

export const Route = createFileRoute("/admin/hackathons/create")({
    component: CreateHackathonPage,
});

function CreateHackathonPage() {
    const navigate = useNavigate();
    const { refetchData } = useAppStore();
    const [statusMsg, setStatusMsg] = useState("");

    // Schema mapped fields
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [theme, setTheme] = useState("");
    const [venue, setVenue] = useState("");
    const [rules, setRules] = useState("");
    const [eligibility, setEligibility] = useState("");
    const [teamSizeMin, setTeamSizeMin] = useState(1);
    const [teamSizeMax, setTeamSizeMax] = useState(4);

    // Dates
    const [registrationStart, setRegistrationStart] = useState("");
    const [registrationEnd, setRegistrationEnd] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [submissionDeadline, setSubmissionDeadline] = useState("");
    const [evaluationDeadline, setEvaluationDeadline] = useState("");
    const [resultDate, setResultDate] = useState("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/hackathons`, {
                name,
                slug,
                description: rules, // Simple mapping for now
                theme,
                venue,
                hackathonRules: rules,
                eligibilityRules: eligibility,
                teamSizeMin,
                teamSizeMax,
                registrationStart,
                registrationEnd,
                startDate,
                endDate,
                submissionDeadline,
                evaluationDeadline,
                resultDate
            }, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            await refetchData();
            setStatusMsg("OK: Hackathon event matrix generated successfully.");
            setTimeout(() => navigate({ to: "/admin" }), 2000);
        } catch (e: any) {
            setStatusMsg(`ERR: ${e.message}`);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
            {/* Header Panel */}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
                        GENERATE EVENT
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm">
                        INITIALIZE NEW CODE_SRIJAN INSTANCE
                    </p>
                </div>
            </div>

            <div className="bg-pure-white brutal-border brutal-shadow-lg p-8">
                {statusMsg && (
                    <div className={`p-4 mb-6 brutal-border font-label-bold uppercase ${statusMsg.startsWith('ERR') ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
                        {statusMsg}
                    </div>
                )}

                <form onSubmit={handleCreate} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Event Designation</label>
                            <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required placeholder="CodeSrijan 2026" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">System Slug</label>
                            <input value={slug} onChange={e => setSlug(e.target.value)} type="text" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required placeholder="codesrijan-2026" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-ink-black">Event Theme Matrix</label>
                        <input value={theme} onChange={e => setTheme(e.target.value)} type="text" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required placeholder="Neo-Brutalism & AI" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Squad Min Cap</label>
                            <input value={teamSizeMin} onChange={e => setTeamSizeMin(parseInt(e.target.value) || 1)} type="number" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Squad Max Cap</label>
                            <input value={teamSizeMax} onChange={e => setTeamSizeMax(parseInt(e.target.value) || 4)} type="number" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Registration Start</label>
                            <input value={registrationStart} onChange={e => setRegistrationStart(e.target.value)} type="datetime-local" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Registration End</label>
                            <input value={registrationEnd} onChange={e => setRegistrationEnd(e.target.value)} type="datetime-local" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Hackathon Start</label>
                            <input value={startDate} onChange={e => setStartDate(e.target.value)} type="datetime-local" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Hackathon End</label>
                            <input value={endDate} onChange={e => setEndDate(e.target.value)} type="datetime-local" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Submission Deadline</label>
                            <input value={submissionDeadline} onChange={e => setSubmissionDeadline(e.target.value)} type="datetime-local" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Evaluation Deadline</label>
                            <input value={evaluationDeadline} onChange={e => setEvaluationDeadline(e.target.value)} type="datetime-local" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-ink-black">Results Date</label>
                            <input value={resultDate} onChange={e => setResultDate(e.target.value)} type="datetime-local" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-electric-blue text-pure-white py-4 font-headline-md italic uppercase brutal-border brutal-shadow hover:-translate-y-1 transition-transform mt-6">
                        INITIALIZE HACKATHON PROTOCOLS
                    </button>
                    <button type="button" onClick={() => window.history.back()} className="w-full bg-surface-container text-ink-black py-4 font-headline-md italic uppercase brutal-border brutal-shadow hover:-translate-y-1 transition-transform mt-2">
                        ABORT CREATION
                    </button>
                </form>
            </div>
        </div>
    );
}
