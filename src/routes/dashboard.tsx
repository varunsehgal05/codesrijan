import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

function DashboardPage() {
    const { currentUser, teams, hackathons } = useAppStore();
    const activeEvent = hackathons[0];

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

    // Calculate Rank
    const rankedTeams = [...teams].map(t => ({
        ...t,
        computedScore: (t.isSubmitted ? 8000 : 2000) + (t.name.length * 100)
    })).sort((a, b) => b.computedScore - a.computedScore);

    const myRank = rankedTeams.findIndex(t => t.id === userTeam?.id) + 1;

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
                        <p className="font-body-md mt-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-electric-blue text-sm">badge</span>
                            Role: <span className="uppercase font-label-bold">{currentUser.role}</span>
                        </p>
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
                    <div className="col-span-1 md:col-span-8 bg-surface-bright brutal-border brutal-shadow p-8 flex flex-col justify-between h-full">
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
                                    <a href="/recruitment" className="bg-white text-ink-black py-3 px-6 font-label-bold text-center block brutal-hover">ACCESS RECRUITMENT MARKETPLACE</a>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-surface p-4 border-2 border-electric-blue">
                                        <p className="font-label-caps text-surface-variant mb-1">Squad Designation</p>
                                        <h3 className="font-headline-sm uppercase text-electric-blue">{userTeam.name}</h3>
                                        <p className="font-body-sm mt-2"><span className="font-bold">{userTeam.members.length}/4</span> Operatives connected.</p>
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
                                </div>
                            )}
                        </div>

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
                            </ul>
                        </div>
                    </div>

                </section>
            </main>

            {/* Footer */}
        </div>
    );
}
