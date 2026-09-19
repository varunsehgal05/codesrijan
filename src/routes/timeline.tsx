import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/timeline")({
    component: TimelinePage,
});

function TimelinePage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    useEffect(() => {
        axios.get(`${API_URL}/timeline`)
            .then(res => {
                // Sort events chronologically
                const sorted = res.data.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                setEvents(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load timeline");
                setLoading(false);
            });
    }, [API_URL]);

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-[800px] mx-auto px-gutter py-section-gap w-full">
                <div className="mb-6"><button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-fit cursor-pointer"><span className="material-symbols-outlined">arrow_back</span>GO BACK</button></div>

                <h1 className="font-display-lg uppercase text-stark-black mb-12 text-center">Event Timeline</h1>

                {loading ? (
                    <div className="text-center font-mono opacity-50 py-20">[SYNCHRONIZING CHRONOLOGY...]</div>
                ) : events.length === 0 ? (
                    <div className="text-center bg-zinc-200 border-2 border-stark-black p-12">
                        <span className="material-symbols-outlined text-4xl mb-4">event_busy</span>
                        <h2 className="font-headline-md text-ink-black uppercase">No Schedule Found</h2>
                        <p className="font-mono text-zinc-500 mt-2">The chronological milestones for this operation are currently unassigned.</p>
                    </div>
                ) : (
                    <div className="relative border-l-4 border-stark-black ml-4 md:ml-0 md:pl-16 space-y-12">
                        {events.map((evt, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute -left-6 md:-left-[76px] top-4 w-8 h-8 bg-electric-blue border-4 border-stark-black rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-on-background rounded-full"></div>
                                </div>

                                <div className="bg-surface border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 pl-8">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-headline-lg text-ink-black uppercase">{evt.title}</h3>
                                        <span className="font-label-caps bg-zinc-200 text-ink-black px-3 py-1 border border-stark-black text-[10px]">
                                            {new Date(evt.startDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="font-body-md text-on-surface-variant mb-4">{evt.description}</p>

                                    {evt.location && (
                                        <div className="flex gap-2 items-center text-sm font-label-bold text-electric-blue bg-electric-blue/10 px-3 py-2 border-l-2 border-electric-blue w-fit">
                                            <span className="material-symbols-outlined text-md">location_on</span>
                                            {evt.location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
