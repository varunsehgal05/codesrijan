import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/problems")({
  component: ProblemsPage,
  head: () => ({
    meta: [
      { title: "Problem Directives & Challenges | CodeSrijan" },
      { name: "description", content: "Explore curated problem statements, track directives, and challenge vectors for CodeSrijan hackathons." },
      { property: "og:title", content: "Problem Directives & Challenges | CodeSrijan" },
      { property: "og:description", content: "Explore curated problem statements, track directives, and challenge vectors for CodeSrijan hackathons." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/problems" },
    ],
    links: [{ rel: "canonical", href: "/problems" }],
  }),
});

const TRACK_SLOTS = [
  { id: 'ALL', label: 'ALL TRACKS', icon: 'apps' },
  { id: 'FRONTEND', label: 'FRONTEND', icon: 'devices' },
  { id: 'BACKEND', label: 'BACKEND', icon: 'dns' },
  { id: 'FULLSTACK', label: 'FULLSTACK', icon: 'layers' },
  { id: 'AI / ML', label: 'AI / ML', icon: 'smart_toy' },
  { id: 'CYBERSECURITY', label: 'CYBERSECURITY', icon: 'shield' },
  { id: 'UI / UX', label: 'UI / UX DESIGN', icon: 'palette' }
];

function ProblemsPage() {
  const { currentUser, isLoaded, hackathons, teams, assignProblem } = useAppStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>("");
  const [selectedTrack, setSelectedTrack] = useState<string>("ALL");
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

  // Filter genuine hackathons (avoid duplicates)
  const genuineHackathons = useMemo(() => {
    const list: any[] = [];
    hackathons.forEach(h => {
      if (!list.some(existing => existing.id === h.id || existing.title === h.title || existing.name === h.name)) {
        list.push(h);
      }
    });
    return list;
  }, [hackathons]);

  // Set default selected hackathon once loaded
  useEffect(() => {
    if (genuineHackathons.length > 0 && !selectedHackathonId) {
      setSelectedHackathonId(genuineHackathons[0].id);
    }
  }, [genuineHackathons, selectedHackathonId]);

  // Selected Hackathon Object
  const currentHackathon = useMemo(() => {
    return genuineHackathons.find(h => h.id === selectedHackathonId) || genuineHackathons[0] || null;
  }, [genuineHackathons, selectedHackathonId]);

  // Check if problem statements are revealed for the selected hackathon
  const isProblemRevealed = useMemo(() => {
    if (!currentHackathon) return false;
    if (currentUser?.role === 'admin') return true;
    if (currentHackathon.problemStatementsRevealed === true) return true;
    if (currentHackathon.problemRevealMode === 'immediate') return true;
    if (currentHackathon.startDate) {
      const start = new Date(currentHackathon.startDate);
      if (new Date() >= start) return true;
    }
    return false;
  }, [currentHackathon, currentUser]);

  // Fetch problems when selected hackathon changes
  useEffect(() => {
    if (!currentHackathon) return;
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/hackathons/${currentHackathon.id}/problems`);
        if (Array.isArray(res.data)) {
          setProblems(res.data.map((p: any) => ({
            ...p,
            hackathonName: currentHackathon.name || currentHackathon.title,
            hackathonId: currentHackathon.id
          })));
        } else {
          setProblems([]);
        }
      } catch (err) {
        setProblems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [currentHackathon?.id, API_URL]);

  const userTeam = teams.find(t => t.id === currentUser?.teamId);

  const selectProblem = async (problemId: string) => {
    if (!currentUser) {
      navigate({ to: '/login' });
      return;
    }
    if (!userTeam) {
      toast.error("You must join or create a squad before selecting a problem statement.");
      return;
    }
    if (userTeam.leaderId !== currentUser.id) {
      toast.error("Only squad leaders can deploy the problem selection directive.");
      return;
    }
    if (userTeam.problemId) {
      if (!confirm("Your squad already has an active tracking vector. Switching vectors will overwrite your objective. Proceed?")) return;
    }
    try {
      await assignProblem(userTeam.id, problemId);
      toast.success("Problem Statement Locked. Return to Dashboard workspace to begin.");
      window.location.reload();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to select problem.");
    }
  };

  // Filtered Hackathons based on search
  const filteredHackathons = useMemo(() => {
    if (!searchQuery.trim()) return genuineHackathons;
    const q = searchQuery.toLowerCase().trim();
    return genuineHackathons.filter(h =>
      (h.name || h.title || '').toLowerCase().includes(q) ||
      (h.tagline || '').toLowerCase().includes(q)
    );
  }, [genuineHackathons, searchQuery]);

  // Filtered Problems based on track slot and query
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      // Track filter
      if (selectedTrack !== 'ALL') {
        const domain = (p.domain || p.category || p.track || '').toUpperCase();
        const slot = selectedTrack.toUpperCase();
        if (slot === 'UI / UX') {
          if (!domain.includes('UI') && !domain.includes('UX') && !domain.includes('DESIGN')) return false;
        } else if (slot === 'AI / ML') {
          if (!domain.includes('AI') && !domain.includes('ML') && !domain.includes('LEARNING') && !domain.includes('INTELLIGENCE')) return false;
        } else if (slot === 'CYBERSECURITY') {
          if (!domain.includes('CYBER') && !domain.includes('SECURITY') && !domain.includes('CLOUD')) return false;
        } else if (!domain.includes(slot)) {
          return false;
        }
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchDomain = (p.domain || p.category || '').toLowerCase().includes(q);
        const matchHack = (p.hackathonName || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchDomain || matchHack;
      }
      return true;
    });
  }, [problems, selectedTrack, searchQuery]);

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-background flex flex-col pb-20">
      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 font-mono text-xs font-bold text-stark-black hover:text-electric-blue transition-colors cursor-pointer bg-pure-white px-3 py-1.5 border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            RETURN TO PREVIOUS SECTOR
          </button>
          {userTeam && (
            <div className="bg-electric-blue/10 border-2 border-electric-blue text-electric-blue px-3 py-1 font-mono text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">groups</span>
              SQUAD: {userTeam.name}
            </div>
          )}
        </div>

        {/* Master Header Banner */}
        <section className="bg-pure-white p-6 sm:p-8 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-electric-blue"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-stark-black text-pure-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
                  OPERATIONAL SPECS
                </span>
                <span className="text-electric-blue font-mono text-xs font-bold">
                  // DECLASSIFIED REPOSITORY
                </span>
              </div>
              <h1 className="font-display-lg text-2xl sm:text-4xl uppercase text-stark-black font-black tracking-tight">
                PROBLEM DIRECTIVES &amp; ARENAS
              </h1>
              <p className="font-mono text-xs text-zinc-600 mt-2 max-w-2xl leading-relaxed">
                Interrogate tournament challenge vectors across verified tracks. Review problem statements, technical constraints, rubric weightings, and lock directives for your squad.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
              <div className="bg-surface-container border-2 border-stark-black p-3 text-center flex-1 md:flex-initial">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block font-bold">AVAILABLE ARENAS</span>
                <span className="font-display-sm text-xl font-black text-stark-black">{genuineHackathons.length}</span>
              </div>
              <div className="bg-surface-container border-2 border-stark-black p-3 text-center flex-1 md:flex-initial">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block font-bold">TRACK SLOTS</span>
                <span className="font-display-sm text-xl font-black text-electric-blue">{TRACK_SLOTS.length - 1}</span>
              </div>
            </div>
          </div>

          {/* Unified Search Bar */}
          <div className="mt-6 pt-6 border-t-2 border-stark-black">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stark-black text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hackathons, problem titles, domains, tech stacks, or keywords..."
                className="w-full bg-surface-container border-2 border-stark-black py-3.5 pl-12 pr-4 font-mono text-xs sm:text-sm text-stark-black placeholder-zinc-500 outline-none focus:border-electric-blue focus:bg-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500 hover:text-stark-black bg-white px-2 py-1 border border-stark-black cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Hackathon Selection Matrix */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-black uppercase tracking-wider text-stark-black flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-electric-blue">sports_esports</span>
              1. SELECT HACKATHON ARENA ({filteredHackathons.length})
            </h2>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              CLICK ANY ARENA TO VIEW DIRECTIVES
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredHackathons.length === 0 ? (
              <div className="col-span-full bg-pure-white border-2 border-stark-black p-6 text-center font-mono text-xs text-zinc-500">
                NO HACKATHONS FOUND MATCHING "{searchQuery}". TRY CLEARING SEARCH.
              </div>
            ) : (
              filteredHackathons.map((h) => {
                const isSelected = (currentHackathon?.id === h.id);
                const isPaid = (h.entryFee && h.entryFee > 0) || h.isPaid;
                const isLive = h.status === 'live' || h.status === 'active';

                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHackathonId(h.id)}
                    className={`p-4 sm:p-5 border-3 sm:border-4 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                      isSelected
                        ? "bg-pure-white border-stark-black shadow-[6px_6px_0px_0px_#0055FF] ring-2 ring-electric-blue"
                        : "bg-surface-container border-stark-black hover:bg-pure-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 border border-stark-black uppercase ${
                          isPaid ? 'bg-amber-300 text-stark-black' : 'bg-emerald-300 text-stark-black'
                        }`}>
                          {isPaid ? `PAID ARENA (₹${h.entryFee || 149})` : 'FREE ARENA ($0)'}
                        </span>
                        {isLive && (
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-rose-500 text-white border border-stark-black uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            LIVE ARENA
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <span className="bg-electric-blue text-white text-[10px] font-mono font-black px-2 py-0.5 uppercase border border-stark-black">
                          ACTIVE ARENA
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-headline-md text-base sm:text-lg font-black uppercase text-stark-black leading-snug">
                        {h.name || h.title}
                      </h3>
                      {h.tagline && (
                        <p className="font-mono text-xs text-zinc-500 mt-1 line-clamp-1">
                          {h.tagline}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-200 text-[11px] font-mono text-zinc-600 w-full">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {h.startDate ? new Date(h.startDate).toLocaleDateString() : 'TBA'}
                      </span>
                      <span className="font-bold text-electric-blue flex items-center gap-1">
                        VIEW DIRECTIVES
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Selected Hackathon Directives Sector */}
        {currentHackathon && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pt-4 border-t-4 border-stark-black">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
                  SELECTED TOURNAMENT VECTOR
                </span>
                <h2 className="font-display-lg text-lg sm:text-xl uppercase font-black text-stark-black">
                  {currentHackathon.name || currentHackathon.title}
                </h2>
              </div>

              {currentUser?.role === 'admin' && (
                <div className="bg-amber-400 text-stark-black border-2 border-stark-black px-3 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  ADMIN BYPASS ENGAGED
                </div>
              )}
            </div>

            {/* CASE 1: PROBLEM STATEMENTS NOT REVEALED */}
            {!isProblemRevealed ? (
              <div className="bg-pure-white border-4 border-stark-black p-8 sm:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden space-y-6">
                <div className="w-20 h-20 bg-rose-50 border-3 border-rose-600 rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(225,29,72,1)]">
                  <span className="material-symbols-outlined text-rose-600 text-4xl animate-pulse">lock</span>
                </div>

                <div className="max-w-2xl mx-auto space-y-3">
                  <span className="bg-rose-100 text-rose-900 border-2 border-rose-600 px-3 py-1 text-[11px] font-mono font-black uppercase tracking-widest inline-block">
                    [CLASSIFIED SECURITY PROTOCOL // PENDING DIRECTORATE AUTHORIZATION]
                  </span>

                  <h3 className="font-display-lg text-xl sm:text-3xl uppercase font-black text-stark-black tracking-tight">
                    THE ADMIN HAS NOT REVEALED THE PROBLEM STATEMENT YET.
                  </h3>

                  <p className="font-mono text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Directives will be decrypted and published once authorized by tournament directorate. Check back at the scheduled start time or watch the announcements feed for official transmission alerts.
                  </p>
                </div>

                <div className="inline-flex flex-wrap items-center justify-center gap-4 pt-4 border-t-2 border-zinc-200">
                  <div className="bg-surface-container border-2 border-stark-black px-4 py-2 font-mono text-xs text-left">
                    <span className="text-[9px] uppercase text-zinc-500 block font-bold">COMMENCEMENT TIME</span>
                    <span className="font-bold text-stark-black">
                      {currentHackathon.startDate ? new Date(currentHackathon.startDate).toLocaleString() : 'SCHEDULE PENDING'}
                    </span>
                  </div>

                  <Link
                    to="/announcements"
                    className="bg-stark-black text-white hover:bg-electric-blue transition-colors px-4 py-2 font-mono text-xs font-bold border-2 border-stark-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span className="material-symbols-outlined text-sm">campaign</span>
                    CHECK ANNOUNCEMENTS
                  </Link>

                  <Link
                    to="/recruitment"
                    className="bg-pure-white text-stark-black hover:bg-zinc-100 transition-colors px-4 py-2 font-mono text-xs font-bold border-2 border-stark-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span className="material-symbols-outlined text-sm">groups</span>
                    BUILD / JOIN SQUAD
                  </Link>
                </div>
              </div>
            ) : (
              /* CASE 2: PROBLEM STATEMENTS REVEALED */
              <div className="space-y-6">
                
                {/* Track Slotting Bar */}
                <div className="bg-pure-white p-4 border-3 sm:border-4 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-stark-black flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-electric-blue">tune</span>
                      2. FILTER BY TRACK SLOTTING:
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">
                      SHOWING {filteredProblems.length} OF {problems.length} DIRECTIVES
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {TRACK_SLOTS.map((slot) => {
                      const isSelected = (selectedTrack === slot.id);
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedTrack(slot.id)}
                          className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-electric-blue text-white border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-[1.02]'
                              : 'bg-surface-container text-stark-black border-stark-black hover:bg-zinc-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">{slot.icon}</span>
                          <span>{slot.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Problems Cards Grid */}
                {loading ? (
                  <div className="bg-pure-white border-4 border-stark-black p-12 text-center font-mono text-xs font-bold uppercase">
                    <span className="material-symbols-outlined text-3xl animate-spin text-electric-blue mb-2 block">sync</span>
                    DECRYPTING ARENA PROBLEM MATRIX...
                  </div>
                ) : filteredProblems.length === 0 ? (
                  <div className="bg-pure-white border-4 border-stark-black p-12 text-center space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-4xl text-zinc-400">filter_alt_off</span>
                    <h3 className="font-headline-md text-base uppercase font-bold text-stark-black">
                      NO DIRECTIVES MATCH THIS FILTER
                    </h3>
                    <p className="font-mono text-xs text-zinc-500 max-w-md mx-auto">
                      No problem statements found in the selected track for this arena. Select "ALL TRACKS" or adjust your search filter above.
                    </p>
                    <button
                      onClick={() => { setSelectedTrack("ALL"); setSearchQuery(""); }}
                      className="mt-2 bg-stark-black text-white px-4 py-2 font-mono text-xs font-bold border-2 border-stark-black hover:bg-electric-blue cursor-pointer"
                    >
                      RESET FILTERS
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProblems.map((prob) => {
                      const isLocked = userTeam?.problemId === prob.id;
                      const difficulty = (prob.difficulty || 'MEDIUM').toUpperCase();

                      return (
                        <div
                          key={prob.id}
                          className={`bg-pure-white border-4 border-stark-black p-6 flex flex-col justify-between gap-5 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative ${
                            isLocked ? 'ring-2 ring-emerald-500 border-l-8 border-l-emerald-500' : ''
                          }`}
                        >
                          {/* Card Header & Badges */}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="bg-electric-blue text-white text-[10px] font-mono font-black px-2 py-0.5 border border-stark-black uppercase">
                                  {prob.domain || prob.category || 'GENERAL TRACK'}
                                </span>
                                <span className={`text-[10px] font-mono font-black px-2 py-0.5 border border-stark-black uppercase ${
                                  difficulty === 'EXTREME' || difficulty === 'HARD'
                                    ? 'bg-rose-500 text-white'
                                    : difficulty === 'MEDIUM'
                                    ? 'bg-amber-300 text-stark-black'
                                    : 'bg-emerald-300 text-stark-black'
                                }`}>
                                  {difficulty}
                                </span>
                              </div>

                              {isLocked && (
                                <span className="bg-emerald-500 text-white text-[10px] font-mono font-black px-2 py-0.5 border border-stark-black uppercase flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                  <span className="material-symbols-outlined text-xs">verified</span>
                                  LOCKED BY SQUAD
                                </span>
                              )}
                            </div>

                            <h3 className="font-headline-md text-lg sm:text-xl font-black uppercase text-stark-black leading-tight">
                              {prob.title}
                            </h3>

                            <p className="font-mono text-xs text-zinc-600 leading-relaxed line-clamp-4">
                              {prob.description}
                            </p>
                          </div>

                          {/* Technical Tags / Deliverables */}
                          {prob.tags && prob.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-200">
                              {prob.tags.map((tag: string, tIdx: number) => (
                                <span
                                  key={tIdx}
                                  className="bg-surface-container text-zinc-700 text-[10px] font-mono font-bold px-1.5 py-0.5 border border-zinc-300 uppercase"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Card Footer: Prize & Action Button */}
                          <div className="pt-3 border-t-2 border-stark-black flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold block">
                                TRACK BOUNTY
                              </span>
                              <span className="font-display-sm text-base sm:text-lg font-black text-electric-blue">
                                {prob.prizePool ? `₹${prob.prizePool.toLocaleString()}` : 'CERTIFICATION & COMMENDATION'}
                              </span>
                            </div>

                            {isLocked ? (
                              <button
                                disabled
                                className="bg-emerald-600 text-white font-mono text-xs font-black px-4 py-2.5 border-2 border-stark-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              >
                                <span className="material-symbols-outlined text-sm">lock</span>
                                ACTIVE OBJECTIVE
                              </button>
                            ) : (
                              <button
                                onClick={() => selectProblem(prob.id)}
                                className="bg-stark-black text-white hover:bg-electric-blue transition-colors font-mono text-xs font-black px-4 py-2.5 border-2 border-stark-black uppercase flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none cursor-pointer"
                              >
                                SELECT DIRECTIVE
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
