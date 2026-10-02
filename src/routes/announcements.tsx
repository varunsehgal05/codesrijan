import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/announcements")({
    component: PublicAnnouncements,
});

function PublicAnnouncements() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE}/announcements`)
            .then(res => {
                setAnnouncements(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load announcements matrix:", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-surface-container-lowest text-on-background pb-20">
            <main className="max-w-[1200px] w-full mx-auto px-4 py-12 space-y-12">

                {/* Global Go Back Navigation */}
                <div className="w-full">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-stark-black hover:text-electric-blue transition-all group w-fit cursor-pointer border-2 border-stark-black px-4 py-2 bg-pure-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase">
                        <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                        GO BACK
                    </button>
                </div>

                <header className="bg-pure-white p-8 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="font-display-lg text-[48px] text-stark-black uppercase tracking-tighter mb-2 flex items-center gap-4">
                        <span className="material-symbols-outlined text-[48px] text-electric-blue">campaign</span>
                        SYSTEM BROADCASTS
                    </h1>
                    <p className="font-code-snippet text-on-surface-variant uppercase tracking-widest text-sm border-l-4 border-electric-blue pl-4">Live synchronization of all official event instructions and network signals.</p>
                </header>

                <div className="flex flex-col gap-8">
                    {loading ? (
                        <div className="bg-pure-white p-16 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center font-code-snippet opacity-50 uppercase tracking-widest animate-pulse">
                            Establishing link to broadcast array...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="bg-pure-white p-16 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">notifications_off</span>
                            <h2 className="font-headline-md text-2xl uppercase text-stark-black">No Transmissions Active</h2>
                            <p className="font-code-snippet text-on-surface-variant uppercase tracking-widest mt-2">The admin nodes have not dispersed any alerts.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {announcements.map((ann) => (
                                <article key={ann.id} className="bg-pure-white border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                                    <div className={`p-4 border-b-4 border-stark-black flex justify-between items-center ${ann.type === 'global' ? 'bg-stark-black text-pure-white' : 'bg-electric-blue text-pure-white'}`}>
                                        <div className="font-label-bold uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">{ann.type === 'global' ? 'public' : 'group'}</span>
                                            {ann.type} {ann.targetId ? `(${ann.targetId})` : ''}
                                        </div>
                                        <div className="font-code-snippet text-[10px] uppercase">
                                            {new Date(ann.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="p-6 flex-grow flex flex-col gap-4">
                                        <h3 className="font-display-sm text-2xl uppercase text-stark-black leading-tight">{ann.title}</h3>
                                        <div className="font-body-md text-stark-black whitespace-pre-wrap leading-relaxed">
                                            {ann.content}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
