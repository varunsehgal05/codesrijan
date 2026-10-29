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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHackathonFilter, setSelectedHackathonFilter] = useState("all");

  const filteredProblems = problems.filter(p => {
    const matchesSearch = 
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHackathon = selectedHackathonFilter === "all" || p.hackathonId === selectedHackathonFilter;
    return matchesSearch && matchesHackathon;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8 pb-20 font-mono text-xs">
      {/* Header */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-2xl md:text-3xl uppercase text-stark-black tracking-tight leading-none bg-[#00E5FF] text-stark-black px-3 py-1.5 inline-block transform -skew-x-6 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            PROBLEM STATEMENTS
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-xs uppercase">
            Challenge Specifications & Track Assignment
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-stark-black text-pure-white px-5 py-2.5 font-label-bold text-xs brutal-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-[#00E5FF] hover:text-stark-black transition-all uppercase flex items-center gap-2 cursor-pointer font-black"
        >
          <span className="material-symbols-outlined text-sm font-black">add_task</span>
          + CREATE PROBLEM STATEMENT
        </button>
      </div>

      {statusMsg && (
          <div className={`p-4 brutal-border font-label-bold uppercase flex items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
                <span>{statusMsg.text}</span>
              </div>
              <button onClick={() => setStatusMsg(null)} className="font-bold underline text-xs cursor-pointer">DISMISS</button>
          </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-pure-white p-4 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search problems by title, domain, or summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest brutal-border font-mono text-xs uppercase tracking-wider focus:outline-none focus:bg-pure-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-bold uppercase text-xs text-stark-black">Filter by Hackathon:</span>
          <select
            value={selectedHackathonFilter}
            onChange={(e) => setSelectedHackathonFilter(e.target.value)}
            className="p-2 bg-surface-container-lowest brutal-border font-mono text-xs uppercase"
          >
            <option value="all">All Hackathons</option>
            {hackathons.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-surface-container p-16 brutal-border text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-code-snippet uppercase tracking-widest animate-pulse font-bold">Syncing Problem Statements Matrix...</p>
        </div>
      ) : (filteredProblems.length === 0) ? (
        <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">assignment_late</span>
          <h3 className="font-display-lg uppercase text-2xl text-stark-black">No Matching Problem Statements</h3>
          <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">
            {problems.length === 0 ? "No challenge statements have been authored yet." : "No problems match your current search or hackathon filter."}
          </p>
          <button onClick={openCreateModal} className="bg-stark-black text-pure-white px-6 py-2.5 font-label-bold uppercase brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer">
            + Author First Problem Statement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map(p => {
            const parentHackathon = hackathons.find(h => h.id === p.hackathonId);
            return (
              <div key={p.id} className="bg-pure-white p-5 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${p.isPublished ? 'bg-success/20 text-success border-success' : 'bg-surface-variant text-stark-black border-stark-black'}`}>
                      {p.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                    {p.isLocked && <span className="material-symbols-outlined text-error text-sm" title="Locked">lock</span>}
                  </div>

                  {parentHackathon ? (
                    <div className="mb-2">
                      <span className="text-[10px] bg-electric-blue text-pure-white px-2 py-0.5 font-bold uppercase brutal-border">
                        Hackathon: {parentHackathon.name}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <span className="text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 font-bold uppercase">
                        Unassigned Hackathon
                      </span>
                    </div>
                  )}

                  <h3 className="font-display-lg uppercase text-lg text-stark-black mb-2 leading-snug">{p.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-[10px] font-mono bg-stark-black text-pure-white px-2 py-0.5 uppercase font-bold">{p.category || 'TRACK'}</span>
                      <span className="text-[10px] font-mono bg-amber-300 text-stark-black px-2 py-0.5 uppercase font-bold">{p.difficulty || 'MEDIUM'}</span>
                  </div>
                  <p className="font-mono text-xs text-on-surface-variant line-clamp-3 mt-3 leading-relaxed">{p.description}</p>
                </div>

                <div className="mt-5 flex flex-col gap-2 pt-3 border-t border-zinc-200">
                  <button onClick={() => { setEditingProblem({...p}); setIsModalOpen(true); }} className="bg-surface-bright text-stark-black px-4 py-1.5 font-bold uppercase text-xs border-2 border-stark-black hover:bg-black hover:text-white transition-colors cursor-pointer text-center">
                      EDIT STATEMENT
                  </button>
                  <div className="flex gap-2">
                      <button onClick={() => handleToggleState(p.id, 'publish', p.isPublished)} className="flex-1 bg-surface-bright text-stark-black px-2 py-1 font-bold text-[10px] border border-stark-black hover:bg-black hover:text-white transition-colors cursor-pointer">
                          {p.isPublished ? 'UNPUBLISH' : 'PUBLISH'}
                      </button>
                      <button onClick={() => handleToggleState(p.id, 'lock', p.isLocked)} className="flex-1 bg-surface-bright text-stark-black px-2 py-1 font-bold text-[10px] border border-stark-black hover:bg-black hover:text-white transition-colors cursor-pointer">
                          {p.isLocked ? 'UNLOCK' : 'LOCK'}
                      </button>
                      <button onClick={() => handleDuplicate(p)} className="flex-1 bg-surface-bright text-stark-black px-2 py-1 font-bold text-[10px] border border-stark-black hover:bg-black hover:text-white transition-colors cursor-pointer">
                          CLONE
                      </button>
                  </div>
                  <button onClick={() => handleDelete(p.id)} className="w-full bg-error text-pure-white px-2 py-1 font-bold text-[10px] border border-stark-black hover:bg-black transition-colors cursor-pointer opacity-80 hover:opacity-100">
                      DELETE STATEMENT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal (CLICK OUTSIDE TO CLOSE) */}
      {isModalOpen && editingProblem && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 bg-stark-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
        >
            <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="bg-[#00E5FF] text-stark-black p-4 border-b-4 border-stark-black flex justify-between items-center sticky top-0 z-10">
                    <h3 className="font-display-lg uppercase text-lg font-black">{editingProblem.id === "new" ? "AUTHOR PROBLEM STATEMENT" : "EDIT PROBLEM STATEMENT"}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center brutal-border bg-white hover:bg-error hover:text-white transition-colors font-bold cursor-pointer">
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="font-bold uppercase text-xs">Problem Title *</label>
                            <input required type="text" value={editingProblem.title || ''} onChange={(e) => setEditingProblem({...editingProblem, title: e.target.value})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none" placeholder="e.g. AI Content Safety Engine"/>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-bold uppercase text-xs">URL Slug *</label>
                            <input required type="text" value={editingProblem.slug || ''} onChange={(e) => setEditingProblem({...editingProblem, slug: e.target.value})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none lowercase" placeholder="e.g. ai-content-safety"/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="font-bold uppercase text-xs">Target Hackathon *</label>
                            <select value={editingProblem.hackathonId || ''} onChange={(e) => setEditingProblem({...editingProblem, hackathonId: e.target.value})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs uppercase focus:outline-none">
                                <option value="">Select Associated Hackathon</option>
                                {hackathons.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-bold uppercase text-xs">Category / Domain</label>
                            <select value={editingProblem.category || 'general'} onChange={(e) => setEditingProblem({...editingProblem, category: e.target.value})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs uppercase focus:outline-none">
                                <option value="frontend">Frontend / UI</option>
                                <option value="backend">Backend / API</option>
                                <option value="fullstack">Fullstack Web</option>
                                <option value="ai_ml">AI & ML</option>
                                <option value="web3">Web3 / Blockchain</option>
                                <option value="general">Open Innovation</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-bold uppercase text-xs">Difficulty Level</label>
                            <select value={editingProblem.difficulty || 'medium'} onChange={(e) => setEditingProblem({...editingProblem, difficulty: e.target.value})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs uppercase focus:outline-none">
                                <option value="beginner">Beginner</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="expert">Expert</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="font-bold uppercase text-xs">Short Summary *</label>
                        <textarea required value={editingProblem.description || ''} onChange={(e) => setEditingProblem({...editingProblem, description: e.target.value})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs min-h-[70px] focus:outline-none" placeholder="Provide a concise 2-sentence overview for participants..."></textarea>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="font-bold uppercase text-xs">Full Problem Specifications</label>
                        <textarea value={editingProblem.fullDescription || ''} onChange={(e) => setEditingProblem({...editingProblem, fullDescription: e.target.value})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs min-h-[140px] focus:outline-none" placeholder="Full requirements, constraints, deliverable expectations..."></textarea>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="font-bold uppercase text-xs">PDF Spec Attachment URL (Optional)</label>
                        <input type="url" value={editingProblem.attachmentUrl || ''} onChange={(e) => setEditingProblem({...editingProblem, attachmentUrl: e.target.value})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none" placeholder="https://storage.googleapis.com/.../problem-spec.pdf"/>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="font-bold uppercase text-xs">Suggested Technologies (Comma Separated)</label>
                        <input type="text" value={(editingProblem.requirements || []).join(', ')} onChange={(e) => setEditingProblem({...editingProblem, requirements: e.target.value.split(',').map((id: string) => id.trim()).filter((id: string) => id)})} className="bg-surface-container-lowest border-2 border-stark-black p-2.5 font-mono text-xs focus:outline-none" placeholder="e.g. React, Node.js, Python, TensorFlow"/>
                    </div>

                    <div className="mt-3 border-t-2 border-stark-black pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-pure-white text-stark-black font-bold uppercase px-4 py-2 border-2 border-stark-black hover:bg-zinc-200 transition-colors cursor-pointer text-xs">
                            CANCEL
                        </button>
                        <button type="submit" disabled={loadingId === "saving"} className="bg-stark-black text-pure-white font-bold uppercase px-6 py-2 border-2 border-stark-black hover:bg-[#00E5FF] hover:text-stark-black transition-all flex items-center gap-2 cursor-pointer text-xs disabled:opacity-50">
                            <span className="material-symbols-outlined text-sm">save</span>
                            {loadingId === "saving" ? 'SAVING...' : 'SAVE PROBLEM STATEMENT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
