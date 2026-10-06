import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupport,
});

function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const { currentUser } = useAppStore();

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');
  const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${BASE}/admin/support`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (e) {
      console.error("Failed to fetch tickets");
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.patch(`${BASE}/admin/support/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadTickets();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleCloneTicket = async (id: string) => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${BASE}/admin/support/${id}/clone`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("SUCCESS: Support ticket cloned.");
      await loadTickets();
    } catch (e) {
      alert("Failed to clone ticket.");
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently remove/delete this support ticket?")) return;
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.delete(`${BASE}/admin/support/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("SUCCESS: Ticket permanently removed.");
      await loadTickets();
    } catch (e) {
      alert("Failed to remove ticket.");
    }
  };

  const openTicketCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white bg-error px-2 py-1 inline-block transform -skew-x-6 tracking-tight leading-none">
            GLOBAL SUPPORT TICKETS
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">User Assistance & Issue Tracking</p>
        </div>
        <div className="font-code-snippet bg-stark-black text-pure-white px-6 py-3 border-2 border-stark-black font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-error">warning</span>
            {openTicketCount} ACTIVE ALERTS
        </div>
      </div>

      <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-0 text-stark-black overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-success mb-4">task_alt</span>
              <h3 className="font-headline-md text-2xl uppercase">INFRASTRUCTURE IS NOMINAL</h3>
              <p className="font-code-snippet mt-2 uppercase tracking-widest text-xs opacity-70">NO USER SUPPORT TICKETS DETECTED.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md">
              <thead className="bg-ink-black text-pure-white uppercase font-label-bold">
                <tr>
                  <th className="p-4 border-2 border-ink-black">Ticket ID</th>
                  <th className="p-4 border-2 border-ink-black">User (Total Tickets)</th>
                  <th className="p-4 border-2 border-ink-black">Subject</th>
                  <th className="p-4 border-2 border-ink-black">Category</th>
                  <th className="p-4 border-2 border-ink-black">Priority</th>
                  <th className="p-4 border-2 border-ink-black">Status</th>
                  <th className="p-4 border-2 border-ink-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const userTicketCount = tickets.filter(t => t.userId === ticket.userId).length;
                  return (
                  <tr key={ticket.id} className="border-b-2 border-ink-black hover:bg-surface-container">
                    <td className="p-4 border-r-2 border-ink-black font-code-snippet text-xs">{ticket.id.substring(0,12)}</td>
                    <td className="p-4 border-r-2 border-ink-black font-code-snippet text-xs">
                      {ticket.userId.substring(0,8)} 
                      <span className="ml-2 inline-block bg-surface-container-high px-2 py-0.5 rounded text-error font-bold" title="Total tickets created by this user">
                         {userTicketCount}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-ink-black font-label-bold">{ticket.subject}</td>
                    <td className="p-4 border-r-2 border-ink-black">{ticket.category}</td>
                    <td className="p-4 border-r-2 border-ink-black">
                      <span className={`px-2 py-1 text-xs font-bold uppercase ${ticket.priority === 'urgent' ? 'bg-error text-pure-white' : 'bg-surface-container-high'}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-ink-black">
                      <select 
                        value={ticket.status} 
                        onChange={(e) => updateStatus(ticket.id, e.target.value)}
                        className={`p-1 border-2 border-ink-black text-xs font-label-bold uppercase focus:outline-none ${ticket.status === 'in_progress' ? 'bg-[#FFD700] text-stark-black' : ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-success text-pure-white' : 'bg-pure-white text-stark-black'}`}
                      >
                        <option value="open">OPEN</option>
                        <option value="in_progress">PROCESSING (IN PROGRESS)</option>
                        <option value="resolved">RESOLVED</option>
                        <option value="closed">CLOSED</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center">
                        <Link to="/chat" search={{ conv: ticket.conversationId }} className="bg-electric-blue text-pure-white px-2 py-1 font-label-bold uppercase text-[11px] brutal-border hover:-translate-y-0.5 transition-all">
                          Comms
                        </Link>
                        <button onClick={() => handleCloneTicket(ticket.id)} className="bg-stark-black text-[#FFD700] px-2 py-1 font-label-bold uppercase text-[11px] brutal-border hover:-translate-y-0.5 transition-all">
                          Clone
                        </button>
                        <button onClick={() => handleDeleteTicket(ticket.id)} className="bg-error text-pure-white px-2 py-1 font-label-bold uppercase text-[11px] brutal-border hover:bg-stark-black transition-all">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
