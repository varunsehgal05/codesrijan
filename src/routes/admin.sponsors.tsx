import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";
import { toast } from "react-hot-toast";

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

  // Custom Delete Modal state
  const [sponsorToDelete, setSponsorToDelete] = useState<any | null>(null);

  const fetchSponsors = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/sponsors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSponsors(Array.isArray(res.data) ? res.data : []);
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
      description: "",
      tier: "gold",
      order: 0,
      isPublished: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sponsor: any) => {
    setEditingSponsor({ ...sponsor });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingId("saving");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/sponsors`, editingSponsor, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      toast.success("Sponsor partnership updated.");
      setStatusMsg({ type: 'success', text: 'Sponsor matrix updated.' });
      fetchSponsors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update sponsor.");
      setStatusMsg({ type: 'error', text: 'Failed to update sponsor.' });
    } finally {
      setLoadingId(null);
    }
  };

  const confirmDeleteSponsor = async () => {
    if (!sponsorToDelete) return;
    setLoadingId(sponsorToDelete.id);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.delete(`${API_BASE}/admin/sponsors/${sponsorToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Sponsor purged successfully.");
      setStatusMsg({ type: 'success', text: 'Sponsor purged.' });
      setSponsorToDelete(null);
      fetchSponsors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to purge sponsor.");
      setStatusMsg({ type: 'error', text: 'Failed to purge sponsor.' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      
      {/* Header Bar */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            SPONSOR LOGISTICS
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Corporate Backing, Industry Partners & Grant Allocations
          </p>
        </div>
        <button 
          onClick={openCreateModal} 
          className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer text-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add_business</span> 
          REGISTER NEW SPONSOR
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
          <button 
            onClick={openCreateModal}
            className="bg-electric-blue text-pure-white px-5 py-2.5 font-label-bold uppercase border-2 border-stark-black text-xs"
          >
            + ADD FIRST SPONSOR
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map(sp => (
            <div key={sp.id} className={`bg-pure-white p-6 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group hover:-translate-y-1 transition-transform ${!sp.isPublished ? 'opacity-70' : ''}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`font-label-bold uppercase text-[10px] tracking-widest px-2.5 py-1 border-2 border-stark-black inline-block ${
                    sp.tier === 'title' ? 'bg-[#FFD700] text-stark-black' :
                    sp.tier === 'platinum' ? 'bg-stark-black text-pure-white' : 
                    sp.tier === 'gold' ? 'bg-amber-100 text-amber-900' :
                    'bg-surface-bright text-stark-black'
                  }`}>
                    {sp.tier} TIER
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => openEditModal(sp)} 
                      className="p-1.5 bg-surface-bright border-2 border-stark-black text-stark-black hover:bg-electric-blue hover:text-white transition-colors cursor-pointer"
                      title="Edit Sponsor"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                    </button>
                    <button 
                      onClick={() => setSponsorToDelete(sp)} 
                      disabled={loadingId === sp.id} 
                      className="p-1.5 bg-surface-bright border-2 border-stark-black text-error hover:bg-error hover:text-pure-white transition-colors disabled:opacity-50 cursor-pointer"
                      title="Purge Sponsor"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  {sp.logo ? (
                    <img src={sp.logo} alt={sp.name} className="w-16 h-16 object-contain border-2 border-stark-black p-1 bg-surface-bright shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-surface-bright border-2 border-stark-black flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined opacity-50">image</span>
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h3 className="font-headline-md uppercase text-lg text-stark-black truncate">{sp.name}</h3>
                    {sp.description && (
                      <p className="font-mono text-xs text-zinc-500 line-clamp-2 mt-0.5">{sp.description}</p>
                    )}
                    {sp.website && (
                      <a href={sp.website} target="_blank" rel="noreferrer" className="font-code-snippet text-[10px] text-electric-blue hover:underline uppercase break-all block mt-1">
                        LINK OUT ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal with Backdrop Click-Outside */}
      {isModalOpen && editingSponsor && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-xl flex flex-col">
            <div className="bg-stark-black text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center">
              <h3 className="font-headline-md uppercase tracking-widest">
                {editingSponsor.id ? 'EDIT SPONSOR PARTNER' : 'REGISTER SPONSOR PARTNER'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-pure-white hover:text-error transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs">Entity Name *</label>
                  <input 
                    required 
                    type="text" 
                    value={editingSponsor.name} 
                    onChange={(e) => setEditingSponsor({...editingSponsor, name: e.target.value})} 
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                    placeholder="e.g. Google Cloud / Polygon"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs">Tier</label>
                  <select 
                    value={editingSponsor.tier} 
                    onChange={(e) => setEditingSponsor({...editingSponsor, tier: e.target.value})} 
                    className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs uppercase focus:outline-none focus:border-electric-blue"
                  >
                    <option value="title">Title Sponsor</option>
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="community">Community / Ecosystem</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs">Description / Blurb</label>
                <textarea 
                  rows={2}
                  value={editingSponsor.description || ''} 
                  onChange={(e) => setEditingSponsor({...editingSponsor, description: e.target.value})} 
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                  placeholder="Official developer tooling provider / Cash prize sponsor..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs">Website URL</label>
                <input 
                  type="url" 
                  value={editingSponsor.website} 
                  onChange={(e) => setEditingSponsor({...editingSponsor, website: e.target.value})} 
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                  placeholder="https://cloud.google.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs">Logo Image URL</label>
                <input 
                  type="url" 
                  value={editingSponsor.logo} 
                  onChange={(e) => setEditingSponsor({...editingSponsor, logo: e.target.value})} 
                  className="bg-surface-bright border-2 border-stark-black p-3 font-code-snippet text-xs focus:outline-none focus:border-electric-blue" 
                  placeholder="https://.../logo.png"
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
                  {loadingId === "saving" ? 'SAVING...' : 'COMMIT SPONSOR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Replaces window.confirm) */}
      {sponsorToDelete && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setSponsorToDelete(null); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
              <h3 className="font-headline-md text-lg uppercase text-stark-black">PURGE SPONSOR</h3>
            </div>
            <p className="font-code-snippet text-xs text-stark-black">
              Are you sure you want to permanently purge sponsor partner <strong className="bg-[#FEF08A] px-1">{sponsorToDelete.name}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSponsorToDelete(null)}
                className="px-4 py-2 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSponsor}
                disabled={loadingId === sponsorToDelete.id}
                className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-error text-white hover:bg-black text-xs cursor-pointer"
              >
                {loadingId === sponsorToDelete.id ? 'PURGING...' : 'CONFIRM PURGE'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
