import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/teams")({
  component: AdminTeams,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-error font-mono bg-pure-white h-screen flex flex-col justify-center items-center">
      <h2 className="text-xl font-bold mb-4 bg-stark-black text-pure-white px-4 py-2 brutal-border inline-block">TEAM DIRECTORY UNAVAILABLE</h2>
      <p>{error instanceof Error ? error.message : "Unknown error"}</p>
    </div>
  )
});

type TeamStatus = "forming" | "active" | "verified" | "submitted" | "disqualified" | "completed";

interface EditForm {
  id: string;
  name: string;
  status: TeamStatus;
  leaderId: string;
  hackathonId: string;
  memberIds: string[];
  points: number;
  adminNote: string;
  notifyMessage: string;
  sendNotification: boolean;
}

const STATUS_META: Record<TeamStatus, { label: string; color: string; bg: string; icon: string }> = {
  forming:      { label: "FORMING",      color: "text-amber-500",     bg: "border-amber-500",      icon: "group_add" },
  active:       { label: "ACTIVE",       color: "text-electric-blue", bg: "border-electric-blue",  icon: "bolt" },
  verified:     { label: "VERIFIED",     color: "text-emerald-500",   bg: "border-emerald-500",    icon: "verified" },
  submitted:    { label: "SUBMITTED",    color: "text-violet-400",    bg: "border-violet-400",     icon: "task_alt" },
  disqualified: { label: "DISQUALIFIED", color: "text-rose-500",      bg: "border-rose-500",       icon: "gavel" },
  completed:    { label: "COMPLETED",    color: "text-amber-400",     bg: "border-amber-400",      icon: "emoji_events" },
};

function AdminTeams() {
  const { teams, users, refetchData } = useAppStore();
  const safeTeams = Array.isArray(teams) ? teams : [];
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingTeam, setEditingTeam] = useState<EditForm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dqTeam, setDqTeam] = useState<any | null>(null);
  const [dqReason, setDqReason] = useState("");
  const [notifyDq, setNotifyDq] = useState(true);
  const [viewTeam, setViewTeam] = useState<any | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<any | null>(null);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);

  const filteredTeams = useMemo(() => {
    return safeTeams.filter(team => {
      const matchesSearch = team.name?.toLowerCase().includes(searchQuery.toLowerCase()) || team.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || team.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [safeTeams, searchQuery, statusFilter]);

  const openEditModal = (t: any) => {
    setEditingTeam({ id: t.id || `new-${Date.now()}`, name: t.name || "", status: t.status || "forming", leaderId: t.leaderId || "", hackathonId: t.hackathonId || "", memberIds: Array.isArray(t.memberIds) ? t.memberIds : [], points: t.points || 0, adminNote: t.adminNote || "", notifyMessage: "", sendNotification: false });
    setIsModalOpen(true);
  };

  const openNewTeamModal = () => {
    setEditingTeam({ id: `new-${Date.now()}`, name: "", status: "forming", leaderId: "", hackathonId: "", memberIds: [], points: 0, adminNote: "", notifyMessage: "", sendNotification: false });
    setIsModalOpen(true);
  };

  const executeDisqualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dqReason.trim() || !dqTeam) return;
    setLoadingId(dqTeam.id);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${dqTeam.id}/disqualify`, { reason: dqReason, notify: notifyDq }, { headers: { Authorization: `Bearer ${token}` } });
      setStatusMsg({ type: "success", text: `Squad "${dqTeam.name}" DISQUALIFIED. ${notifyDq ? "Members notified." : ""}` });
      toast.success(`Squad "${dqTeam.name}" disqualified.`);
      setDqTeam(null); setDqReason("");
      await refetchData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to disqualify." });
      toast.error(err.response?.data?.message || "Failed to disqualify.");
    } finally { setLoadingId(null); }
  };

  const handleUndoDisqualify = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Restore squad "${teamName}"?`)) return;
    setLoadingId(teamId);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${teamId}/undo-disqualify`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setStatusMsg({ type: "success", text: `Squad "${teamName}" restored.` });
      toast.success(`Squad "${teamName}" restored.`);
      await refetchData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally { setLoadingId(null); }
  };

  const handleBanTeam = async (teamId: string, teamName: string) => {
    const reason = window.prompt(`CRITICAL: Enter permanent hackathon BAN reason for squad "${teamName}":`, "Severe integrity violation / Code of conduct breach");
    if (!reason || !reason.trim()) return;

    setLoadingId(teamId);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${teamId}/ban`, 
        { reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Squad "${teamName}" BANNED permanently.`);
      setStatusMsg({ type: "success", text: `Squad "${teamName}" BANNED permanently.` });
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to ban squad.");
      setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to ban squad." });
    } finally { setLoadingId(null); }
  };

  const handleVerifyTeam = async (teamId: string, teamName: string) => {
    setLoadingId(teamId);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${teamId}/verify`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setStatusMsg({ type: "success", text: `Squad "${teamName}" officially VERIFIED & CLEARED. Members notified.` });
      toast.success(`Squad "${teamName}" verified!`);
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to verify squad.");
      setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to verify squad." });
    } finally { setLoadingId(null); }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    setLoadingId("saving");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const isNew = editingTeam.id.startsWith("new-");
      const payload = { name: editingTeam.name, status: editingTeam.status, leaderId: editingTeam.leaderId, hackathonId: editingTeam.hackathonId, memberIds: editingTeam.memberIds, points: editingTeam.points, adminNote: editingTeam.adminNote };
      if (isNew) {
        await axios.post(`${API_BASE}/admin/teams`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`Squad "${editingTeam.name}" provisioned.`);
      } else {
        await axios.put(`${API_BASE}/admin/teams/${editingTeam.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`Squad "${editingTeam.name}" updated.`);
        if (editingTeam.sendNotification && editingTeam.notifyMessage.trim()) {
          try {
            await axios.post(`${API_BASE}/admin/teams/${editingTeam.id}/notify`, { message: editingTeam.notifyMessage.trim(), type: "team_updated", title: "Squad Update" }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Team notification dispatched.");
          } catch { toast.error("Saved but notification failed."); }
        }
      }
      setStatusMsg({ type: "success", text: isNew ? `Squad "${editingTeam.name}" created.` : `Squad "${editingTeam.name}" updated.` });
      setIsModalOpen(false); setEditingTeam(null);
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save team.");
      setStatusMsg({ type: "error", text: err.response?.data?.message || "Failed." });
    } finally { setLoadingId(null); }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTarget || !notifyMsg.trim()) return;
    setNotifyLoading(true);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/teams/${notifyTarget.id}/notify`, { message: notifyMsg.trim(), type: "admin_message", title: "Admin Message" }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Notification dispatched to all squad members.");
      setNotifyTarget(null); setNotifyMsg("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send notification.");
    } finally { setNotifyLoading(false); }
  };

  const getMemberNames = (memberIds: string[]) => memberIds.map(id => { const u = users.find(u => u.id === id); return u ? u.name : id; });

  const statusCounts = useMemo(() => {
    const c = { ALL: safeTeams.length, forming: 0, active: 0, verified: 0, submitted: 0, disqualified: 0, completed: 0 };
    safeTeams.forEach(t => { if (Object.prototype.hasOwnProperty.call(c, t.status || "forming")) (c as any)[t.status || "forming"]++; });
    return c;
  }, [safeTeams]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20 relative">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-3 py-1 inline-block transform -skew-x-6">TEAMS & SQUADS</h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">Global Operations — Admin Edit, Verify, Notify & Status Control</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-stark-black text-pure-white px-6 py-3 font-code-snippet font-bold tracking-widest brutal-border uppercase">Total: {safeTeams.length}</div>
          <button onClick={openNewTeamModal} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined">add</span>PROVISION SQUAD
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "forming", "active", "verified", "submitted", "disqualified", "completed"] as const).map(s => {
          const meta = s === "ALL" ? { label: "ALL", color: "text-stark-black", bg: "border-stark-black", icon: "list" } : STATUS_META[s];
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase border-2 transition-all ${active ? `bg-stark-black text-pure-white ${meta.bg}` : `bg-pure-white ${meta.color} ${meta.bg} hover:opacity-80`}`}>
              <span className="material-symbols-outlined text-sm">{meta.icon}</span>
              {meta.label}
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-sm ${active ? "bg-pure-white text-stark-black" : "bg-stark-black text-pure-white"}`}>{(statusCounts as any)[s]}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-pure-white p-4 brutal-border flex gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="material-symbols-outlined text-stark-black self-center">search</span>
        <input type="text" placeholder="Search by ID or Squad Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-surface-bright border-b-2 border-stark-black p-2 font-code-snippet focus:outline-none focus:border-electric-blue uppercase" />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="text-error font-bold text-xs uppercase px-2 py-1 border border-error hover:bg-error hover:text-white transition-all">Clear</button>}
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === "error" ? "bg-error text-white" : "bg-success text-stark-black"}`}>
          <span className="material-symbols-outlined">{statusMsg.type === "error" ? "error" : "check_circle"}</span>
          {statusMsg.text}
          <button onClick={() => setStatusMsg(null)} className="ml-auto opacity-60 hover:opacity-100">x</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full p-12 text-center text-text-muted font-code-snippet uppercase tracking-widest border-4 border-dashed border-stark-black bg-surface-bright">
            [SYS] No squad signatures detected in the grid.
          </div>
        ) : filteredTeams.map((t, i) => {
          const meta = STATUS_META[(t.status as TeamStatus) || "forming"] || STATUS_META.forming;
          return (
            <div key={t.id || i} className="bg-pure-white border-4 border-stark-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="bg-stark-black text-pure-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">{meta.icon}</span>
                  <span className="font-label-bold text-sm uppercase truncate max-w-[160px]">{t.name || "Unnamed Squad"}</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase border ${meta.color} ${meta.bg}`}>{meta.label}</span>
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-bright border border-stark-black p-2">
                    <span className="block text-on-surface-variant uppercase font-bold text-[10px]">Team ID</span>
                    <span className="font-code-snippet truncate block text-[11px]">{t.id}</span>
                  </div>
                  <div className="bg-surface-bright border border-stark-black p-2">
                    <span className="block text-on-surface-variant uppercase font-bold text-[10px]">Members</span>
                    <span className="font-black">{t.memberIds?.length || 0} / {t.maxMembers || 4}</span>
                  </div>
                  {t.hackathonId && (
                    <div className="bg-surface-bright border border-stark-black p-2 col-span-2">
                      <span className="block text-on-surface-variant uppercase font-bold text-[10px]">Hackathon</span>
                      <span className="font-code-snippet text-[11px] truncate block">{t.hackathonId}</span>
                    </div>
                  )}
                </div>
                {t.memberIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {getMemberNames(t.memberIds.slice(0, 3)).map((name: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-surface-container border border-stark-black px-1.5 py-0.5 font-mono uppercase">{name}</span>
                    ))}
                    {t.memberIds.length > 3 && <span className="text-[10px] bg-electric-blue text-white px-1.5 py-0.5 font-bold">+{t.memberIds.length - 3}</span>}
                  </div>
                )}
                {t.adminNote && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-2 text-[11px] text-amber-800">
                    <span className="font-bold block">Admin Note:</span> {t.adminNote}
                  </div>
                )}
              </div>
              <div className="border-t-2 border-stark-black p-3 grid grid-cols-3 gap-2">
                <button onClick={() => setViewTeam(t)} className="bg-surface-bright text-stark-black py-2 font-label-caps text-[10px] brutal-border hover:bg-stark-black hover:text-pure-white transition-all font-black uppercase flex flex-col items-center gap-0.5">
                  <span className="material-symbols-outlined text-sm">visibility</span>VIEW
                </button>
                <button onClick={() => openEditModal(t)} className="bg-electric-blue text-pure-white py-2 font-label-caps text-[10px] border-2 border-stark-black hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase flex flex-col items-center gap-0.5">
                  <span className="material-symbols-outlined text-sm">edit</span>EDIT
                </button>
                <button onClick={() => { setNotifyTarget(t); setNotifyMsg(""); }} className="bg-violet-600 text-white py-2 font-label-caps text-[10px] border-2 border-stark-black hover:-translate-y-0.5 transition-all font-black uppercase flex flex-col items-center gap-0.5">
                  <span className="material-symbols-outlined text-sm">notifications</span>NOTIFY
                </button>
              </div>
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                {t.status !== "verified" && t.status !== "disqualified" ? (
                  <button onClick={() => handleVerifyTeam(t.id, t.name)} disabled={loadingId === t.id}
                    className="bg-emerald-500 text-stark-black py-2 font-label-caps text-[10px] border-2 border-stark-black hover:-translate-y-0.5 transition-all font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-sm">verified</span>VERIFY SQUAD
                  </button>
                ) : t.status === "verified" ? (
                  <div className="bg-emerald-50 text-emerald-800 border-2 border-emerald-500 py-2 font-label-caps text-[10px] font-black uppercase flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>VERIFIED ✓
                  </div>
                ) : (
                  <button onClick={() => handleUndoDisqualify(t.id, t.name)} disabled={loadingId === t.id}
                    className="bg-success text-stark-black py-2 font-label-caps text-[10px] border-2 border-stark-black hover:-translate-y-0.5 transition-all font-black uppercase disabled:opacity-50 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">undo</span>RESTORE
                  </button>
                )}

                {t.status !== "disqualified" ? (
                  <button onClick={() => { setDqTeam(t); setDqReason(""); setNotifyDq(true); }} disabled={loadingId === t.id}
                    className="bg-error text-pure-white py-2 font-label-caps text-[10px] border-2 border-stark-black hover:-translate-y-0.5 transition-all font-black uppercase disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer">
                    <span className="material-symbols-outlined text-sm">gavel</span>DISQUALIFY
                  </button>
                ) : (
                  <button onClick={() => { setNotifyTarget(t); setNotifyMsg(""); }}
                    className="bg-amber-500 text-stark-black py-2 font-label-caps text-[10px] border-2 border-stark-black hover:-translate-y-0.5 transition-all font-black uppercase flex items-center justify-center gap-1 cursor-pointer">
                    <span className="material-symbols-outlined text-sm">mail</span>MESSAGE
                  </button>
                )}

                <button onClick={() => handleBanTeam(t.id, t.name)} disabled={loadingId === t.id}
                  className="bg-stark-black hover:bg-error text-pure-white py-2 font-label-caps text-[10px] border-2 border-stark-black hover:-translate-y-0.5 transition-all font-black uppercase disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-sm">block</span>BAN TEAM
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {viewTeam && (
        <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-pure-white max-w-xl w-full border-4 border-stark-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="bg-stark-black p-4 border-b-4 border-electric-blue flex justify-between items-center sticky top-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">groups</span>
                <h3 className="font-display-lg text-lg uppercase text-pure-white tracking-widest">{viewTeam.name}</h3>
              </div>
              <button onClick={() => setViewTeam(null)} className="text-pure-white hover:text-electric-blue"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-4 text-sm font-mono">
              <div className="grid grid-cols-2 gap-3">
                {[{ label: "Team ID", value: viewTeam.id }, { label: "Status", value: viewTeam.status || "forming" },
                  { label: "Leader ID", value: viewTeam.leaderId || "N/A" }, { label: "Hackathon", value: viewTeam.hackathonId || "N/A" },
                  { label: "Members", value: `${viewTeam.memberIds?.length || 0} / ${viewTeam.maxMembers || 4}` }, { label: "Points", value: viewTeam.points || 0 }
                ].map(row => (
                  <div key={row.label} className="bg-surface-bright border-2 border-stark-black p-3">
                    <span className="text-on-surface-variant uppercase text-[10px] font-bold block">{row.label}</span>
                    <span className="font-black break-all">{row.value}</span>
                  </div>
                ))}
              </div>
              {viewTeam.memberIds?.length > 0 && (
                <div className="bg-surface-bright border-2 border-stark-black p-3">
                  <span className="text-on-surface-variant uppercase text-[10px] font-bold block mb-2">Member Roster</span>
                  <div className="space-y-1">
                    {viewTeam.memberIds.map((id: string) => {
                      const u = users.find(u => u.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 bg-electric-blue inline-block shrink-0"></span>
                          <span className="font-bold">{u?.name || id}</span>
                          {u?.email && <span className="text-zinc-500">-- {u.email}</span>}
                          {id === viewTeam.leaderId && <span className="text-[10px] bg-electric-blue text-white px-1.5 font-bold uppercase">LEADER</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t-2 border-stark-black">
                <button onClick={() => { setViewTeam(null); openEditModal(viewTeam); }} className="flex-1 bg-electric-blue text-white font-label-bold uppercase py-3 border-2 border-stark-black flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">edit</span>Edit
                </button>
                <button onClick={() => { setViewTeam(null); setNotifyTarget(viewTeam); setNotifyMsg(""); }} className="flex-1 bg-violet-600 text-white font-label-bold uppercase py-3 border-2 border-stark-black flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">notifications</span>Notify
                </button>
                <button onClick={() => setViewTeam(null)} className="bg-surface-container font-label-bold uppercase py-3 px-5 border-2 border-stark-black hover:bg-zinc-200">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dqTeam && (
        <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-pure-white max-w-xl w-full border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-error p-4 border-b-4 border-stark-black flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white">gavel</span>
                <h3 className="font-display-lg text-2xl uppercase text-pure-white tracking-widest">DISQUALIFY TEAM</h3>
              </div>
              <button onClick={() => setDqTeam(null)} className="text-pure-white hover:text-stark-black"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={executeDisqualify} className="p-8 flex flex-col gap-6">
              <div className="bg-rose-50 border-2 border-error p-4">
                <span className="font-black text-error uppercase text-sm">{dqTeam.name}</span>
                <span className="text-xs text-zinc-600 ml-2">({dqTeam.memberIds?.length || 0} members)</span>
              </div>
              <div>
                <label className="font-code-snippet uppercase tracking-widest text-xs font-bold text-on-surface-variant block mb-2">Reason *</label>
                <textarea required value={dqReason} onChange={e => setDqReason(e.target.value)} rows={4}
                  placeholder="State the specific reason (e.g. rule violation, plagiarism)..."
                  className="w-full bg-pure-white p-4 font-code-snippet border-2 border-stark-black focus:outline-none focus:border-error resize-none" />
                <span className="text-[10px] text-zinc-500 mt-1 block">{dqReason.length} characters</span>
              </div>
              <label className="flex items-center gap-3 cursor-pointer bg-violet-50 border-2 border-violet-200 p-3">
                <input type="checkbox" checked={notifyDq} onChange={e => setNotifyDq(e.target.checked)} className="w-4 h-4" />
                <div>
                  <span className="font-bold text-violet-800 text-sm uppercase block">Notify Team Members</span>
                  <span className="text-xs text-violet-600">All members receive an in-app notification with the reason.</span>
                </div>
                <span className="material-symbols-outlined text-violet-600 ml-auto">notifications</span>
              </label>
              <div className="flex gap-4 pt-4 border-t-2 border-dashed border-stark-black">
                <button type="button" onClick={() => setDqTeam(null)} className="flex-1 bg-surface-container font-label-bold uppercase py-4 border-2 border-stark-black hover:bg-zinc-200">CANCEL</button>
                <button type="submit" disabled={loadingId === dqTeam.id || !dqReason.trim()}
                  className="flex-1 bg-error text-pure-white font-label-bold uppercase py-4 border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 disabled:opacity-50">
                  {loadingId === dqTeam.id ? "DISQUALIFYING..." : "CONFIRM DISQUALIFY"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notifyTarget && (
        <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSendNotification} className="bg-pure-white max-w-lg w-full border-4 border-violet-600 shadow-[8px_8px_0px_0px_rgba(109,40,217,1)]">
            <div className="bg-violet-600 p-4 border-b-4 border-stark-black flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white">campaign</span>
                <h3 className="font-display-lg text-xl uppercase text-white tracking-widest">NOTIFY SQUAD</h3>
              </div>
              <button type="button" onClick={() => setNotifyTarget(null)} className="text-white hover:text-stark-black"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-violet-50 border-2 border-violet-200 p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-600">groups</span>
                <div>
                  <span className="font-black text-violet-800 uppercase text-sm block">{notifyTarget.name}</span>
                  <span className="text-xs text-violet-500">{notifyTarget.memberIds?.length || 0} members will receive this</span>
                </div>
              </div>
              <div>
                <label className="font-code-snippet uppercase tracking-widest text-xs font-bold text-on-surface-variant block mb-2">Message *</label>
                <textarea required rows={4} value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)}
                  placeholder="Write a message to all team members..."
                  className="w-full bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-violet-600 resize-none" />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-zinc-500">Delivered as in-app notification to each member.</span>
                  <span className="text-[10px] text-zinc-500">{notifyMsg.length} chars</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-2">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {["Please finalise your submission before the deadline.", "Your team has been selected for an advanced challenge.", "Admin has updated your team status. Please login.", "Reminder: Submission deadline is approaching!"].map((preset, i) => (
                    <button key={i} type="button" onClick={() => setNotifyMsg(preset)}
                      className="text-[10px] bg-violet-50 border border-violet-300 text-violet-700 px-2 py-1 hover:bg-violet-100 transition-all font-bold text-left">
                      {preset.slice(0, 40)}...
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t-2 border-dashed border-stark-black">
                <button type="button" onClick={() => setNotifyTarget(null)} className="flex-1 bg-surface-container font-label-bold uppercase py-3 border-2 border-stark-black hover:bg-zinc-200">CANCEL</button>
                <button type="submit" disabled={notifyLoading || !notifyMsg.trim()}
                  className="flex-1 bg-violet-600 text-white font-label-bold uppercase py-3 border-2 border-stark-black hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">send</span>
                  {notifyLoading ? "SENDING..." : "DISPATCH"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isModalOpen && editingTeam && (
        <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="bg-electric-blue text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">{editingTeam.id.startsWith("new-") ? "add_circle" : "edit"}</span>
                <h3 className="font-headline-md uppercase tracking-widest">{editingTeam.id.startsWith("new-") ? "PROVISION NEW SQUAD" : "EDIT SQUAD"}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors"><span className="material-symbols-outlined text-[24px]">close</span></button>
            </div>
            <form onSubmit={handleSaveTeam} className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-bold uppercase text-xs flex items-center gap-2"><span className="material-symbols-outlined text-sm">badge</span>Squad Name *</label>
                <input required type="text" value={editingTeam.name} onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="e.g. Cyber Knights" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase text-xs flex items-center gap-2"><span className="material-symbols-outlined text-sm">flag</span>Status</label>
                  <select value={editingTeam.status} onChange={e => setEditingTeam({ ...editingTeam, status: e.target.value as TeamStatus })}
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase focus:outline-none focus:border-electric-blue">
                    <option value="forming">FORMING</option>
                    <option value="active">ACTIVE</option>
                    <option value="verified">VERIFIED &amp; CLEARED</option>
                    <option value="submitted">SUBMITTED</option>
                    <option value="completed">COMPLETED</option>
                    <option value="disqualified">DISQUALIFIED</option>
                  </select>
                  <p className="text-[10px] text-zinc-500">Changing status updates the team record visible to members on their dashboard.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase text-xs flex items-center gap-2"><span className="material-symbols-outlined text-sm">emoji_events</span>Points</label>
                  <input type="number" min={0} value={editingTeam.points} onChange={e => setEditingTeam({ ...editingTeam, points: parseInt(e.target.value) || 0 })}
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-bold uppercase text-xs flex items-center gap-2"><span className="material-symbols-outlined text-sm">star</span>Leader User ID</label>
                <input type="text" value={editingTeam.leaderId} onChange={e => setEditingTeam({ ...editingTeam, leaderId: e.target.value })}
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="user-xxxxxxxxxxxxxxxx" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-bold uppercase text-xs flex items-center gap-2"><span className="material-symbols-outlined text-sm">event</span>Hackathon ID</label>
                <input type="text" value={editingTeam.hackathonId} onChange={e => setEditingTeam({ ...editingTeam, hackathonId: e.target.value })}
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="hack-xxxxxxxxxxxxxxxx" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-bold uppercase text-xs flex items-center gap-2"><span className="material-symbols-outlined text-sm">group</span>Member IDs (comma separated)</label>
                <textarea value={editingTeam.memberIds.join(", ")} onChange={e => setEditingTeam({ ...editingTeam, memberIds: e.target.value.split(",").map(id => id.trim()).filter(id => id) })}
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet min-h-[72px] focus:outline-none focus:border-electric-blue resize-none" placeholder="user-abc, user-def..." />
                <p className="text-[10px] text-zinc-500">{editingTeam.memberIds.length} member(s) listed</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-bold uppercase text-xs flex items-center gap-2"><span className="material-symbols-outlined text-sm">sticky_note_2</span>Admin Note (Private)</label>
                <textarea value={editingTeam.adminNote} onChange={e => setEditingTeam({ ...editingTeam, adminNote: e.target.value })}
                  className="bg-amber-50 border-2 border-amber-400 p-3 font-code-snippet min-h-[60px] focus:outline-none resize-none" placeholder="Internal notes visible only to admins..." />
              </div>
              {!editingTeam.id.startsWith("new-") && (
                <div className="bg-violet-50 border-2 border-violet-300 p-4 flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={editingTeam.sendNotification} onChange={e => setEditingTeam({ ...editingTeam, sendNotification: e.target.checked })} className="w-4 h-4 accent-violet-600" />
                    <div>
                      <span className="font-black text-violet-800 uppercase text-sm block">Notify Team Members About This Change</span>
                      <span className="text-[11px] text-violet-600">All members receive an in-app notification after you save.</span>
                    </div>
                  </label>
                  {editingTeam.sendNotification && (
                    <>
                      <textarea value={editingTeam.notifyMessage} onChange={e => setEditingTeam({ ...editingTeam, notifyMessage: e.target.value })}
                        rows={3} placeholder="Write a notification message (optional)..."
                        className="w-full bg-white border-2 border-violet-400 p-3 text-sm font-mono focus:outline-none focus:border-violet-600 resize-none" />
                      <div className="text-[11px] text-violet-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Changes are saved first, then the notification is dispatched.
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors">CANCEL</button>
                <button type="submit" disabled={loadingId === "saving"} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50">
                  <span className="material-symbols-outlined">save</span>
                  {loadingId === "saving" ? "SAVING..." : "COMMIT CHANGES"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
