import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/admin/judges")({
  component: AdminJudges,
});

function AdminJudges() {
  const { users, hackathons, refetchData } = useAppStore();
  const safeUsers = Array.isArray(users) ? users : [];
  
  const judges = safeUsers.filter(u => u.role === 'judge');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<any | null>(null);

  // Custom Deactivate Confirm Modal
  const [judgeToDeactivate, setJudgeToDeactivate] = useState<{ id: string; name: string } | null>(null);

  const genuineHackathons = useMemo(() => {
    const list = Array.isArray(hackathons) ? hackathons : [];
    return list.filter(h => !h.isTest && !h.id.toLowerCase().startsWith('qa-') && !h.id.toLowerCase().startsWith('qa_'));
  }, [hackathons]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingId("saving");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      if (editingJudge.id.startsWith("new-")) {
        const payload = { ...editingJudge, role: 'judge' };
        delete payload.id;
        await axios.post(`${API_BASE}/admin/users`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(`${API_BASE}/admin/users/${editingJudge.id}`, { ...editingJudge, role: 'judge' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      toast.success("Judge clearance committed successfully.");
      setStatusMsg({ type: 'success', text: 'Judge parameters saved successfully.' });
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save judge parameters.');
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save judge parameters.' });
    } finally {
      setLoadingId(null);
    }
  };

  const confirmDeactivateJudge = async () => {
    if (!judgeToDeactivate) return;
    setLoadingId(judgeToDeactivate.id);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.put(`${API_BASE}/admin/users/${judgeToDeactivate.id}`, { 
        role: 'student', 
        assignedHackathons: [], 
        assignedCategories: [] 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Judge ${judgeToDeactivate.name} deactivated.`);
      setStatusMsg({ type: 'success', text: `Judge ${judgeToDeactivate.name} deactivated.` });
      setJudgeToDeactivate(null);
      await refetchData();
    } catch (err: any) {
      toast.error('Failed to deactivate judge.');
      setStatusMsg({ type: 'error', text: 'Failed to deactivate judge.' });
    } finally {
      setLoadingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingJudge({
      id: `new-${Date.now()}`,
      name: "",
      email: "",
      password: "",
      assignedHackathons: [],
      assignedCategories: []
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      
      {/* Header Bar */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            JUDGES DIRECTORY
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Evaluation Personnel Matrix & Score Clearance Management
          </p>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="bg-electric-blue text-pure-white px-4 py-2 font-code-snippet font-bold tracking-widest border-2 border-stark-black text-xs">
            Active Judges: {judges.length}
          </div>
          <button 
            onClick={openCreateModal} 
            className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span> 
            ALLOCATE JUDGE
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
          <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {judges.length === 0 ? (
        <div className="bg-pure-white p-16 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">gavel</span>
          <h3 className="font-display-lg uppercase text-2xl text-stark-black">ZERO JUDGE NODES ALLOCATED</h3>
          <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">You must allocate evaluation personnel to process payloads.</p>
          <button onClick={openCreateModal} className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-xs">
            + Allocate First Judge
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {judges.map(j => (
            <div key={j.id} className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between group relative">
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingJudge({...j}); setIsModalOpen(true); }} 
                  className="p-1.5 bg-surface-bright border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors cursor-pointer"
                  title="Modify Judge"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button 
                  onClick={() => setJudgeToDeactivate({ id: j.id, name: j.name })} 
                  className="p-1.5 bg-surface-bright border-2 border-stark-black text-error hover:bg-error hover:text-pure-white transition-colors cursor-pointer"
                  title="Deactivate Judge"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  {j.profileImage ? (
                    <img src={j.profileImage} alt={j.name} className="w-12 h-12 rounded-full brutal-border object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-stark-black flex items-center justify-center text-pure-white brutal-border shrink-0 font-bold">
                      {j.name ? j.name.charAt(0).toUpperCase() : 'J'}
                    </div>
                  )}
                  <div className="overflow-hidden pr-12">
                    <h3 className="font-headline-sm uppercase text-stark-black font-bold truncate">{j.name}</h3>
                    <p className="font-code-snippet text-[11px] text-on-surface-variant truncate">{j.email}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                  <div className="text-[10px] font-label-bold uppercase text-on-surface-variant border-b-2 border-stark-black pb-1 mb-1">
                    Assigned Hackathons
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(!j.assignedHackathons || j.assignedHackathons.length === 0) ? (
                      <span className="text-[10px] font-code-snippet text-error font-bold">UNASSIGNED (GLOBAL ALL-ACCESS)</span>
                    ) : (
                      j.assignedHackathons.map((hId: string) => {
                        const hack = genuineHackathons.find(h => h.id === hId);
                        return (
                          <span key={hId} className="px-2 py-0.5 bg-electric-blue text-pure-white text-[10px] font-bold border border-stark-black">
                            {hack ? hack.name : hId}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="text-[10px] font-label-bold uppercase text-on-surface-variant border-b-2 border-stark-black pb-1 mb-1">
                    Assigned Categories
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(!j.assignedCategories || j.assignedCategories.length === 0) ? (
                      <span className="text-[10px] font-code-snippet text-warning font-bold">ALL RUBRIC CATEGORIES</span>
                    ) : (
                      j.assignedCategories.map((cat: string) => (
                        <span key={cat} className="px-2 py-0.5 border-2 border-stark-black text-stark-black text-[10px] font-bold uppercase">
                          {cat}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal with Backdrop Click-Outside */}
      {isModalOpen && editingJudge && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="bg-electric-blue text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-headline-md uppercase tracking-widest text-base">
                {editingJudge.id.startsWith("new-") ? "ALLOCATE JUDGE PERSONNEL" : "MODIFY JUDGE PERMISSIONS"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-black transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs">Judge Full Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={editingJudge.name || ''} 
                    onChange={(e) => setEditingJudge({...editingJudge, name: e.target.value})} 
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                    placeholder="Prof. Jane Doe"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs">Email Communication Address *</label>
                  <input 
                    required 
                    type="email" 
                    value={editingJudge.email || ''} 
                    onChange={(e) => setEditingJudge({...editingJudge, email: e.target.value})} 
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                    placeholder="judge@institution.edu"
                  />
                </div>
              </div>

              {editingJudge.id.startsWith("new-") && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs">Temporary Access Password *</label>
                  <input 
                    required 
                    type="text" 
                    value={editingJudge.password || ''} 
                    onChange={(e) => setEditingJudge({...editingJudge, password: e.target.value})} 
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                    placeholder="Min 8 characters with letters & numbers"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs">Assigned Hackathons</label>
                <div className="flex flex-wrap gap-2 p-3 border-2 border-stark-black bg-surface-bright max-h-36 overflow-y-auto">
                  {genuineHackathons.map(h => {
                    const isAssigned = (editingJudge.assignedHackathons || []).includes(h.id);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          const current = editingJudge.assignedHackathons || [];
                          const updated = isAssigned 
                            ? current.filter((id: string) => id !== h.id)
                            : [...current, h.id];
                          setEditingJudge({ ...editingJudge, assignedHackathons: updated });
                        }}
                        className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase border cursor-pointer transition-colors ${
                          isAssigned 
                            ? 'bg-electric-blue text-white border-black' 
                            : 'bg-white text-black border-zinc-400 hover:border-black'
                        }`}
                      >
                        {isAssigned ? '✓ ' : '+ '} {h.name}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  (Leave all unselected to grant global evaluation clearance across all events)
                </span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs">Assigned Rubric Categories (Comma-separated)</label>
                <input 
                  type="text" 
                  value={(editingJudge.assignedCategories || []).join(', ')} 
                  onChange={(e) => setEditingJudge({...editingJudge, assignedCategories: e.target.value.split(',').map((id: string) => id.trim()).filter(Boolean)})} 
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                  placeholder="e.g. innovation, technical_execution, impact, presentation"
                />
              </div>

              <div className="mt-2 border-t-2 border-stark-black pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="bg-pure-white text-stark-black font-label-bold uppercase px-5 py-2.5 border-2 border-stark-black hover:bg-surface-bright transition-colors cursor-pointer text-xs"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={loadingId === "saving"} 
                  className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-2.5 border-2 border-stark-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer text-xs"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  {loadingId === "saving" ? 'SAVING...' : 'COMMIT JUDGE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirm Modal (Replaces window.confirm) */}
      {judgeToDeactivate && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setJudgeToDeactivate(null); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
              <h3 className="font-headline-md text-lg uppercase text-stark-black">REVOKE JUDGE PRIVILEGES</h3>
            </div>
            <p className="font-code-snippet text-xs text-stark-black leading-relaxed">
              Are you sure you want to revoke judge clearance for <strong className="bg-[#FEF08A] px-1">{judgeToDeactivate.name}</strong>? Their role will be reverted to student and evaluation assignments removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setJudgeToDeactivate(null)}
                className="px-4 py-2 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivateJudge}
                disabled={loadingId === judgeToDeactivate.id}
                className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-error text-white hover:bg-black text-xs cursor-pointer"
              >
                {loadingId === judgeToDeactivate.id ? 'REVOKING...' : 'CONFIRM REVOCATION'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
