import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Live Leaderboard & Tournament Standings | CodeSrijan" },
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
                Tournament Standings & Evaluation Matrix — Scored across judge rubrics, operational bonuses, and penalty infractions.
              </p>
            </div>
            <div className="bg-stark-black text-pure-white px-4 py-2 font-mono text-xs font-bold border-2 border-stark-black flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-electric-blue">social_leaderboard</span>
              <span>{displayedTeams.length} SQUADS ENROLLED</span>
            </div>
          </div>
        </section>

        {/* Hackathon Selector Tabs */}
        <div className="bg-pure-white p-4 border-4 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-label-bold uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">trophy</span>
            <span>Select Hosted Tournament / Hackathon:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedHackathonId("ALL")}
              className={`px-4 py-2 font-label-bold text-xs uppercase border-2 transition-all cursor-pointer ${
                selectedHackathonId === "ALL"
                  ? "bg-electric-blue text-pure-white border-stark-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-surface-container text-stark-black border-stark-black hover:bg-zinc-100"
              }`}
            >
              ★ ALL TOURNAMENTS
            </button>
            {genuineHackathons.map(h => {
              const isSelected = selectedHackathonId === h.id;
              const isLive = h.status === 'live' || h.status === 'active';
              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedHackathonId(h.id)}
                  className={`px-4 py-2 font-label-bold text-xs uppercase border-2 transition-all cursor-pointer flex items-center gap-2 ${
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

        {/* Tournament Info Banner if specific hackathon selected */}
        {activeHackathonObj && (
          <div className="bg-pure-white p-6 border-4 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-stark-black text-pure-white px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase mb-2 inline-block">
                ACTIVE ARENA
              </span>
              <h2 className="font-display-sm text-2xl uppercase font-bold text-stark-black">{activeHackathonObj.name}</h2>
              <p className="font-code-snippet text-xs text-on-surface-variant mt-1 line-clamp-1">{activeHackathonObj.tagline || activeHackathonObj.description || "Official CodeSrijan Hackathon Arena"}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-bold uppercase border-2 ${
                activeHackathonObj.status === 'live' || activeHackathonObj.status === 'active'
                  ? 'border-success text-success bg-success/10'
                  : 'border-zinc-400 text-zinc-600 bg-zinc-100'
              }`}>
                {activeHackathonObj.status ? activeHackathonObj.status.toUpperCase() : 'ACTIVE'}
              </span>
              <Link
                to="/recruitment"
                className="bg-stark-black text-pure-white font-label-bold text-xs uppercase px-4 py-2 border-2 border-stark-black hover:bg-electric-blue transition-colors flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <span className="material-symbols-outlined text-[14px]">group_add</span>
                Join / Recruit Squad
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
        ) : displayedTeams.length === 0 ? (
          <div className="bg-pure-white p-16 border-4 border-stark-black text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <span className="material-symbols-outlined text-5xl text-zinc-300">group_off</span>
            <h3 className="font-headline-md text-xl uppercase font-bold text-stark-black">NO SQUADS ENROLLED IN THIS TOURNAMENT YET</h3>
            <p className="font-code-snippet text-xs text-on-surface-variant max-w-md mx-auto uppercase">
              Registration is active. Form or recruit your squad in the Recruitment Matrix to enter the tournament arena.
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
          <div className="flex flex-col gap-4">
            {displayedTeams.map((t, idx) => {
              const hackathonMatch = genuineHackathons.find(h => h.id === t.hackathonId);
              const members = (t.memberIds || []).map(mid => users.find(u => u.id === mid)).filter(Boolean);

              return (
                <div key={t.id} className="bg-pure-white border-4 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  {/* Main Row */}
                  <div 
                    className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer group gap-4"
                    onClick={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="font-display-lg text-3xl md:text-4xl text-stark-black w-10 text-center shrink-0">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="bg-stark-black text-pure-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                            #{t.id.substring(0, 10)}
                          </span>
                          {hackathonMatch && (
                            <span className="bg-surface-container-high text-stark-black border border-stark-black/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                              🏆 {hackathonMatch.name}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                            t.status === 'disqualified'
                              ? 'bg-rose-100 text-rose-800 border-rose-500'
                              : t.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-500'
                              : 'bg-blue-100 text-blue-800 border-blue-500'
                          }`}>
                            {t.status ? t.status.toUpperCase() : 'ACTIVE'}
                          </span>
                        </div>

                        <h2 className="font-label-bold uppercase text-xl md:text-2xl text-stark-black group-hover:text-electric-blue transition-colors line-clamp-1">
                          {t.name}
                        </h2>

                        <div className="font-code-snippet text-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-bold">
                            <span className="material-symbols-outlined text-[14px]">groups</span>
                            {t.memberCount || 0} / 4 HACKERS
                          </span>
                          {t.isScored ? (
                            <>
                              <span>Base: {t.evalScore}</span>
                              {t.bonusPoints > 0 && <span className="text-success font-bold">+{t.bonusPoints} BNS</span>}
                              {t.penaltyPoints > 0 && <span className="text-error font-bold">-{t.penaltyPoints} PNL</span>}
                            </>
                          ) : (
                            <span className="text-amber-700 bg-amber-100 px-2 py-0.5 border border-amber-400 font-bold text-[10px]">
                              ⚡ ENROLLED IN TOURNAMENT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 self-end md:self-auto shrink-0">
                      <div className="text-right">
                        <div className="font-label-bold uppercase text-[10px] text-on-surface-variant tracking-widest mb-1">
                          {t.isScored ? 'NET SCORE' : 'STATUS'}
                        </div>
                        <div className={`font-display-lg text-2xl md:text-3xl px-3 py-1 border-2 border-stark-black ${
                          t.isScored ? 'text-electric-blue bg-surface-container-lowest' : 'text-zinc-600 bg-zinc-100 text-sm font-mono'
                        }`}>
                          {t.isScored ? t.totalScore : 'IN MATRIX'}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-stark-black transition-transform duration-300" style={{ transform: expandedTeam === t.id ? 'rotate(180deg)' : 'none' }}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Expandable Breakdown Matrix & Squad Members */}
                  {expandedTeam === t.id && (
                    <div className="border-t-4 border-stark-black bg-surface-container-lowest p-6 animate-fade-in space-y-4">
                      
                      {/* Squad Members List */}
                      <div>
                        <h4 className="font-label-bold uppercase text-xs text-stark-black mb-2 tracking-widest flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">badge</span>
                          SQUAD ROSTER & OPERATIVES
                        </h4>
                        {members.length === 0 ? (
                          <p className="font-code-snippet text-xs text-on-surface-variant">Member records loading...</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                            {members.map(m => (
                              <div key={m.id} className="bg-pure-white border-2 border-stark-black p-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-electric-blue text-pure-white font-bold flex items-center justify-center text-xs border border-stark-black">
                                  {(m.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-label-bold text-xs truncate uppercase text-stark-black">{m.name}</p>
                                  <p className="font-mono text-[10px] text-zinc-500 truncate">{m.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Score Breakdown if scored */}
                      {t.isScored && (
                        <div>
                          <h4 className="font-label-bold uppercase text-xs text-stark-black mb-2 tracking-widest flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">rubric</span>
                            SCORING BREAKDOWN MATRIX
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {t.scores.map((sc: any, sIdx: number) => (
                              <div key={sIdx} className="bg-pure-white border-2 border-stark-black p-3 text-center">
                                <div className="font-label-bold uppercase text-[10px] text-on-surface-variant line-clamp-1">{sc.criteriaId}</div>
                                <div className="font-display-sm text-2xl text-stark-black mt-1">{sc.score}</div>
                              </div>
                            ))}
                          </div>
                          
                          {(t.bonusPoints > 0 || t.penaltyPoints > 0) && (
                            <div className="mt-3 flex gap-3">
                              {t.bonusPoints > 0 && (
                                <div className="flex-1 bg-pure-white border-2 border-success p-2.5 text-center text-success">
                                  <div className="font-label-bold uppercase text-[10px]">Operational Bonus</div>
                                  <div className="font-display-sm text-xl font-bold">+{t.bonusPoints}</div>
                                </div>
                              )}
                              {t.penaltyPoints > 0 && (
                                <div className="flex-1 bg-pure-white border-2 border-error p-2.5 text-center text-error">
                                  <div className="font-label-bold uppercase text-[10px]">Infraction Penalty</div>
                                  <div className="font-display-sm text-xl font-bold">-{t.penaltyPoints}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
