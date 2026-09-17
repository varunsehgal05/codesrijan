import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/support")({
    component: SupportPage,
});

function SupportPage() {
    const [supportType, setSupportType] = useState<"online" | "offline">("online");

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
                  

            <main className="flex-grow max-w-[900px] mx-auto w-full px-margin-desktop py-12 flex flex-col gap-8">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>
    
                <header className="border-b-4 border-ink-black pb-8 mb-4 lg:mb-8 text-center flex flex-col items-center">
                    <span className="material-symbols-outlined text-[64px] text-[#FFA500] bg-ink-black p-4 neo-border mb-6 rotate-3">
                        sos
                    </span>
                    <h1 className="font-display-lg uppercase text-ink-black leading-tight">Emergency Support</h1>
                    <p className="font-body-lg text-text-muted mt-2 max-w-lg">
                        Blocked? Infrastructure down? Teammate went AFK? Raise a ticket here and the CodeSrijan coordination team will step in.
                    </p>
                </header>

                <section className="bg-surface neo-border p-6 md:p-10 neo-shadow-lg">
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setSupportType("online")}
                            className={`flex-1 py-3 font-headline-md uppercase neo-border border-2 transition-colors ${supportType === "online" ? "bg-electric-blue text-white border-ink-black neo-shadow" : "bg-white text-ink-black border-ink-black"}`}
                        >
                            Online Support
                        </button>
                        <button
                            onClick={() => setSupportType("offline")}
                            className={`flex-1 py-3 font-headline-md uppercase neo-border border-2 transition-colors ${supportType === "offline" ? "bg-[#FFA500] text-ink-black border-ink-black neo-shadow" : "bg-white text-ink-black border-ink-black"}`}
                        >
                            Offline Coordination
                        </button>
                    </div>

                    <form className="flex flex-col gap-6" onSubmit={e => e.preventDefault()}>
                        {supportType === "offline" && (
                            <div className="bg-[#FFE100] border-2 border-ink-black p-4 flex gap-4 items-start shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                                <span className="material-symbols-outlined text-ink-black">warning</span>
                                <p className="font-label-caps text-sm text-ink-black">
                                    Offline support requests notify volunteers on the show floor. Provide your desk number or location flag.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="font-label-caps uppercase">Team ID</label>
                                <input className="neo-border bg-white p-3 focus:outline-none focus:border-electric-blue font-body-md" placeholder="#CS_TEAM" />
                            </div>
                            {supportType === "offline" && (
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-caps uppercase">Table / Zone Number</label>
                                    <input className="neo-border bg-white p-3 focus:outline-none focus:border-electric-blue font-body-md" placeholder="e.g. Zone B, Table 12" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps uppercase">Priority Level</label>
                            <select className="neo-border bg-white p-3 focus:outline-none focus:border-electric-blue font-body-md appearance-none">
                                <option>Blocker (Cannot progress)</option>
                                <option>Major Issue (Can work around)</option>
                                <option>General Question</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps uppercase">Describe the issue</label>
                            <textarea className="neo-border bg-white p-3 focus:outline-none focus:border-electric-blue font-body-md min-h-[120px]" placeholder="Specify logs, constraints, or networking issues..."></textarea>
                        </div>

                        <button className="bg-ink-black text-white neo-border p-4 font-headline-md uppercase neo-shadow hover:-translate-y-1 transition-transform mt-4 w-full">
                            Dispatch Request
                        </button>
                    </form>
                </section>

            </main>
        </div>
    );
}
