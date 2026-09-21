import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

export const Route = createFileRoute("/admin/hackathons/$id")({
    component: AdminHackathonDetail,
});

function AdminHackathonDetail() {
    const { id } = useParams({ from: "/admin/hackathons/$id" });
    const { refetchData } = useAppStore();
    const [hackathon, setHackathon] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState("Overview");

    const tabs = ["Overview", "Participants", "Teams", "Problems", "Timeline", "Submissions", "Judges", "Mentors", "Evaluations", "Leaderboard", "Settings"];

    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/hackathons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHackathon(res.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "Unable to load hackathon data.");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const changeStatus = async (endpoint: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/hackathons/${id}/${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await loadData();
            await refetchData(); // Sync global state
        } catch (err: any) {
            alert(err.response?.data?.message || "Action failed.");
        }
    };

    if (loading) return <div className="p-12 text-center font-display-md text-electric-blue animate-pulse">Scanning Event Matrix...</div>;

    if (error) return (
        <div className="p-12 text-center flex flex-col items-center gap-4">
            <h2 className="font-display-lg text-error uppercase">{error}</h2>
            <button onClick={loadData} className="px-6 py-2 bg-stark-black text-pure-white font-label-caps brutal-border">RETRY</button>
        </div>
    );

    if (!hackathon) return <div className="p-12">No hackathons have been created yet.</div>;

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            {/* Master Header */}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
                        {hackathon.name}
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        State: {hackathon.status.replace('_', ' ')}
                    </p>
                </div>

                <div className="flex items-center gap-3 font-label-bold uppercase text-xs flex-wrap">
                    {/* Status mutators based on current state */}
                    {hackathon.status === 'draft' && (
                        <button onClick={() => changeStatus('publish')} className="bg-success text-stark-black px-4 py-2 brutal-border brutal-shadow hover:-translate-y-1 transition-transform">
                            Publish Hackathon
                        </button>
                    )}
                    {(hackathon.status === 'registration_open' || hackathon.status === 'registration_closed') && (
                        <button onClick={() => changeStatus('unpublish')} className="bg-error text-pure-white px-4 py-2 brutal-border brutal-shadow hover:-translate-y-1 transition-transform">
                            Unpublish (Draft)
                        </button>
                    )}
                    {hackathon.status === 'registration_closed' && (
                        <button onClick={() => changeStatus('open-registration')} className="bg-electric-blue text-pure-white px-4 py-2 brutal-border brutal-shadow hover:-translate-y-1 transition-transform">
                            Open Registration
                        </button>
                    )}
                    {hackathon.status === 'registration_open' && (
                        <button onClick={() => changeStatus('close-registration')} className="bg-warning text-stark-black px-4 py-2 brutal-border brutal-shadow hover:-translate-y-1 transition-transform">
                            Close Registration
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto no-scrollbar border-b-4 border-stark-black">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-4 font-label-bold uppercase whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-stark-black text-pure-white border-t-4 border-electric-blue' : 'bg-surface-bright text-on-surface-variant hover:bg-surface-variant'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview Payload */}
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-pure-white p-6 brutal-border brutal-shadow flex flex-col gap-2">
                        <span className="font-label-bold text-xs uppercase text-on-surface-variant">Participants</span>
                        <span className="font-display-lg text-4xl text-stark-black">0</span>
                    </div>
                    <div className="bg-pure-white p-6 brutal-border brutal-shadow flex flex-col gap-2">
                        <span className="font-label-bold text-xs uppercase text-on-surface-variant">Active Teams</span>
                        <span className="font-display-lg text-4xl text-stark-black">0</span>
                    </div>
                    <div className="bg-pure-white p-6 brutal-border brutal-shadow flex flex-col gap-2">
                        <span className="font-label-bold text-xs uppercase text-on-surface-variant">Submissions</span>
                        <span className="font-display-lg text-4xl text-stark-black">0</span>
                    </div>
                    <div className="bg-pure-white p-6 brutal-border brutal-shadow flex flex-col gap-2">
                        <span className="font-label-bold text-xs uppercase text-on-surface-variant">Pending Evals</span>
                        <span className="font-display-lg text-4xl text-electric-blue">0</span>
                    </div>
                </div>
            )}

            {activeTab !== 'Overview' && (
                <div className="bg-surface-container py-12 px-6 text-center brutal-border">
                    <p className="font-code-snippet text-on-surface-variant uppercase text-sm tracking-widest block mb-4">
                        [ SYSTEM NODE OFFLINE ]
                    </p>
                    <h3 className="font-headline-md text-stark-black mb-2">{activeTab.toUpperCase()} Matrix requires explicit database link integration.</h3>
                    <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">
                        This view operates on strict schema architecture. Fallback or generic placeholder data streams are prohibited.
                    </p>
                </div>
            )}
        </div>
    );
}
