import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

function SupportPage() {
  const { currentUser } = useAppStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const API_URL = (import.meta.env['VITE_API_URL'] ? (import.meta.env['VITE_API_URL'].endsWith('/api') ? import.meta.env['VITE_API_URL'] : import.meta.env['VITE_API_URL'] + '/api') : 'https://codesrijan-api.onrender.com/api');
  const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      if (!token) return;
      const res = await axios.get(`${BASE}/support`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (e) {
      console.error("Failed to fetch tickets");
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${BASE}/support`, {
        subject, category, description, priority
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTickets();
      setIsFormOpen(false);
      setSubject("");
      setDescription("");
    } catch (e) {
      alert("Failed to submit ticket.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="p-12 text-center font-code-snippet uppercase mt-10 text-xl font-bold">PLEASE AUTHENTICATE TO ACCESS SECURE COMM CHANNELS.</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-4 md:p-12">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white bg-error px-2 py-1 inline-block transform -skew-x-6">
            SUPPORT HQ
          </h2>
          <p className="font-code-snippet text-xs mt-2 uppercase tracking-widest text-on-surface-variant">
            Direct Line to Administration
          </p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
        >
          {isFormOpen ? 'CANCEL' : 'TALK TO ADMIN'}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-surface-container p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-headline-md uppercase mb-6 text-stark-black border-b-4 border-stark-black pb-2 inline-block">Initialize Ticket</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-bold uppercase text-xs tracking-widest">Subject Payload</label>
                <input 
                  type="text" 
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="bg-pure-white border-2 border-stark-black p-3 font-code-snippet text-sm focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
                  placeholder="e.g. Squad Formation Error"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-bold uppercase text-xs tracking-widest">Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="bg-pure-white border-2 border-stark-black p-3 font-code-snippet text-sm uppercase focus:outline-none"
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Glitch</option>
                  <option value="billing">Account / Billing</option>
                  <option value="report">Report Operative</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="font-label-bold uppercase text-xs tracking-widest">Priority</label>
                    <select 
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="bg-pure-white border-2 border-stark-black p-3 font-code-snippet text-sm uppercase focus:outline-none"
                    >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Blocker)</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-bold uppercase text-xs tracking-widest">Transmission Data</label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="bg-pure-white border-2 border-stark-black p-3 font-code-snippet text-sm min-h-[120px] focus:outline-none"
                placeholder="Describe your issue in detail..."
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-electric-blue text-pure-white font-label-bold uppercase px-6 py-4 border-2 border-stark-black mt-4 disabled:opacity-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">{loading ? 'sync' : 'send'}</span>
              {loading ? 'TRANSMITTING...' : 'TRANSMIT TICKET'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-pure-white brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-ink-black text-pure-white p-4 flex justify-between items-center">
          <h3 className="font-label-bold uppercase tracking-widest">ACTIVE TRANSMISSIONS ({tickets.length})</h3>
        </div>
        
        {tickets.length === 0 ? (
          <div className="p-12 text-center font-code-snippet text-on-surface-variant uppercase">
            [SYS] No active support tickets detected for this operative.
          </div>
        ) : (
          <ul className="flex flex-col">
            {tickets.map(t => (
              <li key={t.id} className="border-b-2 border-stark-black p-6 hover:bg-surface-container transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-stark-black text-pure-white px-2 py-0.5 text-[10px] font-label-bold uppercase">{t.id.substring(0,8)}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-label-bold uppercase border-2 ${t.status === 'open' ? 'border-error text-error' : t.status === 'resolved' ? 'border-success text-success' : 'border-electric-blue text-electric-blue'}`}>
                      {t.status}
                    </span>
                  </div>
                  <h4 className="font-headline-sm font-bold text-stark-black">{t.subject}</h4>
                  <p className="font-code-snippet text-xs text-on-surface-variant mt-1 line-clamp-1">{t.description}</p>
                </div>
                <Link 
                  to="/chat"
                  search={{ conv: t.conversationId }}
                  className="bg-surface-bright text-stark-black px-4 py-2 text-xs font-label-bold uppercase border-2 border-stark-black hover:bg-electric-blue hover:text-pure-white transition-colors flex items-center gap-2 whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[2px] translate-y-[2px] hover:translate-x-0 hover:translate-y-0"
                >
                  <span className="material-symbols-outlined text-[16px]">forum</span>
                  Open Comms
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
