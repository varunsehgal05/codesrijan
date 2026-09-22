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
  points: number;
  evalScore: number;
  totalScore: number;
  memberCount: number;
  status: string;
}

function AdminLeaderboard() {
  const [teams, setTeams] = useState<TeamScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customPoints, setCustomPoints] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
        const points = Number(t.points) || 0;
        return {
          id: t.id,
          name: t.name,
          points,
          evalScore,
          totalScore: points + evalScore,
          memberCount: (t.memberIds || t.members || []).length,
          status: t.status || 'active'
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

  const handleModifyPoints = async (teamId: string, delta: number) => {
    setUpdatingId(teamId);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.patch(`${API_BASE}/teams/${teamId}/points`, { delta }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg({
        type: 'success',
        text: `Successfully ${delta >= 0 ? `added +${delta}` : `deducted ${delta}`} points for team [${teamId}].`
      });
      await fetchData();
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: e.response?.data?.message || "Failed to adjust team points."
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetExactPoints = async (teamId: string) => {
    const val = customPoints[teamId];
    if (val === undefined || val === '') return;
    const num = Number(val);
    if (isNaN(num)) return;

    setUpdatingId(teamId);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.patch(`${API_BASE}/teams/${teamId}/points`, { points: num }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg({
        type: 'success',
        text: `Assigned points explicitly to ${num} for team [${teamId}].`
      });
      setCustomPoints(prev => ({ ...prev, [teamId]: '' }));
      await fetchData();
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: e.response?.data?.message || "Failed to set team points."
      });
    } finally {
      setUpdatingId(null);
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
      setStatusMsg({
        type: 'success',
        text: "Standings broadcasted globally! Public Leaderboard is now LIVE."
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: "Failed to broadcast public leaderboard standings."
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-stark-black text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            LEADERBOARD CONTROL
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Live Squad Score & Points Matrix
          </p>
        </div>
        <button
          onClick={handlePublishStandings}
          disabled={publishing}
          className="bg-success text-pure-white px-8 py-3 brutal-border brutal-shadow font-label-bold uppercase hover:bg-stark-black hover:-translate-y-1 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">send</span>
          {publishing ? 'BROADCASTING...' : 'Publish Standings'}
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
          <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-pure-white p-6 brutal-border brutal-shadow">
          <p className="font-label-caps text-surface-variant mb-1">TOTAL SQUADS ENLISTED</p>
          <p className="font-display-lg text-3xl text-stark-black">{teams.length}</p>
        </div>
        <div className="bg-pure-white p-6 brutal-border brutal-shadow">
          <p className="font-label-caps text-surface-variant mb-1">TOP CURRENT SCORE</p>
          <p className="font-display-lg text-3xl text-electric-blue">{teams.length > 0 ? teams[0].totalScore : 0} PTS</p>
        </div>
        <div className="bg-pure-white p-6 brutal-border brutal-shadow">
          <p className="font-label-caps text-surface-variant mb-1">LEADING SQUAD</p>
          <p className="font-headline-sm uppercase text-stark-black truncate">{teams.length > 0 ? teams[0].name : 'N/A'}</p>
        </div>
      </div>

      {/* Main Points & Scores HUD */}
      <div className="bg-pure-white brutal-border brutal-shadow overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-stark-black text-pure-white">
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 w-16 text-center">Rank</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Squad Matrix</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 text-center">Base Points</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 text-center">Eval Score</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4 text-center">Total Score</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue text-center min-w-[320px]">Points Management</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-text-muted font-code-snippet uppercase tracking-widest animate-pulse">
                  [SYS] Loading telemetry and points grid...
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-text-muted font-code-snippet uppercase tracking-widest">
                  [SYS] No registered squads available in the leaderboard pipeline.
                </td>
              </tr>
            ) : (
              teams.map((t, idx) => {
                const isUpdating = updatingId === t.id;
                return (
                  <tr key={t.id} className="border-b-2 border-stark-black hover:bg-surface-container transition-colors">
                    <td className="p-4 font-display-lg text-xl text-center border-r-2 border-stark-black">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                    </td>
                    <td className="p-4 border-r-2 border-stark-black">
                      <div className="font-label-bold text-base text-stark-black uppercase">{t.name}</div>
                      <div className="font-code-snippet text-xs text-text-muted">ID: {t.id} • {t.memberCount}/4 Operatives</div>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-base border-r-2 border-stark-black">
                      {t.points}
                    </td>
                    <td className="p-4 text-center font-mono text-base border-r-2 border-stark-black text-on-surface-variant">
                      {t.evalScore}
                    </td>
                    <td className="p-4 text-center font-display-lg text-2xl font-bold text-electric-blue border-r-2 border-stark-black">
                      {t.totalScore}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {/* Quick Adjust Buttons */}
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleModifyPoints(t.id, 10)}
                            disabled={isUpdating}
                            className="bg-electric-blue text-white px-2 py-1 font-mono text-xs font-bold brutal-border hover:bg-stark-black disabled:opacity-50 cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleModifyPoints(t.id, 25)}
                            disabled={isUpdating}
                            className="bg-electric-blue text-white px-2 py-1 font-mono text-xs font-bold brutal-border hover:bg-stark-black disabled:opacity-50 cursor-pointer"
                          >
                            +25
                          </button>
                          <button
                            onClick={() => handleModifyPoints(t.id, 50)}
                            disabled={isUpdating}
                            className="bg-electric-blue text-white px-2 py-1 font-mono text-xs font-bold brutal-border hover:bg-stark-black disabled:opacity-50 cursor-pointer"
                          >
                            +50
                          </button>
                          <button
                            onClick={() => handleModifyPoints(t.id, -10)}
                            disabled={isUpdating}
                            className="bg-error text-white px-2 py-1 font-mono text-xs font-bold brutal-border hover:bg-stark-black disabled:opacity-50 cursor-pointer"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => handleModifyPoints(t.id, -25)}
                            disabled={isUpdating}
                            className="bg-error text-white px-2 py-1 font-mono text-xs font-bold brutal-border hover:bg-stark-black disabled:opacity-50 cursor-pointer"
                          >
                            -25
                          </button>
                        </div>

                        {/* Direct input for exact points */}
                        <div className="flex gap-2 justify-center items-center">
                          <input
                            type="number"
                            placeholder="Set points"
                            value={customPoints[t.id] ?? ''}
                            onChange={e => setCustomPoints({ ...customPoints, [t.id]: e.target.value })}
                            className="w-24 p-1 text-xs font-mono border-2 border-ink-black bg-surface-container"
                          />
                          <button
                            onClick={() => handleSetExactPoints(t.id)}
                            disabled={isUpdating || !customPoints[t.id]}
                            className="bg-stark-black text-white px-3 py-1 font-label-bold text-xs brutal-border hover:bg-electric-blue disabled:opacity-40 cursor-pointer uppercase"
                          >
                            {isUpdating ? 'Saving...' : 'Set'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
