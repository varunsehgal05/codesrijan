import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/evaluations")({
    component: AdminEvaluations,
});

function AdminEvaluations() {
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvals = async () => {
        const token = localStorage.getItem("codesrijan_auth_token");
        try {
            const res = await axios.get(`${API_BASE}/evaluations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvaluations(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Could not fetch evaluations", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvals();
    }, []);

    const [selectedEval, setSelectedEval] = useState<any | null>(null);

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20 relative">
            <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
                        JUDGE MATRIX
                    </h2>
                    <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        Processed Evaluations & Scores
                    </p>
                </div>
                <div className="bg-stark-black text-pure-white px-6 py-2 font-code-snippet font-bold tracking-widest brutal-border uppercase">
                    Total Logs: {evaluations.length}
                </div>
            </div>

            {loading ? (
                <div className="bg-surface-container p-16 brutal-border text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-code-snippet uppercase tracking-widest animate-pulse">Syncing evaluation payloads...</p>
                </div>
            ) : evaluations.length === 0 ? (
                <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant">fact_check</span>
                    <h3 className="font-display-lg uppercase text-2xl text-stark-black">NO EVALUATIONS RECORDED</h3>
                    <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">Awaiting judges to process payloads.</p>
                </div>
            ) : (
                <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-stark-black text-pure-white">
                                <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Evaluation ID</th>
                                <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Target Team</th>
                                <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Origin Judge</th>
                                <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Total Score</th>
                                <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evaluations.map((ev, i) => (
                                <tr key={ev.id || i} className="border-b-2 border-stark-black hover:bg-surface-container transition-colors">
                                    <td className="p-4 border-r-2 border-stark-black">
                                        <div className="font-code-snippet text-xs font-bold uppercase">{ev.id}</div>
                                        <div className="font-code-snippet text-[10px] text-on-surface-variant uppercase mt-1">{new Date(ev.createdAt).toLocaleString()}</div>
                                    </td>
                                    <td className="p-4 border-r-2 border-stark-black font-label-bold uppercase text-stark-black">{ev.teamId}</td>
                                    <td className="p-4 border-r-2 border-stark-black font-code-snippet text-xs">{ev.judgeId || 'ADMIN'}</td>
                                    <td className="p-4 border-r-2 border-stark-black">
                                        <div className="bg-stark-black text-pure-white font-display-sm text-center px-4 py-2 text-xl inline-block brutal-border w-24">
                                            {ev.totalScore}<span className="text-sm opacity-50">/50</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center flex justify-center">
                                        <button 
                                            onClick={() => setSelectedEval(ev)}
                                            className="bg-electric-blue text-pure-white px-4 py-2 font-label-caps text-xs border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold tracking-widest uppercase cursor-pointer"
                                        >
                                            INSPECT
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Eval Modal */}
            {selectedEval && (
                <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="bg-stark-black text-pure-white p-6 border-b-4 border-stark-black flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-display-lg text-2xl uppercase tracking-widest text-electric-blue">PAYLOAD EVALUATION</h3>
                                <div className="font-code-snippet text-[10px] uppercase opacity-70 mt-1">ID: {selectedEval.id}</div>
                            </div>
                            <button onClick={() => setSelectedEval(null)} className="text-pure-white hover:text-error transition-colors">
                                <span className="material-symbols-outlined text-[32px]">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-6">
                            
                            <div className="flex gap-4">
                                <div className="flex-1 bg-surface-bright border-2 border-stark-black p-4">
                                    <div className="font-label-bold uppercase text-[10px] text-on-surface-variant mb-1">Target Team</div>
                                    <div className="font-code-snippet font-bold uppercase">{selectedEval.teamId}</div>
                                </div>
                                <div className="flex-1 bg-surface-bright border-2 border-stark-black p-4">
                                    <div className="font-label-bold uppercase text-[10px] text-on-surface-variant mb-1">Originating Judge</div>
                                    <div className="font-code-snippet font-bold uppercase">{selectedEval.judgeId || 'ADMIN'}</div>
                                </div>
                            </div>

                            <div className="border-t-2 border-stark-black"></div>

                            <h4 className="font-headline-md uppercase text-stark-black mb-2">SCORING BREAKDOWN</h4>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {(selectedEval.scores || []).map((sc: any, idx: number) => (
                                    <div key={idx} className="bg-surface-container-lowest border-2 border-stark-black p-4 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <div className="font-label-bold uppercase text-lg text-stark-black">{sc.criteriaId}</div>
                                            <div className="font-display-sm text-2xl text-electric-blue font-bold">{sc.score}<span className="text-sm text-on-surface-variant">/10</span></div>
                                        </div>
                                        {sc.comment && (
                                            <div className="bg-pure-white border border-stark-black p-3 font-code-snippet text-xs text-stark-black mt-2 relative">
                                                <div className="absolute -top-2 left-2 bg-pure-white px-1 font-label-bold text-[8px] uppercase text-on-surface-variant">Feedback</div>
                                                "{sc.comment}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 bg-electric-blue text-pure-white p-6 border-4 border-stark-black flex justify-between items-center">
                                <div className="font-headline-lg uppercase">TOTAL SCORE</div>
                                <div className="font-display-lg text-5xl">
                                    {selectedEval.totalScore} <span className="text-xl opacity-70">/ 50</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
