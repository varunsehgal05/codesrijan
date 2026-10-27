import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { SubmissionCountdown } from "../components/SubmissionCountdown";

export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

function DashboardPage() {
    const navigate = useNavigate();
    const { currentUser, teams, hackathons, users, registrations, isLoaded, logout } = useAppStore();

    const handleLogout = () => {
        logout();
        navigate({ to: '/login' });
    };

    const userTeam = teams.find(t => t.id === currentUser?.teamId);

    // Resolve targeted hackathon: Prioritize user's enrolled hackathon, then active event
    const activeEvent = useMemo(() => {
        const userRegistration = (registrations || []).find((r: any) => r.userId === currentUser?.id);
        const enrolledHackId = userTeam?.hackathonId || userRegistration?.hackathonId;
        if (enrolledHackId) {
            const enrolled = (hackathons || []).find(h => h.id === enrolledHackId);
            if (enrolled) return enrolled;
        }
        return (hackathons || []).find(h => h.status === 'active' || h.status === 'registration_open') || hackathons[0] || null;
    }, [hackathons, userTeam, registrations, currentUser]);

    const [teamRequests, setTeamRequests] = useState<any[]>([]);

    useEffect(() => {
        if (userTeam?.leaderId === currentUser?.id) {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
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
            const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            await axios.post(`${BASE}/teams/${userTeam?.id}/kick`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed to kick."); }
    };

    const handleLeaveTeam = async () => {
        if (!confirm("WARNING: Are you absolutely certain you want to abandon your active squad allocation?")) return;
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            await axios.post(`${BASE}/teams/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (e: any) { toast.error(e.response?.data?.message || "Leave protocol denied."); }
    };

    const handleDissolveTeam = async () => {
        if (!confirm("CRITICAL WARNING: Are you certain you want to completely DISSOLVE this squad? All assignment tracking for this team will evaporate permanently.")) return;
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            await axios.delete(`${BASE}/teams/${userTeam?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (e: any) { toast.error(e.response?.data?.message || "Dissolve sequence interrupted."); }
    };

    const handleActionRequest = async (reqId: string, action: 'accept' | 'reject') => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
            const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            await axios.post(`${BASE}/teams/requests/${reqId}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.reload();
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed to process request."); }
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
                        <div className="flex items-center gap-3 sm:gap-4 mt-2 flex-wrap">
                            <p className="font-body-md flex items-center gap-2">
                                <span className="material-symbols-outlined text-electric-blue text-sm">badge</span>
                                Role: <span className="uppercase font-label-bold">{currentUser.role}</span>
                            </p>
                            <Link
                                to="/workspace"
                                className="bg-electric-blue text-black px-3.5 py-1 font-label-bold text-xs uppercase brutal-border hover:bg-black hover:text-white hover:-translate-y-0.5 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                title="Open Operative Workspace"
                            >
                                <span className="material-symbols-outlined text-xs">terminal</span> Workspace HUD
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-error text-white px-3 py-1 font-label-bold text-xs uppercase brutal-border hover:bg-stark-black hover:-translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                                title="Terminate Session"
                            >
                                <span className="material-symbols-outlined text-xs">logout</span> Logout
                            </button>
                        </div>
                    </div>

                    <SubmissionCountdown targetEvent={activeEvent} />
                </section>

                {/* Feature 6: Operative Mission Readiness Checklist */}
                {currentUser.role === 'student' && (() => {
                    const userRegistration = (registrations || []).find((r: any) => r.userId === currentUser?.id);
                    const isProfileComplete = Boolean(currentUser?.bio || currentUser?.phone || (currentUser?.skills && currentUser.skills.length > 0) || currentUser?.github);
                    const hasSquad = Boolean(userTeam);
                    const isEnrolled = Boolean(userRegistration);
                    const isPaymentRequired = Boolean(userRegistration && userRegistration.feeAmount && userRegistration.feeAmount > 0);
                    const isPaymentVerified = !isPaymentRequired || userRegistration?.paymentStatus === 'verified' || userRegistration?.paymentStatus === 'free';
                    const hasTrack = Boolean(userTeam?.problemId);
                    const hasSubmitted = Boolean(userTeam?.isSubmitted);

                    const steps = [
                        {
                            id: 'profile',
                            title: '1. Profile Intelligence',
                            done: isProfileComplete,
                            desc: 'Add bio, technical skills, or GitHub portfolio link.',
                            link: '/profile',
                            action: 'Edit Profile'
                        },
                        {
                            id: 'squad',
                            title: '2. Squad Allocation',
                            done: hasSquad,
                            desc: hasSquad ? `Connected to squad "${userTeam.name}".` : 'Recruit teammates or join a 1-4 operative squad.',
                            link: '/recruitment',
                            action: 'Recruitment'
                        },
                        {
                            id: 'enrollment',
                            title: '3. Hackathon Enrollment',
                            done: isEnrolled,
                            desc: isEnrolled ? 'Successfully registered for hackathon.' : 'Register your operative identity for active event.',
                            link: '/hackathons',
                            action: 'Catalog'
                        },
                        ...(isPaymentRequired ? [{
                            id: 'payment',
                            title: '4. Payment Verification',
                            done: isPaymentVerified,
                            desc: userRegistration?.paymentStatus === 'under_review' ? 'Proof submitted — awaiting admin approval.' : 'Submit transaction reference and payment screenshot.',
                            link: '/payment',
                            action: 'Verify Payment'
                        }] : []),
                        {
                            id: 'track',
                            title: '5. Problem Statement Track',
                            done: hasTrack,
                            desc: hasTrack ? `Locked track: ${userTeam.problemId}` : (hasSquad ? 'Lock an active problem statement for your team.' : 'Requires active squad before track selection.'),
                            link: '/problems',
                            action: 'View Tracks'
                        },
                        {
                            id: 'submit',
                            title: '6. Payload Submission',
                            done: hasSubmitted,
                            desc: hasSubmitted ? 'Final payload delivered successfully.' : 'Upload repository URL and project demo before deadline.',
                            link: '/workspace',
                            action: 'Workspace'
                        }
                    ];

                    const completedCount = steps.filter(s => s.done).length;
                    const allDone = completedCount === steps.length;

                    return (
                        <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-stark-black pb-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-headline-md text-xl uppercase tracking-tight text-stark-black">
                                            OPERATIVE MISSION READINESS
                                        </h3>
                                        <span className={`px-2 py-0.5 text-[10px] font-label-bold uppercase ${allDone ? 'bg-success text-pure-white' : 'bg-warning text-stark-black'}`}>
                                            {allDone ? 'FULL CLEARANCE' : `${completedCount} / ${steps.length} COMPLETED`}
                                        </span>
                                    </div>
                                    <p className="font-code-snippet text-xs text-surface-variant mt-1">
                                        Complete each progression step to ensure hackathon eligibility and submission clearance.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 w-full md:w-56">
                                    <div className="flex justify-between w-full text-[10px] font-mono text-zinc-500 uppercase">
                                        <span>Checklist Progress</span>
                                        <span className="font-bold text-ink-black">{Math.round((completedCount / steps.length) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-surface-container h-3 brutal-border overflow-hidden">
                                        <div
                                            className="bg-electric-blue h-full transition-all duration-500"
                                            style={{ width: `${Math.round((completedCount / steps.length) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {steps.map(step => (
                                    <div
                                        key={step.id}
                                        className={`p-4 brutal-border flex flex-col justify-between ${step.done ? 'bg-surface-bright/50 border-stark-black' : 'bg-surface-container-lowest border-electric-blue'}`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-label-bold text-xs uppercase text-stark-black">{step.title}</span>
                                                <span className={`material-symbols-outlined text-sm ${step.done ? 'text-success' : 'text-surface-variant'}`}>
                                                    {step.done ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                            </div>
                                            <p className="font-code-snippet text-[11px] text-surface-variant mb-3">{step.desc}</p>
                                        </div>
                                        <Link
                                            to={step.link}
                                            className={`font-label-bold text-[10px] uppercase px-3 py-1.5 brutal-border text-center transition-all ${step.done ? 'bg-stark-black text-pure-white hover:bg-surface-variant' : 'bg-electric-blue text-pure-white hover:-translate-y-0.5 brutal-shadow-hover'}`}
                                        >
                                            {step.action} →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

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

                            {!userTeam ? (
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
                                <li><Link to="/workspace" className="flex items-center gap-2 p-3 bg-white border-2 border-ink-black hover:bg-electric-blue hover:text-white transition-colors brutal-hover"><span className="material-symbols-outlined text-sm">terminal</span> Operative Workspace (HUD)</Link></li>
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
