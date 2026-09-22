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
        difficulty: "easy"
    });

    useEffect(() => {
        const token = localStorage.getItem("codesrijan_auth_token");
        // Load hackathons to associate
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
            setError(e.response?.data?.message || "Failed to instantiate problem statement node.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
            <div className="bg-electric-blue p-6 brutal-border brutal-shadow flex items-center justify-between">
                <h1 className="font-display-lg text-3xl uppercase text-pure-white flex items-center gap-4">
                    <span className="material-symbols-outlined text-4xl">add_box</span>
                    New Problem Matrix
                </h1>
            </div>

            {error && (
                <div className="bg-error text-pure-white p-4 brutal-border flex items-center gap-3">
                    <span className="material-symbols-outlined">warning</span>
                    <span className="font-mono text-sm tracking-widest uppercase">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-8 brutal-border brutal-shadow space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="font-label-bold uppercase text-ink-black text-sm block">Parent Hackathon (Optional)</label>
                        <select className="w-full bg-surface-container border-2 border-ink-black p-3 font-mono text-sm" value={formData.hackathonId} onChange={e => setFormData({ ...formData, hackathonId: e.target.value })}>
                            <option value="">No Active Matrix Selected</option>
                            {hackathons.map(h => (
                                <option key={h.id} value={h.id}>[{h.id}] {h.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="font-label-bold uppercase text-ink-black text-sm block">Difficulty Target</label>
                        <select className="w-full bg-surface-container border-2 border-ink-black p-3 font-mono text-sm" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                            <option value="easy">Easy / Beginner</option>
                            <option value="medium">Medium / Intermediate</option>
                            <option value="hard">Hard / Expert</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-label-bold uppercase text-ink-black text-sm block">Problem Title</label>
                    <input type="text" required placeholder="Project Vanguard: Secure Identity Network" className="w-full bg-surface-container border-2 border-ink-black p-3 font-mono text-sm focus:border-electric-blue focus:outline-none" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="font-label-bold uppercase text-ink-black text-sm block">URL Slug</label>
                        <input type="text" required placeholder="project-vanguard-identity" className="w-full bg-surface-container border-2 border-ink-black p-3 font-mono text-sm focus:border-electric-blue focus:outline-none lowercase" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <label className="font-label-bold uppercase text-ink-black text-sm block">Domain Category</label>
                        <input type="text" required placeholder="Web3 & Blockchain" className="w-full bg-surface-container border-2 border-ink-black p-3 font-mono text-sm focus:border-electric-blue focus:outline-none" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-label-bold uppercase text-ink-black text-sm block">Short Description</label>
                    <textarea required rows={2} placeholder="A brief 1-2 sentence overview shown in the recruitment marketplace." className="w-full bg-surface-container border-2 border-ink-black p-3 font-mono text-sm focus:border-electric-blue focus:outline-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="space-y-2">
                    <label className="font-label-bold uppercase text-ink-black text-sm block">Hardware / Software Full Specifications</label>
                    <textarea required rows={5} placeholder="Full markdown compatible architecture requirements." className="w-full bg-surface-container border-2 border-ink-black p-3 font-mono text-sm focus:border-electric-blue focus:outline-none" value={formData.fullDescription} onChange={e => setFormData({ ...formData, fullDescription: e.target.value })} />
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={loading} className="bg-stark-black text-pure-white font-label-bold uppercase px-8 py-4 brutal-hover border-2 border-transparent disabled:opacity-50">
                        {loading ? 'Initializing...' : 'Compile Directive'}
                    </button>
                    <button type="button" onClick={() => navigate({ to: '/admin/problems' })} className="bg-surface-variant text-ink-black font-label-bold uppercase px-8 py-4 border-2 border-ink-black brutal-hover">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
