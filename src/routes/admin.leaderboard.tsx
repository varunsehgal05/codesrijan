import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/leaderboard")({
  component: AdminLeaderboard,
});

interface TeamScoreItem {
  id: string;
  name: string;
  bonusPoints: number;
  penaltyPoints: number;
  evalScore: number;
  totalScore: number;
  memberCount: number;
  isScored: boolean;
}

function AdminLeaderboard() {
  const [teams, setTeams] = useState<TeamScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // State for points editor
  const [editingTeam, setEditingTeam] = useState<TeamScoreItem | null>(null);
  const [draftBonus, setDraftBonus] = useState<number>(0);
  const [draftPenalty, setDraftPenalty] = useState<number>(0);
  const [savingPoints, setSavingPoints] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const [teamsRes, evalsRes] = await Promise.all([
        axios.get(`${API_BASE}/teams`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/evaluations`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);

      const rawTeams = teamsRes.data || [];
      const evals = evalsRes.data || [];

      const mapped: TeamScoreItem[] = rawTeams.map((t: any) => {
        const teamEvals = evals.filter((e: any) => e.projectId === t.id || e.teamId === t.id);
        const evalScore = teamEvals.reduce((acc: number, cur: any) => acc + (cur.totalScore || 0), 0);
        const bonusPoints = Number(t.bonusPoints) || 0;
        const penaltyPoints = Number(t.penaltyPoints) || 0;
        const totalScore = evalScore + bonusPoints - penaltyPoints;
        const isScored = teamEvals.length > 0;
        
        return {
          id: t.id,
          name: t.name,
          bonusPoints,
          penaltyPoints,
          evalScore,
          totalScore,
          memberCount: (t.memberIds || t.members || []).length,
          isScored
        };
      });

      // Sort by totalScore descending
      mapped.sort((a, b) => b.totalScore - a.totalScore);
      setTeams(mapped);
      setLoading(false);
    } catch (err: any) {
      console.error("Leaderboard fetch error", err);
      setStatusMsg({ type: 'error', text: "Failed to sync squad standings from mainframe." });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePoints = async () => {
    if (!editingTeam) return;
    setSavingPoints(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.patch(`${API_BASE}/teams/${editingTeam.id}/points`, { 
          bonusPoints: draftBonus, 
          penaltyPoints: draftPenalty 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg({ type: 'success', text: `Modifiers successfully applied for [${editingTeam.name}].` });
      setEditingTeam(null);
      await fetchData();
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.response?.data?.message || "Failed to adjust modifiers." });
    } finally {
      setSavingPoints(false);
    }
  };

  const handlePublishStandings = async () => {
    setPublishing(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/settings`, {
        key: 'leaderboardVisible',
        value: true,
        description: 'Broadcast scores to the public.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg({ type: 'success', text: "Standings broadcasted globally! Public Leaderboard is now LIVE." });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: "Failed to broadcast public leaderboard standings." });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            LEADERBOARD ENGINE
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Score Modifiers & Ranking Matrix
          </p>
        </div>
        <button
          onClick={handlePublishStandings}
          disabled={publishing}
          className="bg-electric-blue text-pure-white px-8 py-3 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-label-bold uppercase hover:-translate-y-1 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">cell_tower</span>
          {publishing ? 'BROADCASTING...' : 'PUBLISH STANDINGS'}
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${statusMsg.type === 'error' ? 'bg-error text-pure-white' : 'bg-success text-stark-black'}`}>
          <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-code-snippet text-on-surface-variant uppercase text-xs font-bold mb-2">Total Evaluated Squads</p>
          <p className="font-display-lg text-4xl text-stark-black">{teams.filter(t => t.isScored).length} <span className="text-xl text-on-surface-variant opacity-50">/ {teams.length}</span></p>
        </div>
        <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-code-snippet text-on-surface-variant uppercase text-xs font-bold mb-2">Maximum Current Score</p>
          <p className="font-display-lg text-4xl text-electric-blue">{teams.length > 0 && teams[0].isScored ? teams[0].totalScore : 0} <span className="text-xl text-on-surface-variant opacity-50">PTS</span></p>
        </div>
        <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-code-snippet text-on-surface-variant uppercase text-xs font-bold mb-2">Current Vanguard Matrix</p>
          <p className="font-headline-sm uppercase text-stark-black truncate text-xl">{teams.length > 0 && teams[0].isScored ? teams[0].name : 'N/A'}</p>
        </div>
      </div>

      {/* Main Points & Scores HUD */}
      <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-stark-black text-pure-white">
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 w-16 text-center">Rank</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Squad Matrix</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 text-center">Eval Score</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 text-center text-success">Bonuses</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 text-center text-error">Penalties</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 text-center">Net Score</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue text-center">Overrides</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-on-surface-variant font-code-snippet uppercase tracking-widest animate-pulse">
                  Syncing structural telemetry...
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-on-surface-variant font-code-snippet uppercase tracking-widest">
                  Zero active squads detected in mainframe.
                </td>
              </tr>
            ) : (
              teams.map((t, idx) => {
                return (
                  <tr key={t.id} className={`border-b-2 border-stark-black hover:bg-surface-container transition-colors ${!t.isScored ? 'bg-surface-container-lowest opacity-75' : ''}`}>
                    <td className="p-4 font-display-lg text-2xl text-center border-r-2 border-stark-black">
                      {t.isScored ? (idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1) : '-'}
                    </td>
                    <td className="p-4 border-r-2 border-stark-black">
                      <div className="font-label-bold text-lg text-stark-black uppercase truncate max-w-[200px]">{t.name}</div>
                      <div className="font-code-snippet text-[10px] text-on-surface-variant uppercase">ID: {t.id} • {t.memberCount} Mbrs</div>
                    </td>
                    <td className="p-4 text-center font-display-sm text-2xl border-r-2 border-stark-black text-stark-black">
                      {t.isScored ? t.evalScore : '-'}
                    </td>
                    <td className="p-4 text-center font-display-sm text-2xl border-r-2 border-stark-black text-success">
                      +{t.bonusPoints}
                    </td>
                    <td className="p-4 text-center font-display-sm text-2xl border-r-2 border-stark-black text-error">
                      -{t.penaltyPoints}
                    </td>
                    <td className="p-4 text-center font-display-lg text-3xl font-bold text-electric-blue border-r-2 border-stark-black">
                      {t.isScored ? (
                        t.totalScore
                      ) : (
                        <span className="text-surface-variant text-[10px] font-label-bold uppercase tracking-wider">AWAITING EVAL</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                        <button
                          onClick={() => {
                              setEditingTeam(t);
                              setDraftBonus(t.bonusPoints);
                              setDraftPenalty(t.penaltyPoints);
                          }}
                          className="bg-stark-black text-pure-white px-4 py-2 font-label-caps text-xs border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold tracking-widest uppercase cursor-pointer"
                        >
                          MODIFY
                        </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md flex flex-col">
                <div className="bg-stark-black text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center">
                    <h3 className="font-headline-md uppercase tracking-widest">ADJUST MODIFIERS</h3>
                    <button onClick={() => setEditingTeam(null)} className="text-pure-white hover:text-error transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 flex flex-col gap-6">
                    <div className="bg-surface-container-lowest border-2 border-stark-black p-4 text-center">
                        <div className="font-label-bold uppercase text-[10px] text-on-surface-variant mb-1">Target Squad</div>
                        <div className="font-display-sm text-xl uppercase">{editingTeam.name}</div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs text-success flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">add_circle</span> Bonus Points
                            </label>
                            <input 
                                type="number" 
                                min="0"
                                value={draftBonus} 
                                onChange={(e) => setDraftBonus(Math.max(0, parseInt(e.target.value) || 0))} 
                                className="w-full bg-surface-bright border-2 border-stark-black p-4 text-2xl text-center font-display-sm focus:outline-none focus:border-success text-success"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs text-error flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">do_not_disturb_on</span> Penalty Points
                            </label>
                            <input 
                                type="number" 
                                min="0"
                                value={draftPenalty} 
                                onChange={(e) => setDraftPenalty(Math.max(0, parseInt(e.target.value) || 0))} 
                                className="w-full bg-surface-bright border-2 border-stark-black p-4 text-2xl text-center font-display-sm focus:outline-none focus:border-error text-error"
                            />
                        </div>
                    </div>

                    <div className="bg-electric-blue text-pure-white p-4 border-2 border-stark-black flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="font-label-bold uppercase text-xs">Simulated Net Score</div>
                        <div className="font-display-lg text-3xl">
                            {editingTeam.evalScore + draftBonus - draftPenalty}
                        </div>
                    </div>

                    <div className="mt-2 border-t-2 border-stark-black pt-4 flex justify-end gap-4">
                        <button onClick={() => setEditingTeam(null)} className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors">
                            CANCEL
                        </button>
                        <button onClick={handleSavePoints} disabled={savingPoints} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 flex items-center gap-2">
                            <span className="material-symbols-outlined">sync</span>
                            {savingPoints ? 'SYNCING...' : 'COMMIT MODIFIERS'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
