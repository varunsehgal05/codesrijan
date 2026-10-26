import { createFileRoute, Navigate, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/recruitment")({
  component: RecruitmentMatrix,
  head: () => ({
    meta: [
      { title: "Squad Recruitment & Directorate | CodeSrijan" },
    ],
  }),
});

function RecruitmentMatrix() {
  const { currentUser, teams, users, refetchData, createTeam, hackathons, registrations, isLoaded } = useAppStore();
  const navigate = useNavigate();
  
  // Student view state
  const [activeTab, setActiveTab] = useState<'find' | 'join' | 'create'>('find');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedHackathonId, setSelectedHackathonId] = useState(registrations?.[0]?.hackathonId || "");

  // Admin view state
  const [adminSearch, setAdminSearch] = useState("");
  const [adminHackathonFilter, setAdminHackathonFilter] = useState("ALL");
  const [adminStatusFilter, setAdminStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const BASE_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
  const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

  // Filtered teams for Admin view - declared unconditionally before any early returns
  const genuineHackathons = useMemo(() => {
    const list = Array.isArray(hackathons) ? hackathons : [];
    return list.filter(h => !h.isTest && !h.id.toLowerCase().startsWith('qa-') && !h.id.toLowerCase().startsWith('qa_'));
  }, [hackathons]);

  const adminFilteredTeams = useMemo(() => {
    const safeTeams = Array.isArray(teams) ? teams : [];
    const safeUsers = Array.isArray(users) ? users : [];
    return safeTeams.filter(team => {
      const q = adminSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        team.name?.toLowerCase().includes(q) || 
        team.id?.toLowerCase().includes(q) ||
        (team.memberIds || []).some(mid => {
          const u = safeUsers.find(user => user.id === mid);
          return u?.name?.toLowerCase().includes(q) || u?.email?.toLowerCase().includes(q);
        });

      const teamHackathon = team.hackathonId || (team as any).lockedForHackathonId;
      const matchesHackathon = adminHackathonFilter === "ALL" || teamHackathon === adminHackathonFilter;
      const matchesStatus = adminStatusFilter === "ALL" || (team.status || 'forming') === adminStatusFilter;

      return matchesSearch && matchesHackathon && matchesStatus;
    });
  }, [teams, users, adminSearch, adminHackathonFilter, adminStatusFilter]);

  const hasSquad = !!currentUser?.teamId;
  const currentTeam = (teams || []).find(t => t.id === currentUser?.teamId);
  const isTeamLeader = !!(currentTeam && currentUser && currentTeam.leaderId === currentUser.id);

  // --------------------------------------------------------------------------
  // ADMIN ACTIONS: Disqualify, Undo Disqualify, Ban
  // --------------------------------------------------------------------------
  const handleAdminDisqualify = async (teamId: string, teamName: string) => {
    const reason = window.prompt(`Enter authoritative disqualification reason for squad "${teamName}":`, "Rule infraction / unauthorized assistance");
    if (!reason || !reason.trim()) return;

    try {
      setActionLoadingId(teamId);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/admin/teams/${teamId}/disqualify`, 
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

  const handleAdminUndoDisqualify = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Restore squad "${teamName}" to active tournament standing?`)) return;

    try {
      setActionLoadingId(teamId);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/admin/teams/${teamId}/undo-disqualify`, {}, {
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

  const handleAdminBanTeam = async (teamId: string, teamName: string) => {
    const reason = window.prompt(`CRITICAL: Enter permanent tournament BAN reason for squad "${teamName}":`, "Severe integrity violation / Code of conduct breach");
    if (!reason || !reason.trim()) return;

    try {
      setActionLoadingId(teamId);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/admin/teams/${teamId}/ban`, 
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

  // --------------------------------------------------------------------------
  // STUDENT ACTIONS
  // --------------------------------------------------------------------------
  const handleJoinByCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    const teamCode = formData.get("teamCode") as string;
    const token = localStorage.getItem("codesrijan_auth_token");
    try {
      await axios.post(`${API_URL}/teams/join`, { teamCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refetchData();
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to join squad.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSquad = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    
    if (!selectedHackathonId) {
      setErrorMsg("You must select a hackathon to form a squad for.");
      setLoading(false);
      return;
    }

    try {
      if (!currentUser) return;
      await createTeam(name, currentUser.id, selectedHackathonId, "");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to create squad.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (teamId: string) => {
    try {
      setLoading(true);
      setErrorMsg("");
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/teams/${teamId}/request`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast("Join signature transmitted! Await Squad Leader approval.");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to transmit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId: string) => {
    try {
      if (!currentUser?.teamId) return;
      setLoading(true);
      setErrorMsg("");
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/teams/${currentUser.teamId}/invite`, { receiverId: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast("Invite dispatched to Operative.");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to dispatch invite.");
    } finally {
      setLoading(false);
    }
  };

  // Instant Loading Skeleton (after all hooks are called)
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-stark-black border-t-electric-blue rounded-full animate-spin mb-4"></div>
        <p className="font-code-snippet uppercase tracking-widest text-sm font-bold text-stark-black">
          SYNCHRONIZING SQUAD RECRUITMENT MATRIX...
        </p>
      </div>
    );
  }

  // Graceful Unauthenticated Guard
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-pure-white p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <span className="material-symbols-outlined text-5xl text-electric-blue mb-4">lock</span>
          <h1 className="font-display-lg text-3xl mb-3 text-ink-black uppercase">AUTHENTICATION REQUIRED</h1>
          <p className="font-body-md text-text-muted mb-6">
            You must authenticate your operative clearance before deploying squads or accessing the recruitment matrix.
          </p>
          <Link 
            to="/login" 
            className="inline-block w-full bg-electric-blue text-pure-white py-3 px-6 font-label-bold uppercase brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-stark-black transition-colors"
          >
            AUTHENTICATE IDENTITY ↗
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: ADMIN SQUAD DIRECTORATE (NO FIND / JOIN / CREATE TABS)
  // ==========================================================================
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-background text-on-background pb-20">
        <main className="max-w-[1300px] w-full mx-auto px-4 md:px-8 py-12 flex flex-col gap-8">
          
          {/* Header Card */}
          <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-error text-pure-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
                  ADMINISTRATION PRIVILEGED
                </span>
                <span className="bg-electric-blue text-pure-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
                  GLOBAL SQUAD DIRECTORY
                </span>
              </div>
              <h1 className="font-display-lg text-3xl md:text-4xl text-ink-black uppercase tracking-tight">
                Squad Recruitment & Tournament Governance
              </h1>
              <p className="font-body-md text-text-muted mt-1 text-sm">
                Real-time oversight of all hackathon teams, player rosters, tournament admissions, and disciplinary controls.
              </p>
            </div>

            <Link
              to="/admin/teams"
              className="bg-stark-black text-pure-white px-5 py-3 font-label-bold text-xs uppercase brutal-border hover:bg-electric-blue transition-colors flex items-center gap-2 shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              ADMIN TEAMS CONSOLE ↗
            </Link>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">
                search
              </span>
              <input
                type="text"
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                placeholder="Search by squad name, ID, player name, or email..."
                className="w-full pl-11 pr-4 py-3 bg-surface-container border-2 border-stark-black font-code-snippet text-xs focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 uppercase"
              />
            </div>

            {/* Hackathon Filter Dropdown */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-label-bold uppercase whitespace-nowrap">Tournament:</span>
                <select
                  value={adminHackathonFilter}
                  onChange={e => setAdminHackathonFilter(e.target.value)}
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

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-label-bold uppercase whitespace-nowrap">Status:</span>
                <select
                  value={adminStatusFilter}
                  onChange={e => setAdminStatusFilter(e.target.value)}
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

          {/* Squad Directorate List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="font-label-bold text-xs uppercase tracking-wider text-on-surface-variant">
                MATCHING SQUADS: {adminFilteredTeams.length} OF {teams.length} TOTAL
              </span>
            </div>

            {adminFilteredTeams.length === 0 ? (
              <div className="bg-pure-white brutal-border p-16 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <span className="material-symbols-outlined text-5xl text-zinc-300">group_off</span>
                <h3 className="font-headline-md text-xl uppercase font-bold text-stark-black">NO SQUADS MATCH CURRENT CRITERIA</h3>
                <p className="font-code-snippet text-xs text-on-surface-variant max-w-sm mx-auto uppercase">
                  Try adjusting your search query, tournament selector, or status filter.
                </p>
              </div>
            ) : (
              adminFilteredTeams.map(team => {
                const hackathonMatch = genuineHackathons.find(h => h.id === (team.hackathonId || (team as any).lockedForHackathonId));
                const memberList = (team.memberIds || []).map(mid => users.find(u => u.id === mid)).filter(Boolean);
                const isDq = team.status === 'disqualified';
                const isActionBusy = actionLoadingId === team.id;

                return (
                  <div 
                    key={team.id}
                    className="bg-pure-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5 hover:-translate-y-0.5 transition-transform"
                  >
                    {/* Top Row: Squad info & Badges */}
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
                        <h2 className="font-headline-sm text-2xl font-bold uppercase text-stark-black">
                          {team.name}
                        </h2>
                        {team.description && (
                          <p className="font-code-snippet text-xs text-on-surface-variant mt-1 line-clamp-1">
                            {team.description}
                          </p>
                        )}
                      </div>

                      {/* Disciplinary & Admin Actions */}
                      <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                        {isDq ? (
                          <button
                            onClick={() => handleAdminUndoDisqualify(team.id, team.name)}
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
                          onClick={() => handleAdminBanTeam(team.id, team.name)}
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

                    {/* Full Player / Operative Roster */}
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
        </main>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: STUDENT SQUAD BUILDER (WITH FIND, JOIN, CREATE TABS)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-background text-on-background">
      <main className="flex-grow max-w-[1200px] w-full mx-auto px-margin-desktop py-16 flex flex-col gap-12">

        <div className="w-full mb-2">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>

        <header className="flex flex-col gap-4 md:flex-row justify-between items-end border-b-4 border-ink-black pb-8">
          <div className="max-w-2xl">
            <h1 className="font-headline-lg text-[48px] text-ink-black uppercase tracking-tighter mb-2">Squad Builder</h1>
            <p className="font-body-lg text-text-muted">Deploy a highly-specialized team of 4 hackers. Link up directly to enter the arena.</p>
          </div>

          <div className="flex bg-surface-container-high brutal-border p-1 w-full md:w-auto relative group brutal-shadow-sm self-start md:self-end mt-4 md:mt-0 font-label-bold">
            <button
              onClick={() => setActiveTab('find')}
              className={`flex-1 md:w-32 px-4 py-2 transition-all border-2 cursor-pointer ${activeTab === 'find' ? 'bg-electric-blue text-pure-white border-stark-black brutal-shadow' : 'bg-surface text-ink-black border-transparent hover:border-ink-black hover:-translate-y-1'}`}
            >
              FIND
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 md:w-32 px-4 py-2 transition-all border-2 cursor-pointer ${activeTab === 'join' ? 'bg-electric-blue text-pure-white border-stark-black brutal-shadow' : 'bg-surface text-ink-black border-transparent hover:border-ink-black hover:-translate-y-1'}`}
            >
              JOIN
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 md:w-32 px-4 py-2 transition-all border-2 cursor-pointer ${activeTab === 'create' ? 'bg-electric-blue text-pure-white border-stark-black brutal-shadow' : 'bg-surface text-ink-black border-transparent hover:border-ink-black hover:-translate-y-1'}`}
            >
              CREATE
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="p-4 bg-error text-pure-white font-label-bold uppercase brutal-border">
            ERR: {errorMsg}
          </div>
        )}

        {hasSquad && !isTeamLeader && (
          <div className="p-6 bg-[#FFD700] text-stark-black font-label-bold uppercase brutal-border brutal-shadow mb-4">
            ⚠ WARNING: YOU ARE ALREADY BOUND TO A SQUAD ({currentTeam?.name}). CREATING OR JOINING A NEW MATRIX IS CURRENTLY LOCKED.
          </div>
        )}
        {isTeamLeader && (
          <div className="p-6 bg-electric-blue text-pure-white font-label-bold uppercase brutal-border brutal-shadow mb-4">
            SQUAD LEADER ACTIVE. YOU MAY RECRUIT FREE HACKERS FROM THE MARKETPLACE.
          </div>
        )}

        <div className="relative">
          {activeTab === 'find' && (
            <section className="flex flex-col gap-6">
              <h2 className="font-headline-md uppercase">{isTeamLeader ? "Recruit Free Hackers" : "Active Squad Marketplace"}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {isTeamLeader ? (
                  users.filter(u => !u.teamId && u.role === 'student' && u.id !== currentUser.id).length === 0 ? (
                    <div className="col-span-full text-center bg-surface brutal-border p-12">
                      <h2 className="font-headline-md text-ink-black uppercase">No Free Hackers</h2>
                      <p className="font-mono text-zinc-500 mt-2">All registered operatives are currently assigned to squads.</p>
                    </div>
                  ) : (
                    users.filter(u => !u.teamId && u.role === 'student' && u.id !== currentUser.id).map(user => (
                      <article key={user.id} className="bg-surface brutal-border brutal-shadow px-6 py-6 flex flex-col gap-4 relative group hover:-translate-y-1 transition-transform">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full border-2 border-ink-black flex items-center justify-center bg-electric-blue text-white font-bold text-xl uppercase">
                            {(user.name || "?").charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-headline-md uppercase text-xl truncate">{user.name}</h3>
                            <p className="font-label-caps text-xs text-text-muted">{user.email}</p>
                          </div>
                        </div>
                        <button onClick={() => handleInvite(user.id)} className="mt-4 w-full bg-electric-blue text-pure-white brutal-border py-2 font-button-text hover:bg-stark-black transition-colors cursor-pointer" disabled={loading}>
                          Dispatch Invite
                        </button>
                      </article>
                    ))
                  )
                ) : (
                  teams.filter(t => t.memberIds && t.memberIds.length < 4).length === 0 ? (
                    <div className="col-span-full text-center bg-surface brutal-border p-12">
                      <h2 className="font-headline-md text-ink-black uppercase">No Open Squads</h2>
                      <p className="font-mono text-zinc-500 mt-2">All scanned teams are packed to max capacity (4 Hackers).</p>
                    </div>
                  ) : (
                    teams.filter(t => t.memberIds && t.memberIds.length < 4).map((team) => (
                      <article key={team.id} className="bg-surface brutal-border brutal-shadow px-6 py-6 flex flex-col gap-4 relative group hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start">
                          <h3 className="font-headline-md uppercase text-2xl truncate">{team.name}</h3>
                          <span className="bg-stark-black text-pure-white px-2 py-1 font-label-bold text-xs brutal-border">{team.memberIds.length} / 4 SLOTS</span>
                        </div>
                        <div className="h-0.5 w-full bg-ink-black opacity-30"></div>
                        <p className="font-body-md text-ink-black italic line-clamp-2 min-h-[48px]">
                          {team.description || "Deploying custom tech stack for massive disruption."}
                        </p>
                        <button onClick={() => handleRequestJoin(team.id)} className="mt-4 w-full bg-electric-blue text-pure-white brutal-border py-2 font-button-text hover:bg-stark-black transition-colors cursor-pointer" disabled={hasSquad || loading}>
                          Transmit Join Signature
                        </button>
                      </article>
                    ))
                  )
                )}
              </div>
            </section>
          )}

          {activeTab === 'join' && (
            <section className="max-w-xl mx-auto w-full bg-surface brutal-border brutal-shadow p-8">
              <h2 className="font-headline-md uppercase mb-2">Connect to Matrix</h2>
              <p className="font-body-md text-text-muted mb-6">Enter the exact Squad Authorization Code provided by the team leader.</p>
              <form onSubmit={handleJoinByCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase">Squad Code (Terminal ID)</label>
                  <input name="teamCode" type="text" className="bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none uppercase" required placeholder="t-178..." />
                </div>
                <button disabled={loading || hasSquad} type="submit" className="mt-4 bg-ink-black text-pure-white font-label-bold px-6 py-4 brutal-border brutal-shadow-hover transition-all disabled:opacity-50 cursor-pointer">
                  {loading ? 'AUTHENTICATING...' : 'JOIN SQUAD'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'create' && (
            <section className="max-w-2xl mx-auto w-full bg-surface brutal-border brutal-shadow p-8">
              <h2 className="font-headline-md uppercase mb-2">Initialize New Squad</h2>
              <p className="font-body-md text-text-muted mb-6">You will automatically be locked in as the designated Team Leader.</p>
              
              {!registrations || registrations.length === 0 ? (
                <div className="p-6 bg-red-500/10 text-red-500 font-label-bold uppercase brutal-border mb-4">
                  ERR: YOU MUST REGISTER FOR A HACKATHON BEFORE FORMING A SQUAD. 
                  <br/><br/>
                  <Link to="/hackathons" className="underline hover:text-red-400">View available hackathons</Link>
                </div>
              ) : (
              <form onSubmit={handleCreateSquad} className="flex flex-col gap-6">

                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase">Target Hackathon</label>
                  <select 
                    className="bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" 
                    value={selectedHackathonId} 
                    onChange={(e) => setSelectedHackathonId(e.target.value)}
                    required
                  >
                    <option value="">Select a Hackathon</option>
                    {registrations.map((reg: any) => (
                      <option key={reg.hackathonId} value={reg.hackathonId}>
                        {hackathons.find(h => h.id === reg.hackathonId)?.name || reg.hackathonId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase">Squad Designation</label>
                  <input name="name" type="text" className="bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required placeholder="Cyber Punks" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase">Operation Parameters (Description)</label>
                  <textarea name="description" rows={4} className="bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" placeholder="We are building an AI-orchestrated blockchain app..." />
                </div>
                <button disabled={loading || hasSquad} type="submit" className="md:self-end bg-electric-blue text-pure-white font-label-bold px-8 py-4 brutal-border brutal-shadow-hover transition-all disabled:opacity-50 cursor-pointer">
                  {loading ? 'DEPLOYING SQUAD...' : 'DEPLOY SQUAD'}
                </button>
              </form>
              )}
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
