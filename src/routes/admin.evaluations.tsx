import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/evaluations")({
    component: AdminEvaluations,
});

function AdminEvaluations() {
    return (
        <div className="flex flex-col gap-6">
            <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-4 py-2 inline-block transform -skew-x-6 w-fit mb-4">
                JUDGE MATRIX
            </h2>

            <div className="bg-white p-6 border-4 border-ink-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                <h3 className="font-headline-md uppercase underline underline-offset-4">Pending Evaluations</h3>

                <div className="bg-surface-variant p-4 border-2 border-ink-black mt-4 flex justify-between items-center bg-[#ddf] ">
                    <div>
                        <p className="font-bold">Team: Quantum Devs</p>
                        <p className="font-code-snippet text-xs opacity-75">Needs grading on: Code Quality, Innovation</p>
                    </div>
                    <button onClick={() => alert("Opening Judge Evaluation Modal...")} className="bg-electric-blue text-white px-3 py-1 font-label-caps border-2 border-ink-black hover:-translate-y-1 transition-transform">
                        EVALUATE
                    </button>
                </div>
            </div>
        </div>
    );
}
