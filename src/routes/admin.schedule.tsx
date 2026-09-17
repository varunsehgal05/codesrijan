import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/schedule")({
    component: AdminSchedule,
});

function AdminSchedule() {
    return (
        <div className="flex flex-col gap-6">
            <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-4 py-2 inline-block transform -skew-x-6 w-fit mb-4">
                EVENT TIMELINE
            </h2>

            <div className="bg-white p-6 border-4 border-ink-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                <h3 className="font-headline-md uppercase underline underline-offset-4">Hackathon Schedule</h3>

                <div className="flex flex-col gap-4 mt-4">
                    <div className="border-l-4 border-electric-blue pl-4">
                        <p className="font-bold">Opening Ceremony</p>
                        <p className="font-code-snippet text-xs opacity-75">T-Minus 00:00 (Completed)</p>
                    </div>
                    <div className="border-l-4 border-ink-black pl-4">
                        <p className="font-bold">Round 1: Ideation Submit</p>
                        <p className="font-code-snippet text-xs opacity-75">T-Plus 12:00 (Completed)</p>
                    </div>
                    <div className="border-l-4 border-error pl-4">
                        <p className="font-bold">Round 2: Evaluation</p>
                        <p className="font-code-snippet text-xs opacity-75 text-error font-bold">ACTIVE NOW</p>
                        <button onClick={() => alert("Closing Round 2 Submissions...")} className="bg-destructive text-white px-3 py-1 mt-2 font-label-caps border-2 border-ink-black hover:-translate-y-1 transition-transform">
                            FORCE CLOSE
                        </button>
                    </div>
                    <div className="border-l-4 border-surface-variant pl-4">
                        <p className="font-bold">Closing Ceremony</p>
                        <p className="font-code-snippet text-xs opacity-75">Scheduled for Tomorrow</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
