import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/problems")({
  component: AdminProblems,
});

function AdminProblems() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { hackathons } = useAppStore();

  const fetchProblems = () => {
    const token = localStorage.getItem("codesrijan_auth_token");
    axios.get(`${API_BASE}/admin/problems`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        setProblems(r.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Admin problems fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const openCreateModal = () => {
    setEditingProblem({
        id: "new",
        title: "",
        slug: "",
        description: "",
        fullDescription: "",
        category: "frontend",
        difficulty: "easy",
        hackathonId: "",
        isPublished: false,
        isLocked: false
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProblem.title || !editingProblem.slug || !editingProblem.description) {
        setStatusMsg({ type: 'error', text: 'Title, Slug, and Description are required.' });
        return;
    }
    
    setLoadingId("saving");
    try {
        const token = localStorage.getItem("codesrijan_auth_token");
        if (editingProblem.id === "new") {
            const payload = { ...editingProblem };
            delete payload.id;
            await axios.post(`${API_BASE}/admin/problems`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            await axios.put(`${API_BASE}/admin/problems/${editingProblem.id}`, editingProblem, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        setIsModalOpen(false);
        setStatusMsg({ type: 'success', text: 'Problem statement saved successfully.' });
        fetchProblems();
    } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save problem.' });
    } finally {
        setLoadingId(null);
    }
  };

  const handleToggleState = async (id: string, action: 'publish' | 'lock', currentState: boolean) => {
    setLoadingId(id);
    try {
        const token = localStorage.getItem("codesrijan_auth_token");
        const payload = action === 'publish' ? { isPublished: !currentState } : { isLocked: !currentState };
        await axios.patch(`${API_BASE}/admin/problems/${id}/${action}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStatusMsg({ type: 'success', text: `Problem statement updated.` });
        fetchProblems();
    } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Action failed.' });
    } finally {
        setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm("Permanently eradicate this problem statement?")) return;
      setLoadingId(id);
      try {
          const token = localStorage.getItem("codesrijan_auth_token");
          await axios.delete(`${API_BASE}/admin/problems/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setStatusMsg({ type: 'success', text: 'Problem deleted.' });
          fetchProblems();
      } catch (err: any) {
          setStatusMsg({ type: 'error', text: 'Failed to delete.' });
      } finally {
          setLoadingId(null);
      }
  };

  const handleDuplicate = async (problem: any) => {
    setLoadingId(problem.id);
    try {
        const token = localStorage.getItem("codesrijan_auth_token");
        const payload = { ...problem, title: `${problem.title} (Copy)`, slug: `${problem.slug}-copy-${Date.now()}` };
        delete payload.id;
        delete payload._id;
        delete payload.createdAt;
        delete payload.updatedAt;
        
        await axios.post(`${API_BASE}/admin/problems`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStatusMsg({ type: 'success', text: 'Problem duplicated successfully.' });
        fetchProblems();
    } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Failed to duplicate.' });
    } finally {
        setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            PROBLEM STATEMENTS
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Challenge Directives Manager
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_task</span>
          New Statement
        </button>
      </div>

      {statusMsg && (
          <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
              <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
              <span>{statusMsg.text}</span>
          </div>
      )}

      {loading ? (
        <div className="bg-surface-container p-16 brutal-border text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-code-snippet uppercase tracking-widest animate-pulse">Syncing Problem Statements Matrix...</p>
        </div>
      ) : (problems.length === 0) ? (
        <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">assignment_late</span>
          <h3 className="font-display-lg uppercase text-2xl text-stark-black">No Active Directives</h3>
          <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">No challenge statements have been authored yet.</p>
          <button onClick={openCreateModal} className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            + Author First Problem Statement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map(p => (
            <div key={p.id} className="bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 text-[10px] font-label-bold uppercase border-2 ${p.isPublished ? 'bg-success/20 text-success border-success' : 'bg-surface-variant text-stark-black border-stark-black'}`}>
                    {p.isPublished ? 'PUBLISHED' : 'DRAFT'}
                  </span>
                  {p.isLocked && <span className="material-symbols-outlined text-error text-sm">lock</span>}
                </div>
                <h3 className="font-headline-sm uppercase font-bold text-stark-black mb-2">{p.title}</h3>
                <div className="flex gap-2 mb-2">
                    <span className="text-[10px] font-code-snippet bg-electric-blue text-pure-white px-2 py-1 uppercase">{p.category || 'UNASSIGNED'}</span>
                    <span className="text-[10px] font-code-snippet bg-stark-black text-pure-white px-2 py-1 uppercase">{p.difficulty || 'MEDIUM'}</span>
                </div>
                <p className="font-code-snippet text-xs text-on-surface-variant line-clamp-3 mt-4">{p.description}</p>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <button onClick={() => { setEditingProblem({...p}); setIsModalOpen(true); }} className="bg-surface-bright text-stark-black px-4 py-2 font-label-bold uppercase text-xs border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors">
                    EDIT STATEMENT
                </button>
                <div className="flex gap-2">
                    <button onClick={() => handleToggleState(p.id, 'publish', p.isPublished)} className="flex-1 bg-surface-bright text-stark-black px-2 py-2 font-label-caps text-[10px] border-2 border-stark-black hover:bg-stark-black hover:text-pure-white transition-colors">
                        {p.isPublished ? 'UNPUBLISH' : 'PUBLISH'}
                    </button>
                    <button onClick={() => handleToggleState(p.id, 'lock', p.isLocked)} className="flex-1 bg-surface-bright text-stark-black px-2 py-2 font-label-caps text-[10px] border-2 border-stark-black hover:bg-stark-black hover:text-pure-white transition-colors">
                        {p.isLocked ? 'UNLOCK' : 'LOCK'}
                    </button>
                    <button onClick={() => handleDuplicate(p)} className="flex-1 bg-surface-bright text-stark-black px-2 py-2 font-label-caps text-[10px] border-2 border-stark-black hover:bg-stark-black hover:text-pure-white transition-colors">
                        COPY
                    </button>
                </div>
                <button onClick={() => handleDelete(p.id)} className="w-full bg-error text-pure-white px-2 py-1 font-label-caps text-[10px] border-2 border-stark-black hover:bg-stark-black transition-colors mt-2 opacity-0 group-hover:opacity-100">
                    DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && editingProblem && (
        <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="bg-electric-blue text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
                    <h3 className="font-headline-md uppercase tracking-widest">{editingProblem.id === "new" ? "AUTHOR PROBLEM STATEMENT" : "MODIFY PROBLEM STATEMENT"}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Title *</label>
                            <input required type="text" value={editingProblem.title || ''} onChange={(e) => setEditingProblem({...editingProblem, title: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="e.g. AI Content Moderator"/>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Slug *</label>
                            <input required type="text" value={editingProblem.slug || ''} onChange={(e) => setEditingProblem({...editingProblem, slug: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="e.g. ai-content-moderator"/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Hackathon ID (Optional)</label>
                            <select value={editingProblem.hackathonId || ''} onChange={(e) => setEditingProblem({...editingProblem, hackathonId: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase focus:outline-none">
                                <option value="">Global / Unassigned</option>
                                {hackathons.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Category</label>
                            <select value={editingProblem.category || 'general'} onChange={(e) => setEditingProblem({...editingProblem, category: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase focus:outline-none">
                                <option value="frontend">Frontend / UI</option>
                                <option value="backend">Backend / API</option>
                                <option value="fullstack">Fullstack</option>
                                <option value="ai_ml">AI & ML</option>
                                <option value="web3">Web3 / Crypto</option>
                                <option value="general">Open Innovation</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Difficulty</label>
                            <select value={editingProblem.difficulty || 'medium'} onChange={(e) => setEditingProblem({...editingProblem, difficulty: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase focus:outline-none">
                                <option value="beginner">Beginner</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="expert">Expert</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-xs">Short Description *</label>
                        <textarea required value={editingProblem.description || ''} onChange={(e) => setEditingProblem({...editingProblem, description: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet min-h-[80px] focus:outline-none"></textarea>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-xs">Full Specification (Markdown Supported)</label>
                        <textarea value={editingProblem.fullDescription || ''} onChange={(e) => setEditingProblem({...editingProblem, fullDescription: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet min-h-[200px] focus:outline-none"></textarea>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold uppercase text-xs">Technical Requirements (Comma Separated)</label>
                        <input type="text" value={(editingProblem.requirements || []).join(', ')} onChange={(e) => setEditingProblem({...editingProblem, requirements: e.target.value.split(',').map((id: string) => id.trim()).filter((id: string) => id)})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="e.g. React, Node.js, MongoDB"/>
                    </div>

                    <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors">
                            CANCEL
                        </button>
                        <button type="submit" disabled={loadingId === "saving"} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50">
                            <span className="material-symbols-outlined">save</span>
                            {loadingId === "saving" ? 'SAVING...' : 'COMMIT DIRECTIVE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
