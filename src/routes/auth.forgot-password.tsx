import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/auth/forgot-password")({
    component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setSubmitted(true); // Always show success to prevent enumeration
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 p-8 border-4 border-electric-blue brute-shadow-blue relative">
                <h1 className="text-3xl font-black uppercase mb-2">System Recovery</h1>
                <p className="text-zinc-400 mb-8 font-mono text-sm leading-relaxed">
                    Initialize password reset sequence. A securely encrypted retrieval hook will be dispatched to your coordinates.
                </p>

                {submitted ? (
                    <div className="bg-electric-blue/10 p-6 border-l-4 border-electric-blue">
                        <h3 className="text-electric-blue font-bold uppercase mb-2">Transmission Dispatched</h3>
                        <p className="text-sm text-zinc-300">If your identity exists in our matrices, you will receive an encrypted transmission shortly containing the recovery sequence.</p>
                        <button
                            onClick={() => navigate({ to: '/login' })}
                            className="mt-6 font-mono text-sm uppercase px-4 py-2 bg-white text-black font-bold hover:bg-electric-blue hover:text-white transition-colors"
                        >
                            Return to Gateway
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-300">Target Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white focus:border-electric-blue focus:outline-none transition-colors"
                                placeholder="operative@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full bg-electric-blue text-black font-black uppercase tracking-widest py-4 border-2 border-transparent hover:bg-transparent hover:text-electric-blue hover:border-electric-blue transition-all disabled:opacity-50"
                        >
                            {loading ? 'Transmitting...' : 'Initialize Sequence'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate({ to: '/login' })}
                            className="w-full mt-4 text-zinc-500 font-mono text-sm uppercase hover:text-white transition-colors"
                        >
                            Abort / Return
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
