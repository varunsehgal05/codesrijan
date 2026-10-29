import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/admin/mentors")({
  component: AdminMentors,
});

function AdminMentors() {
  const { users, refetchData } = useAppStore();
  const safeUsers = Array.isArray(users) ? users : [];
  
  const mentors = safeUsers.filter(u => u.role === 'mentor');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<any | null>(null);

  // Custom Deactivate Modal
  const [mentorToDeactivate, setMentorToDeactivate] = useState<{ id: string; name: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingId("saving");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      if (editingMentor.id.startsWith("new-")) {
        const payload = { ...editingMentor, role: 'mentor' };
        delete payload.id;
        await axios.post(`${API_BASE}/admin/users`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(`${API_BASE}/admin/users/${editingMentor.id}`, { ...editingMentor, role: 'mentor' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      toast.success("Mentor clearance committed successfully.");
      setStatusMsg({ type: 'success', text: 'Mentor parameters saved successfully.' });
      await refetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save mentor parameters.');
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save mentor parameters.' });
    } finally {
      setLoadingId(null);
    }
  };

  const confirmDeactivateMentor = async () => {
    if (!mentorToDeactivate) return;
    setLoadingId(mentorToDeactivate.id);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.put(`${API_BASE}/admin/users/${mentorToDeactivate.id}`, { 
        role: 'student', 
        assignedTeams: [] 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Mentor ${mentorToDeactivate.name} deactivated.`);
      setStatusMsg({ type: 'success', text: `Mentor ${mentorToDeactivate.name} deactivated.` });
      setMentorToDeactivate(null);
      await refetchData();
    } catch (err: any) {
      toast.error('Failed to deactivate mentor.');
      setStatusMsg({ type: 'error', text: 'Failed to deactivate mentor.' });
    } finally {
      setLoadingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingMentor({
      id: `new-${Date.now()}`,
      name: "",
      email: "",
      password: "",
      assignedTeams: [],
      skills: []
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      
      {/* Header Bar */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            MENTORS DIRECTORY
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Support Personnel Matrix & Technical Guidance Dispatch
          </p>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="bg-electric-blue text-pure-white px-4 py-2 font-code-snippet font-bold tracking-widest border-2 border-stark-black text-xs">
            Active Mentors: {mentors.length}
          </div>
          <button 
            onClick={openCreateModal} 
            className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span> 
            ALLOCATE MENTOR
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
          <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {mentors.length === 0 ? (
        <div className="bg-pure-white p-16 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">support_agent</span>
          <h3 className="font-display-lg uppercase text-2xl text-stark-black">ZERO MENTOR NODES ALLOCATED</h3>
          <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">You must allocate support personnel to assist active squads.</p>
          <button onClick={openCreateModal} className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-xs">
            + Allocate First Mentor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map(m => (
            <div key={m.id} className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between group relative">
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingMentor({...m}); setIsModalOpen(true); }} 
                  className="p-1.5 bg-surface-bright border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors cursor-pointer"
                  title="Modify Mentor"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button 
                  onClick={() => setMentorToDeactivate({ id: m.id, name: m.name })} 
                  className="p-1.5 bg-surface-bright border-2 border-stark-black text-error hover:bg-error hover:text-pure-white transition-colors cursor-pointer"
                  title="Deactivate Mentor"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  {m.profileImage ? (
                    <img src={m.profileImage} alt={m.name} className="w-12 h-12 rounded-full brutal-border object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-stark-black flex items-center justify-center text-pure-white brutal-border shrink-0 font-bold">
                      {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                  )}
                  <div className="overflow-hidden pr-12">
                    <h3 className="font-headline-sm uppercase text-stark-black font-bold truncate">{m.name}</h3>
                    <p className="font-code-snippet text-[11px] text-on-surface-variant truncate">{m.email}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="text-[10px] font-label-bold uppercase text-on-surface-variant border-b-2 border-stark-black pb-1 mb-1">
                    Specialized Technical Competencies
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(!m.skills || m.skills.length === 0) ? (
                      <span className="text-[10px] font-code-snippet text-on-surface-variant font-bold">GENERAL ARCHITECTURE</span>
                    ) : (
                      m.skills.map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 bg-surface-bright border border-stark-black text-stark-black text-[10px] font-bold uppercase">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="text-[10px] font-label-bold uppercase text-on-surface-variant border-b-2 border-stark-black pb-1 mb-1">
                    Assigned Squads
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(!m.assignedTeams || m.assignedTeams.length === 0) ? (
                      <span className="text-[10px] font-code-snippet text-error font-bold">OPEN DISPATCH (ALL SQUADS)</span>
                    ) : (
                      m.assignedTeams.map((tId: string) => (
                        <span key={tId} className="px-2 py-0.5 bg-electric-blue text-pure-white text-[10px] font-bold border border-stark-black">
                          #{tId.substring(0, 10)}
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
      {isModalOpen && editingMentor && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="bg-stark-black text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-headline-md uppercase tracking-widest text-base">
                {editingMentor.id.startsWith("new-") ? "ALLOCATE MENTOR PERSONNEL" : "MODIFY MENTOR PROFILE"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs">Mentor Full Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={editingMentor.name || ''} 
                    onChange={(e) => setEditingMentor({...editingMentor, name: e.target.value})} 
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                    placeholder="Alex Chen"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs">Email Address *</label>
                  <input 
                    required 
                    type="email" 
                    value={editingMentor.email || ''} 
                    onChange={(e) => setEditingMentor({...editingMentor, email: e.target.value})} 
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                    placeholder="alex@tech.org"
                  />
                </div>
              </div>

              {editingMentor.id.startsWith("new-") && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs">Temporary Password *</label>
                  <input 
                    required 
                    type="text" 
                    value={editingMentor.password || ''} 
                    onChange={(e) => setEditingMentor({...editingMentor, password: e.target.value})} 
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                    placeholder="SecretPassword123!"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs">Specialized Skills (Comma-separated)</label>
                <input 
                  type="text" 
                  value={(editingMentor.skills || []).join(', ')} 
                  onChange={(e) => setEditingMentor({...editingMentor, skills: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)})} 
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                  placeholder="e.g. React, Python, Solidity, Cloud Architecture, Computer Vision"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs">Assigned Squad IDs (Comma-separated)</label>
                <input 
                  type="text" 
                  value={(editingMentor.assignedTeams || []).join(', ')} 
                  onChange={(e) => setEditingMentor({...editingMentor, assignedTeams: e.target.value.split(',').map((id: string) => id.trim()).filter(Boolean)})} 
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                  placeholder="e.g. team-1234, team-5678 (Leave empty for open support across all squads)"
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
                  {loadingId === "saving" ? 'SAVING...' : 'COMMIT MENTOR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirm Modal (Replaces window.confirm) */}
      {mentorToDeactivate && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setMentorToDeactivate(null); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
              <h3 className="font-headline-md text-lg uppercase text-stark-black">REVOKE MENTOR CLEARANCE</h3>
            </div>
            <p className="font-code-snippet text-xs text-stark-black leading-relaxed">
              Are you sure you want to revoke mentor clearance for <strong className="bg-[#FEF08A] px-1">{mentorToDeactivate.name}</strong>? Their role will revert to student and squad assignments will be removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setMentorToDeactivate(null)}
                className="px-4 py-2 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivateMentor}
                disabled={loadingId === mentorToDeactivate.id}
                className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-error text-white hover:bg-black text-xs cursor-pointer"
              >
                {loadingId === mentorToDeactivate.id ? 'REVOKING...' : 'CONFIRM REVOCATION'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
