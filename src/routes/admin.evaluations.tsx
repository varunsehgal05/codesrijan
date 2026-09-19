import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";

export const Route = createFileRoute("/admin/evaluations")({
    component: AdminEvaluations,
});

function AdminEvaluations() {
    const [evaluations, setEvaluations] = useState<any[]>([]);

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    useEffect(() => {
        const fetchEvals = async () => {
            const token = localStorage.getItem("codesrijan_auth_token");
            try {
                const res = await axios.get(`${API_URL}/evaluations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEvaluations(res.data);
            } catch (err) {
                console.error("Could not fetch evaluations", err);
            }
        };
        fetchEvals();
    }, [API_URL]);

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
            <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-4 py-2 inline-block transform -skew-x-6 w-fit mb-4">
                JUDGE MATRIX
            </h2>

            <div className="bg-white p-6 border-4 border-ink-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                <h3 className="font-headline-md uppercase underline underline-offset-4">Processed Evaluations</h3>

                {evaluations.length === 0 ? (
                    <div className="p-4 bg-surface-container font-label-mono-bold text-center">
                        NO EVALUATIONS DETECTED IN DATABASE.
                    </div>
                ) : (
                    evaluations.map((ev, index) => (
                        <div key={ev.id || index} className="bg-surface-variant p-4 border-2 border-ink-black mt-4 flex justify-between items-center bg-[#ddf] ">
                            <div>
                                <p className="font-bold">Team ID: <span className="text-electric-blue">{ev.projectId}</span></p>
                                <p className="font-code-snippet text-xs opacity-75">Judge ID: {ev.judgeId || 'Admin'} • Score: {ev.totalScore}/40</p>
                            </div>
                            <button onClick={() => alert(`Submitted Matrix:\n\nConcept: ${ev.scores?.concept || 0}\nExecution: ${ev.scores?.execution || 0}\nDesign: ${ev.scores?.design || 0}\nImpact: ${ev.scores?.impact || 0}`)} className="bg-electric-blue text-white px-3 py-1 font-label-caps border-2 border-ink-black hover:-translate-y-1 transition-transform">
                                REVIEW
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
