import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/auth/reset-password")({
    component: ResetPasswordPage,
});

function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Extract token and uid from URL query params
    const search: any = useSearch({ strict: false });
    const token = search.token;
    const uid = search.uid;

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !uid) {
            setError("Invalid reset link. Token missing.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await axios.post(`${API_URL}/auth/reset-password`, {
                userId: uid,
                token,
                newPassword: password
            });
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to reset password. The link might be expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 p-8 border-4 border-electric-blue brute-shadow-blue relative">
                <h1 className="text-3xl font-black uppercase mb-2">Cryptographic Override</h1>
                <p className="text-zinc-400 mb-8 font-mono text-sm leading-relaxed">
                    Input your new authentication passkey to secure your identity.
                </p>

                {success ? (
                    <div className="bg-green-500/10 p-6 border-l-4 border-green-500">
                        <h3 className="text-green-500 font-bold uppercase mb-2">Override Successful</h3>
                        <p className="text-sm text-zinc-300">Your passkey has been mutated successfully. All existing sessions have been terminated for security.</p>
                        <button
                            onClick={() => navigate({ to: '/login' })}
                            className="mt-6 font-mono text-sm uppercase px-4 py-2 bg-white text-black font-bold hover:bg-green-500 hover:text-white transition-colors"
                        >
                            Re-Engage Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-300">New Passkey</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white focus:border-electric-blue focus:outline-none transition-colors"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-300">Confirm Passkey</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-zinc-900 border-2 border-zinc-700 p-3 text-white focus:border-electric-blue focus:outline-none transition-colors"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border-l-4 border-red-500 p-3 text-red-500 font-mono text-sm">
                                [ERROR] {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full bg-electric-blue text-black font-black uppercase tracking-widest py-4 border-2 border-transparent hover:bg-transparent hover:text-electric-blue hover:border-electric-blue transition-all disabled:opacity-50"
                        >
                            {loading ? 'Re-encrypting...' : 'Confirm Override'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
