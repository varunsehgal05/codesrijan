import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";

export const Route = createFileRoute("/announcements")({
    component: PublicAnnouncements,
});

function PublicAnnouncements() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';
    const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

    useEffect(() => {
        axios.get(`${BASE}/announcements`)
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
        <div className="min-h-screen bg-background text-on-background">
            <main className="max-w-[1200px] w-full mx-auto px-margin-desktop py-16 flex flex-col gap-12">

                {/* Global Go Back Navigation */}
                <div className="w-full mb-6">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
                        <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                        GO BACK
                    </button>
                </div>

                <header className="flex flex-col gap-4 border-b-4 border-ink-black pb-8">
                    <h1 className="font-headline-lg text-[48px] text-ink-black uppercase tracking-tighter mb-2 flex items-center gap-4">
                        <span className="material-symbols-outlined text-[48px] text-electric-blue">campaign</span>
                        System Broadcasts
                    </h1>
                    <p className="font-body-lg text-text-muted">Live synchronization of all official event instructions and network signals.</p>
                </header>

                <div className="flex flex-col gap-6">
                    {loading ? (
                        <div className="bg-surface p-12 brutal-border text-center font-mono opacity-50 uppercase tracking-widest">
                            Establishing link to broadcast array...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="bg-surface p-12 brutal-border brutal-shadow text-center">
                            <h2 className="font-headline-md uppercase text-ink-black">No Transmissions Active</h2>
                            <p className="font-mono text-zinc-500 mt-2">The admin nodes have not dispersed any alerts.</p>
                        </div>
                    ) : (
                        announcements.map((ann) => (
                            <article key={ann.id} className="bg-surface brutal-border brutal-shadow p-6 group hover:-translate-y-1 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-headline-md uppercase text-2xl group-hover:text-electric-blue transition-colors">{ann.title}</h3>
                                    <span className="font-code-snippet text-xs bg-stark-black text-pure-white px-2 py-1 text-center border-2 border-transparent">
                                        {new Date(ann.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="font-code-snippet text-xs uppercase bg-surface-container-high px-2 py-1 w-fit mb-4 brutal-border flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">tag</span>
                                    {ann.type || 'Notice'}
                                </div>
                                <p className="font-body-md whitespace-pre-wrap">{ann.content}</p>
                            </article>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
