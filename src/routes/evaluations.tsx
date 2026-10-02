import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/evaluations")({
    component: EvaluationsPage,
});

function EvaluationsPage() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAppStore();

    useEffect(() => {
        const token = localStorage.getItem("codesrijan_auth_token");
        axios.get(`${API_BASE}/submissions`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            // Only show locked submissions for grading
            setSubmissions(res.data.filter((s: any) => s.status === 'locked'));
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const [selectedSub, setSelectedSub] = useState<string | null>(null);
    const [scores, setScores] = useState({
        innovation: { score: 0, max: 10, comment: '' },
        technical: { score: 0, max: 10, comment: '' },
        design: { score: 0, max: 10, comment: '' },
        impact: { score: 0, max: 10, comment: '' },
        presentation: { score: 0, max: 10, comment: '' }
    });

    const activeSub = submissions.find(s => s.id === selectedSub);

    const handleScoreChange = (criteria: keyof typeof scores, field: 'score' | 'comment', val: string | number) => {
        setScores(prev => ({
            ...prev,
            [criteria]: {
                ...prev[criteria],
                [field]: field === 'score' ? Math.max(0, Math.min(prev[criteria].max, Number(val))) : val
            }
        }));
    };

    const submitEvaluation = async () => {
        if (!selectedSub) return;
        if (!window.confirm("Lock in this evaluation? Scores cannot be modified by the judge after submission.")) return;

        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const totalScore = scores.innovation.score + scores.technical.score + scores.design.score + scores.impact.score + scores.presentation.score;
            
            const payload = {
                hackathonId: activeSub.hackathonId,
                teamId: activeSub.teamId,
                totalScore,
                scores: [
                    { criteriaId: 'innovation', score: scores.innovation.score, comment: scores.innovation.comment },
                    { criteriaId: 'technical', score: scores.technical.score, comment: scores.technical.comment },
                    { criteriaId: 'design', score: scores.design.score, comment: scores.design.comment },
                    { criteriaId: 'impact', score: scores.impact.score, comment: scores.impact.comment },
                    { criteriaId: 'presentation', score: scores.presentation.score, comment: scores.presentation.comment }
                ],
                status: 'submitted'
            };

            await axios.post(`${API_BASE}/evaluations/${activeSub.teamId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Evaluation submitted for ${activeSub?.projectTitle}!\nTotal Score: ${totalScore}/50`);
            setSelectedSub(null);
            setScores({
                innovation: { score: 0, max: 10, comment: '' },
                technical: { score: 0, max: 10, comment: '' },
                design: { score: 0, max: 10, comment: '' },
                impact: { score: 0, max: 10, comment: '' },
                presentation: { score: 0, max: 10, comment: '' }
            });

            // Remove from queue visually
            setSubmissions(prev => prev.filter(s => s.id !== activeSub.id));
        } catch (err: any) {
            alert(err.response?.data?.message || "Error transmitting evaluation matrix.");
        }
    };

    if (currentUser?.role !== 'judge' && currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-pure-white flex flex-col items-center justify-center p-4">
                <div className="bg-pure-white p-8 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-lg">
                    <span className="material-symbols-outlined text-6xl text-error mb-4">gavel</span>
                    <h2 className="font-display-lg text-3xl uppercase mb-2">ACCESS RESTRICTED</h2>
                    <p className="font-code-snippet text-on-surface-variant">This terminal requires Judge or Administrator clearance.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-container-lowest text-on-background flex flex-col">
            <main className="flex-grow max-w-[1400px] mx-auto px-4 py-12 space-y-12 w-full">
                <section className="bg-pure-white p-8 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="font-display-lg text-headline-lg uppercase text-stark-black border-l-8 border-electric-blue pl-4 mb-4">EVALUATION MATRIX</h1>
                    <p className="font-code-snippet text-on-surface-variant">Select a finalized payload to commence grading. Authenticated as: <span className="text-electric-blue font-bold uppercase">{currentUser.name} ({currentUser.role})</span>.</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Project Selection Sidebar */}
                    <div className="md:col-span-1 border-4 border-stark-black bg-pure-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[80vh]">
                        <h2 className="font-headline-md uppercase p-6 border-b-4 border-stark-black flex items-center justify-between bg-electric-blue text-pure-white">
                            <span><span className="material-symbols-outlined align-middle mr-2">inbox</span> PENDING REVIEW</span>
                            <span className="font-code-snippet text-xs bg-stark-black px-2 py-1">{submissions.length}</span>
                        </h2>

                        <div className="overflow-y-auto flex-grow p-4 space-y-4">
                            {loading ? (
                                <div className="text-center font-code-snippet animate-pulse p-4 uppercase">Syncing payloads...</div>
                            ) : submissions.length === 0 ? (
                                <div className="bg-surface-container p-6 text-center font-code-snippet text-on-surface-variant uppercase border-2 border-stark-black">Queue Empty</div>
                            ) : (
                                submissions.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setSelectedSub(sub.id)}
                                        className={`w-full text-left p-4 border-2 border-stark-black transition-all ${selectedSub === sub.id ? 'bg-electric-blue text-pure-white translate-x-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-pure-white text-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                                    >
                                        <div className="font-label-bold uppercase text-lg truncate">{sub.projectTitle || "UNNAMED PAYLOAD"}</div>
                                        <div className="font-code-snippet text-xs opacity-80 mt-1 uppercase truncate flex justify-between">
                                            <span>Team: {sub.teamId}</span>
                                            <span>v{sub.version}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Rubric View */}
                    <div className="md:col-span-2 border-4 border-stark-black bg-pure-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[80vh] overflow-y-auto">
                        {!activeSub ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-on-surface-variant p-8 text-center">
                                <span className="material-symbols-outlined text-6xl mb-4 text-stark-black opacity-20">fact_check</span>
                                <h2 className="font-headline-md uppercase text-2xl text-stark-black mb-2">AWAITING SELECTION</h2>
                                <p className="font-code-snippet uppercase tracking-widest text-xs">Select a payload from the queue to initialize the grading interface.</p>
                            </div>
                        ) : (
                            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                                <div>
                                    <div className="flex justify-between items-start flex-wrap gap-4">
                                        <h2 className="font-display-lg text-4xl uppercase text-stark-black">{activeSub.projectTitle}</h2>
                                        <span className="bg-stark-black text-pure-white font-label-caps px-4 py-2 border-2 border-stark-black">TEAM ID: {activeSub.teamId}</span>
                                    </div>
                                    <div className="flex gap-4 mt-6 flex-wrap">
                                        {activeSub.githubUrl && (
                                            <a href={activeSub.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-surface-bright border-2 border-stark-black px-4 py-2 text-stark-black font-label-bold uppercase hover:bg-electric-blue hover:text-pure-white transition-colors">
                                                <span className="material-symbols-outlined">code</span> REPOSITORY
                                            </a>
                                        )}
                                        {activeSub.figmaUrl && (
                                            <a href={activeSub.figmaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-surface-bright border-2 border-stark-black px-4 py-2 text-stark-black font-label-bold uppercase hover:bg-electric-blue hover:text-pure-white transition-colors">
                                                <span className="material-symbols-outlined">design_services</span> PROTOTYPE
                                            </a>
                                        )}
                                        {activeSub.demoVideoUrl && (
                                            <a href={activeSub.demoVideoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-surface-bright border-2 border-stark-black px-4 py-2 text-stark-black font-label-bold uppercase hover:bg-electric-blue hover:text-pure-white transition-colors">
                                                <span className="material-symbols-outlined">play_circle</span> LIVE DEMO
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t-4 border-stark-black w-full"></div>

                                {/* Grading Matrix Input */}
                                <div className="space-y-6">
                                    <h3 className="font-headline-md uppercase bg-stark-black text-pure-white inline-block px-4 py-1">SCORING ALGORITHMS</h3>

                                    {[
                                        { id: 'innovation', label: 'Innovation', desc: 'Is the core concept uniquely engineered?' },
                                        { id: 'technical', label: 'Technical Execution', desc: 'Are the structural algorithms robust and functional?' },
                                        { id: 'design', label: 'UX / Design', desc: 'Is the visual matrix accessible and intuitive?' },
                                        { id: 'impact', label: 'Impact', desc: 'Does the payload solve a scalable, real-world issue?' },
                                        { id: 'presentation', label: 'Presentation', desc: 'Is the pitch well-articulated and convincing?' }
                                    ].map((criteria) => (
                                        <div key={criteria.id} className="flex flex-col gap-4 p-6 border-4 border-stark-black bg-surface-container-lowest">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-stark-black pb-4">
                                                <div className="flex-grow">
                                                    <div className="font-label-bold text-xl uppercase text-stark-black">{criteria.label}</div>
                                                    <div className="font-code-snippet text-xs text-on-surface-variant uppercase mt-1">{criteria.desc}</div>
                                                </div>
                                                <div className="flex items-center gap-2 font-display-lg bg-pure-white border-2 border-stark-black p-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        value={scores[criteria.id as keyof typeof scores].score}
                                                        onChange={(e) => handleScoreChange(criteria.id as keyof typeof scores, 'score', e.target.value)}
                                                        className="w-16 text-center text-3xl bg-transparent focus:outline-none focus:text-electric-blue transition-colors"
                                                    />
                                                    <span className="text-on-surface-variant text-xl">/ 10</span>
                                                </div>
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Optional feedback..." 
                                                value={scores[criteria.id as keyof typeof scores].comment}
                                                onChange={(e) => handleScoreChange(criteria.id as keyof typeof scores, 'comment', e.target.value)}
                                                className="w-full bg-pure-white border-2 border-stark-black p-3 font-code-snippet text-sm focus:outline-none focus:border-electric-blue"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-electric-blue text-pure-white p-6 border-4 border-stark-black flex flex-col md:flex-row justify-between items-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="font-headline-md uppercase tracking-widest">FINAL TRAJECTORY SCORE:</div>
                                    <div className="font-display-lg text-5xl bg-stark-black px-6 py-2 border-2 border-pure-white">
                                        {Object.values(scores).reduce((acc, curr) => acc + curr.score, 0)} <span className="text-2xl text-pure-white/70">/ 50</span>
                                    </div>
                                </div>

                                <button onClick={submitEvaluation} className="w-full bg-stark-black text-pure-white py-6 font-display-lg uppercase tracking-widest text-2xl border-4 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors flex items-center justify-center gap-4">
                                    <span className="material-symbols-outlined text-3xl">fact_check</span> SUBMIT FINAL EVALUATION
                                </button>

                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
