import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

interface LeaderboardItem {
  id: string;
  name: string;
  bonusPoints: number;
  penaltyPoints: number;
  evalScore: number;
  totalScore: number;
  isScored: boolean;
  scores: any[]; // The detailed scores from evaluations
}

function LeaderboardPage() {
  const [teams, setTeams] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const isVisible = true;

  useEffect(() => {
    if (!isVisible) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/leaderboard`);
        setTeams(res.data || []);
        setLoading(false);
      } catch (err: any) {
        console.error("Leaderboard fetch error", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className="min-h-screen bg-surface-container-lowest text-on-background flex flex-col items-center justify-center p-8">
        <div className="bg-pure-white p-12 border-4 border-stark-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center max-w-xl">
          <span className="material-symbols-outlined text-6xl text-ink-black mb-6">visibility_off</span>
          <h1 className="font-display-lg text-4xl uppercase text-stark-black mb-4">CLASSIFIED STANDINGS</h1>
          <p className="font-code-snippet text-on-surface-variant uppercase tracking-widest text-sm">
            The global leaderboard is currently locked by the administration. Check back after payload evaluation cycles conclude.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-background flex flex-col pb-20">
      <main className="flex-grow max-w-[1000px] mx-auto px-4 py-12 space-y-12 w-full">
        <section className="bg-pure-white p-8 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="font-display-lg text-headline-lg uppercase text-stark-black border-l-8 border-electric-blue pl-4 mb-2">GLOBAL LEADERBOARD</h1>
          <p className="font-code-snippet text-on-surface-variant uppercase tracking-widest text-xs">
            Live evaluation standings. Net score incorporates judge metrics, operational bonuses, and penalty infractions.
          </p>
        </section>

        {loading ? (
            <div className="text-center font-code-snippet uppercase tracking-widest animate-pulse p-12 text-stark-black">
                INITIALIZING RANKING MATRIX...
            </div>
        ) : teams.length === 0 ? (
            <div className="bg-pure-white p-16 border-4 border-stark-black text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <span className="material-symbols-outlined text-4xl mb-4 opacity-50">data_alert</span>
                <p className="font-code-snippet uppercase text-sm font-bold tracking-widest">No evaluated payloads detected yet.</p>
            </div>
        ) : (
            <div className="flex flex-col gap-4">
                {teams.map((t, idx) => (
                    <div key={t.id} className="bg-pure-white border-4 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                        {/* Main Row */}
                        <div 
                            className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer group"
                            onClick={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)}
                        >
                            <div className="flex items-center gap-6">
                                <div className="font-display-lg text-4xl md:text-5xl text-stark-black w-12 text-center shrink-0">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                </div>
                                <div>
                                    <h2 className="font-label-bold uppercase text-2xl md:text-3xl text-stark-black group-hover:text-electric-blue transition-colors line-clamp-1">{t.name}</h2>
                                    <div className="font-code-snippet text-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mt-1">
                                        <span>Base: {t.evalScore}</span>
                                        {t.bonusPoints > 0 && <span className="text-success font-bold">+{t.bonusPoints} BNS</span>}
                                        {t.penaltyPoints > 0 && <span className="text-error font-bold">-{t.penaltyPoints} PNL</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 md:mt-0 flex items-center gap-6 self-end md:self-auto">
                                <div className="text-right">
                                    <div className="font-label-bold uppercase text-[10px] text-on-surface-variant tracking-widest mb-1">NET SCORE</div>
                                    <div className="font-display-lg text-4xl text-electric-blue bg-surface-container-lowest px-4 py-1 border-2 border-stark-black">{t.totalScore}</div>
                                </div>
                                <span className="material-symbols-outlined text-stark-black transition-transform duration-300" style={{ transform: expandedTeam === t.id ? 'rotate(180deg)' : 'none' }}>
                                    expand_more
                                </span>
                            </div>
                        </div>

                        {/* Expandable Breakdown */}
                        {expandedTeam === t.id && (
                            <div className="border-t-4 border-stark-black bg-surface-container-lowest p-6 animate-fade-in">
                                <h3 className="font-label-bold uppercase text-xs text-stark-black mb-4 tracking-widest bg-pure-white border-2 border-stark-black inline-block px-3 py-1">SCORING BREAKDOWN MATRIX</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {t.scores.map((sc: any, sIdx: number) => (
                                        <div key={sIdx} className="bg-pure-white border-2 border-stark-black p-3 text-center">
                                            <div className="font-label-bold uppercase text-[10px] text-on-surface-variant line-clamp-1">{sc.criteriaId}</div>
                                            <div className="font-display-sm text-2xl text-stark-black mt-1">{sc.score}</div>
                                        </div>
                                    ))}
                                </div>
                                
                                {(t.bonusPoints > 0 || t.penaltyPoints > 0) && (
                                    <div className="mt-4 flex gap-4">
                                        {t.bonusPoints > 0 && (
                                            <div className="flex-1 bg-pure-white border-2 border-success p-3 text-center text-success">
                                                <div className="font-label-bold uppercase text-[10px]">Operational Bonus</div>
                                                <div className="font-display-sm text-2xl">+{t.bonusPoints}</div>
                                            </div>
                                        )}
                                        {t.penaltyPoints > 0 && (
                                            <div className="flex-1 bg-pure-white border-2 border-error p-3 text-center text-error">
                                                <div className="font-label-bold uppercase text-[10px]">Infraction Penalty</div>
                                                <div className="font-display-sm text-2xl">-{t.penaltyPoints}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
