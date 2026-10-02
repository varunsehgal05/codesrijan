import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/teams")({
  component: AdminTeams,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-error font-mono bg-pure-white h-screen flex flex-col justify-center items-center">
      <h2 className="text-xl font-bold mb-4 bg-stark-black text-pure-white px-4 py-2 brutal-border inline-block">TEAM DIRECTORY UNAVAILABLE</h2>
      <p>We couldn't retrieve the team directory.</p>
      <p className="mt-4 opacity-75">Error ID: TEAM-QUERY-104 | {error.message}</p>
    </div>
  )
});

function AdminTeams() {
  const { teams, users, refetchData } = useAppStore();
  const safeTeams = Array.isArray(teams) ? teams : [];
  
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Modal State
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    return safeTeams.filter(team => {
      const matchesSearch = team.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            team.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || team.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeTeams, searchQuery, statusFilter]);

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

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingId("saving");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      if (editingTeam.id && !editingTeam.id.startsWith("new-")) {
        // Edit
        await axios.put(`${API_BASE}/admin/teams/${editingTeam.id}`, editingTeam, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatusMsg({ type: 'success', text: `Squad "${editingTeam.name}" updated successfully.` });
      } else {
        // Create
        const payload = { ...editingTeam };
        delete payload.id;
        await axios.post(`${API_BASE}/admin/teams`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatusMsg({ type: 'success', text: `Squad "${editingTeam.name}" created successfully.` });
      }
      setIsModalOpen(false);
      await refetchData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || "Failed to save team." });
    } finally {
      setLoadingId(null);
    }
  };

  const openNewTeamModal = () => {
    setEditingTeam({
      id: "new-" + Date.now(),
      name: "",
      status: "forming",
      memberIds: [],
      leaderId: "",
      points: 0
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20 relative">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-3 py-1 inline-block transform -skew-x-6">
            TEAMS & SQUADS
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Global Operations Directory
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-stark-black text-pure-white px-6 py-3 font-code-snippet font-bold tracking-widest brutal-border uppercase">
            Total Quota: {safeTeams.length}
          </div>
          <button 
            onClick={openNewTeamModal}
            className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            PROVISION SQUAD
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-pure-white p-4 brutal-border flex flex-col md:flex-row gap-4 justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex-1 flex gap-2 items-center">
            <span className="material-symbols-outlined text-stark-black">search</span>
            <input 
                type="text" 
                placeholder="Search by ID or Squad Name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-bright border-b-2 border-stark-black p-2 font-code-snippet focus:outline-none focus:border-electric-blue uppercase"
            />
        </div>
        <div className="flex items-center gap-2">
            <span className="font-label-bold uppercase text-xs">STATUS:</span>
            <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-pure-white border-2 border-stark-black p-2 font-code-snippet font-bold text-sm focus:outline-none uppercase"
            >
                <option value="ALL">ALL STATES</option>
                <option value="forming">FORMING</option>
                <option value="active">ACTIVE</option>
                <option value="submitted">SUBMITTED</option>
                <option value="disqualified">DISQUALIFIED</option>
            </select>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
          <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-stark-black text-pure-white">
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Team ID</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Squad Name</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Status</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Roster</th>
              <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-text-muted font-code-snippet uppercase tracking-widest">
                  [SYS] No squad signatures detected in the grid.
                </td>
              </tr>
            ) : (
              filteredTeams.map((t, i) => (
                <tr key={t.id || i} className="border-b-2 border-stark-black hover:bg-surface-container transition-colors group">
                  <td className="p-4 font-code-snippet text-sm border-r-2 border-stark-black">{t.id}</td>
                  <td className="p-4 font-label-bold text-stark-black border-r-2 border-stark-black">{t.name}</td>
                  <td className="p-4 border-r-2 border-stark-black">
                      <span className={`px-2 py-1 text-xs font-bold uppercase border-2 ${t.status === 'disqualified' ? 'border-error text-error' : t.status === 'submitted' ? 'border-success text-success' : 'border-electric-blue text-electric-blue'}`}>
                          {t.status}
                      </span>
                  </td>
                  <td className="p-4 font-body-md border-r-2 border-stark-black">
                    {t.memberIds?.length || 0} / {t.maxMembers || 4} OPERATIVES
                  </td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => { setEditingTeam({...t}); setIsModalOpen(true); }}
                      className="bg-surface-bright text-stark-black px-4 py-2 font-label-caps text-xs brutal-border hover:bg-electric-blue hover:text-pure-white transition-all font-bold tracking-widest uppercase cursor-pointer"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDisqualify(t.id, t.name)}
                      disabled={loadingId === t.id}
                      className="bg-error text-pure-white px-4 py-2 font-label-caps text-xs border-2 border-stark-black hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold tracking-widest uppercase cursor-pointer disabled:opacity-50"
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

      {/* Editor Modal */}
      {isModalOpen && editingTeam && (
        <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="bg-electric-blue text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
                    <h3 className="font-headline-md uppercase tracking-widest">{editingTeam.id.startsWith("new-") ? "PROVISION NEW SQUAD" : "MODIFY SQUAD PROTOCOLS"}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>
                <form onSubmit={handleSaveTeam} className="p-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-xs">Squad Designation (Name)</label>
                        <input 
                            required 
                            type="text" 
                            value={editingTeam.name || ''} 
                            onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                            className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Status</label>
                            <select 
                                value={editingTeam.status || 'forming'} 
                                onChange={(e) => setEditingTeam({...editingTeam, status: e.target.value})}
                                className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase focus:outline-none"
                            >
                                <option value="forming">FORMING</option>
                                <option value="active">ACTIVE</option>
                                <option value="submitted">SUBMITTED</option>
                                <option value="disqualified">DISQUALIFIED</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Leader ID</label>
                            <input 
                                type="text" 
                                value={editingTeam.leaderId || ''} 
                                onChange={(e) => setEditingTeam({...editingTeam, leaderId: e.target.value})}
                                className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-xs">Hackathon ID Assignment</label>
                        <input 
                            type="text" 
                            value={editingTeam.hackathonId || ''} 
                            onChange={(e) => setEditingTeam({...editingTeam, hackathonId: e.target.value})}
                            className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none"
                            placeholder="e.g. hack-123456"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-xs">Member Roster (IDs, comma separated)</label>
                        <textarea 
                            value={(editingTeam.memberIds || []).join(', ')} 
                            onChange={(e) => setEditingTeam({...editingTeam, memberIds: e.target.value.split(',').map((id: string) => id.trim()).filter((id: string) => id)})}
                            className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet min-h-[80px] focus:outline-none"
                            placeholder="user-1, user-2..."
                        />
                    </div>

                    <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-4">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors"
                        >
                            CANCEL
                        </button>
                        <button 
                            type="submit" 
                            disabled={loadingId === "saving"}
                            className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">save</span>
                            {loadingId === "saving" ? 'SAVING...' : 'COMMIT SQUAD'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
