import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/hackathons/$id/register")({
    component: HackathonRegistrationPage,
});

function HackathonRegistrationPage() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const { currentUser } = useAppStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form Fields mapped to Registration Schema requirements
    const [college, setCollege] = useState((currentUser as any)?.college || "");
    const [branch, setBranch] = useState((currentUser as any)?.branch || "");
    const [year, setYear] = useState((currentUser as any)?.year || "");

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    useEffect(() => {
        if (!currentUser) {
            alert("You must be logged in as a student to register for a hackathon.");
            navigate({ to: '/login' });
        } else if (currentUser.role !== 'student') {
            alert("Only students can register to participate.");
            window.history.back();
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.post(`${API_URL}/hackathons/${id}/register`, {
                college,
                branch,
                year
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Registration failed. Are you already registered?");
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-mono">
            <div className="w-full max-w-md bg-zinc-950 p-8 border-4 border-electric-blue brute-shadow-blue relative">
                <div className="mb-6"><Link to="/" className="flex items-center gap-2 font-bold text-zinc-400 hover:text-white transition-colors w-fit"><span className="material-symbols-outlined text-sm">arrow_back</span>ABORT ENROLLMENT</Link></div>

                <h1 className="text-3xl font-black uppercase mb-2">Hackathon Enrollment</h1>
                <p className="text-electric-blue mb-8 font-mono text-sm uppercase tracking-widest border-b-2 border-zinc-800 pb-4">
                    TARGET TOURNAMENT: {id}
                </p>

                {success ? (
                    <div className="bg-electric-blue/10 p-6 border-l-4 border-electric-blue">
                        <h3 className="text-electric-blue font-bold uppercase mb-2">Enrollment Confirmed</h3>
                        <p className="text-sm text-zinc-300">Your registration has been logged into the CodeSrijan Mainframe. You may now form or join a squad.</p>
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={() => navigate({ to: '/dashboard' })}
                                className="font-mono text-sm uppercase px-4 py-2 bg-white text-black font-bold hover:bg-electric-blue hover:text-white transition-colors"
                            >
                                Enter Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-300">Hackathon ID</label>
                            <input type="text" disabled className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-zinc-500 cursor-not-allowed" value={id} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-300">Academic Institution</label>
                            <input type="text" required className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white focus:border-electric-blue focus:outline-none transition-colors" value={college} onChange={(e) => setCollege(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-300">Branch Specialization</label>
                            <input type="text" required className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white focus:border-electric-blue focus:outline-none transition-colors" value={branch} onChange={(e) => setBranch(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-300">Academic Year</label>
                            <select required className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white focus:border-electric-blue focus:outline-none transition-colors" value={year} onChange={(e) => setYear(e.target.value)}>
                                <option value="">Select Year</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border-l-4 border-red-500 p-3 text-red-500 font-mono text-sm">
                                [ERROR] {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !college || !branch || !year}
                            className="w-full bg-electric-blue text-black font-black uppercase tracking-widest py-4 border-2 border-transparent hover:bg-transparent hover:text-electric-blue hover:border-electric-blue transition-all disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Transmitting...' : 'Confirm Enrollment'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
