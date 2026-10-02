import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/sponsors")({
  component: AdminSponsors,
});

function AdminSponsors() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<any | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchSponsors = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/sponsors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSponsors(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const openCreateModal = () => {
      setEditingSponsor({
          name: "",
          logo: "",
          website: "",
          tier: "gold",
          order: 0,
          isPublished: true
      });
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoadingId("saving");
      try {
          const token = localStorage.getItem("codesrijan_auth_token");
          // Currently backend only supports POST for creating new, no PUT for editing. 
          // We will mock it as always creating or just deleting/recreating.
          await axios.post(`${API_BASE}/admin/sponsors`, editingSponsor, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setIsModalOpen(false);
          setStatusMsg({ type: 'success', text: 'Sponsor matrix updated.' });
          fetchSponsors();
      } catch (err: any) {
          setStatusMsg({ type: 'error', text: 'Failed to update sponsor.' });
      } finally {
          setLoadingId(null);
      }
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm("Purge this sponsor?")) return;
      setLoadingId(id);
      try {
          const token = localStorage.getItem("codesrijan_auth_token");
          await axios.delete(`${API_BASE}/admin/sponsors/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setStatusMsg({ type: 'success', text: 'Sponsor purged.' });
          fetchSponsors();
      } catch (err: any) {
          setStatusMsg({ type: 'error', text: 'Failed to purge sponsor.' });
      } finally {
          setLoadingId(null);
      }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            SPONSOR LOGISTICS
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Corporate Backing & Partnerships
          </p>
        </div>
        <button onClick={openCreateModal} className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined">add_business</span> NEW SPONSOR
        </button>
      </div>

      {statusMsg && (
          <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${statusMsg.type === 'error' ? 'bg-error text-pure-white' : 'bg-success text-stark-black'}`}>
              <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
              <span>{statusMsg.text}</span>
          </div>
      )}

      {loading ? (
          <div className="bg-surface-container p-16 brutal-border text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-code-snippet uppercase tracking-widest animate-pulse">Syncing partnership nodes...</p>
          </div>
      ) : sponsors.length === 0 ? (
          <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant">storefront</span>
              <h3 className="font-display-lg uppercase text-2xl text-stark-black">ZERO PARTNERSHIPS FOUND</h3>
              <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">You have not registered any corporate sponsors yet.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map(sp => (
                  <div key={sp.id} className={`bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group ${!sp.isPublished ? 'opacity-70' : ''}`}>
                      <div>
                          <div className="flex justify-between items-start mb-4">
                              <div className={`font-label-bold uppercase text-[10px] tracking-widest px-2 py-1 border-2 border-stark-black inline-block ${sp.tier === 'platinum' ? 'bg-stark-black text-pure-white' : 'bg-surface-bright text-stark-black'}`}>
                                  {sp.tier} TIER
                              </div>
                              <button onClick={() => handleDelete(sp.id)} disabled={loadingId === sp.id} className="p-1 bg-surface-bright border-2 border-stark-black text-error hover:bg-error hover:text-pure-white transition-colors disabled:opacity-50">
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-4">
                            {sp.logo ? (
                                <img src={sp.logo} alt={sp.name} className="w-16 h-16 object-contain border-2 border-stark-black p-1 bg-surface-bright" />
                            ) : (
                                <div className="w-16 h-16 bg-surface-bright border-2 border-stark-black flex items-center justify-center">
                                    <span className="material-symbols-outlined opacity-50">image</span>
                                </div>
                            )}
                            <div>
                                <h3 className="font-headline-md uppercase text-xl text-stark-black">{sp.name}</h3>
                                {sp.website && <a href={sp.website} target="_blank" rel="noreferrer" className="font-code-snippet text-[10px] text-electric-blue hover:underline uppercase break-all">LINK</a>}
                            </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && editingSponsor && (
          <div className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-xl flex flex-col">
                  <div className="bg-stark-black text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center">
                      <h3 className="font-headline-md uppercase tracking-widest">REGISTER SPONSOR</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[24px]">close</span>
                      </button>
                  </div>
                  <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Entity Name *</label>
                            <input required type="text" value={editingSponsor.name} onChange={(e) => setEditingSponsor({...editingSponsor, name: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="Acme Corp"/>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold uppercase text-xs">Tier</label>
                            <select value={editingSponsor.tier} onChange={(e) => setEditingSponsor({...editingSponsor, tier: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet uppercase focus:outline-none focus:border-electric-blue">
                                <option value="platinum">Platinum</option>
                                <option value="gold">Gold</option>
                                <option value="silver">Silver</option>
                                <option value="bronze">Bronze</option>
                            </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                          <label className="font-label-bold uppercase text-xs">Website URL</label>
                          <input type="url" value={editingSponsor.website} onChange={(e) => setEditingSponsor({...editingSponsor, website: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="https://..."/>
                      </div>

                      <div className="flex flex-col gap-2">
                          <label className="font-label-bold uppercase text-xs">Logo Image URL</label>
                          <input type="url" value={editingSponsor.logo} onChange={(e) => setEditingSponsor({...editingSponsor, logo: e.target.value})} className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet focus:outline-none focus:border-electric-blue" placeholder="https://..."/>
                      </div>

                      <div className="mt-4 border-t-4 border-stark-black pt-4 flex justify-end gap-4">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="bg-pure-white text-stark-black font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:bg-surface-bright transition-colors">
                              CANCEL
                          </button>
                          <button type="submit" disabled={loadingId === "saving"} className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50">
                              <span className="material-symbols-outlined">save</span>
                              {loadingId === "saving" ? 'SAVING...' : 'COMMIT SPONSOR'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
