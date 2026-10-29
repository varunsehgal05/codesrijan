import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/hackathons/")({
    component: HackathonsHubPage,
});

function HackathonsHubPage() {
    const { registrations, currentUser } = useAppStore();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

    useEffect(() => {
        axios.get(`${API_URL}/hackathons`)
            .then(res => {
                const rawEvents = Array.isArray(res.data) ? res.data : [];
                const sorted = rawEvents.sort((a: any, b: any) => {
                    const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
                    const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
                    if (timeA && timeB) return timeA - timeB;
                    if (timeA) return -1;
                    if (timeB) return 1;
                    return (a.name || a.title || '').localeCompare(b.name || b.title || '');
                });
                setEvents(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load hackathons timeline", err);
                setLoading(false);
            });
    }, [API_URL]);

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col font-mono">
            <main className="flex-grow max-w-[1100px] mx-auto px-gutter py-section-gap w-full">
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
                    <h1 className="font-display-lg text-4xl md:text-5xl uppercase tracking-tight mt-2 font-black">HACKATHONS HUB</h1>
                    <p className="font-body-md mt-2 text-pure-white/90">Explore all active competitive hacks, build operational prototypes, and claim victory.</p>
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
                        {events.map((evt, idx) => {
                            const rawStatus = (evt.status || 'active').toLowerCase();
                            const isPaid = evt.entryType === 'paid';
                            const hasValidDates = evt.startDate && !isNaN(new Date(evt.startDate).getTime());
                            const isJoined = (registrations || []).some((r: any) => r.hackathonId === evt.id || (currentUser?.teamId && r.teamId === currentUser?.teamId && r.hackathonId === evt.id));

                            return (
                                <div key={evt.id || idx} className={`bg-pure-white brutal-border brutal-shadow p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform relative ${
                                    isJoined ? 'border-4 border-electric-blue shadow-[6px_6px_0px_0px_#0055FF]' : ''
                                }`}>
                                    <div>
                                        <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <span className={`px-2.5 py-1 font-code-snippet text-[11px] uppercase font-bold brutal-border ${
                                                    rawStatus === 'registration_open' ? 'bg-electric-blue text-pure-white' :
                                                    rawStatus === 'active' || rawStatus === 'submission_open' ? 'bg-[#FFD700] text-stark-black' :
                                                    rawStatus === 'completed' ? 'bg-stark-black text-pure-white' :
                                                    'bg-surface-container-high text-stark-black'
                                                }`}>
                                                    {rawStatus.replace('_', ' ')}
                                                </span>
                                                <span className={`px-2 py-0.5 font-bold uppercase text-[10px] brutal-border ${
                                                    isPaid ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'
                                                }`}>
                                                    {isPaid ? `₹${evt.fee || 0} / ${evt.feeBasis === 'per_participant' ? 'MEMBER' : 'SQUAD'}` : 'FREE ENTRY'}
                                                </span>
                                                {isJoined && (
                                                    <span className="px-2 py-0.5 bg-emerald-500 text-black font-black uppercase text-[10px] brutal-border flex items-center gap-1 animate-pulse">
                                                        <span className="material-symbols-outlined text-[12px]">verified</span>
                                                        YOU HAVE JOINED
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-code-snippet text-xs font-bold text-electric-blue">
                                                {hasValidDates ? new Date(evt.startDate).toLocaleDateString() : 'OPEN SCHEDULE'}
                                            </span>
                                        </div>

                                        <h3 className="font-display-lg text-2xl uppercase text-stark-black mb-1 font-black">
                                            {evt.name || evt.title || evt.id}
                                        </h3>
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[11px] font-bold uppercase tracking-wider bg-stark-black text-white px-2 py-0.5">
                                                {evt.mode ? evt.mode.toUpperCase() : 'ONLINE ARENA'}
                                            </span>
                                            {evt.venue && evt.mode !== 'online' && (
                                                <span className="text-[11px] text-zinc-600 font-bold truncate">
                                                    📍 {evt.venue}
                                                </span>
                                            )}
                                        </div>

                                        <p className="font-body-md text-on-surface-variant text-sm line-clamp-3 mb-4">
                                            {evt.description || evt.theme || 'Competitive hackathon arena. Form or join a squad to prototype solutions and deploy artifacts.'}
                                        </p>

                                        {/* Amenities Badges */}
                                        {evt.amenities && evt.amenities.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4 pt-2 border-t border-zinc-200">
                                                {evt.amenities.slice(0, 4).map((a: string) => (
                                                    <span key={a} className="text-[10px] uppercase font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 border border-zinc-300">
                                                        ✓ {a.replace('_', ' ')}
                                                    </span>
                                                ))}
                                                {evt.amenities.length > 4 && (
                                                    <span className="text-[10px] uppercase font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 border border-zinc-300">
                                                        +{evt.amenities.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t-2 border-stark-black flex justify-between items-center">
                                        <span className="font-code-snippet text-[11px] font-bold uppercase text-zinc-600">
                                            {evt.problemStatementsRevealed ? '🟢 Directives Live' : '🔒 Directives Classified'}
                                        </span>
                                        {currentUser?.role === 'admin' ? (
                                            <Link 
                                                to="/admin/hackathons"
                                                className="px-4 py-2 font-label-bold text-xs uppercase brutal-border bg-cyan-400 text-black hover:bg-white transition-colors shadow-[2px_2px_0px_0px_#000000]"
                                            >
                                                MANAGE HACKATHON →
                                            </Link>
                                        ) : (
                                            <Link 
                                                to="/hackathons/$id/register" 
                                                params={{ id: evt.id }} 
                                                className={`px-4 py-2 font-label-bold text-xs uppercase brutal-border transition-colors ${
                                                    isJoined 
                                                        ? 'bg-electric-blue text-white hover:bg-stark-black shadow-[2px_2px_0px_0px_#000000]' 
                                                        : 'bg-stark-black text-pure-white hover:bg-electric-blue'
                                                }`}
                                            >
                                                {isJoined ? 'MANAGE ENROLLMENT →' : 'ENTER ARENA'}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
