import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

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
          setStatusMsg({ type: 'success', text: 'Mentor parameters saved successfully.' });
          await refetchData();
      } catch (err: any) {
          setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save mentor parameters.' });
      } finally {
          setLoadingId(null);
      }
  };

  const handleDeactivate = async (id: string, name: string) => {
      if (!window.confirm(`Revoke mentor privileges for ${name}?`)) return;
      setLoadingId(id);
      try {
          const token = localStorage.getItem("codesrijan_auth_token");
          // Change role back to student
          await axios.put(`${API_BASE}/admin/users/${id}`, { role: 'student', assignedTeams: [] }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setStatusMsg({ type: 'success', text: `Mentor ${name} deactivated.` });
          await refetchData();
      } catch (err: any) {
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
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            MENTORS DIRECTORY
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Support Personnel Matrix
          </p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="bg-electric-blue text-pure-white px-4 py-2 font-code-snippet font-bold tracking-widest border-2 border-stark-black">
                Active Mentors: {mentors.length}
            </div>
            <button onClick={openCreateModal} className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                <span className="material-symbols-outlined">person_add</span> ALLOCATE MENTOR
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
              <button onClick={openCreateModal} className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  + Allocate First Mentor
              </button>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map(m => (
            <div key={m.id} className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between group relative">
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingMentor({...m}); setIsModalOpen(true); }} className="p-1 bg-surface-bright border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button onClick={() => handleDeactivate(m.id, m.name)} className="p-1 bg-surface-bright border-2 border-stark-black text-error hover:bg-error hover:text-pure-white transition-colors">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
              </div>
              <div>
                  <div className="flex items-center gap-4 mb-4">
                      {m.profileImage ? (
                          <img src={m.profileImage} alt={m.name} className="w-12 h-12 rounded-full brutal-border object-cover" />
                      ) : (
                          <div className="w-12 h-12 rounded-full bg-stark-black flex items-center justify-center text-pure-white brutal-border shrink-0">
                              <span className="material-symbols-outlined">person</span>
                          </div>
                      )}
                      <div>
                          <h3 className="font-headline-sm uppercase text-stark-black font-bold line-clamp-1">{m.name}</h3>
                          <p className="font-code-snippet text-[10px] text-on-surface-variant line-clamp-1">{m.email}</p>
                      </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2">
                      <div className="text-[10px] font-label-bold uppercase text-on-surface-variant border-b-2 border-stark-black pb-1 mb-1">Expertise / Skills</div>
                      <div className="flex flex-wrap gap-1">
                          {(!m.skills || m.skills.length === 0) ? (
                              <span className="text-[10px] font-code-snippet text-error font-bold">UNSPECIFIED</span>
                          ) : (
                              m.skills.slice(0, 3).map((sk: string) => (
                                  <span key={sk} className="px-2 py-0.5 bg-electric-blue text-pure-white text-[10px] font-bold">{sk}</span>
                              ))
                          )}
                          {m.skills && m.skills.length > 3 && (
                              <span className="px-2 py-0.5 border-2 border-stark-black text-stark-black text-[10px] font-bold">+{m.skills.length - 3}</span>
                          )}
                      </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                      <div className="text-[10px] font-label-bold uppercase text-on-surface-variant border-b-2 border-stark-black pb-1 mb-1">Assigned Squads</div>
                      <div className="flex flex-wrap gap-1">
                          {(!m.assignedTeams || m.assignedTeams.length === 0) ? (
                              <span className="text-[10px] font-code-snippet text-warning font-bold">GLOBAL (UNASSIGNED)</span>
                          ) : (
                              m.assignedTeams.map((teamId: string) => (
                                  <span key={teamId} className="px-2 py-0.5 border-2 border-stark-black text-stark-black text-[10px] font-bold uppercase">{teamId}</span>
                              ))
                          )}
                      </div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && editingMentor && (
        <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="bg-electric-blue text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
                    <h3 className="font-headline-md uppercase tracking-widest">{editingMentor.id.startsWith("new-") ? "ALLOCATE MENTOR" : "MODIFY MENTOR PROFILE"}</h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Mentor Name *</label>
                            <input required type="text" value={editingMentor.name || ''} onChange={(e) => setEditingMentor({...editingMentor, name: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="John Doe"/>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Email *</label>
                            <input required type="email" value={editingMentor.email || ''} onChange={(e) => setEditingMentor({...editingMentor, email: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="john@example.com"/>
                        </div>
                    </div>

                    {editingMentor.id.startsWith("new-") && (
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Temporary Password *</label>
                            <input required type="text" value={editingMentor.password || ''} onChange={(e) => setEditingMentor({...editingMentor, password: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="SecretPassword123!"/>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-xs">Expertise / Skills (Comma Separated)</label>
                        <input type="text" value={(editingMentor.skills || []).join(', ')} onChange={(e) => setEditingMentor({...editingMentor, skills: e.target.value.split(',').map((id: string) => id.trim()).filter((id: string) => id)})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="e.g. React, Node.js, AI"/>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-xs">Assigned Squad IDs (Comma Separated)</label>
                        <input type="text" value={(editingMentor.assignedTeams || []).join(', ')} onChange={(e) => setEditingMentor({...editingMentor, assignedTeams: e.target.value.split(',').map((id: string) => id.trim()).filter((id: string) => id)})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="e.g. team-1234, team-5678 (Leave empty for global)"/>
                    </div>

                    <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors">
                            CANCEL
                        </button>
                        <button type="submit" disabled={loadingId === "saving"} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50">
                            <span className="material-symbols-outlined">save</span>
                            {loadingId === "saving" ? 'SAVING...' : 'COMMIT MENTOR'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
