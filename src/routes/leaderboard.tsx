import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Live Leaderboard & Hackathon Standings | CodeSrijan" },
    ],
  }),
});

interface LeaderboardItem {
  id: string;
  name: string;
  hackathonId?: string | null;
  status?: string;
  memberIds?: string[];
  memberCount?: number;
  isSubmitted?: boolean;
  bonusPoints: number;
  penaltyPoints: number;
  evalScore: number;
  totalScore: number;
  isScored: boolean;
  scores: any[];
}

function LeaderboardPage() {
  const { hackathons, teams: storeTeams, users, isLoaded } = useAppStore();
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>("ALL");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Filter out genuine non-test hackathons
  const genuineHackathons = useMemo(() => {
    const list = Array.isArray(hackathons) ? hackathons : [];
    return list.filter(h => !h.isTest && !h.id.toLowerCase().startsWith('qa-') && !h.id.toLowerCase().startsWith('qa_'));
  }, [hackathons]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = selectedHackathonId === "ALL" 
          ? `${API_BASE}/leaderboard?includeAll=true` 
          : `${API_BASE}/leaderboard?hackathonId=${selectedHackathonId}&includeAll=true`;
        const res = await axios.get(url);
        setLeaderboardItems(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        console.error("Leaderboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedHackathonId]);

  // Combined teams list: merges store teams with backend scores so all joined teams appear
  const displayedTeams = useMemo(() => {
    const scoreMap = new Map<string, LeaderboardItem>();
    leaderboardItems.forEach(item => scoreMap.set(item.id, item));

    // Get candidate teams
    let candidateTeams = Array.isArray(storeTeams) ? storeTeams : [];
    if (selectedHackathonId !== "ALL") {
      candidateTeams = candidateTeams.filter(t => 
        t.hackathonId === selectedHackathonId || (t as any).lockedForHackathonId === selectedHackathonId
      );
    }

    // Merge score data
    const merged = candidateTeams.map(t => {
      const scored = scoreMap.get(t.id);
      return {
        id: t.id,
        name: t.name,
        hackathonId: t.hackathonId || (t as any).lockedForHackathonId || null,
        status: t.status || 'forming',
        memberIds: t.memberIds || [],
        memberCount: (t.memberIds || []).length,
        isSubmitted: !!t.isSubmitted,
        bonusPoints: scored?.bonusPoints ?? (t.bonusPoints || 0),
        penaltyPoints: scored?.penaltyPoints ?? (t.penaltyPoints || 0),
        evalScore: scored?.evalScore ?? 0,
        totalScore: scored?.totalScore ?? (t.points || 0),
        isScored: scored?.isScored ?? false,
        scores: scored?.scores || []
      };
    });

    // Also include any scored teams from backend not in store
    leaderboardItems.forEach(item => {
      if (!merged.some(m => m.id === item.id)) {
        if (selectedHackathonId === "ALL" || item.hackathonId === selectedHackathonId) {
          merged.push(item);
        }
      }
    });

    // Sort descending by score, then members
    merged.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.isScored !== a.isScored) return b.isScored ? 1 : -1;
      return (b.memberCount || 0) - (a.memberCount || 0);
    });

    return merged;
  }, [storeTeams, leaderboardItems, selectedHackathonId]);

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return displayedTeams;
    const q = searchQuery.toLowerCase().trim();
    return displayedTeams.filter(t => 
      t.name?.toLowerCase().includes(q) || 
      t.id?.toLowerCase().includes(q) ||
      (t.memberIds || []).some(mid => {
        const u = users.find(user => user.id === mid);
        return u?.name?.toLowerCase().includes(q) || u?.email?.toLowerCase().includes(q);
      })
    );
  }, [displayedTeams, searchQuery, users]);

  const activeHackathonObj = genuineHackathons.find(h => h.id === selectedHackathonId);

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-background flex flex-col pb-20">
      <main className="flex-grow max-w-[1100px] mx-auto px-4 py-12 space-y-8 w-full">
        
        {/* Header Banner */}
        <section className="bg-pure-white p-8 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display-lg text-headline-lg uppercase text-stark-black border-l-8 border-electric-blue pl-4 mb-2">
                GLOBAL LEADERBOARD
              </h1>
              <p className="font-code-snippet text-on-surface-variant uppercase tracking-widest text-xs">
                Hackathon Standings & Evaluation Matrix — Scored across judge rubrics, operational bonuses, and penalty infractions.
              </p>
            </div>
            <div className="bg-stark-black text-pure-white px-4 py-2 font-mono text-xs font-bold border-2 border-stark-black flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-electric-blue">social_leaderboard</span>
              <span>{displayedTeams.length} SQUADS ENROLLED</span>
            </div>
          </div>
        </section>

        {/* Hackathon Selector Tabs & Instant Search */}
        <div className="bg-pure-white p-5 border-4 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-label-bold uppercase tracking-widest text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-electric-blue">trophy</span>
              <span>Select Hosted Hackathon / Hackathon:</span>
            </div>
            
            {/* Squad Search Input */}
            <div className="w-full md:w-72 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search squad name, ID, member..."
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue uppercase"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200">
            <button
              onClick={() => setSelectedHackathonId("ALL")}
              className={`px-3.5 py-1.5 font-label-bold text-xs uppercase border-2 transition-all cursor-pointer ${
                selectedHackathonId === "ALL"
                  ? "bg-electric-blue text-pure-white border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-surface-container text-stark-black border-stark-black hover:bg-zinc-100"
              }`}
            >
              ★ ALL HACKATHONS
            </button>
            {genuineHackathons.map(h => {
              const isSelected = selectedHackathonId === h.id;
              const isLive = h.status === 'live' || h.status === 'active';
              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedHackathonId(h.id)}
                  className={`px-3.5 py-1.5 font-label-bold text-xs uppercase border-2 transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-electric-blue text-pure-white border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-surface-container text-stark-black border-stark-black hover:bg-zinc-100"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-ping' : 'bg-zinc-400'}`}></span>
                  <span>{h.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hackathon Info Banner if specific hackathon selected */}
        {activeHackathonObj && (
          <div className="bg-pure-white p-5 border-4 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-stark-black text-pure-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase mb-1.5 inline-block">
                ACTIVE ARENA
              </span>
              <h2 className="font-display-sm text-xl uppercase font-bold text-stark-black">{activeHackathonObj.name}</h2>
              <p className="font-code-snippet text-xs text-on-surface-variant mt-0.5 line-clamp-1">{activeHackathonObj.tagline || activeHackathonObj.description || "Official CodeSrijan Hackathon Arena"}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 text-xs font-bold uppercase border-2 ${
                activeHackathonObj.status === 'live' || activeHackathonObj.status === 'active'
                  ? 'border-success text-success bg-success/10'
                  : 'border-zinc-400 text-zinc-600 bg-zinc-100'
              }`}>
                {activeHackathonObj.status ? activeHackathonObj.status.toUpperCase() : 'ACTIVE'}
              </span>
              <Link
                to="/recruitment"
                className="bg-stark-black text-pure-white font-label-bold text-xs uppercase px-3.5 py-1.5 border-2 border-stark-black hover:bg-electric-blue transition-colors flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <span className="material-symbols-outlined text-[14px]">group_add</span>
                Squad Directorate
              </Link>
            </div>
          </div>
        )}

        {/* Content Matrix */}
        {loading ? (
          <div className="text-center font-code-snippet uppercase tracking-widest animate-pulse p-16 text-stark-black bg-pure-white border-4 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="material-symbols-outlined text-4xl mb-3 animate-spin block text-electric-blue">sync</span>
            SYNCHRONIZING SQUAD STANDINGS & EVALUATION METRICS...
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="bg-pure-white p-12 border-4 border-stark-black text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <span className="material-symbols-outlined text-5xl text-zinc-300">group_off</span>
            <h3 className="font-headline-md text-xl uppercase font-bold text-stark-black">NO SQUADS FOUND</h3>
            <p className="font-code-snippet text-xs text-on-surface-variant max-w-md mx-auto uppercase">
              {searchQuery ? "No squads match your search criteria. Try a different query." : "Registration is active. Form or recruit your squad in the Recruitment Matrix."}
            </p>
            <div className="pt-2">
              <Link
                to="/recruitment"
                className="bg-electric-blue text-pure-white font-label-bold text-xs uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">groups</span>
                RECRUIT & FORM SQUAD NOW
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* TOP 3 PODIUM SHOWCASE GRID */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-md uppercase text-lg text-stark-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">military_tech</span>
                  CHAMPIONSHIP PODIUM // TOP OPERATIVES
                </h3>
                <span className="text-xs font-mono text-zinc-500 font-bold uppercase">
                  Showing Top 3 Contenders
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredTeams.slice(0, 3).map((team, pIdx) => {
                  const medal = pIdx === 0 ? '🥇' : pIdx === 1 ? '🥈' : '🥉';
                  const medalTitle = pIdx === 0 ? '1ST PLACE' : pIdx === 1 ? '2ND PLACE' : '3RD PLACE';
                  const borderClass = pIdx === 0 
                    ? 'border-yellow-400 bg-gradient-to-b from-yellow-50/60 to-pure-white shadow-[6px_6px_0px_0px_#EAB308]' 
                    : pIdx === 1 
                      ? 'border-zinc-400 bg-gradient-to-b from-zinc-50/60 to-pure-white shadow-[6px_6px_0px_0px_#71717A]' 
                      : 'border-amber-600 bg-gradient-to-b from-amber-50/60 to-pure-white shadow-[6px_6px_0px_0px_#D97706]';
                  const hackathonMatch = genuineHackathons.find(h => h.id === team.hackathonId);
                  const members = (team.memberIds || []).map(mid => users.find(u => u.id === mid)).filter(Boolean);

                  return (
                    <div
                      key={team.id}
                      onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                      className={`border-4 p-5 flex flex-col justify-between gap-4 cursor-pointer hover:-translate-y-1 transition-all ${borderClass}`}
                    >
                      <div>
                        {/* Podium Rank Header */}
                        <div className="flex justify-between items-center pb-3 border-b-2 border-stark-black">
                          <span className="text-2xl">{medal}</span>
                          <span className="font-mono text-xs font-black uppercase px-2 py-0.5 bg-stark-black text-white">
                            {medalTitle}
                          </span>
                        </div>

                        {/* Squad Identity */}
                        <div className="mt-3">
                          <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">
                            #{team.id.substring(0, 10)}
                          </span>
                          <h4 className="font-headline-md uppercase text-xl font-black text-stark-black truncate mt-0.5">
                            {team.name}
                          </h4>
                          {hackathonMatch && (
                            <span className="inline-block mt-1 text-[10px] font-mono bg-zinc-200 text-zinc-800 px-2 py-0.5 border border-zinc-400 font-bold truncate max-w-full">
                              🏆 {hackathonMatch.name}
                            </span>
                          )}
                        </div>

                        {/* Operatives Avatars Row */}
                        <div className="mt-4 pt-3 border-t border-zinc-300">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">
                            Squad Roster ({team.memberCount || 0} / 4)
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {members.length === 0 ? (
                              <span className="text-xs text-zinc-400 font-mono">1 Leader</span>
                            ) : (
                              members.map(m => (
                                <div
                                  key={m.id}
                                  title={`${m.name} (${m.email})`}
                                  className="w-7 h-7 rounded-full bg-electric-blue text-white text-[11px] font-bold border border-black flex items-center justify-center uppercase shadow-[1px_1px_0px_0px_#000]"
                                >
                                  {(m.name || "?").charAt(0)}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score / Status Footer */}
                      <div className="pt-3 border-t-2 border-stark-black flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-zinc-600">Standings Score:</span>
                        <span className={`px-2.5 py-1 text-xs font-mono font-black border-2 border-black ${
                          team.isScored ? 'bg-electric-blue text-white' : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          {team.isScored ? `${team.totalScore} PTS` : 'AWAITING EVAL'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DENSE STANDINGS MATRIX TABLE */}
            <div className="bg-pure-white border-4 border-stark-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-4 bg-stark-black text-white flex justify-between items-center">
                <h4 className="font-headline-md uppercase text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-electric-blue text-lg">format_list_numbered</span>
                  GLOBAL STANDINGS MATRIX ({filteredTeams.length} SQUADS)
                </h4>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  Click any row to inspect operatives and scoring breakdown
                </span>
              </div>

              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-3 p-3 bg-zinc-100 border-b-2 border-stark-black text-[11px] font-mono font-bold uppercase text-zinc-600">
                <div className="col-span-1 text-center">RANK</div>
                <div className="col-span-4">SQUAD IDENTITY</div>
                <div className="col-span-3">ARENA</div>
                <div className="col-span-2 text-center">ROSTER</div>
                <div className="col-span-2 text-right">EVALUATION / SCORE</div>
              </div>

              {/* Matrix Rows */}
              <div className="divide-y-2 divide-stark-black">
                {filteredTeams.map((team, idx) => {
                  const hackathonMatch = genuineHackathons.find(h => h.id === team.hackathonId);
                  const members = (team.memberIds || []).map(mid => users.find(u => u.id === mid)).filter(Boolean);
                  const isExpanded = expandedTeam === team.id;

                  return (
                    <div key={team.id} className="transition-colors hover:bg-yellow-50/50">
                      <div
                        onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                        className="p-3 md:p-3.5 flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-3 items-start md:items-center cursor-pointer text-xs"
                      >
                        {/* Rank */}
                        <div className="md:col-span-1 flex md:justify-center items-center gap-2 font-display-sm text-base md:text-lg font-bold text-stark-black shrink-0">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </div>

                        {/* Squad Identity */}
                        <div className="md:col-span-4 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm uppercase text-stark-black truncate hover:text-electric-blue transition-colors">
                              {team.name}
                            </span>
                            <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${
                              team.status === 'disqualified'
                                ? 'bg-rose-100 text-rose-800 border-rose-400'
                                : team.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-400'
                            }`}>
                              {team.status || 'ACTIVE'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 block truncate">
                            ID: {team.id}
                          </span>
                        </div>

                        {/* Arena */}
                        <div className="md:col-span-3 min-w-0">
                          <span className="font-mono text-[11px] text-zinc-700 truncate block">
                            {hackathonMatch ? hackathonMatch.name : 'CodeSrijan Arena'}
                          </span>
                        </div>

                        {/* Roster */}
                        <div className="md:col-span-2 md:text-center">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] bg-zinc-100 px-2 py-0.5 border border-zinc-300">
                            <span className="material-symbols-outlined text-[13px]">groups</span>
                            {team.memberCount || 0} / 4 Hackers
                          </span>
                        </div>

                        {/* Evaluation Score */}
                        <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
                          <span className={`px-2 py-0.5 font-mono text-xs font-bold border ${
                            team.isScored
                              ? 'bg-electric-blue text-white border-black'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-300'
                          }`}>
                            {team.isScored ? `${team.totalScore} PTS` : 'AWAITING EVAL'}
                          </span>
                          <span className="material-symbols-outlined text-sm text-zinc-500 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                            expand_more
                          </span>
                        </div>
                      </div>

                      {/* Expandable Breakdown Details */}
                      {isExpanded && (
                        <div className="bg-surface-container-lowest p-5 border-t-2 border-stark-black border-dashed animate-fade-in space-y-4">
                          {/* Operative Roster */}
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block mb-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">badge</span> SQUAD ROSTER & OPERATIVES
                            </span>
                            {members.length === 0 ? (
                              <p className="text-xs text-zinc-500 font-mono">1 Team Leader assigned.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                {members.map(m => (
                                  <div key={m.id} className="bg-pure-white border-2 border-stark-black p-2 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-electric-blue text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                      {(m.name || "?").charAt(0)}
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="font-bold text-xs truncate uppercase">{m.name}</p>
                                      <p className="font-mono text-[9px] text-zinc-500 truncate">{m.email}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Scoring Rubric Breakdown */}
                          {team.isScored ? (
                            <div>
                              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block mb-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">rubric</span> SCORING RUBRIC MATRIX
                              </span>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {(team.scores || []).map((sc: any, sIdx: number) => (
                                  <div key={sIdx} className="bg-pure-white border-2 border-stark-black p-2 text-center">
                                    <span className="text-[9px] uppercase font-bold text-zinc-500 block truncate">{sc.criteriaId}</span>
                                    <span className="font-display-sm text-lg font-bold">{sc.score}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-amber-50 border border-amber-300 p-2.5 text-xs text-amber-800 font-mono flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-amber-600">hourglass_empty</span>
                              OFFICIALLY ENROLLED SQUAD // UNRANKED / AWAITING EVALUATION
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
