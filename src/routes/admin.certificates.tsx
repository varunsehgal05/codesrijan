import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/certificates")({
  component: AdminCertificates,
});

function AdminCertificates() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCerts = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCerts(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleBatchGenerate = async () => {
    if (!window.confirm("Commence batch generation of SHA-256 verifiable certificates for all evaluated squads?")) return;
    setGenerating(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/certificates/batch`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg({ type: 'success', text: "Batch generation pipeline initialized successfully." });
      setTimeout(() => fetchCerts(), 2000); // mock reload
    } catch (err) {
      setStatusMsg({ type: 'error', text: "Failed to initialize generation pipeline." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-[#FFD700] px-2 py-1 inline-block transform -skew-x-6">
            CREDENTIALS ENFORCEMENT
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">SHA-256 Verifiable Participation Certificates</p>
        </div>
        <div className="font-code-snippet bg-stark-black text-pure-white px-6 py-3 border-2 border-stark-black font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#FFD700]">workspace_premium</span>
            ISSUED: {certs.length}
        </div>
      </div>

      {statusMsg && (
          <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${statusMsg.type === 'error' ? 'bg-error text-pure-white' : 'bg-success text-stark-black'}`}>
              <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
              <span>{statusMsg.text}</span>
          </div>
      )}

      <div className="bg-pure-white p-12 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center gap-8">
        <div className="relative">
            <span className="material-symbols-outlined text-[100px] text-electric-blue">workspace_premium</span>
            {generating && <span className="absolute top-0 right-0 material-symbols-outlined text-[40px] text-success animate-spin">settings</span>}
        </div>
        <div className="text-center">
            <h3 className="font-headline-lg uppercase text-2xl mb-2">Automated Batch Generation</h3>
            <p className="font-code-snippet text-on-surface-variant text-sm max-w-xl mx-auto uppercase tracking-widest">
            Automatically map participation matrices against final submissions to batch-generate and cryptographically sign credentials for all registered squads.
            </p>
        </div>
        <button 
            onClick={handleBatchGenerate} 
            disabled={generating}
            className="bg-stark-black text-pure-white px-12 py-4 font-label-bold uppercase border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 disabled:opacity-50"
        >
            <span className="material-symbols-outlined">{generating ? 'sync' : 'precision_manufacturing'}</span>
            {generating ? 'GENERATING BATCH...' : 'COMMENCE BATCH RUN'}
        </button>
      </div>

      {certs.length > 0 && (
          <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-0">
              <table className="w-full text-left font-body-md">
                  <thead className="bg-stark-black text-pure-white uppercase font-label-bold">
                      <tr>
                          <th className="p-4 border-r-2 border-stark-black">Certificate Hash</th>
                          <th className="p-4 border-r-2 border-stark-black">Recipient</th>
                          <th className="p-4 border-r-2 border-stark-black">Designation</th>
                          <th className="p-4">Issued At</th>
                      </tr>
                  </thead>
                  <tbody>
                      {certs.map(c => (
                          <tr key={c.id} className="border-b-2 border-stark-black hover:bg-surface-bright">
                              <td className="p-4 border-r-2 border-stark-black font-code-snippet text-xs">{c.verificationCode || c.id}</td>
                              <td className="p-4 border-r-2 border-stark-black font-label-bold uppercase">{c.userId}</td>
                              <td className="p-4 border-r-2 border-stark-black uppercase text-xs">{c.type}</td>
                              <td className="p-4 font-code-snippet text-xs opacity-70">{new Date(c.createdAt).toLocaleDateString()}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
}
