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

  // Student search, slotting & dossier inspection states
  const [candidateSearch, setCandidateSearch] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("ALL");
  const [selectedOperativeId, setSelectedOperativeId] = useState<string | null>(null);
  const [operativeDossier, setOperativeDossier] = useState<any | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null);

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

  // Modal States (replacing window.prompt and window.confirm)
  const [disqualifyTarget, setDisqualifyTarget] = useState<{ id: string; name: string } | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("Rule infraction / unauthorized assistance");
  const [reinstateTarget, setReinstateTarget] = useState<{ id: string; name: string } | null>(null);
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState("Severe integrity violation / Code of conduct breach");

  // --------------------------------------------------------------------------
  // ADMIN ACTIONS: Disqualify, Undo Disqualify, Ban
  // --------------------------------------------------------------------------
  const confirmAdminDisqualify = async () => {
    if (!disqualifyTarget || !disqualifyReason.trim()) return;

    try {
      setActionLoadingId(disqualifyTarget.id);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/admin/teams/${disqualifyTarget.id}/disqualify`, 
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

  const confirmAdminUndoDisqualify = async () => {
    if (!reinstateTarget) return;

    try {
      setActionLoadingId(reinstateTarget.id);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/admin/teams/${reinstateTarget.id}/undo-disqualify`, {}, {
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

  const confirmAdminBanTeam = async () => {
    if (!banTarget || !banReason.trim()) return;

    try {
      setActionLoadingId(banTarget.id);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/admin/teams/${banTarget.id}/ban`, 
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

  const handleAdminDisqualify = confirmAdminDisqualify;
  const handleAdminUndoDisqualify = confirmAdminUndoDisqualify;
  const handleAdminBanTeam = confirmAdminBanTeam;

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

  const handleOpenDossier = async (userId: string) => {
    setSelectedOperativeId(userId);
    setDossierLoading(true);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_URL}/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOperativeDossier(res.data);
    } catch (err: any) {
      toast.error("Failed to load operative dossier.");
      setOperativeDossier(null);
    } finally {
      setDossierLoading(false);
    }
  };

  const handleToggleFriend = async (userId: string) => {
    try {
      setFriendActionLoading(userId);
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.post(`${API_URL}/users/${userId}/friend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.isFriend ? "Operative added to comrade network!" : "Operative removed from comrades.");
      if (refetchData) await refetchData();
      if (selectedOperativeId === userId) {
        handleOpenDossier(userId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle comrade status.");
    } finally {
      setFriendActionLoading(null);
    }
  };

  const getOperativeSlotting = (user: any) => {
    if (user.specialization) return user.specialization;
    const email = (user.email || '').toLowerCase();
    const name = (user.name || '').toLowerCase();
    if (email.includes('hacker1') || name.includes('hacker one') || email.includes('design')) return 'UI/UX DESIGN';
    if (email.includes('hacker2') || name.includes('hacker two') || email.includes('front')) return 'FRONTEND';
    if (email.includes('hacker3') || name.includes('hacker three') || email.includes('back')) return 'BACKEND';
    if (email.includes('hacker4') || name.includes('hacker four') || email.includes('ai')) return 'AI / ML';
    if (email.includes('hacker5') || name.includes('hacker five') || email.includes('sec')) return 'CYBERSECURITY';
    if (email.includes('hacker6') || name.includes('hacker six') || email.includes('full')) return 'FULLSTACK';
    return 'FULLSTACK';
  };

  const getOperativeSkills = (user: any, slotting: string) => {
    if (user.techStack && user.techStack.length > 0) return user.techStack;
    if (slotting === 'UI/UX DESIGN') return ['Figma', 'Design Systems', 'Tailwind', 'Wireframing'];
    if (slotting === 'FRONTEND') return ['React', 'TypeScript', 'Next.js', 'CSS Architecture'];
    if (slotting === 'BACKEND') return ['Node.js', 'Express', 'MongoDB Atlas', 'REST APIs'];
    if (slotting === 'AI / ML') return ['Python', 'PyTorch', 'LangChain', 'Prompt Engineering'];
    if (slotting === 'CYBERSECURITY') return ['Penetration Testing', 'OWASP', 'Linux', 'Cryptography'];
    return ['TypeScript', 'Fullstack Web', 'Docker', 'PostgreSQL'];
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
                Squad Recruitment & Hackathon Governance
              </h1>
              <p className="font-body-md text-text-muted mt-1 text-sm">
                Real-time oversight of all hackathon teams, player rosters, hackathon admissions, and disciplinary controls.
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
                <span className="text-xs font-label-bold uppercase whitespace-nowrap">Hackathon:</span>
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
                  Try adjusting your search query, hackathon selector, or status filter.
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

        {/* In-App Neo-Brutalist Modals with Backdrop Click-Outside */}
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
                  onClick={confirmAdminDisqualify}
                  disabled={actionLoadingId === disqualifyTarget.id || !disqualifyReason.trim()}
                  className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-rose-600 text-white hover:bg-black text-xs cursor-pointer"
                >
                  {actionLoadingId === disqualifyTarget.id ? 'PROCESSING...' : 'CONFIRM DISQUALIFY'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                  onClick={confirmAdminUndoDisqualify}
                  disabled={actionLoadingId === reinstateTarget.id}
                  className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-emerald-600 text-white hover:bg-black text-xs cursor-pointer"
                >
                  {actionLoadingId === reinstateTarget.id ? 'REINSTATING...' : 'CONFIRM REINSTATE'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                  onClick={confirmAdminBanTeam}
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
              {/* Search & Slotting Controls Toolbar */}
              <div className="bg-pure-white brutal-border brutal-shadow p-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="font-headline-md uppercase text-2xl text-ink-black flex items-center gap-2">
                      <span className="material-symbols-outlined text-electric-blue text-2xl">person_search</span>
                      {isTeamLeader ? "Recruit Free Hackers & Inspect Dossiers" : "Operative Network & Squad Marketplace"}
                    </h2>
                    <p className="font-body-md text-xs text-text-muted mt-0.5">
                      Filter candidates by technical specialization, inspect comprehensive dossiers, or link up comrades into your network.
                    </p>
                  </div>

                  {/* Operative Search Input */}
                  <div className="w-full md:w-80 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="Search name, skills, college..."
                      className="w-full pl-10 pr-3 py-2 bg-surface-container-high border-2 border-stark-black font-code-snippet text-xs focus:outline-none focus:border-electric-blue uppercase"
                    />
                  </div>
                </div>

                {/* Specialization Slotting Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mr-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">tune</span> SLOTTING:
                  </span>
                  {[
                    { id: 'ALL', label: 'ALL SLOTS' },
                    { id: 'UI/UX DESIGN', label: '🎨 UI/UX DESIGN' },
                    { id: 'FRONTEND', label: '⚡ FRONTEND' },
                    { id: 'BACKEND', label: '🛠️ BACKEND' },
                    { id: 'FULLSTACK', label: '💻 FULLSTACK' },
                    { id: 'AI / ML', label: '🧠 AI / ML' },
                    { id: 'CYBERSECURITY', label: '🛡️ CYBERSECURITY' }
                  ].map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSpecializationFilter(slot.id)}
                      className={`px-3 py-1 text-xs font-bold uppercase transition-all cursor-pointer brutal-border ${
                        specializationFilter === slot.id
                          ? 'bg-electric-blue text-white shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-surface hover:bg-zinc-200 text-ink-black'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operative Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  const candidatePool = users.filter(u => {
                    if (u.role !== 'student' || u.id === currentUser.id) return false;
                    const slotting = getOperativeSlotting(u);
                    const skills = getOperativeSkills(u, slotting);

                    if (specializationFilter !== 'ALL' && slotting !== specializationFilter) return false;

                    if (candidateSearch.trim()) {
                      const q = candidateSearch.toLowerCase().trim();
                      const matchName = u.name?.toLowerCase().includes(q);
                      const matchEmail = u.email?.toLowerCase().includes(q);
                      const matchCollege = u.college?.toLowerCase().includes(q);
                      const matchSlot = slotting.toLowerCase().includes(q);
                      const matchSkills = skills.some((s: string) => s.toLowerCase().includes(q));
                      if (!matchName && !matchEmail && !matchCollege && !matchSlot && !matchSkills) return false;
                    }
                    return true;
                  });

                  if (candidatePool.length === 0) {
                    return (
                      <div className="col-span-full text-center bg-pure-white brutal-border brutal-shadow p-12">
                        <span className="material-symbols-outlined text-4xl text-electric-blue mb-2">search_off</span>
                        <h3 className="font-headline-md text-ink-black uppercase text-xl">No Operatives Match Filter</h3>
                        <p className="font-mono text-zinc-500 text-xs mt-1">Adjust your search query or reset specialization slotting filters.</p>
                      </div>
                    );
                  }

                  return candidatePool.map((user) => {
                    const slotting = getOperativeSlotting(user);
                    const skills = getOperativeSkills(user, slotting);
                    const isFriend = Array.isArray((currentUser as any)?.friends) && (currentUser as any).friends.includes(user.id);
                    const isFreeAgent = !user.teamId;

                    return (
                      <article
                        key={user.id}
                        className="bg-pure-white brutal-border brutal-shadow p-5 flex flex-col justify-between gap-4 hover:-translate-y-1 transition-transform relative group"
                      >
                        {/* Header & Badges */}
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className="px-2 py-0.5 bg-stark-black text-white font-mono text-[10px] font-bold uppercase tracking-wider brutal-border">
                              {slotting}
                            </span>
                            <span className={`px-2 py-0.5 font-bold text-[10px] uppercase brutal-border ${
                              isFreeAgent ? 'bg-emerald-400 text-black' : 'bg-zinc-200 text-zinc-700'
                            }`}>
                              {isFreeAgent ? 'FREE AGENT' : 'ASSIGNED'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full border-2 border-stark-black bg-electric-blue text-white flex items-center justify-center font-black text-xl uppercase shrink-0 relative">
                              {(user.name || "?").charAt(0)}
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full" />
                            </div>
                            <div className="overflow-hidden">
                              <h3 className="font-headline-md uppercase text-lg truncate text-ink-black font-bold">
                                {user.name}
                              </h3>
                              <p className="font-mono text-[11px] text-zinc-500 truncate">{user.email}</p>
                            </div>
                          </div>

                          {/* Operative Institutional & Friends Metadata */}
                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-zinc-200 text-[11px] font-bold">
                            <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 border border-zinc-300 truncate max-w-[180px]">
                              🏛️ {user.college || 'Verified Institute'}
                            </span>
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-300">
                              👥 {(user as any)?.friends?.length || 0} Friends
                            </span>
                          </div>

                          {/* Tech Skill Tags */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {skills.slice(0, 4).map((skill: string) => (
                              <span
                                key={skill}
                                className="text-[10px] font-mono uppercase bg-surface-container px-2 py-0.5 border border-stark-black font-semibold"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="flex flex-col gap-2 pt-3 border-t-2 border-stark-black">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenDossier(user.id)}
                              className="flex-1 bg-surface-container hover:bg-zinc-200 text-stark-black text-[11px] font-bold uppercase py-2 px-2 brutal-border transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span> View Dossier
                            </button>
                            <button
                              onClick={() => handleToggleFriend(user.id)}
                              disabled={friendActionLoading === user.id}
                              className={`flex-1 text-[11px] font-bold uppercase py-2 px-2 brutal-border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                                isFriend
                                  ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                                  : 'bg-white hover:bg-amber-100 text-black'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isFriend ? 'check_circle' : 'person_add'}
                              </span>
                              {friendActionLoading === user.id ? 'Saving...' : (isFriend ? 'Comrades' : 'Add Friend')}
                            </button>
                          </div>

                          {isTeamLeader && isFreeAgent && (
                            <button
                              onClick={() => handleInvite(user.id)}
                              disabled={loading}
                              className="w-full bg-electric-blue hover:bg-stark-black hover:text-white text-white text-xs font-black uppercase py-2 px-3 brutal-border shadow-[2px_2px_0px_0px_#000] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">send</span> Dispatch Squad Invite
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  });
                })()}
              </div>

              {/* Open Squads Section when student has no squad */}
              {!hasSquad && (
                <div className="mt-8 pt-8 border-t-4 border-stark-black">
                  <h3 className="font-headline-md uppercase text-2xl text-ink-black mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-electric-blue">groups</span>
                    Available Open Squads Seeking Operatives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.filter(t => t.memberIds && t.memberIds.length < 4).length === 0 ? (
                      <div className="col-span-full text-center bg-pure-white brutal-border p-8">
                        <p className="font-mono text-zinc-500 text-xs">All deployed squads are currently full.</p>
                      </div>
                    ) : (
                      teams.filter(t => t.memberIds && t.memberIds.length < 4).map((team) => (
                        <article key={team.id} className="bg-pure-white brutal-border brutal-shadow p-5 flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h4 className="font-headline-md uppercase text-xl truncate font-black">{team.name}</h4>
                              <span className="bg-stark-black text-pure-white px-2 py-0.5 font-mono text-[10px] font-bold brutal-border">
                                {team.memberIds.length} / 4 SLOTS
                              </span>
                            </div>
                            <p className="text-xs text-zinc-600 line-clamp-2 min-h-[32px]">
                              {team.description || "Deploying custom tech stack for massive disruption."}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRequestJoin(team.id)}
                            disabled={loading}
                            className="w-full bg-electric-blue hover:bg-stark-black text-white text-xs font-black uppercase py-2.5 px-3 brutal-border shadow-[2px_2px_0px_0px_#000] transition-colors cursor-pointer"
                          >
                            Transmit Join Signature
                          </button>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}
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

        {/* Neo-Brutalist Operative Dossier Modal */}
        {selectedOperativeId && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedOperativeId(null);
                setOperativeDossier(null);
              }
            }}
            className="fixed inset-0 bg-stark-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          >
            <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,102,255,1)] w-full max-w-lg p-6 flex flex-col gap-4 relative">
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b-2 border-stark-black pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-electric-blue text-2xl">badge</span>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-electric-blue text-white px-2 py-0.5">
                      CLASSIFIED DOSSIER
                    </span>
                    <h3 className="font-headline-md text-lg uppercase text-stark-black mt-1">
                      Operative Technical Record
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedOperativeId(null);
                    setOperativeDossier(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center border-2 border-stark-black bg-surface hover:bg-error hover:text-white font-black text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {dossierLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-4 border-stark-black border-t-electric-blue rounded-full animate-spin" />
                  <p className="font-mono text-xs uppercase font-bold text-zinc-600">Retrieving Operative Dossier...</p>
                </div>
              ) : operativeDossier ? (
                <div className="flex flex-col gap-4">
                  {/* Top Profile Summary */}
                  <div className="flex items-center gap-4 bg-surface-container p-3.5 border-2 border-stark-black">
                    <div className="w-16 h-16 rounded-full border-2 border-stark-black bg-electric-blue text-white flex items-center justify-center font-black text-2xl uppercase shrink-0">
                      {(operativeDossier.name || "?").charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-headline-md uppercase text-xl font-bold truncate text-stark-black">
                        {operativeDossier.name}
                      </h4>
                      <p className="font-mono text-xs text-zinc-600 truncate">{operativeDossier.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-stark-black text-white text-[10px] font-mono font-bold uppercase">
                          {operativeDossier.specialization || 'FULLSTACK DEVELOPER'}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-mono font-black uppercase">
                          👥 {operativeDossier.friendsCount || 0} COMRADES
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Institution & Academic Standing */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-surface p-2.5 border-2 border-stark-black">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Institution</span>
                      <strong className="text-stark-black truncate block">{operativeDossier.college || 'Verified University'}</strong>
                    </div>
                    <div className="bg-surface p-2.5 border-2 border-stark-black">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Branch & Year</span>
                      <strong className="text-stark-black truncate block">{operativeDossier.branch || 'CSE'} • Year {operativeDossier.year || '4'}</strong>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="bg-surface p-3 border-2 border-stark-black">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Operative Directive / Bio</span>
                    <p className="font-mono text-xs text-zinc-800 leading-relaxed italic">
                      "{operativeDossier.bio || 'Tactical developer specialized in building robust software solutions for competitive hackathon operations.'}"
                    </p>
                  </div>

                  {/* Skills Arsenal */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">terminal</span> VERIFIED SKILLS ARSENAL
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(operativeDossier.techStack && operativeDossier.techStack.length > 0
                        ? operativeDossier.techStack
                        : ['React', 'TypeScript', 'Tailwind', 'Node.js', 'MongoDB Atlas']
                      ).map((tech: string) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 bg-yellow-300 text-stark-black text-[11px] font-mono uppercase font-bold border-2 border-stark-black shadow-[2px_2px_0px_0px_#000]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Squad Status */}
                  <div className="p-3 bg-zinc-100 border-2 border-zinc-400 text-xs flex justify-between items-center">
                    <span className="text-zinc-600 font-bold uppercase text-[10px]">Squad Status:</span>
                    <span className="font-black uppercase text-stark-black text-[11px]">
                      {operativeDossier.team ? `Enrolled in "${operativeDossier.team.name}"` : '🟢 FREE AGENT // OPEN FOR RECRUITMENT'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t-2 border-stark-black">
                    <button
                      onClick={() => handleToggleFriend(operativeDossier.id)}
                      disabled={friendActionLoading === operativeDossier.id}
                      className="flex-1 py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase border-2 border-stark-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {Array.isArray((currentUser as any)?.friends) && (currentUser as any).friends.includes(operativeDossier.id) ? 'check_circle' : 'person_add'}
                      </span>
                      {Array.isArray((currentUser as any)?.friends) && (currentUser as any).friends.includes(operativeDossier.id) ? 'Comrades' : 'Add Friend'}
                    </button>

                    {isTeamLeader && !operativeDossier.teamId && (
                      <button
                        onClick={() => {
                          handleInvite(operativeDossier.id);
                          setSelectedOperativeId(null);
                        }}
                        className="flex-1 py-2.5 px-3 bg-electric-blue hover:bg-stark-black text-white text-xs font-black uppercase border-2 border-stark-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">send</span> Invite to Squad
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedOperativeId(null);
                        setOperativeDossier(null);
                      }}
                      className="py-2.5 px-4 bg-surface hover:bg-zinc-200 text-stark-black text-xs font-bold uppercase border-2 border-stark-black transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                  Dossier records could not be retrieved from mainframe.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
