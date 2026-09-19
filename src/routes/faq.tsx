import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/faq")({
    component: FAQPage,
});

function FAQPage() {
    const [faqs, setFaqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    useEffect(() => {
        axios.get(`${API_URL}/faqs`)
            .then(res => {
                setFaqs(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load FAQs");
                setLoading(false);
            });
    }, [API_URL]);

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-[800px] mx-auto px-gutter py-section-gap w-full">
                <div className="mb-6"><button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-fit cursor-pointer"><span className="material-symbols-outlined">arrow_back</span>GO BACK</button></div>

                <h1 className="font-display-lg uppercase text-stark-black mb-12 text-center">Frequently Asked Questions</h1>

                {loading ? (
                    <div className="text-center font-mono opacity-50 py-20">[LOADING INTELLIGENCE NODE...]</div>
                ) : faqs.length === 0 ? (
                    <div className="text-center bg-zinc-200 border-2 border-stark-black p-12">
                        <span className="material-symbols-outlined text-4xl mb-4">help_center</span>
                        <h2 className="font-headline-md text-ink-black uppercase">No Intelligence Available</h2>
                        <p className="font-mono text-zinc-500 mt-2">The FAQ database has not been populated by the administrators yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-surface border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <button
                                    className="w-full text-left px-6 py-4 flex justify-between items-center font-headline-sm hover:bg-zinc-200 transition-colors"
                                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                >
                                    {faq.question}
                                    <span className={`material-symbols-outlined transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>
                                {openIndex === idx && (
                                    <div className="px-6 py-4 border-t-2 border-stark-black bg-white">
                                        <p className="font-body-md text-on-surface-variant whitespace-pre-wrap">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
