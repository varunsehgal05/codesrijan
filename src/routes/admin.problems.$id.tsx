import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/admin/problems/$id")({
    component: AdminProblemDetail,
});

function AdminProblemDetail() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com';

    const fetchProblem = async () => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            const res = await axios.get(`${BASE}/admin/problems/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProblem(res.data);
        } catch (e: any) {
            setError("Failed to fetch Problem details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProblem();
    }, [id]);

    const togglePublish = async () => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

            await axios.patch(`${BASE}/admin/problems/${id}/${problem.isPublished ? 'unpublish' : 'publish'}`,
                { isPublished: !problem.isPublished },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchProblem();
        } catch (e: any) {
            alert("Publish execution failed.");
        }
    };

    const toggleLock = async () => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

            await axios.patch(`${BASE}/admin/problems/${id}/lock`,
                { isLocked: !problem.isLocked },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchProblem();
        } catch (e: any) {
            alert("Lock execution failed.");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you certain you want to ERADICATE this Problem Statement permanently?")) return;
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

            await axios.delete(`${BASE}/admin/problems/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate({ to: '/admin/problems' });
        } catch (e: any) {
            alert("Deletion aborted.");
        }
    };

    if (loading) return <div className="text-white p-8">Loading problem matrix...</div>;
    if (error || !problem) return <div className="text-error bg-error/10 p-8 brutal-border">{error}</div>;

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-12">
            {/* HUD Header */}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <Link to="/admin/problems" className="font-label-bold uppercase text-ink-black flex items-center gap-2 mb-4 hover:text-electric-blue w-fit">
                        <span className="material-symbols-outlined">arrow_back</span>
                        BACK TO DIRECTIVES
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className="font-display-lg text-4xl uppercase text-stark-black tracking-tight leading-none">
                            {problem.title}
                        </h2>
                        {problem.isLocked && <span className="material-symbols-outlined text-error text-3xl">lock</span>}
                    </div>
                    <p className="font-mono text-on-surface-variant font-bold tracking-widest text-sm uppercase">
                        ID: {problem.id} | SLUG: {problem.slug}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={togglePublish}
                        className={`px-6 py-3 font-label-bold uppercase border-2 text-sm transition-all brutal-hover ${problem.isPublished ? 'bg-warning text-ink-black border-ink-black' : 'bg-success text-pure-white border-transparent'}`}
                    >
                        {problem.isPublished ? 'UNPUBLISH' : 'PUBLISH'}
                    </button>
                    <button
                        onClick={toggleLock}
                        className={`px-6 py-3 font-label-bold uppercase border-2 text-sm transition-all brutal-hover ${problem.isLocked ? 'bg-surface-variant text-ink-black border-ink-black' : 'bg-error text-pure-white border-transparent'}`}
                    >
                        {problem.isLocked ? 'UNLOCK' : 'LOCK DIRECTIVE'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Metadata */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-surface-container p-6 brutal-border">
                        <h3 className="font-label-bold uppercase border-b-2 border-ink-black pb-2 mb-4">Metadata Payload</h3>

                        <div className="space-y-4">
                            <div>
                                <span className="block text-xs uppercase font-label-bold text-surface-variant">Publish State</span>
                                <span className={`inline-block px-2 py-1 text-xs font-bold uppercase mt-1 ${problem.isPublished ? 'bg-success/20 text-success' : 'bg-surface-variant text-ink-black'}`}>
                                    {problem.isPublished ? 'VISIBLE NATIONWIDE' : 'HIDDEN DRAFT'}
                                </span>
                            </div>

                            <div>
                                <span className="block text-xs uppercase font-label-bold text-surface-variant">Domain</span>
                                <span className="font-mono font-bold">{problem.domain}</span>
                            </div>

                            <div>
                                <span className="block text-xs uppercase font-label-bold text-surface-variant">Difficulty</span>
                                <span className="font-mono font-bold uppercase text-electric-blue">{problem.difficulty}</span>
                            </div>

                            <div>
                                <span className="block text-xs uppercase font-label-bold text-surface-variant">Timestamps</span>
                                <div className="font-mono text-sm mt-1">
                                    <div>Cr: {new Date(problem.createdAt).toLocaleString()}</div>
                                    <div>Up: {new Date(problem.updatedAt).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-error/10 p-6 brutal-border border-error">
                        <h3 className="font-label-bold uppercase text-error mb-2 tracking-widest border-b-2 border-error pb-2">Destructive Operations</h3>
                        <p className="text-xs font-mono text-ink-black mb-4">Erasing this directive is permanent and will cascade through squad assignments.</p>

                        <button onClick={handleDelete} className="w-full bg-error text-pure-white font-label-bold py-3 uppercase border-2 border-transparent brutal-hover">
                            ERADICATE PROBLEM
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <div className="bg-pure-white p-8 brutal-border brutal-shadow">
                        <h3 className="font-label-bold uppercase border-b-2 border-ink-black pb-2 mb-4 text-electric-blue">Overview</h3>
                        <p className="font-mono text-ink-black whitespace-pre-wrap">{problem.description}</p>
                    </div>

                    <div className="bg-pure-white p-8 brutal-border brutal-shadow">
                        <h3 className="font-label-bold uppercase border-b-2 border-ink-black pb-2 mb-4">Architecture Requirement Blueprint</h3>
                        <div className="prose prose-sm font-mono text-ink-black whitespace-pre-wrap">
                            {problem.fullDescription}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
