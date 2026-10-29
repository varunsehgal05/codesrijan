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

  // Modal States (replacing window.prompt and window.confirm)
  const [disqualifyTarget, setDisqualifyTarget] = useState<{ id: string; name: string } | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("Rule infraction / unauthorized assistance");
  
  const [reinstateTarget, setReinstateTarget] = useState<{ id: string; name: string } | null>(null);

  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState("Severe integrity violation / Code of conduct breach");

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

  const confirmDisqualify = async () => {
    if (!disqualifyTarget || !disqualifyReason.trim()) return;

    try {
      setActionLoadingId(disqualifyTarget.id);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${disqualifyTarget.id}/disqualify`, 
        { reason: disqualifyReason.trim(), notify: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Squad "${disqualifyTarget.name}" DISQUALIFIED. Members notified.`);
      setDisqualifyTarget(null);
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to disqualify squad.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmUndoDisqualify = async () => {
    if (!reinstateTarget) return;

    try {
      setActionLoadingId(reinstateTarget.id);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${reinstateTarget.id}/undo-disqualify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Squad "${reinstateTarget.name}" reinstated to active.`);
      setReinstateTarget(null);
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to restore squad.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmBanTeam = async () => {
    if (!banTarget || !banReason.trim()) return;

    try {
      setActionLoadingId(banTarget.id);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${banTarget.id}/ban`, 
        { reason: banReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Squad "${banTarget.name}" BANNED permanently.`);
      setBanTarget(null);
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
                        onClick={() => setReinstateTarget({ id: team.id, name: team.name })}
                        disabled={isActionBusy}
                        className="bg-emerald-600 hover:bg-emerald-700 text-pure-white font-label-bold text-xs uppercase px-4 py-2 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">restore</span>
                        REINSTATE SQUAD
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setDisqualifyTarget({ id: team.id, name: team.name });
                          setDisqualifyReason("Rule infraction / unauthorized assistance");
                        }}
                        disabled={isActionBusy}
                        className="bg-rose-600 hover:bg-stark-black text-pure-white font-label-bold text-xs uppercase px-4 py-2 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">gavel</span>
                        DISQUALIFY (DIQ)
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setBanTarget({ id: team.id, name: team.name });
                        setBanReason("Severe integrity violation / Code of conduct breach");
                      }}
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

      {/* Disqualify Modal (Neo-Brutalist, replaces window.prompt) */}
      {disqualifyTarget && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setDisqualifyTarget(null); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3">
              <span className="material-symbols-outlined text-rose-600 text-2xl">gavel</span>
              <h3 className="font-headline-md text-lg uppercase text-stark-black">DISQUALIFY SQUAD</h3>
            </div>
            <p className="font-code-snippet text-xs text-stark-black">
              Enter official disqualification reason for squad <strong className="bg-[#FEF08A] px-1">{disqualifyTarget.name}</strong>. Members will be notified.
            </p>
            <textarea
              rows={3}
              value={disqualifyReason}
              onChange={e => setDisqualifyReason(e.target.value)}
              className="w-full bg-surface-bright border-2 border-stark-black p-3 font-mono text-xs focus:outline-none focus:border-rose-600"
              placeholder="e.g. Code plagiarism / Rule 4.2 infraction"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDisqualifyTarget(null)}
                className="px-4 py-2 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisqualify}
                disabled={actionLoadingId === disqualifyTarget.id || !disqualifyReason.trim()}
                className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-rose-600 text-white hover:bg-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>{actionLoadingId === disqualifyTarget.id ? 'PROCESSING...' : 'CONFIRM DISQUALIFY'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reinstate Modal */}
      {reinstateTarget && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setReinstateTarget(null); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3">
              <span className="material-symbols-outlined text-emerald-600 text-2xl">restore</span>
              <h3 className="font-headline-md text-lg uppercase text-stark-black">REINSTATE SQUAD</h3>
            </div>
            <p className="font-code-snippet text-xs text-stark-black">
              Are you sure you want to restore squad <strong className="bg-[#FEF08A] px-1">{reinstateTarget.name}</strong> to active hackathon standing?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setReinstateTarget(null)}
                className="px-4 py-2 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmUndoDisqualify}
                disabled={actionLoadingId === reinstateTarget.id}
                className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-emerald-600 text-white hover:bg-black text-xs cursor-pointer"
              >
                {actionLoadingId === reinstateTarget.id ? 'REINSTATING...' : 'CONFIRM REINSTATE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Team Modal */}
      {banTarget && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setBanTarget(null); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3">
              <span className="material-symbols-outlined text-error text-2xl">block</span>
              <h3 className="font-headline-md text-lg uppercase text-stark-black">PERMANENT SQUAD BAN</h3>
            </div>
            <p className="font-code-snippet text-xs text-stark-black">
              CRITICAL: Enter permanent hackathon BAN reason for squad <strong className="bg-[#FEF08A] px-1">{banTarget.name}</strong>:
            </p>
            <textarea
              rows={3}
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              className="w-full bg-surface-bright border-2 border-stark-black p-3 font-mono text-xs focus:outline-none focus:border-error"
              placeholder="e.g. Severe harassment / Unethical breach"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setBanTarget(null)}
                className="px-4 py-2 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmBanTeam}
                disabled={actionLoadingId === banTarget.id || !banReason.trim()}
                className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-error text-white hover:bg-black text-xs cursor-pointer"
              >
                {actionLoadingId === banTarget.id ? 'BANNING...' : 'CONFIRM BAN'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
