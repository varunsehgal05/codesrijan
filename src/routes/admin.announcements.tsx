import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/announcements")({
  component: AdminAnnouncements,
});

function AdminAnnouncements() {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("announcement");
  const [targetAudience, setTargetAudience] = useState("everyone");
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

  // Must be admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate({ to: "/dashboard" });
    }
  }, [currentUser, navigate]);

  const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${BASE}/announcements`,
        { title, content, type, targetAudience },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMsg("TRANSMISSION SUCCESSFUL: Broadcast sent to all nodes.");
      setTitle("");
      setContent("");
    } catch (err: any) {
      setStatusMsg(`ERR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* Header Panel */}
      <div className="bg-pure-white p-6 brutal-border brutal-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            COMMUNICATIONS
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Global Broadcast Control Node
          </p>
        </div>
      </div>

      <div className="bg-pure-white brutal-border brutal-shadow-lg p-8">
        {statusMsg && (
          <div className={`p-4 mb-6 brutal-border font-label-bold uppercase ${statusMsg.startsWith('ERR') ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleBroadcast} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-label-bold uppercase text-ink-black">Transmission Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required placeholder="URGENT: Submission Deadline Extended..." />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-bold uppercase text-ink-black">Message Payload (Markdown Supported)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required placeholder="Alerting all hackers! We have adjusted the timeline..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-bold uppercase text-ink-black">Event Designation</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none">
                <option value="announcement">Global Notice</option>
                <option value="submission">Submission Alert</option>
                <option value="evaluation">Judgment Phase</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-bold uppercase text-ink-black">Target Vectors</label>
              <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none">
                <option value="everyone">All Operatives Node</option>
                <option value="students">Hacker Squads Only</option>
                <option value="judges">Review Staff Only</option>
              </select>
            </div>
          </div>

          <button disabled={loading} type="submit" className="md:self-end mt-4 bg-stark-black text-pure-white font-label-bold px-8 py-4 uppercase brutal-border brutal-shadow-hover transition-all disabled:opacity-50 flex items-center gap-2">
            <span className="material-symbols-outlined">campaign</span>
            {loading ? 'Dispersing...' : 'Initiate Broadcast'}
          </button>
        </form>
      </div>
    </div>
  );
}
