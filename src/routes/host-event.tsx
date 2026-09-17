import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/host-event")({
    component: HostEventPage,
});

function HostEventPage() {
    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
                  

            <main className="flex-grow max-w-[1000px] mx-auto w-full px-margin-desktop py-16 flex flex-col md:flex-row gap-12">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>
    

                <div className="w-full md:w-1/2 flex flex-col gap-6">
                    <h1 className="font-display-lg text-[48px] uppercase text-ink-black leading-tight tracking-tighter bg-surface inline-block border-2 border-ink-black p-4 neo-shadow-lg -rotate-2 mb-4">
                        Host <br /><span className="text-electric-blue">CodeSrijan</span><br /> in your<br /> Campus
                    </h1>
                    <p className="font-body-lg text-text-muted">
                        Partner with us to organize localized rounds, community meetups, or host the grand finale. Tap into our hacker network and robust platform infrastructure.
                    </p>

                    <div className="flex flex-col gap-4 mt-8">
                        <div className="flex items-center gap-4 bg-surface-bright p-4 neo-border">
                            <span className="material-symbols-outlined text-electric-blue text-[32px]">campaign</span>
                            <div>
                                <h3 className="font-headline-md uppercase">Massive Reach</h3>
                                <p className="font-body-sm">Access 10,000+ registered hackers.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-surface-bright p-4 neo-border">
                            <span className="material-symbols-outlined text-electric-blue text-[32px]">dashboard_customize</span>
                            <div>
                                <h3 className="font-headline-md uppercase">Event Telemetry</h3>
                                <p className="font-body-sm">Track offline footfall and submissions via admin dashboard.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/2 bg-surface neo-border p-8 neo-shadow h-fit">
                    <h2 className="font-headline-md uppercase border-b-4 border-ink-black pb-2 mb-6">Partnership Application</h2>
                    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps uppercase">Institution Name</label>
                            <input className="neo-border bg-white p-3 font-body-md focus:border-electric-blue focus:outline-none transition-colors" placeholder="e.g. Neo Tech Institute" type="text" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps uppercase">Coordinator Email</label>
                            <input className="neo-border bg-white p-3 font-body-md focus:border-electric-blue focus:outline-none transition-colors" placeholder="hello@institute.edu" type="email" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps uppercase">Event Type</label>
                            <select className="neo-border bg-white p-3 font-body-md focus:border-electric-blue focus:outline-none transition-colors appearance-none cursor-pointer">
                                <option>Offline Hackathon Round</option>
                                <option>Online Workshop Series</option>
                                <option>Pre-Event Meetup</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-caps uppercase">Estimated Capacity</label>
                            <input className="neo-border bg-white p-3 font-body-md focus:border-electric-blue focus:outline-none transition-colors" placeholder="Number of attendees" type="number" />
                        </div>
                        <button className="bg-electric-blue text-white py-4 font-headline-md uppercase neo-border neo-shadow hover:-translate-y-1 transition-transform mt-4">
                            Submit Proposal
                        </button>
                    </form>
                </div>

            </main>
        </div>
    );
}
