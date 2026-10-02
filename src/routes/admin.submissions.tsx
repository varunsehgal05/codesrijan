import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/submissions")({
  component: AdminSubmissions,
});

function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSubmissions = () => {
    const token = localStorage.getItem("codesrijan_auth_token");
    axios.get(`${API_BASE}/admin/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        setSubmissions(r.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch submissions error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleToggleLock = async (id: string, isLocked: boolean) => {
    if (isLocked && !window.confirm("Unlock this submission? This will allow the team to edit their payloads again.")) return;
    if (!isLocked && !window.confirm("Lock this submission? The team will be blocked from modifying payloads.")) return;

    setLoadingId(id);
    try {
        const token = localStorage.getItem("codesrijan_auth_token");
        const action = isLocked ? 'unlock' : 'lock';
        await axios.patch(`${API_BASE}/admin/submissions/${id}/${action}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStatusMsg({ type: 'success', text: `Submission successfully ${action}ed.` });
        fetchSubmissions();
    } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Lock toggle failed.' });
    } finally {
        setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            PAYLOAD PIPELINE
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Team Submissions Matrix
          </p>
        </div>
        <div className="bg-electric-blue text-pure-white px-6 py-2 font-code-snippet font-bold tracking-widest brutal-border uppercase">
            Total Submissions: {submissions.length}
        </div>
      </div>

      {statusMsg && (
          <div className={`p-4 brutal-border font-label-bold uppercase flex items-center gap-3 ${statusMsg.type === 'error' ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
              <span className="material-symbols-outlined">{statusMsg.type === 'error' ? 'error' : 'check_circle'}</span>
              <span>{statusMsg.text}</span>
          </div>
      )}

      {loading ? (
        <div className="bg-surface-container p-16 brutal-border text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-code-snippet uppercase tracking-widest animate-pulse">Scanning Transmission Logs...</p>
        </div>
      ) : (submissions.length === 0) ? (
        <div className="bg-pure-white p-16 brutal-border text-center flex flex-col items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant">inbox</span>
          <h3 className="font-display-lg uppercase text-2xl text-stark-black">NO PAYLOADS DETECTED</h3>
          <p className="font-mono text-on-surface-variant uppercase tracking-widest text-xs mb-4">No squad has transmitted their final structural package yet.</p>
        </div>
      ) : (
        <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-stark-black text-pure-white">
                        <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">ID / Time</th>
                        <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Squad Matrix</th>
                        <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Payload Links</th>
                        <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">State</th>
                        <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue text-center">Overrides</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub, i) => {
                        const isLocked = sub.status === 'locked';
                        return (
                            <tr key={sub.id || i} className={`border-b-2 border-stark-black hover:bg-surface-container transition-colors ${isLocked ? 'bg-surface-container-lowest' : ''}`}>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <div className="font-code-snippet text-xs text-stark-black font-bold mb-1">{sub.id}</div>
                                    <div className="font-code-snippet text-[10px] text-on-surface-variant uppercase">v{sub.version || 1} • {new Date(sub.createdAt).toLocaleString()}</div>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <div className="font-label-bold uppercase text-stark-black">{sub.projectTitle || 'Unnamed'}</div>
                                    <div className="font-code-snippet text-xs text-electric-blue">Team: {sub.teamId}</div>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <div className="flex flex-col gap-1">
                                        {sub.githubUrl && <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="text-[10px] font-label-bold uppercase text-stark-black hover:text-electric-blue flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">code</span> Repository</a>}
                                        {sub.figmaUrl && <a href={sub.figmaUrl} target="_blank" rel="noreferrer" className="text-[10px] font-label-bold uppercase text-stark-black hover:text-electric-blue flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">design_services</span> Prototype</a>}
                                        {sub.demoVideoUrl && <a href={sub.demoVideoUrl} target="_blank" rel="noreferrer" className="text-[10px] font-label-bold uppercase text-stark-black hover:text-electric-blue flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">play_circle</span> Demo</a>}
                                        {!sub.githubUrl && !sub.figmaUrl && !sub.demoVideoUrl && <span className="text-[10px] text-error font-bold uppercase">MISSING PAYLOAD DATA</span>}
                                    </div>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <span className={`px-2 py-1 text-xs font-bold uppercase border-2 flex items-center gap-1 w-fit ${isLocked ? 'border-success text-success bg-success/10' : 'border-warning text-warning bg-warning/10'}`}>
                                        <span className="material-symbols-outlined text-sm">{isLocked ? 'lock' : 'lock_open'}</span>
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => handleToggleLock(sub.id, isLocked)}
                                        disabled={loadingId === sub.id}
                                        className={`px-4 py-2 font-label-caps text-xs border-2 brutal-shadow hover:-translate-y-0.5 transition-all font-bold tracking-widest uppercase cursor-pointer disabled:opacity-50 ${isLocked ? 'bg-error text-pure-white border-stark-black' : 'bg-success text-stark-black border-stark-black'}`}
                                    >
                                        {loadingId === sub.id ? 'PROCESSING...' : isLocked ? 'FORCE UNLOCK' : 'LOCKDOWN'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
