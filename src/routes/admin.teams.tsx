import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/teams")({
  component: AdminTeams,
});

function AdminTeams() {
  const { teams, refetchData } = useAppStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDisqualify = async (teamId: string, teamName: string) => {
    if (!window.confirm(`ACTION CONFIRMATION: Are you sure you want to disqualify squad "${teamName}" [ID: ${teamId}]? All operative associations will be dissolved.`)) {
      return;
    }

    setLoadingId(teamId);
    setStatusMsg(null);

    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.delete(`${API_BASE}/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg({ type: 'success', text: `Squad "${teamName}" successfully disqualified and dissolved across grid.` });
      await refetchData();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || `Failed to disqualify squad ${teamName}.`
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            TEAMS & SQUADS
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Registered Squad Matrix
          </p>
        </div>
        <div className="bg-stark-black text-pure-white px-6 py-2 font-code-snippet font-bold tracking-widest brutal-border uppercase">
          Total Quota: {teams.length}
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
          <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="bg-pure-white brutal-border brutal-shadow overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-stark-black text-pure-white">
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Team ID</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Squad Name</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Join Code</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Member Capacity</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-text-muted font-code-snippet uppercase tracking-widest">
                  [SYS] No squad signatures detected in the grid.
                </td>
              </tr>
            ) : (
              teams.map((t, i) => (
                <tr key={t.id || i} className="border-b-2 border-stark-black hover:bg-surface-container transition-colors group">
                  <td className="p-4 font-code-snippet text-sm border-r-2 border-stark-black">{t.id}</td>
                  <td className="p-4 font-label-bold text-stark-black border-r-2 border-stark-black">{t.name}</td>
                  <td className="p-4 font-code-snippet font-bold text-electric-blue border-r-2 border-stark-black">{(t as any).joinCode || t.id}</td>
                  <td className="p-4 font-body-md border-r-2 border-stark-black">
                    {t.memberIds?.length || 0} / 4 OPERATIVES
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDisqualify(t.id, t.name)}
                      disabled={loadingId === t.id}
                      className="bg-error text-pure-white px-4 py-2 font-label-caps text-xs brutal-border brutal-shadow-hover transition-all font-bold tracking-widest uppercase hover:bg-stark-black cursor-pointer disabled:opacity-50"
                    >
                      {loadingId === t.id ? 'DISSOLVING...' : 'DISQUALIFY'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
