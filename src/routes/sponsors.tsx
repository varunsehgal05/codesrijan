import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/sponsors")({
    component: SponsorsPage,
    head: () => ({
        meta: [
            { title: "Sponsors & Partners | CodeSrijan" },
        ],
    }),
});

function SponsorsPage() {
    const [sponsors, setSponsors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    useEffect(() => {
        axios.get(`${API_URL}/sponsors`)
            .then(res => {
                setSponsors(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load sponsors");
                setLoading(false);
            });
    }, [API_URL]);

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-[1200px] mx-auto px-gutter py-section-gap w-full">
                <div className="mb-6"><button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-fit cursor-pointer"><span className="material-symbols-outlined">arrow_back</span>GO BACK</button></div>
                <h1 className="font-display-lg uppercase text-stark-black mb-12 text-center">Platform Partners</h1>

                {loading ? (
                    <div className="text-center font-mono opacity-50 py-20">[LOADING PARTNERS DATA...]</div>
                ) : sponsors.length === 0 ? (
                    <div className="text-center bg-zinc-200 border-2 border-stark-black p-12">
                        <span className="material-symbols-outlined text-4xl mb-4">handshake</span>
                        <h2 className="font-headline-md text-ink-black uppercase">No Partners Available</h2>
                        <p className="font-mono text-zinc-500 mt-2">The partner network is currently empty.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {sponsors.map((sponsor, idx) => (
                            <div key={idx} className="bg-surface border-2 border-stark-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center hover:-translate-y-2 transition-transform">
                                <div className="w-24 h-24 bg-surface-bright border-2 border-stark-black rounded-full mb-4 flex items-center justify-center font-headline-xl text-electric-blue overflow-hidden">
                                    {sponsor.logo ? <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-cover" /> : sponsor.name.substring(0, 1).toUpperCase()}
                                </div>
                                <h3 className="font-headline-md text-ink-black">{sponsor.name}</h3>
                                <p className="font-body-md mt-2 text-on-surface-variant">{sponsor.description}</p>
                                {sponsor.website && (
                                    <a href={sponsor.website} target="_blank" rel="noreferrer" className="mt-4 font-label-caps text-electric-blue border-b-2 border-electric-blue pb-1 hover:text-ink-black">VISIT OUTPOST</a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
