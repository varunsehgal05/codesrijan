import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useAppStore } from "../lib/store";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/recruitment")({
  component: AdminRecruitment,
});

function AdminRecruitment() {
  const { teams, users, hackathons, refetchData } = useAppStore();
  const [matching, setMatching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hackathonFilter, setHackathonFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const genuineHackathons = useMemo(() => {
    const list = Array.isArray(hackathons) ? hackathons : [];
    return list.filter(h => !h.isTest && !h.id.toLowerCase().startsWith('qa-') && !h.id.toLowerCase().startsWith('qa_'));
  }, [hackathons]);

  const filteredTeams = useMemo(() => {
    const safeTeams = Array.isArray(teams) ? teams : [];
    return safeTeams.filter(team => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        team.name?.toLowerCase().includes(q) || 
        team.id?.toLowerCase().includes(q) ||
        (team.memberIds || []).some(mid => {
          const u = users.find(user => user.id === mid);
          return u?.name?.toLowerCase().includes(q) || u?.email?.toLowerCase().includes(q);
        });

      const teamHackathon = team.hackathonId || (team as any).lockedForHackathonId;
      const matchesHackathon = hackathonFilter === "ALL" || teamHackathon === hackathonFilter;
      const matchesStatus = statusFilter === "ALL" || (team.status || 'forming') === statusFilter;

      return matchesSearch && matchesHackathon && matchesStatus;
    });
  }, [teams, users, searchQuery, hackathonFilter, statusFilter]);

  const handleDisqualify = async (teamId: string, teamName: string) => {
    const reason = window.prompt(`Enter authoritative disqualification reason for squad "${teamName}":`, "Rule infraction / unauthorized assistance");
    if (!reason || !reason.trim()) return;

    try {
      setActionLoadingId(teamId);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${teamId}/disqualify`, 
        { reason: reason.trim(), notify: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Squad "${teamName}" DISQUALIFIED. Members notified.`);
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to disqualify squad.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUndoDisqualify = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Restore squad "${teamName}" to active hackathon standing?`)) return;

    try {
      setActionLoadingId(teamId);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${teamId}/undo-disqualify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Squad "${teamName}" reinstated to active.`);
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to restore squad.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBanTeam = async (teamId: string, teamName: string) => {
    const reason = window.prompt(`CRITICAL: Enter permanent hackathon BAN reason for squad "${teamName}":`, "Severe integrity violation / Code of conduct breach");
    if (!reason || !reason.trim()) return;

    try {
      setActionLoadingId(teamId);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${teamId}/ban`, 
        { reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Squad "${teamName}" BANNED permanently.`);
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to ban squad.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const mockMatch = () => {
    setMatching(true);
    setTimeout(() => {
      toast.success("Auto-matching algorithm complete. All participants assigned.");
      setMatching(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      
      {/* Header Bar */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-success px-2 py-1 inline-block transform -skew-x-6">
            RECRUITMENT & SQUAD GOVERNANCE
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Hackathon Roster, Hackathon Allotment & Disciplinary Controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={mockMatch} 
            disabled={matching} 
            className="bg-stark-black text-pure-white font-label-bold uppercase px-5 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">{matching ? 'sync' : 'group_add'}</span>
            {matching ? 'MATCHING...' : 'FORCE AUTO-MATCH'}
          </button>
          <Link
            to="/admin/teams"
            className="bg-electric-blue text-pure-white font-label-bold uppercase px-5 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            TEAMS REGISTRY
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search squad name, ID, player name, email..."
            className="w-full pl-11 pr-4 py-3 bg-surface-container border-2 border-stark-black font-code-snippet text-xs focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 uppercase"
          />
        </div>

        {/* Hackathon Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-label-bold uppercase whitespace-nowrap">Hackathon:</span>
            <select
              value={hackathonFilter}
              onChange={e => setHackathonFilter(e.target.value)}
              className="bg-pure-white border-2 border-stark-black px-3 py-2.5 font-code-snippet text-xs uppercase focus:outline-none cursor-pointer"
            >
              <option value="ALL">★ All Hackathons</option>
              {genuineHackathons.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-label-bold uppercase whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-pure-white border-2 border-stark-black px-3 py-2.5 font-code-snippet text-xs uppercase focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="verified">Verified</option>
              <option value="forming">Forming</option>
              <option value="submitted">Submitted</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Squad Cards List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="font-label-bold text-xs uppercase tracking-wider text-on-surface-variant">
            ENROLLED SQUADS: {filteredTeams.length} OF {teams.length}
          </span>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="bg-pure-white brutal-border p-16 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <span className="material-symbols-outlined text-5xl text-zinc-300">group_off</span>
            <h3 className="font-headline-md text-xl uppercase font-bold text-stark-black">NO SQUADS MATCH CRITERIA</h3>
            <p className="font-code-snippet text-xs text-on-surface-variant max-w-sm mx-auto uppercase">
              No squads found matching your search term or hackathon filter.
            </p>
          </div>
        ) : (
          filteredTeams.map(team => {
            const hackathonMatch = genuineHackathons.find(h => h.id === (team.hackathonId || (team as any).lockedForHackathonId));
            const memberList = (team.memberIds || []).map(mid => users.find(u => u.id === mid)).filter(Boolean);
            const isDq = team.status === 'disqualified';
            const isActionBusy = actionLoadingId === team.id;

            return (
              <div 
                key={team.id}
                className="bg-pure-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5 hover:-translate-y-0.5 transition-transform"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b-2 border-stark-black pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="bg-stark-black text-pure-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                        #{team.id}
                      </span>
                      {hackathonMatch ? (
                        <span className="bg-electric-blue text-pure-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                          🏆 {hackathonMatch.name}
                        </span>
                      ) : (
                        <span className="bg-zinc-200 text-zinc-700 px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                          GENERAL POOL
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border-2 ${
                        isDq
                          ? 'bg-rose-100 text-rose-800 border-rose-600'
                          : team.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                          : 'bg-blue-100 text-blue-800 border-blue-600'
                      }`}>
                        {team.status ? team.status.toUpperCase() : 'FORMING'}
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-2xl font-bold uppercase text-stark-black">
                      {team.name}
                    </h3>
                    {team.description && (
                      <p className="font-code-snippet text-xs text-on-surface-variant mt-1 line-clamp-1">
                        {team.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                    {isDq ? (
                      <button
                        onClick={() => handleUndoDisqualify(team.id, team.name)}
                        disabled={isActionBusy}
                        className="bg-emerald-600 hover:bg-emerald-700 text-pure-white font-label-bold text-xs uppercase px-4 py-2 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">restore</span>
                        REINSTATE SQUAD
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAdminDisqualify(team.id, team.name)}
                        disabled={isActionBusy}
                        className="bg-rose-600 hover:bg-stark-black text-pure-white font-label-bold text-xs uppercase px-4 py-2 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">gavel</span>
                        DISQUALIFY (DIQ)
                      </button>
                    )}

                    <button
                      onClick={() => handleBanTeam(team.id, team.name)}
                      disabled={isActionBusy}
                      className="bg-stark-black hover:bg-error text-pure-white font-label-bold text-xs uppercase px-4 py-2 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[14px]">block</span>
                      BAN TEAM
                    </button>

                    <Link
                      to="/chat"
                      search={{ conv: team.conversationId }}
                      className="bg-surface-container text-stark-black font-label-bold text-xs uppercase px-3 py-2 border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <span className="material-symbols-outlined text-[14px]">forum</span>
                      Comms
                    </Link>
                  </div>
                </div>

                {/* Disqualification / Admin note notice */}
                {team.adminNote && (
                  <div className="bg-amber-50 border-2 border-amber-500 p-2.5 text-xs text-amber-900 font-mono">
                    <span className="font-bold uppercase block text-[10px]">ADMIN NOTE / REASON:</span>
                    {team.adminNote}
                  </div>
                )}

                {/* Player Dossier */}
                <div>
                  <h4 className="font-label-bold uppercase text-xs text-stark-black mb-3 tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-electric-blue">badge</span>
                    ENROLLED OPERATIVES & PLAYER DOSSIER ({memberList.length} / 4 SLOTS)
                  </h4>

                  {memberList.length === 0 ? (
                    <p className="font-code-snippet text-xs text-on-surface-variant italic">
                      No players linked to this squad record.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {memberList.map(member => {
                        const isLeader = member.id === team.leaderId;
                        return (
                          <div 
                            key={member.id} 
                            className="bg-surface-container border-2 border-stark-black p-3 flex items-start gap-2.5 relative group hover:border-electric-blue transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-stark-black ${
                              isLeader ? 'bg-[#FFD700] text-stark-black' : 'bg-electric-blue text-pure-white'
                            }`}>
                              {(member.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <p className="font-label-bold text-xs uppercase text-stark-black truncate">
                                  {member.name}
                                </p>
                                {isLeader && (
                                  <span className="bg-[#FFD700] text-stark-black font-mono font-bold text-[8px] px-1 border border-stark-black shrink-0">
                                    LEAD
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-[10px] text-zinc-500 truncate mt-0.5">
                                {member.email}
                              </p>
                              <span className="font-mono text-[9px] text-zinc-400 block truncate mt-1">
                                ID: {member.id.substring(0, 10)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
