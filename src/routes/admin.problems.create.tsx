import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/problems/create")({
    component: AdminCreateProblem,
});

function AdminCreateProblem() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hackathons, setHackathons] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        hackathonId: "",
        description: "",
        fullDescription: "",
        domain: "",
        difficulty: "easy",
        attachmentUrl: ""
    });

    useEffect(() => {
        const token = localStorage.getItem("codesrijan_auth_token");
        axios.get(`${API_BASE}/hackathons`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setHackathons(r.data))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_BASE}/admin/problems`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate({ to: '/admin/problems' });
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to create problem statement.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 p-4 md:p-8 font-mono text-xs">
            <div className="bg-[#00E5FF] p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                <h1 className="font-display-lg text-2xl md:text-3xl uppercase text-stark-black flex items-center gap-3 font-black">
                    <span className="material-symbols-outlined text-3xl font-black">add_task</span>
                    Create Problem Statement
                </h1>
            </div>

            {error && (
                <div className="bg-error text-pure-white p-4 brutal-border flex items-center gap-3">
                    <span className="material-symbols-outlined">warning</span>
                    <span className="font-mono text-xs tracking-widest uppercase">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="font-bold uppercase text-xs block">Target Hackathon *</label>
                        <select required className="w-full bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs uppercase" value={formData.hackathonId} onChange={e => setFormData({ ...formData, hackathonId: e.target.value })}>
                            <option value="">Select Associated Hackathon</option>
                            {hackathons.map(h => (
                                <option key={h.id} value={h.id}>{h.name} ({h.id})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="font-bold uppercase text-xs block">Difficulty Level</label>
                        <select className="w-full bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs uppercase" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                            <option value="easy">Easy / Beginner</option>
                            <option value="medium">Medium / Intermediate</option>
                            <option value="hard">Hard / Expert</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="font-bold uppercase text-xs block">Problem Title *</label>
                    <input type="text" required placeholder="Project Vanguard: Secure Identity Network" className="w-full bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="font-bold uppercase text-xs block">URL Slug *</label>
                        <input type="text" required placeholder="project-vanguard-identity" className="w-full bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none lowercase" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="font-bold uppercase text-xs block">Domain Track *</label>
                        <input type="text" required placeholder="Web3 & Blockchain" className="w-full bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="font-bold uppercase text-xs block">Short Summary *</label>
                    <textarea required rows={2} placeholder="A concise 2-sentence overview shown to participants." className="w-full bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                    <label className="font-bold uppercase text-xs block">Full Technical Specifications & Constraints</label>
                    <textarea required rows={5} placeholder="Full architecture guidelines, deliverables, expected modules..." className="w-full bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none" value={formData.fullDescription} onChange={e => setFormData({ ...formData, fullDescription: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                    <label className="font-bold uppercase text-xs block">PDF Attachment / Spec URL (Optional)</label>
                    <input type="url" placeholder="https://storage.googleapis.com/.../spec.pdf" className="w-full bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none" value={formData.attachmentUrl} onChange={e => setFormData({ ...formData, attachmentUrl: e.target.value })} />
                </div>

                <div className="flex gap-3 pt-3 border-t-2 border-stark-black">
                    <button type="button" onClick={() => navigate({ to: '/admin/problems' })} className="bg-pure-white text-stark-black font-bold uppercase px-6 py-2.5 border-2 border-stark-black hover:bg-zinc-200 cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="bg-stark-black text-pure-white font-bold uppercase px-6 py-2.5 brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#00E5FF] hover:text-stark-black transition-all cursor-pointer disabled:opacity-50">
                        {loading ? 'Creating...' : 'Save & Publish Statement'}
                    </button>
                </div>
            </form>
        </div>
    );
}
