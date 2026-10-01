import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupport,
});

function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const { currentUser } = useAppStore();

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';
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

  const openTicketCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white bg-error px-2 py-1 inline-block transform -skew-x-6">
            GLOBAL SUPPORT TICKETS
          </h2>
        </div>
        <div className="font-mono bg-stark-black text-pure-white px-4 py-2 brutal-border">
          {openTicketCount} ACTIVE ALERTS
        </div>
      </div>

      <div className="bg-pure-white brutal-border brutal-shadow p-6 text-stark-black">
        {tickets.length === 0 ? (
          <div className="p-12 text-center font-code-snippet">
            INFRASTRUCTURE IS NOMINAL. NO USER SUPPORT TICKETS DETECTED.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md">
              <thead className="bg-ink-black text-pure-white uppercase font-label-bold">
                <tr>
                  <th className="p-4 border-2 border-ink-black">Ticket ID</th>
                  <th className="p-4 border-2 border-ink-black">Subject</th>
                  <th className="p-4 border-2 border-ink-black">Category</th>
                  <th className="p-4 border-2 border-ink-black">Priority</th>
                  <th className="p-4 border-2 border-ink-black">Status</th>
                  <th className="p-4 border-2 border-ink-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b-2 border-ink-black hover:bg-surface-container">
                    <td className="p-4 border-r-2 border-ink-black font-code-snippet text-xs">{ticket.id.substring(0,12)}</td>
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
                        className="p-1 border-2 border-ink-black text-xs font-label-bold uppercase bg-pure-white focus:outline-none"
                      >
                        <option value="open">OPEN</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="resolved">RESOLVED</option>
                        <option value="closed">CLOSED</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {/* Navigate to Chat UI for this support ticket */}
                      <a href="/chat" className="text-electric-blue font-label-bold uppercase text-xs hover:underline">
                        Open Comms
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
