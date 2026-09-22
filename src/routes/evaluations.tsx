import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";

export const Route = createFileRoute("/evaluations")({
    component: EvaluationsPage,
});

function EvaluationsPage() {
    const [teams, setTeams] = useState<any[]>([]);

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    useEffect(() => {
        const token = localStorage.getItem("codesrijan_auth_token");
        axios.get(`${API_URL}/submissions`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            setTeams(res.data);
        }).catch(err => {
            console.error(err);
        });
    }, [API_URL]);

    // Submissions endpoint already filters for `isSubmitted === true`
    const submittedTeams = teams;

    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [scores, setScores] = useState({
        concept: 0,
        execution: 0,
        design: 0,
        impact: 0
    });

    const activeTeam = submittedTeams.find(t => t.id === selectedTeam);

    const handleScoreChange = (criteria: keyof typeof scores, val: number) => {
        setScores(prev => ({ ...prev, [criteria]: Math.max(0, Math.min(10, val)) }));
    };

    const submitEvaluation = async () => {
        if (!selectedTeam) return;

        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const totalScore = scores.concept + scores.execution + scores.design + scores.impact;
            await axios.post(`${API_URL}/evaluations/${activeTeam.id}`, {
                hackathonId: 'hack-1', // Default active hackathon
                teamId: activeTeam.id,
                scores: { ...scores },
                totalScore: totalScore,
                comments: "Automated Evaluation Terminal Submission",
                strengths: "N/A",
                improvements: "N/A"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Evaluation submitted for ${activeTeam?.name}!\nTotal Score: ${totalScore}/40`);
            setSelectedTeam(null);
            setScores({ concept: 0, execution: 0, design: 0, impact: 0 });

            // Remove from local array temporarily to reflect submission visually
            setTeams(prev => prev.filter(t => t.id !== activeTeam.id));
        } catch (err: any) {
            alert(err.response?.data?.message || "Error transmitting evaluation matrix.");
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-12 w-full">
                <div className="w-full">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
                        <span className="material-symbols-outlined group-hover:-translate-x-1">arrow_back</span> GO BACK
                    </button>
                </div>

                <section>
                    <h1 className="font-display-lg text-headline-lg uppercase text-ink-black border-l-8 border-electric-blue pl-4 mb-4">Evaluation Matrix</h1>
                    <p className="font-body-lg text-surface-variant max-w-3xl">Select a submitted project to begin grading. All evaluations are final upon submission and immediately reflect on the global leaderboard.</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Project Selection Sidebar */}
                    <div className="md:col-span-1 border-2 border-ink-black bg-surface-bright brutal-shadow p-6">
                        <h2 className="font-headline-md uppercase mb-6 flex items-center gap-2"><span className="material-symbols-outlined">inbox</span> Pending Review</h2>

                        {submittedTeams.length === 0 ? (
                            <div className="bg-surface-container p-4 text-center font-label-md text-surface-variant">No projects submitted yet.</div>
                        ) : (
                            <div className="space-y-4">
                                {submittedTeams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedTeam(team.id)}
                                        className={`w-full text-left p-4 brutal-border transition-all ${selectedTeam === team.id ? 'bg-electric-blue text-on-primary ml-2 brutal-shadow' : 'bg-white text-ink-black hover:-translate-y-1 brutal-hover'}`}
                                    >
                                        <div className="font-label-bold uppercase text-lg truncate">{team.name}</div>
                                        <div className="font-body-sm opacity-80 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-sm">link</span> {team.repositoryUrl || "No repo link"}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rubric View */}
                    <div className="md:col-span-2 border-2 border-ink-black bg-white brutal-shadow p-6 md:p-10 relative">
                        {!activeTeam ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-surface-variant">
                                <span className="material-symbols-outlined text-6xl mb-4"> Grading</span>
                                <p className="font-headline-md">Select a project to evaluate</p>
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-8">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h2 className="font-display-lg text-3xl uppercase text-ink-black">{activeTeam.name}</h2>
                                        <span className="bg-surface-container font-label-caps px-3 py-1 border-2 border-ink-black">Team ID: {activeTeam.id}</span>
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        {activeTeam.repositoryUrl && (
                                            <a href={activeTeam.repositoryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-electric-blue font-label-bold hover:underline">
                                                <span className="material-symbols-outlined">code</span> View Repository
                                            </a>
                                        )}
                                        {activeTeam.demoUrl && (
                                            <a href={activeTeam.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-electric-blue font-label-bold hover:underline">
                                                <span className="material-symbols-outlined">play_circle</span> View Demo
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-t-2 border-surface-container" />

                                {/* Grading Matrix Input */}
                                <div className="space-y-6">
                                    <h3 className="font-headline-md uppercase">Official Scoring Rubric</h3>

                                    {[
                                        { id: 'concept', label: 'Concept & Innovation', desc: 'Is the idea unique? Does it solve a real problem?' },
                                        { id: 'execution', label: 'Technical Execution', desc: 'Is the code robust? Does the application actually work?' },
                                        { id: 'design', label: 'UI / UX Design', desc: 'Is it intuitive, accessible, and aesthetically pleasing?' },
                                        { id: 'impact', label: 'Business Impact', desc: 'Is it scalable and viable for the real world?' }
                                    ].map((criteria) => (
                                        <div key={criteria.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-2 border-surface-variant bg-surface-container-lowest">
                                            <div className="flex-grow">
                                                <div className="font-label-bold text-lg uppercase">{criteria.label}</div>
                                                <div className="font-body-sm text-surface-variant">{criteria.desc}</div>
                                            </div>
                                            <div className="flex items-center gap-2 font-display-lg">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={scores[criteria.id as keyof typeof scores]}
                                                    onChange={(e) => handleScoreChange(criteria.id as keyof typeof scores, parseInt(e.target.value) || 0)}
                                                    className="w-20 text-center text-2xl p-2 brutal-border focus:outline-none focus:ring-4 focus:ring-electric-blue"
                                                />
                                                <span className="text-surface-variant text-xl">/ 10</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-ink-black text-on-primary p-6 brutal-border flex justify-between items-center">
                                    <div className="font-headline-md uppercase">Total Aggregated Score:</div>
                                    <div className="font-display-lg text-4xl text-electric-blue">
                                        {scores.concept + scores.execution + scores.design + scores.impact} <span className="text-xl text-surface-variant">/ 40</span>
                                    </div>
                                </div>

                                <button onClick={submitEvaluation} className="w-full bg-electric-blue text-on-primary py-4 font-label-bold uppercase tracking-widest text-lg brutal-border brutal-shadow brutal-hover brutal-active mt-8 flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">publish</span> Lock Final Evaluation
                                </button>

                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
