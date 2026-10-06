import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/hackathons")({
    component: HackathonsHubPage,
});

function HackathonsHubPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');

    useEffect(() => {
        axios.get(`${API_URL}/hackathons`)
            .then(res => {
                const sorted = res.data.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                setEvents(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load hackathons timeline", err);
                setLoading(false);
            });
    }, [API_URL]);

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-[1000px] mx-auto px-gutter py-section-gap w-full">
                <div className="mb-6 flex justify-between items-center">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-fit cursor-pointer">
                        <span className="material-symbols-outlined">arrow_back</span>GO BACK
                    </button>
                    <Link to="/timeline" className="font-label-bold text-electric-blue border-2 border-stark-black px-4 py-2 bg-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
                        VIEW TIMELINE
                    </Link>
                </div>

                <div className="bg-electric-blue text-pure-white p-8 brutal-border brutal-shadow mb-10">
                    <span className="font-code-snippet text-xs font-bold uppercase tracking-widest bg-stark-black text-pure-white px-2 py-1">CodeSrijan 2026</span>
                    <h1 className="font-display-lg text-4xl md:text-5xl uppercase tracking-tight mt-2">HACKATHONS HUB</h1>
                    <p className="font-body-md mt-2 text-pure-white/90">Explore upcoming competitive hacks, build operational prototypes, and claim victory.</p>
                </div>

                {loading ? (
                    <div className="text-center font-mono opacity-50 py-20">[LOADING HACKATHON ARENAS...]</div>
                ) : events.length === 0 ? (
                    <div className="text-center bg-surface-container border-2 border-stark-black p-12 brutal-shadow">
                        <span className="material-symbols-outlined text-5xl mb-4 text-electric-blue">trophy</span>
                        <h2 className="font-headline-md text-ink-black uppercase text-2xl">No Active Arenas Found</h2>
                        <p className="font-code-snippet text-zinc-600 mt-2">Check back soon for new hackathon operations.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {events.map((evt, idx) => (
                            <div key={idx} className="bg-pure-white brutal-border brutal-shadow p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-surface-container-high px-3 py-1 font-code-snippet text-xs uppercase font-bold brutal-border">
                                            {evt.status || 'Active'}
                                        </span>
                                        <span className="font-code-snippet text-xs font-bold text-electric-blue">
                                            {evt.startDate ? new Date(evt.startDate).toLocaleDateString() : 'TBA'}
                                        </span>
                                    </div>
                                    <h3 className="font-display-lg text-2xl uppercase text-stark-black mb-2">{evt.name || evt.title}</h3>
                                    <p className="font-body-md text-on-surface-variant text-sm line-clamp-3 mb-6">{evt.description}</p>
                                </div>
                                <div className="pt-4 border-t-2 border-stark-black flex justify-between items-center">
                                    <span className="font-code-snippet text-xs font-bold uppercase">{evt.location || 'Online Arena'}</span>
                                    <Link to={`/hackathons/${evt.id}/register`} className="bg-stark-black text-pure-white px-4 py-2 font-label-bold text-xs uppercase brutal-border hover:bg-electric-blue transition-colors">
                                        ENTER ARENA
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
