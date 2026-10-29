import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";
import { useAppStore } from "../lib/store";
import { toast } from "react-hot-toast";

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
            // Show both submitted and locked submissions for grading
            setSubmissions(res.data.filter((s: any) => s.status === 'locked' || s.status === 'submitted' || !s.status));
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const [selectedSub, setSelectedSub] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
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

            toast(`Evaluation submitted for ${activeSub?.projectTitle}!\nTotal Score: ${totalScore}/50`);
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
            toast.error(err.response?.data?.message || "Error transmitting evaluation matrix.");
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
                                        <div>
                                            <h2 className="font-display-lg text-3xl md:text-4xl uppercase text-stark-black">{activeSub.projectTitle || "Unnamed Project"}</h2>
                                            <div className="font-mono text-xs text-zinc-500 mt-1 uppercase">Squad ID: {activeSub.teamId} • Version {activeSub.version || 1}</div>
                                        </div>
                                        <span className="bg-stark-black text-pure-white font-label-caps px-4 py-2 border-2 border-stark-black text-xs font-bold uppercase">
                                            STATUS: {activeSub.status || 'SUBMITTED'}
                                        </span>
                                    </div>

                                    {/* Project Abstract & Tech Stack */}
                                    {activeSub.description && (
                                        <div className="mt-4 p-4 bg-surface-container-lowest brutal-border">
                                            <span className="font-bold uppercase text-[10px] text-zinc-500 block mb-1">Project Abstract</span>
                                            <p className="font-mono text-xs text-stark-black leading-relaxed whitespace-pre-wrap">{activeSub.description}</p>
                                        </div>
                                    )}

                                    {activeSub.solution && (
                                        <div className="mt-3 p-4 bg-surface-container-lowest brutal-border">
                                            <span className="font-bold uppercase text-[10px] text-zinc-500 block mb-1">Technical Architecture</span>
                                            <p className="font-mono text-xs text-stark-black leading-relaxed whitespace-pre-wrap">{activeSub.solution}</p>
                                        </div>
                                    )}

                                    {Array.isArray(activeSub.technologies) && activeSub.technologies.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1 items-center">
                                            <span className="font-bold uppercase text-[10px] text-zinc-500 mr-1">Stack:</span>
                                            {activeSub.technologies.map((tech: string, idx: number) => (
                                                <span key={idx} className="px-2 py-0.5 bg-stark-black text-pure-white text-[10px] font-bold brutal-border uppercase">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-4 flex-wrap">
                                        {activeSub.githubUrl && (
                                            <a href={activeSub.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-surface-bright border-2 border-stark-black px-3 py-1.5 text-stark-black font-label-bold uppercase text-xs hover:bg-[#00E5FF] hover:text-stark-black transition-colors">
                                                <span className="material-symbols-outlined text-sm">code</span> REPOSITORY
                                            </a>
                                        )}
                                        {activeSub.liveDemoUrl && (
                                            <a href={activeSub.liveDemoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-surface-bright border-2 border-stark-black px-3 py-1.5 text-stark-black font-label-bold uppercase text-xs hover:bg-[#00E5FF] hover:text-stark-black transition-colors">
                                                <span className="material-symbols-outlined text-sm">public</span> LIVE DEMO
                                            </a>
                                        )}
                                        {activeSub.figmaUrl && (
                                            <a href={activeSub.figmaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-surface-bright border-2 border-stark-black px-3 py-1.5 text-stark-black font-label-bold uppercase text-xs hover:bg-[#00E5FF] hover:text-stark-black transition-colors">
                                                <span className="material-symbols-outlined text-sm">design_services</span> PROTOTYPE
                                            </a>
                                        )}
                                        {activeSub.demoVideoUrl && (
                                            <a href={activeSub.demoVideoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-surface-bright border-2 border-stark-black px-3 py-1.5 text-stark-black font-label-bold uppercase text-xs hover:bg-[#00E5FF] hover:text-stark-black transition-colors">
                                                <span className="material-symbols-outlined text-sm">play_circle</span> VIDEO WALKTHROUGH
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t-4 border-stark-black w-full"></div>

                                {/* Grading Matrix Input */}
                                <div className="space-y-6">
                                    <h3 className="font-headline-md uppercase bg-stark-black text-pure-white inline-block px-4 py-1 text-sm font-black">SCORING RUBRIC</h3>

                                    {[
                                        { id: 'innovation', label: 'Innovation', desc: 'Is the core concept uniquely engineered and creative?' },
                                        { id: 'technical', label: 'Technical Execution', desc: 'Are the structural algorithms robust and functional?' },
                                        { id: 'design', label: 'UX / Design', desc: 'Is the visual matrix accessible and intuitive?' },
                                        { id: 'impact', label: 'Impact', desc: 'Does the payload solve a scalable, real-world issue?' },
                                        { id: 'presentation', label: 'Presentation', desc: 'Is the pitch and demonstration convincing?' }
                                    ].map((criteria) => (
                                        <div key={criteria.id} className="flex flex-col gap-4 p-5 border-4 border-stark-black bg-surface-container-lowest">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-stark-black pb-4">
                                                <div className="flex-grow">
                                                    <div className="font-label-bold text-lg uppercase text-stark-black">{criteria.label}</div>
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
                                                placeholder="Optional evaluator feedback..." 
                                                value={scores[criteria.id as keyof typeof scores].comment}
                                                onChange={(e) => handleScoreChange(criteria.id as keyof typeof scores, 'comment', e.target.value)}
                                                className="w-full bg-pure-white border-2 border-stark-black p-3 font-code-snippet text-sm focus:outline-none focus:border-electric-blue"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-[#00E5FF] text-stark-black p-5 border-4 border-stark-black flex flex-col md:flex-row justify-between items-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="font-headline-md uppercase tracking-widest font-black text-sm">TOTAL EVALUATION SCORE:</div>
                                    <div className="font-display-lg text-4xl bg-stark-black text-pure-white px-5 py-2 border-2 border-pure-white">
                                        {Object.values(scores).reduce((acc, curr) => acc + curr.score, 0)} <span className="text-xl text-pure-white/70">/ 50</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setIsConfirmModalOpen(true)} 
                                    className="w-full bg-stark-black text-pure-white py-5 font-display-lg uppercase tracking-widest text-xl border-4 border-stark-black hover:bg-[#00E5FF] hover:text-stark-black transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <span className="material-symbols-outlined text-2xl">fact_check</span> SUBMIT FINAL EVALUATION
                                </button>

                                {/* Confirmation Modal */}
                                {isConfirmModalOpen && (
                                    <div 
                                        onClick={(e) => { if (e.target === e.currentTarget) setIsConfirmModalOpen(false); }}
                                        className="fixed inset-0 bg-stark-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
                                    >
                                        <div className="bg-pure-white brutal-border p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md flex flex-col gap-4 font-mono text-xs">
                                            <div className="flex justify-between items-center border-b-2 border-stark-black pb-2">
                                                <h3 className="font-display-lg uppercase text-lg text-stark-black font-black">CONFIRM EVALUATION</h3>
                                                <button onClick={() => setIsConfirmModalOpen(false)} className="font-bold text-lg hover:text-error cursor-pointer">✕</button>
                                            </div>
                                            <p className="text-zinc-700 leading-relaxed uppercase">
                                                Are you sure you want to lock in your score of <span className="font-bold text-stark-black bg-[#00E5FF] px-1">{Object.values(scores).reduce((acc, curr) => acc + curr.score, 0)} / 50</span> for squad "{activeSub.teamId}"?
                                            </p>
                                            <div className="flex justify-end gap-3 pt-3 border-t-2 border-stark-black">
                                                <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 border-2 border-stark-black uppercase font-bold hover:bg-zinc-200 cursor-pointer">
                                                    Cancel
                                                </button>
                                                <button onClick={() => { setIsConfirmModalOpen(false); submitEvaluation(); }} className="px-5 py-2 bg-success text-stark-black border-2 border-stark-black font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer">
                                                    Confirm & Transmit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
