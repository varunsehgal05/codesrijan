import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useEffect, useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

function DashboardPage() {
    const navigate = useNavigate();
    const { currentUser, teams, hackathons, users, registrations, isLoaded, logout } = useAppStore();
    const activeEvent = hackathons[0];

    const handleLogout = () => {
        logout();
        navigate({ to: '/login' });
    };

    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, active: false });

    useEffect(() => {
        if (!activeEvent?.submissionDeadline) return;

        const computeDifference = () => {
            const target = new Date(activeEvent.submissionDeadline).getTime();
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) return { h: 0, m: 0, s: 0, active: false };
            return {
                h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                s: Math.floor((diff % (1000 * 60)) / 1000),
                active: true
            };
        };

        setTimeLeft(computeDifference());
        const timer = setInterval(() => setTimeLeft(computeDifference()), 1000);
        return () => clearInterval(timer);
    }, [activeEvent]);

    const userTeam = teams.find(t => t.id === currentUser?.teamId);

    const [teamRequests, setTeamRequests] = useState<any[]>([]);

    useEffect(() => {
        if (userTeam?.leaderId === currentUser?.id) {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com';
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            axios.get(`${BASE}/teams/requests/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(r => setTeamRequests(r.data)).catch(() => null);
        }
    }, [userTeam, currentUser]);

    const handleKickUser = async (userId: string) => {
        if (!confirm("Are you sure you want to kick this operative?")) return;
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com';
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            await axios.post(`${BASE}/teams/${userTeam?.id}/kick`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (e: any) { alert(e.response?.data?.message || "Failed to kick."); }
    };

    const handleLeaveTeam = async () => {
        if (!confirm("WARNING: Are you absolutely certain you want to abandon your active squad allocation?")) return;
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com';
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            await axios.post(`${BASE}/teams/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (e: any) { alert(e.response?.data?.message || "Leave protocol denied."); }
    };

    const handleDissolveTeam = async () => {
        if (!confirm("CRITICAL WARNING: Are you certain you want to completely DISSOLVE this squad? All assignment tracking for this team will evaporate permanently.")) return;
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com';
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            await axios.delete(`${BASE}/teams/${userTeam?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (e: any) { alert(e.response?.data?.message || "Dissolve sequence interrupted."); }
    };

    const handleActionRequest = async (reqId: string, action: 'accept' | 'reject') => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com';
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            await axios.post(`${BASE}/teams/requests/${reqId}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (e: any) { alert(e.response?.data?.message || "Failed to process request."); }
    };

    // Calculate Rank
    const rankedTeams = [...teams].map(t => ({
        ...t,
        computedScore: (t.isSubmitted ? 8000 : 2000) + ((t.name || '').length * 100)
    })).sort((a, b) => b.computedScore - a.computedScore);

    const myRank = rankedTeams.findIndex(t => t.id === userTeam?.id) + 1;

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 border-4 border-ink-black border-t-electric-blue rounded-full animate-spin mb-4"></div>
                <h1 className="font-display-lg text-2xl uppercase tracking-widest animate-pulse">VERIFYING IDENTITY...</h1>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
                <h1 className="font-display-lg text-4xl mb-4">ACCESS DENIED</h1>
                <p className="font-body-lg mb-8 text-surface-variant">Authentication protocol bypassed. Please authenticate your identity.</p>
                <a href="/login" className="bg-electric-blue text-on-primary py-4 px-8 font-label-bold brutal-border brutal-shadow brutal-hover">LOGIN SYSTEM</a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-12 w-full">

                {/* Welcome & Timer Section */}
                <section className="flex flex-col md:flex-row justify-between gap-8 items-end border-b-4 border-ink-black pb-8">
                    <div>
                        <p className="font-label-caps text-surface-variant mb-2">Welcome Back,</p>
                        <h1 className="font-display-lg text-headline-lg uppercase text-ink-black">{currentUser.name}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="font-body-md flex items-center gap-2">
                                <span className="material-symbols-outlined text-electric-blue text-sm">badge</span>
                                Role: <span className="uppercase font-label-bold">{currentUser.role}</span>
                            </p>
                            <button
                                onClick={handleLogout}
                                className="bg-error text-white px-3 py-1 font-label-bold text-xs uppercase brutal-border hover:bg-stark-black hover:-translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                                title="Terminate Session"
                            >
                                <span className="material-symbols-outlined text-xs">logout</span> Logout
                            </button>
                        </div>
                    </div>

                    <div className="bg-ink-black text-on-primary p-6 brutal-border brutal-shadow flex flex-col items-center">
                        <p className="font-label-caps text-electric-blue border-b-2 border-surface-variant pb-2 mb-4 w-full text-center">SYSTEM LOCKDOWN IN</p>
                        <div className="flex gap-4 font-display-lg text-4xl">
                            <div className="text-center">
                                <span className="text-surface-bright">{timeLeft.h.toString().padStart(2, '0')}</span>
                                <span className="block font-label-sm text-surface-variant mt-1">HRS</span>
                            </div>
                            <span className="text-surface-variant">:</span>
                            <div className="text-center">
                                <span className="text-surface-bright">{timeLeft.m.toString().padStart(2, '0')}</span>
                                <span className="block font-label-sm text-surface-variant mt-1">MIN</span>
                            </div>
                            <span className="text-surface-variant animate-pulse">:</span>
                            <div className="text-center">
                                <span className="text-error">{timeLeft.s.toString().padStart(2, '0')}</span>
                                <span className="block font-label-sm text-surface-variant mt-1 animate-pulse text-error">SEC</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dynamic HUD Grid */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Mission Status (Team/Project) */}
                    {/* Mission Status (Team/Project) & Judge Portal */}
                    <div className="col-span-1 md:col-span-8 bg-surface-bright brutal-border brutal-shadow p-8 flex flex-col justify-between h-full">
                        {(currentUser.role === 'admin' || currentUser.role === 'judge') && (
                            <div className="mb-8 border-4 border-ink-black p-6 bg-[#ffeb3b] text-ink-black brutal-shadow">
                                <h3 className="font-display-md text-2xl uppercase mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-3xl">policy</span> Judge Operations Center</h3>
                                <p className="font-body-md mb-4 font-bold">You possess rigorous grade authorization capability. Open the matrix to begin rendering judgments on locked payloads.</p>
                                <Link to="/evaluations" className="bg-ink-black text-pure-white w-full uppercase py-3 font-label-bold flex items-center justify-center gap-2 brutal-hover">
                                    <span className="material-symbols-outlined text-electric-blue">launch</span> ENTER JUDGE PORTAL
                                </Link>
                            </div>
                        )}
                        <div>
                            <h2 className="font-headline-md uppercase mb-6 border-l-4 border-ink-black pl-3 flex items-center justify-between">
                                Mission Status
                                {userTeam && <span className="text-xs bg-success text-on-primary px-2 py-1 font-label-bold">ACTIVE ALLIANCE</span>}
                            </h2>

                            {!(registrations || []).some(r => r.hackathonId === activeEvent?.id) ? (
                                <div className="bg-electric-blue text-on-primary p-6 brutal-border">
                                    <span className="material-symbols-outlined text-4xl mb-2">how_to_reg</span>
                                    <h3 className="font-label-bold text-xl uppercase mb-2">REGISTRATION REQUIRED</h3>
                                    <p className="font-body-md mb-6">You are not registered for the {activeEvent?.id || 'Active'} Hackathon. Registration is mandatory to proceed.</p>
                                    <a href={`/hackathons/${activeEvent?.id}/register`} className="bg-white text-ink-black py-3 px-6 font-label-bold text-center block brutal-hover shadow-black drop-shadow-xl hover:-translate-y-1">ENROLL IN THE MAINFRAME</a>
                                </div>
                            ) : !userTeam ? (
                                <div className="bg-error text-on-primary p-6 brutal-border">
                                    <span className="material-symbols-outlined text-4xl mb-2">warning</span>
                                    <h3 className="font-label-bold text-xl uppercase mb-2">LONE WOLF DETECTED</h3>
                                    <p className="font-body-md mb-6">You have not joined a squad yet. You cannot access the project workspace or submit to the hackathon without a team.</p>
                                    <a href="/recruitment" className="bg-white text-ink-black py-3 px-6 font-label-bold text-center block brutal-hover hover:-translate-y-1">ACCESS RECRUITMENT MARKETPLACE</a>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-surface p-4 border-2 border-electric-blue">
                                        <p className="font-label-caps text-surface-variant mb-1">Squad Designation</p>
                                        <h3 className="font-headline-sm uppercase text-electric-blue">{userTeam.name}</h3>
                                        <p className="font-body-sm mt-2"><span className="font-bold">{(userTeam.memberIds || userTeam.members || []).length}/4</span> Operatives connected.</p>
                                        {userTeam.leaderId !== currentUser.id && (
                                            <button onClick={handleLeaveTeam} className="mt-4 font-label-bold uppercase text-xs px-4 py-2 border-2 border-ink-black text-ink-black brutal-hover bg-pure-white transition-transform hover:-translate-y-1">ABANDON SQUAD</button>
                                        )}
                                    </div>

                                    <div className="bg-surface-container p-4 border-2 border-ink-black">
                                        <p className="font-label-caps text-surface-variant mb-1">Project Trajectory</p>
                                        {userTeam.problemId ? (
                                            <p className="font-label-bold">{userTeam.problemId} — <span className="text-success uppercase">Locked</span></p>
                                        ) : (
                                            <p className="font-label-bold text-error">PENDING PROBLEM STATEMENT SELECTION</p>
                                        )}
                                    </div>

                                    <div className="bg-surface-container p-4 border-2 border-ink-black flex items-center justify-between">
                                        <div>
                                            <p className="font-label-caps text-surface-variant mb-1">Submission Status</p>
                                            <p className={`font-label-bold uppercase ${userTeam.isSubmitted ? 'text-success' : 'text-error animate-pulse'}`}>
                                                {userTeam.isSubmitted ? 'FINAL PAYLOAD DELIVERED' : 'AWAITING UPLOAD'}
                                            </p>
                                        </div>
                                        {userTeam.isSubmitted && <span className="material-symbols-outlined text-success text-4xl">check_circle</span>}
                                    </div>

                                    <Link to="/workspace" className="mt-8 bg-electric-blue text-pure-white py-4 px-6 font-display-md text-xl text-center flex justify-center items-center gap-2 brutal-hover shadow-black drop-shadow-xl hover:-translate-y-1 w-full border-4 border-ink-black uppercase">
                                        ENTER KANBAN WORKSPACE <span className="material-symbols-outlined font-bold">arrow_forward</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {userTeam && userTeam.leaderId === currentUser.id && (
                            <div className="mt-8 border-t-4 border-ink-black pt-8">
                                <h2 className="font-headline-md uppercase mb-4 text-ink-black flex items-center justify-between">
                                    Squad Management
                                </h2>
                                <div className="space-y-4">
                                    <div className="bg-error/20 p-4 border-2 border-error">
                                        <h3 className="font-label-bold uppercase text-error mb-2 border-b-2 border-error pb-1">Extreme Measures</h3>
                                        <button onClick={handleDissolveTeam} className="bg-error text-white font-label-bold px-4 py-3 text-xs brutal-hover w-full uppercase transition-transform hover:-translate-y-1 block max-w-sm">DISSOLVE SQUAD ENTIRELY</button>
                                    </div>

                                    {/* Members roster */}
                                    <div className="bg-surface p-4 border-2 border-ink-black">
                                        <h3 className="font-label-bold uppercase text-surface-variant mb-2 border-b-2 border-ink-black pb-1">Operative Roster</h3>
                                        <div className="flex flex-col gap-2">
                                            {(userTeam.memberIds || userTeam.members || []).map((mId: string) => {
                                                const u = users.find(u => u.id === mId);
                                                return (
                                                    <div key={mId} className="flex justify-between items-center bg-white p-2 border border-ink-black">
                                                        <span className="font-label-bold uppercase">{u ? u.name : mId} {userTeam.leaderId === mId && <span className="text-electric-blue text-xs ml-2">(LEADER)</span>}</span>
                                                        {userTeam.leaderId !== mId && (
                                                            <button onClick={() => handleKickUser(mId)} className="bg-error text-white font-label-bold px-3 py-1 text-xs brutal-hover">KICK</button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Join requests */}
                                    {teamRequests.length > 0 && (
                                        <div className="bg-[#ffeb3b] p-4 border-2 border-ink-black brutal-shadow">
                                            <h3 className="font-label-bold uppercase text-ink-black mb-2 border-b-2 border-ink-black pb-1">Pending Join Signatures</h3>
                                            <div className="flex flex-col gap-2">
                                                {teamRequests.map(r => {
                                                    const u = users.find(u => u.id === r.userId);
                                                    return (
                                                        <div key={r.id} className="flex justify-between items-center bg-white p-2 border border-ink-black">
                                                            <span className="font-label-bold uppercase">{u ? u.name : r.userId} <span className="text-surface-variant text-xs ml-2">Wants to join</span></span>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleActionRequest(r.id, 'accept')} className="bg-success text-white font-label-bold px-3 py-1 text-xs brutal-hover">ACCEPT</button>
                                                                <button onClick={() => handleActionRequest(r.id, 'reject')} className="bg-ink-black text-white font-label-bold px-3 py-1 text-xs brutal-hover">REJECT</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {userTeam && (
                            <div className="mt-8">
                                <a href="/workspace" className="w-full bg-ink-black text-on-primary py-4 font-label-bold uppercase text-lg brutal-hover flex items-center justify-center gap-2 border-2 text-center brutal-active">
                                    <span className="material-symbols-outlined text-electric-blue">rocket_launch</span> Enter Workspace
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats & Notifications */}
                    <div className="col-span-1 md:col-span-4 flex flex-col gap-8 h-full">

                        {/* Global Rank */}
                        <div className="bg-white brutal-border brutal-shadow p-6 flex flex-col items-center justify-center text-center">
                            <p className="font-label-caps text-surface-variant mb-4">GLOBAL RANKING (LIVE)</p>
                            {userTeam ? (
                                <>
                                    <div className="w-24 h-24 rounded-full border-4 border-ink-black bg-electric-blue text-on-primary flex items-center justify-center font-display-lg text-4xl mb-4 brutal-shadow animate-ping-slow">
                                        #{myRank > 0 ? myRank : '?'}
                                    </div>
                                    <a href="/leaderboard" className="font-label-bold text-electric-blue hover:underline">VIEW LEADERBOARD &rarr;</a>
                                </>
                            ) : (
                                <div className="text-surface-variant font-label-bold mb-4">N/A</div>
                            )}
                        </div>

                        {/* Secure Comm Links */}
                        <div className="bg-surface-container-highest brutal-border brutal-shadow p-6 flex-grow">
                            <h2 className="font-label-bold uppercase mb-4 text-ink-black">Secure Comm Links</h2>
                            <ul className="space-y-3 font-label-bold uppercase">
                                <li><a href="/profile" className="flex items-center gap-2 p-3 bg-white border-2 border-ink-black hover:bg-electric-blue hover:text-white transition-colors brutal-hover"><span className="material-symbols-outlined text-sm">person</span> Personal Profile</a></li>
                                <li><a href="/certificates" className="flex items-center gap-2 p-3 bg-white border-2 border-ink-black hover:bg-electric-blue hover:text-white transition-colors brutal-hover"><span className="material-symbols-outlined text-sm">workspace_premium</span> Diplomas</a></li>
                                <li><a href="/ai-assistant" className="flex items-center gap-2 p-3 bg-white border-2 border-ink-black hover:bg-electric-blue hover:text-white transition-colors brutal-hover"><span className="material-symbols-outlined text-sm">smart_toy</span> Oracle Support</a></li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 p-3 bg-error text-white border-2 border-ink-black hover:bg-stark-black transition-colors brutal-hover cursor-pointer uppercase font-label-bold"
                                    >
                                        <span className="material-symbols-outlined text-sm">logout</span> Terminate Session (Logout)
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                </section>
            </main>

            {/* Footer */}
        </div>
    );
}
