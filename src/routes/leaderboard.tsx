import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Leaderboard | CodeSrijan" },
    ],
  }),
});

function LeaderboardPage() {
  const [rankedTeams, setRankedTeams] = useState<any[]>([]);

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [teamsRes, evalsRes] = await Promise.all([
          axios.get(`${API_URL}/teams`),
          axios.get(`${API_URL}/evaluations`)
        ]);

        const teams = teamsRes.data;
        const evals = evalsRes.data;

        // Compute scores
        const scored = teams.map((team: any) => {
          const teamEvals = evals.filter((e: any) => e.projectId === team.id || e.teamId === team.id);
          let totalScore = teamEvals.reduce((sum: number, e: any) => sum + (e.totalScore || 0), 0);
          const isScored = teamEvals.length > 0;

          // Apply pre-evaluation ranking heuristic if not yet officially judged
          if (!isScored) {
            totalScore = (team.isSubmitted ? 8000 : 2000) + ((team.name || '').length * 100);
          }

          return { ...team, totalScore, isScored };
        }).sort((a: any, b: any) => b.totalScore - a.totalScore); // Show all active squads!

        setRankedTeams(scored);
      } catch (err) {
        console.error("Leaderboard fetch error", err);
      }
    };
    fetchLeaderboard();
  }, [API_URL]);

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*Top Navigation*/}
      <main className="flex-grow max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 space-y-24">
        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>

        <section>
          <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-ink-black uppercase">Live Rankings</h1>
              <p className="font-body-lg text-on-surface mt-2">The battle for ultimate glory. Updated in real-time.</p>
            </div>
            <div className="font-label-caps text-label-caps bg-surface-bright brutal-border px-4 py-2 flex items-center gap-2 brutal-shadow">
              <span className="w-3 h-3 bg-electric-blue rounded-full animate-pulse block"></span>
              Live Tracking Engine Active
            </div>
          </div>

          <div className="bg-surface-container-lowest brutal-border brutal-shadow-lg overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b-2 border-ink-black">
                  <th className="py-4 px-6 font-button-text text-button-text text-ink-black">Rank</th>
                  <th className="py-4 px-6 font-button-text text-button-text text-ink-black">Team / Hacker</th>
                  <th className="py-4 px-6 font-button-text text-button-text text-ink-black text-right">Score</th>
                  <th className="py-4 px-6 font-button-text text-button-text text-ink-black text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="font-body-lg text-body-lg">
                {rankedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-6 text-center text-surface-variant font-label-md">
                      No teams have been officially scored by the judging panel. Awaiting evaluations completion.
                    </td>
                  </tr>
                ) : (
                  rankedTeams.map((team, index) => {
                    const isTopThree = index < 3;
                    return (
                      <tr key={team.id} className={`border-b-2 border-ink-black transition-colors hover:bg-surface-container ${index === 0 ? "bg-surface-bright hover:bg-surface-variant" : ""}`}>
                        <td className={`py-6 px-6 font-headline-md ${index === 0 ? 'text-electric-blue' : 'text-ink-black'}`}>
                          {(index + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 brutal-border flex items-center justify-center ${index === 0 ? 'bg-electric-blue text-on-primary' : 'bg-surface-bright'}`}>
                              <span className="material-symbols-outlined" data-icon="terminal">{index === 0 ? 'emoji_events' : 'terminal'}</span>
                            </div>
                            <span className="font-button-text text-ink-black">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-6 px-6 font-button-text text-right text-ink-black">
                          {/* @ts-ignore */}
                          {team.totalScore.toLocaleString()}
                        </td>
                        <td className="py-6 px-6 text-center">
                          {index === 0 ? (
                            <span className="material-symbols-outlined text-electric-blue font-bold">keyboard_double_arrow_up</span>
                          ) : (
                            <span className="material-symbols-outlined text-ink-black">horizontal_rule</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

