import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import axios from "axios";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
    component: SettingsPage,
});

function SettingsPage() {
    const { currentUser } = useAppStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    if (!currentUser) {
        return <div className="p-8 text-center text-white bg-black min-h-screen">Identity not found. Navigate to gateway.</div>;
    }

    const handleRevokeSessions = async () => {
        if (!confirm("WARNING: This will obliterate all active tokens across all geographic hardware. Proceed?")) return;

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/sessions/revoke`);
            alert("All sessions have been forcibly terminated.");
            localStorage.removeItem("codesrijan_auth_token");
            window.location.href = '/login';
        } catch (e) {
            alert("System fault during termination sequence.");
        } finally {
            setLoading(false);
        }
    };

    const handleStandardLogout = () => {
        localStorage.removeItem("codesrijan_auth_token");
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="border-l-4 border-electric-blue pl-4 mb-12">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-white">System Settings</h1>
                    <p className="text-zinc-500 uppercase tracking-widest text-sm mt-2">Manage Identity & Cryptographic Vectors</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Identity Matrix */}
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 space-y-6">
                        <h2 className="text-xl font-bold uppercase text-electric-blue border-b-2 border-zinc-800 pb-2">Identity Profile</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase">Callsign</label>
                                <div className="text-lg font-bold">{currentUser.name}</div>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase">Comm Link (Email)</label>
                                <div className="text-lg font-bold">{currentUser.email}</div>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase">Role Clearance</label>
                                <div className="inline-block px-3 py-1 bg-electric-blue text-black font-bold uppercase text-xs">
                                    {currentUser.role}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Protocols */}
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 space-y-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold uppercase text-red-500 border-b-2 border-zinc-800 pb-2">Security Protocols</h2>
                            <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
                                Execute localized detachment from the mainframe, or force global session termination across all active nodes if a compromise is suspected.
                            </p>
                        </div>

                        <div className="space-y-4 pt-8">
                            <button
                                onClick={handleStandardLogout}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase py-3 transition-colors border border-zinc-600"
                            >
                                Local Detach (Log Out)
                            </button>

                            <button
                                onClick={handleRevokeSessions}
                                disabled={loading}
                                className="w-full bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold uppercase py-3 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Executing...' : 'Force Global Revocation'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
