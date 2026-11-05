import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";

export const Route = createFileRoute("/timeline")({
    component: TimelinePage,
});

interface Milestone {
    id: string;
    hackathonId: string;
    hackathonName: string;
    hackathonMode?: string;
    entryType?: string;
    phaseKey: string;
    phaseNumber: number;
    title: string;
    category: string;
    description: string;
    startDate: string;
    endDate: string;
    location?: string;
    meetingUrl?: string;
    icon?: string;
    status: 'completed' | 'ongoing' | 'upcoming';
    isCurrentPhase?: boolean;
}

interface HackathonMeta {
    id: string;
    name: string;
    entryType?: string;
    mode?: string;
    startDate?: string;
    endDate?: string;
}

export function TimelinePage() {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ongoing' | 'upcoming' | 'completed'>('ALL');
    const [now, setNow] = useState<Date>(new Date());

    const API_URL = import.meta.env.VITE_API_URL
        ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api')
        : 'https://codesrijan-api-6tfr.onrender.com/api';

    // Live clock ticker every second for countdowns
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper to generate rich canonical milestones from hackathon configurations
    const buildMilestonesFromHackathons = (hList: any[]): Milestone[] => {
        const results: Milestone[] = [];
        const currentTime = new Date();
        const fallbackList = Array.isArray(hList) && hList.length > 0 ? hList : [
            {
                id: 'hack-free-1792862581267',
                name: 'CodeSrijan Impact Challenge — Free Edition',
                mode: 'hybrid',
                entryType: 'free',
                venue: 'CodeSrijan Virtual Arena & Stage'
            },
            {
                id: 'hack-paid-1792862582632',
                name: 'CodeSrijan 24-Hour Innovation Hackathon',
                mode: 'offline',
                entryType: 'paid',
                venue: 'Main Campus Auditorium'
            }
        ];

        for (const h of fallbackList) {
            const hStart = new Date(h.startDate || h.hackathonStart || Date.now());
            const hEnd = new Date(h.endDate || h.hackathonEnd || (hStart.getTime() + 48 * 3600000));
            const regStart = new Date(h.registrationStart || (hStart.getTime() - 14 * 86400000));
            const regEnd = new Date(h.registrationEnd || h.startDate || (hStart.getTime() - 2 * 3600000));
            const subDeadline = new Date(h.submissionDeadline || (hEnd.getTime() - 2 * 3600000));
            const evalDeadline = new Date(h.evaluationDeadline || (hEnd.getTime() - 3600000));
            const resultDate = new Date(h.resultDate || hEnd);
            const hackDuration = Math.max(3600000, subDeadline.getTime() - hStart.getTime());

            const phases = [
                {
                    phaseKey: 'registration',
                    phaseNumber: 1,
                    title: 'Registration Window',
                    category: 'Registration',
                    description: 'Individual and squad enrollment opens. Operatives register, submit credentials, and claim tournament entry.',
                    startDate: regStart.toISOString(),
                    endDate: regEnd.toISOString(),
                    icon: 'app_registration'
                },
                {
                    phaseKey: 'team_formation',
                    phaseNumber: 2,
                    title: 'Team Formation & Roster Lock',
                    category: 'Teams',
                    description: 'Assemble your squad, recruit specialists across Frontend, Backend, AI/ML, and Cybersecurity via the Recruitment Directorate.',
                    startDate: regStart.toISOString(),
                    endDate: new Date(Math.min(regEnd.getTime(), hStart.getTime())).toISOString(),
                    icon: 'group_add'
                },
                {
                    phaseKey: 'opening_ceremony',
                    phaseNumber: 3,
                    title: 'Opening Ceremony & Keynote Briefing',
                    category: 'Kickoff',
                    description: 'Official tournament kickoff, keynote presentations, problem directives briefing, and matrix initialization.',
                    startDate: hStart.toISOString(),
                    endDate: new Date(hStart.getTime() + 60 * 60 * 1000).toISOString(),
                    icon: 'campaign'
                },
                {
                    phaseKey: 'hacking_begins',
                    phaseNumber: 4,
                    title: 'Hacking Begins & Git Repositories Live',
                    category: 'Development',
                    description: 'Development sprint commences. Git repositories active, APIs accessible, and workspace Kanban unlocked.',
                    startDate: new Date(hStart.getTime() + 60 * 60 * 1000).toISOString(),
                    endDate: subDeadline.toISOString(),
                    icon: 'terminal'
                },
                {
                    phaseKey: 'checkpoint_1',
                    phaseNumber: 5,
                    title: 'Checkpoint 1: Idea Validation & Architecture Review',
                    category: 'Mentorship',
                    description: 'Initial mentor consultation. Review system architecture, domain problem alignment, and technology stack.',
                    startDate: new Date(hStart.getTime() + Math.max(3600000, hackDuration * 0.25)).toISOString(),
                    endDate: new Date(hStart.getTime() + Math.max(3600000, hackDuration * 0.25) + 2 * 3600000).toISOString(),
                    icon: 'support_agent'
                },
                {
                    phaseKey: 'midpoint_review',
                    phaseNumber: 6,
                    title: 'Mid-Point Checkpoint: Core Implementation Sync',
                    category: 'Mentorship',
                    description: 'Progress assessment. Verify database schemas, core business logic, and API endpoints.',
                    startDate: new Date(hStart.getTime() + Math.max(7200000, hackDuration * 0.5)).toISOString(),
                    endDate: new Date(hStart.getTime() + Math.max(7200000, hackDuration * 0.5) + 2 * 3600000).toISOString(),
                    icon: 'sync'
                },
                {
                    phaseKey: 'checkpoint_3',
                    phaseNumber: 7,
                    title: 'Checkpoint 3: Feature Freeze & Polish',
                    category: 'Mentorship',
                    description: 'Final technical check. UI/UX polish, bug fixes, edge-case hardening, and deployment readiness review.',
                    startDate: new Date(hStart.getTime() + Math.max(10800000, hackDuration * 0.75)).toISOString(),
                    endDate: new Date(hStart.getTime() + Math.max(10800000, hackDuration * 0.75) + 2 * 3600000).toISOString(),
                    icon: 'fact_check'
                },
                {
                    phaseKey: 'submission_deadline',
                    phaseNumber: 8,
                    title: 'Code Freeze & Deliverable Submission Deadline',
                    category: 'Submission',
                    description: 'Absolute deadline for final GitHub repository commit hashes and live deployment URLs. Workspace locks immediately.',
                    startDate: new Date(subDeadline.getTime() - 3600000).toISOString(),
                    endDate: subDeadline.toISOString(),
                    icon: 'lock_clock'
                },
                {
                    phaseKey: 'judging_period',
                    phaseNumber: 9,
                    title: 'Evaluation & Judging Period',
                    category: 'Judging',
                    description: 'Judicial panel executes blind rubric scoring across Innovation, Architecture, Functionality, and Presentation vectors.',
                    startDate: subDeadline.toISOString(),
                    endDate: evalDeadline.toISOString(),
                    icon: 'gavel'
                },
                {
                    phaseKey: 'grand_finale',
                    phaseNumber: 10,
                    title: 'Grand Finale & Awards Ceremony',
                    category: 'Ceremony',
                    description: 'Live broadcast of final deliberations, winner announcements, podium distribution, and achievement certificate issuance.',
                    startDate: evalDeadline.toISOString(),
                    endDate: resultDate.toISOString(),
                    icon: 'emoji_events'
                }
            ];

            for (const p of phases) {
                const s = new Date(p.startDate);
                const e = new Date(p.endDate);
                const status: 'completed' | 'ongoing' | 'upcoming' = currentTime > e ? 'completed' : (currentTime >= s ? 'ongoing' : 'upcoming');
                results.push({
                    id: `${h.id}-${p.phaseKey}`,
                    hackathonId: h.id,
                    hackathonName: h.name || h.title || 'CodeSrijan Hackathon',
                    hackathonMode: h.mode || 'hybrid',
                    entryType: h.entryType || (h.fee > 0 ? 'paid' : 'free'),
                    location: h.venue || (h.mode === 'offline' ? 'Main Campus Auditorium' : 'CodeSrijan Virtual Arena & Stage'),
                    meetingUrl: (h.mode === 'online' || !h.venue) ? 'https://meet.google.com/codesrijan-hackathon' : undefined,
                    status,
                    isCurrentPhase: status === 'ongoing',
                    ...p
                });
            }
        }
        return results;
    };

    // Fetch timeline from backend with automated fallback
    useEffect(() => {
        axios.get(`${API_URL}/timeline`)
            .then(res => {
                const data: Milestone[] = Array.isArray(res.data) && res.data.length > 0 ? res.data : [];
                if (data.length > 0) {
                    setMilestones(data);
                    if (!selectedHackathonId) setSelectedHackathonId(data[0].hackathonId);
                    setLoading(false);
                } else {
                    // Fallback to active hackathons
                    axios.get(`${API_URL}/hackathons`)
                        .then(hRes => {
                            const fallback = buildMilestonesFromHackathons(Array.isArray(hRes.data) ? hRes.data : []);
                            setMilestones(fallback);
                            if (fallback.length > 0 && !selectedHackathonId) {
                                setSelectedHackathonId(fallback[0].hackathonId);
                            }
                            setLoading(false);
                        })
                        .catch(() => {
                            const fallback = buildMilestonesFromHackathons([]);
                            setMilestones(fallback);
                            if (fallback.length > 0 && !selectedHackathonId) {
                                setSelectedHackathonId(fallback[0].hackathonId);
                            }
                            setLoading(false);
                        });
                }
            })
            .catch(err => {
                console.warn("Falling back to client-generated tournament milestones", err);
                axios.get(`${API_URL}/hackathons`)
                    .then(hRes => {
                        const fallback = buildMilestonesFromHackathons(Array.isArray(hRes.data) ? hRes.data : []);
                        setMilestones(fallback);
                        if (fallback.length > 0 && !selectedHackathonId) {
                            setSelectedHackathonId(fallback[0].hackathonId);
                        }
                        setLoading(false);
                    })
                    .catch(() => {
                        const fallback = buildMilestonesFromHackathons([]);
                        setMilestones(fallback);
                        if (fallback.length > 0 && !selectedHackathonId) {
                            setSelectedHackathonId(fallback[0].hackathonId);
                        }
                        setLoading(false);
                    });
            });
    }, [API_URL]);

    // Discover unique hackathons from backend data
    const hackathonsList = useMemo(() => {
        const map = new Map<string, HackathonMeta>();
        for (const m of milestones) {
            if (m.hackathonId && !map.has(m.hackathonId)) {
                map.set(m.hackathonId, {
                    id: m.hackathonId,
                    name: m.hackathonName || m.hackathonId,
                    entryType: m.entryType,
                    mode: m.hackathonMode
                });
            }
        }
        return Array.from(map.values());
    }, [milestones]);

    // Active milestones filtered by selected hackathon
    const activeHackathonMilestones = useMemo(() => {
        if (!selectedHackathonId) return milestones;
        return milestones.filter(m => m.hackathonId === selectedHackathonId);
    }, [milestones, selectedHackathonId]);

    // Find the currently active phase or nearest upcoming phase
    const currentPhase = useMemo(() => {
        const ongoing = activeHackathonMilestones.find(m => {
            const start = new Date(m.startDate).getTime();
            const end = new Date(m.endDate).getTime();
            const cur = now.getTime();
            return cur >= start && cur <= end;
        });
        if (ongoing) return { ...ongoing, isLive: true };

        const upcoming = activeHackathonMilestones.find(m => {
            return now.getTime() < new Date(m.startDate).getTime();
        });
        if (upcoming) return { ...upcoming, isLive: false };

        if (activeHackathonMilestones.length > 0) {
            return { ...activeHackathonMilestones[activeHackathonMilestones.length - 1], isLive: false };
        }
        return null;
    }, [activeHackathonMilestones, now]);

    // Compute dynamic countdown for target date
    const countdown = useMemo(() => {
        if (!currentPhase) return null;
        const targetDate = currentPhase.isLive
            ? new Date(currentPhase.endDate).getTime()
            : new Date(currentPhase.startDate).getTime();
        const diff = Math.max(0, targetDate - now.getTime());

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        return { days, hours, minutes, seconds, diff };
    }, [currentPhase, now]);

    // Format dates with timezone
    const formatDate = (isoString: string) => {
        if (!isoString) return 'Date Pending';
        const d = new Date(isoString);
        return d.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatUTC = (isoString: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
    };

    // Filtered milestones based on user status pill
    const displayedMilestones = useMemo(() => {
        if (statusFilter === 'ALL') return activeHackathonMilestones;
        return activeHackathonMilestones.filter(m => {
            const start = new Date(m.startDate).getTime();
            const end = new Date(m.endDate).getTime();
            const cur = now.getTime();
            if (statusFilter === 'completed') return cur > end;
            if (statusFilter === 'ongoing') return cur >= start && cur <= end;
            if (statusFilter === 'upcoming') return cur < start;
            return true;
        });
    }, [activeHackathonMilestones, statusFilter, now]);

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col font-mono selection:bg-electric-blue selection:text-pure-white">
            <main className="flex-grow max-w-[1050px] mx-auto px-4 sm:px-6 py-8 w-full">
                
                {/* Header Navigation */}
                <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer text-xs sm:text-sm uppercase font-bold"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Go Back
                    </button>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/hackathons"
                            className="font-label-bold text-electric-blue border-2 border-stark-black px-4 py-2 bg-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all text-xs sm:text-sm uppercase font-bold"
                        >
                            Arena Directory ↗
                        </Link>
                    </div>
                </div>

                {/* Hero Title Section */}
                <div className="bg-surface-bright border-4 border-stark-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="bg-electric-blue text-pure-white text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 border border-stark-black">
                            CodeSrijan 2026 Tournament Directorate
                        </span>
                        <span className="bg-zinc-200 text-ink-black text-[11px] font-bold uppercase px-2.5 py-1 border border-stark-black flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Synced Schedule
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-stark-black leading-none mb-3">
                        HACKATHON SCHEDULE &amp; MILESTONES
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-700 font-sans max-w-2xl leading-relaxed">
                        Complete chronological battle plan for CodeSrijan hackathons. Track real-time checkpoint deadlines, mentor synchronization sessions, code freezes, pitch rounds, and ceremony directives.
                    </p>

                    {/* Multi-Hackathon Event Selector Tabs */}
                    {hackathonsList.length > 1 && (
                        <div className="mt-6 pt-6 border-t-2 border-stark-black">
                            <p className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-3">
                                Select Tournament Schedule:
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {hackathonsList.map(h => {
                                    const isSelected = h.id === selectedHackathonId;
                                    return (
                                        <button
                                            key={h.id}
                                            onClick={() => setSelectedHackathonId(h.id)}
                                            className={`px-4 py-2.5 text-xs sm:text-sm font-bold uppercase border-2 border-stark-black transition-all flex items-center gap-2 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-electric-blue text-pure-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                                    : 'bg-pure-white text-ink-black hover:bg-zinc-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                                            </span>
                                            <span>{h.name}</span>
                                            {h.entryType === 'paid' ? (
                                                <span className="text-[10px] bg-amber-400 text-stark-black font-black px-1.5 py-0.5 border border-stark-black">
                                                    PAID
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-emerald-400 text-stark-black font-black px-1.5 py-0.5 border border-stark-black">
                                                    FREE
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* CURRENT ACTIVE PHASE SPOTLIGHT BANNER */}
                {currentPhase && countdown && (
                    <div className="bg-stark-black text-pure-white border-4 border-electric-blue p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,53,213,1)] mb-10 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentPhase.isLive ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${currentPhase.isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    </span>
                                    <span className="text-xs font-black uppercase tracking-wider text-pure-white">
                                        {currentPhase.isLive ? 'CURRENT OPERATIVE PHASE [LIVE NOW]' : 'NEXT UPCOMING MILESTONE'}
                                    </span>
                                </div>

                                <span className="bg-electric-blue text-pure-white text-[11px] font-bold uppercase px-3 py-1 border border-pure-white/40">
                                    Phase {currentPhase.phaseNumber} of 10
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                                <div className="lg:col-span-2">
                                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-pure-white mb-2 tracking-tight">
                                        {currentPhase.title}
                                    </h2>
                                    <p className="text-sm text-zinc-300 font-sans leading-relaxed mb-4">
                                        {currentPhase.description}
                                    </p>

                                    <div className="flex flex-wrap gap-3 items-center text-xs text-zinc-200">
                                        <div className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-electric-blue">calendar_today</span>
                                            <span>{formatDate(currentPhase.startDate)}</span>
                                        </div>
                                        {currentPhase.location && (
                                            <div className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm text-amber-400">location_on</span>
                                                <span>{currentPhase.location}</span>
                                            </div>
                                        )}
                                        {currentPhase.meetingUrl && (
                                            <a
                                                href={currentPhase.meetingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-electric-blue hover:bg-blue-600 text-pure-white border border-pure-white px-3 py-1.5 font-bold flex items-center gap-1.5 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">videocam</span>
                                                <span>Join Stage Call ↗</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Dynamic Live Countdown Timer */}
                                <div className="bg-zinc-900/90 border-2 border-zinc-700 p-4 text-center">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                                        {currentPhase.isLive ? 'PHASE ENDS IN' : 'STARTS IN'}
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="bg-black/60 border border-zinc-800 p-2">
                                            <span className="text-xl sm:text-2xl font-black text-pure-white block leading-none">
                                                {String(countdown.days).padStart(2, '0')}
                                            </span>
                                            <span className="text-[9px] text-zinc-400 uppercase font-bold">Days</span>
                                        </div>
                                        <div className="bg-black/60 border border-zinc-800 p-2">
                                            <span className="text-xl sm:text-2xl font-black text-pure-white block leading-none">
                                                {String(countdown.hours).padStart(2, '0')}
                                            </span>
                                            <span className="text-[9px] text-zinc-400 uppercase font-bold">Hours</span>
                                        </div>
                                        <div className="bg-black/60 border border-zinc-800 p-2">
                                            <span className="text-xl sm:text-2xl font-black text-pure-white block leading-none">
                                                {String(countdown.minutes).padStart(2, '0')}
                                            </span>
                                            <span className="text-[9px] text-zinc-400 uppercase font-bold">Mins</span>
                                        </div>
                                        <div className="bg-black/60 border border-zinc-800 p-2">
                                            <span className="text-xl sm:text-2xl font-black text-electric-blue block leading-none">
                                                {String(countdown.seconds).padStart(2, '0')}
                                            </span>
                                            <span className="text-[9px] text-zinc-400 uppercase font-bold">Secs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Filter Chips */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b-2 border-stark-black">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold uppercase text-zinc-500 mr-2">Filter Phase:</span>
                        {(['ALL', 'ongoing', 'upcoming', 'completed'] as const).map(f => {
                            const isSelected = statusFilter === f;
                            const count = f === 'ALL'
                                ? activeHackathonMilestones.length
                                : activeHackathonMilestones.filter(m => {
                                      const start = new Date(m.startDate).getTime();
                                      const end = new Date(m.endDate).getTime();
                                      const cur = now.getTime();
                                      if (f === 'completed') return cur > end;
                                      if (f === 'ongoing') return cur >= start && cur <= end;
                                      if (f === 'upcoming') return cur < start;
                                      return false;
                                  }).length;

                            return (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-stark-black transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-stark-black text-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : 'bg-pure-white text-ink-black hover:bg-zinc-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    {f === 'ALL' ? 'ALL PHASES' : f} ({count})
                                </button>
                            );
                        })}
                    </div>

                    <span className="text-xs font-mono text-zinc-500">
                        Showing {displayedMilestones.length} of {activeHackathonMilestones.length} milestones
                    </span>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center font-mono py-24 bg-surface-bright border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="inline-block animate-spin text-electric-blue text-4xl mb-4">⚙</div>
                        <p className="font-bold uppercase tracking-wider text-stark-black text-sm">
                            [SYNCHRONIZING CODE-SRIJAN TOURNAMENT CHRONOLOGY...]
                        </p>
                    </div>
                ) : displayedMilestones.length === 0 ? (
                    <div className="text-center bg-zinc-100 border-2 border-stark-black p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <span className="material-symbols-outlined text-5xl text-zinc-400 mb-3 block">event_busy</span>
                        <h2 className="text-xl font-black uppercase text-stark-black mb-2">No Milestones in this Category</h2>
                        <p className="text-sm text-zinc-600 font-sans max-w-md mx-auto">
                            No schedule phases match the selected filter. Switch to "ALL PHASES" to review the full timeline.
                        </p>
                    </div>
                ) : (
                    /* The 10 Chronological Milestones Timeline */
                    <div className="relative border-l-4 border-stark-black ml-4 sm:ml-6 md:ml-8 pl-6 sm:pl-8 space-y-8">
                        {displayedMilestones.map((m) => {
                            const startMs = new Date(m.startDate).getTime();
                            const endMs = new Date(m.endDate).getTime();
                            const curMs = now.getTime();
                            const isLive = curMs >= startMs && curMs <= endMs;
                            const isCompleted = curMs > endMs;
                            const isUpcoming = curMs < startMs;

                            return (
                                <div key={m.id} className="relative group">
                                    {/* Timeline Marker Node */}
                                    <div
                                        className={`absolute -left-[35px] sm:-left-[43px] top-6 w-8 h-8 sm:w-10 sm:h-10 border-4 border-stark-black flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110 ${
                                            isLive
                                                ? 'bg-electric-blue text-pure-white ring-4 ring-electric-blue/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse'
                                                : isCompleted
                                                ? 'bg-emerald-500 text-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-pure-white text-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <span className="material-symbols-outlined text-sm sm:text-base font-bold">check</span>
                                        ) : (
                                            <span>{m.phaseNumber || '•'}</span>
                                        )}
                                    </div>

                                    {/* Milestone Card */}
                                    <div
                                        className={`p-6 sm:p-7 border-2 border-stark-black transition-all ${
                                            isLive
                                                ? 'bg-pure-white border-4 border-electric-blue shadow-[6px_6px_0px_0px_rgba(0,53,213,1)] ring-2 ring-electric-blue/20'
                                                : isCompleted
                                                ? 'bg-zinc-50 border-2 border-zinc-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                                : 'bg-pure-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                                        }`}
                                    >
                                        {/* Card Header & Status */}
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-electric-blue uppercase tracking-wider">
                                                    PHASE {m.phaseNumber < 10 ? `0${m.phaseNumber}` : m.phaseNumber} / 10
                                                </span>
                                                <span className="text-zinc-300">•</span>
                                                <span className="text-xs font-bold uppercase bg-zinc-200 text-zinc-800 px-2 py-0.5 border border-stark-black">
                                                    {m.category}
                                                </span>
                                            </div>

                                            {/* Status Badge */}
                                            {isLive && (
                                                <span className="bg-electric-blue text-pure-white text-[11px] font-black uppercase px-3 py-1 border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 animate-pulse">
                                                    <span className="w-2 h-2 rounded-full bg-pure-white"></span>
                                                    ● LIVE NOW / CURRENT PHASE
                                                </span>
                                            )}
                                            {isCompleted && (
                                                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase px-3 py-1 border border-emerald-600 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs font-bold">check_circle</span>
                                                    COMPLETED
                                                </span>
                                            )}
                                            {isUpcoming && (
                                                <span className="bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase px-3 py-1 border border-zinc-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                                    UPCOMING
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl sm:text-2xl font-black uppercase text-stark-black tracking-tight mb-2">
                                            {m.title}
                                        </h3>

                                        {/* Directive Description */}
                                        <p className="text-sm text-zinc-700 font-sans leading-relaxed mb-4">
                                            {m.description}
                                        </p>

                                        {/* Metadata Row: Date, Location, Meeting Link */}
                                        <div className="pt-4 border-t border-zinc-300 flex flex-wrap items-center justify-between gap-3 text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 font-bold text-stark-black">
                                                    <span className="material-symbols-outlined text-sm text-electric-blue">calendar_month</span>
                                                    <span>{formatDate(m.startDate)}</span>
                                                    <span className="text-zinc-400">→</span>
                                                    <span>{formatDate(m.endDate)}</span>
                                                </div>
                                                <p className="text-[10px] text-zinc-500 font-mono">
                                                    Standard: {formatUTC(m.startDate)} to {formatUTC(m.endDate)}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2 items-center">
                                                {m.location && (
                                                    <span className="bg-zinc-100 border border-zinc-400 text-zinc-800 px-2.5 py-1 font-bold flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs text-amber-500">location_on</span>
                                                        {m.location}
                                                    </span>
                                                )}
                                                {m.meetingUrl && (
                                                    <a
                                                        href={m.meetingUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-electric-blue hover:bg-blue-600 text-pure-white border border-stark-black px-3 py-1 font-bold flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">videocam</span>
                                                        Join Stage ↗
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer Help Directive */}
                <div className="mt-12 p-6 bg-surface-container border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h4 className="text-sm font-black uppercase text-stark-black">
                            Need Schedule Clarification or Stage Support?
                        </h4>
                        <p className="text-xs text-zinc-600 font-sans mt-0.5">
                            Connect with tournament mentors and organizers on Discord or submit a priority support ticket.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/support"
                            className="bg-stark-black text-pure-white px-4 py-2 text-xs font-bold uppercase border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                        >
                            Support Desk ↗
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}
