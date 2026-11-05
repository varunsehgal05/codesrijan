import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

interface Ticket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  affectedPage?: string;
  conversationId?: string;
  createdAt: string;
}

function SupportPage() {
  const { currentUser, users, isLoaded } = useAppStore();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New Ticket Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [affectedPage, setAffectedPage] = useState("");
  const [priority, setPriority] = useState("normal");

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
  const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      if (!token) return;
      const endpoint = currentUser?.role === 'admin' 
        ? `${BASE}/admin/support?activeOnly=false` 
        : `${BASE}/support?includeClosed=true`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setTickets(data);
    } catch (e) {
      console.error("Failed to fetch tickets", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 10000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === 'admin') {
      toast.error("Administrators cannot create student support tickets from this view.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.post(`${BASE}/support`, {
        subject, category, description, priority, affectedPage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("🎫 Support ticket registered. Routing to Comms channel...");
      setIsFormOpen(false);
      setSubject("");
      setDescription("");
      setAffectedPage("");
      await fetchTickets();
      
      const newTicket = res.data;
      if (newTicket?.id) {
        navigate({ 
          to: "/chat", 
          search: { ticketId: newTicket.id, conv: newTicket.conversationId } 
        });
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to submit ticket.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, nextStatus: string) => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const endpoint = currentUser?.role === 'admin' 
        ? `${BASE}/admin/support/${ticketId}/status` 
        : `${BASE}/support/${ticketId}/status`;
      await axios.patch(endpoint, { status: nextStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Ticket status updated to ${nextStatus.toUpperCase().replace('_', ' ')}`);
      await fetchTickets();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update ticket status.");
    }
  };

  if (!isLoaded && typeof window !== 'undefined' && localStorage.getItem("codesrijan_auth_token")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="p-8 font-mono text-xs uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-electric-blue animate-ping"></span>
          VERIFYING TRANSMISSION CREDENTIALS...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-pure-white p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <span className="material-symbols-outlined text-5xl text-error mb-4">lock</span>
          <h2 className="font-display-lg text-2xl uppercase text-stark-black">AUTHENTICATION REQUIRED</h2>
          <p className="font-code-snippet text-xs text-on-surface-variant mt-2 uppercase tracking-widest">
            Please log in to access the Support Ticket Matrix.
          </p>
          <Link to="/login" className="mt-6 inline-block bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase brutal-border hover:bg-electric-blue transition-all">
            ACCESS GATEWAY ↗
          </Link>
        </div>
      </div>
    );
  }

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.id.toLowerCase().includes(q) || 
      t.subject?.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    const normalizedStatus = (t.status || 'open').toLowerCase().replace(/[\s-]+/g, '_');
    let matchesStatus = true;
    if (statusFilter === 'open') {
      matchesStatus = normalizedStatus === 'open';
    } else if (statusFilter === 'in_progress') {
      matchesStatus = normalizedStatus === 'in_progress';
    } else if (statusFilter === 'resolved') {
      matchesStatus = normalizedStatus === 'resolved';
    } else if (statusFilter === 'closed') {
      matchesStatus = normalizedStatus === 'closed';
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => (t.status || 'open').toLowerCase() === 'open').length;
  const inProgressCount = tickets.filter(t => (t.status || '').toLowerCase().replace(/[\s-]+/g, '_') === 'in_progress').length;
  const resolvedCount = tickets.filter(t => ['resolved', 'closed'].includes((t.status || '').toLowerCase())).length;

  const getStatusBadge = (status: string) => {
    const s = (status || 'open').toLowerCase().replace(/[\s-]+/g, '_');
    if (s === 'in_progress') {
      return <span className="bg-[#FEF08A] text-[#854D0E] border-2 border-black px-2.5 py-1 text-xs font-mono font-bold uppercase shadow-[1px_1px_0px_#000]">⚡ IN PROGRESS</span>;
    }
    if (s === 'resolved') {
      return <span className="bg-[#DCFCE7] text-[#166534] border-2 border-black px-2.5 py-1 text-xs font-mono font-bold uppercase shadow-[1px_1px_0px_#000]">✓ RESOLVED</span>;
    }
    if (s === 'closed') {
      return <span className="bg-[#E5E7EB] text-[#1F2937] border-2 border-black px-2.5 py-1 text-xs font-mono font-bold uppercase shadow-[1px_1px_0px_#000]">✕ CLOSED</span>;
    }
    return <span className="bg-[#FEE2E2] text-[#991B1B] border-2 border-black px-2.5 py-1 text-xs font-mono font-bold uppercase shadow-[1px_1px_0px_#000]">● OPEN</span>;
  };

  const getPriorityBadge = (p: string) => {
    const pr = (p || 'normal').toLowerCase();
    if (pr === 'critical') return <span className="bg-rose-600 text-white border border-black px-2 py-0.5 text-[10px] font-mono font-black uppercase">CRITICAL</span>;
    if (pr === 'high') return <span className="bg-amber-400 text-black border border-black px-2 py-0.5 text-[10px] font-mono font-black uppercase">HIGH</span>;
    if (pr === 'low') return <span className="bg-zinc-200 text-zinc-700 border border-black px-2 py-0.5 text-[10px] font-mono font-bold uppercase">LOW</span>;
    return <span className="bg-blue-100 text-blue-900 border border-black px-2 py-0.5 text-[10px] font-mono font-bold uppercase">NORMAL</span>;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'bug_report': return 'bug_report';
      case 'payment': return 'payments';
      case 'squad': return 'groups';
      case 'feature_request': return 'lightbulb';
      case 'system': return 'terminal';
      default: return 'help_outline';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6 font-mono">
      
      {/* Top Header Banner */}
      <div className="bg-pure-white p-6 sm:p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#5865F2] text-pure-white border-4 border-stark-black flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="material-symbols-outlined text-3xl">headset_mic</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display-lg text-2xl sm:text-3xl uppercase text-stark-black font-black tracking-tight">
                SUPPORT TICKET MATRIX
              </h2>
              <span className="bg-[#5865F2] text-pure-white font-mono text-[10px] font-bold px-2 py-0.5 border border-stark-black">
                LIVE DISPATCH
              </span>
            </div>
            <p className="font-code-snippet text-xs text-on-surface-variant mt-1 uppercase tracking-widest">
              {currentUser.role === 'admin' ? 'Global Support Dispatch Directorate' : 'Technical Inquiries & Admin Resolution Ledger'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {currentUser.role === 'admin' && (
            <Link
              to="/admin/support"
              className="bg-zinc-100 text-black px-5 py-3 font-label-bold uppercase border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 text-xs"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              ADMIN DIRECTIVE ↗
            </Link>
          )}
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-[#5865F2] hover:bg-black text-white px-6 py-3 font-label-bold uppercase border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-base">{isFormOpen ? 'close' : 'add_circle'}</span>
            {isFormOpen ? 'CLOSE FORM' : 'TALK TO ADMIN / NEW TICKET'}
          </button>
        </div>
      </div>

      {/* Ticket Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border-4 border-black p-4 brutal-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">ALL TICKETS</span>
            <span className="text-2xl font-black">{totalCount}</span>
          </div>
          <span className="material-symbols-outlined text-3xl text-zinc-400">inventory_2</span>
        </div>
        <div className="bg-rose-50 border-4 border-black p-4 brutal-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-rose-800 font-bold block">OPEN / ACTIVE</span>
            <span className="text-2xl font-black text-rose-700">{openCount}</span>
          </div>
          <span className="material-symbols-outlined text-3xl text-rose-500">pending</span>
        </div>
        <div className="bg-amber-50 border-4 border-black p-4 brutal-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">IN PROGRESS</span>
            <span className="text-2xl font-black text-amber-800">{inProgressCount}</span>
          </div>
          <span className="material-symbols-outlined text-3xl text-amber-500">bolt</span>
        </div>
        <div className="bg-emerald-50 border-4 border-black p-4 brutal-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">RESOLVED</span>
            <span className="text-2xl font-black text-emerald-700">{resolvedCount}</span>
          </div>
          <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
        </div>
      </div>

      {/* New Ticket Form Modal */}
      {isFormOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop-animate font-mono"
          onClick={() => setIsFormOpen(false)}
        >
          <div 
            className="bg-white border-4 border-black brutal-shadow max-w-xl w-full p-6 sm:p-8 modal-content-animate relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-[#5865F2]">add_comment</span>
                <h3 className="font-display-lg text-2xl uppercase font-black text-black">
                  DISPATCH SUPPORT TICKET
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-black hover:text-white border-2 border-black transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                  Ticket Subject / Title *
                </label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. UPI Verification Pending for Team Alpha"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full border-2 border-black p-3 bg-surface-container font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border-2 border-black p-2.5 bg-surface-container font-mono text-xs uppercase"
                  >
                    <option value="general">General Support</option>
                    <option value="payment">Payment & Refunds</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="squad">Squad Management</option>
                    <option value="system">System / Access</option>
                    <option value="feature_request">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full border-2 border-black p-2.5 bg-surface-container font-mono text-xs uppercase"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                  Affected URL / Portal (Optional)
                </label>
                <input
                  placeholder="e.g. /workspace, /payment, /dashboard"
                  value={affectedPage}
                  onChange={e => setAffectedPage(e.target.value)}
                  className="w-full border-2 border-black p-2.5 bg-surface-container font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-800 mb-1">
                  Reason for Inquiry / Technical Details *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue with steps to reproduce or transaction reference..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border-2 border-black p-3 bg-surface-container font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div className="flex gap-4 mt-3 pt-4 border-t-2 border-zinc-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#5865F2] hover:bg-black text-white font-label-bold uppercase py-3 border-2 border-black transition-all brutal-shadow hover:-translate-y-0.5 cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      DISPATCHING TICKET...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      TRANSMIT TICKET & OPEN CHAT
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-black font-label-bold uppercase py-3 border-2 border-black transition-all brutal-shadow hover:-translate-y-0.5 cursor-pointer text-xs"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-pure-white border-4 border-black p-4 sm:p-5 brutal-shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'ALL TICKETS' },
            { id: 'open', label: '● OPEN' },
            { id: 'in_progress', label: '⚡ IN PROGRESS' },
            { id: 'resolved', label: '✓ RESOLVED' },
            { id: 'closed', label: '✕ CLOSED' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 font-mono text-xs font-bold uppercase border-2 border-black transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border-2 border-black px-3 py-2 text-xs font-mono bg-white outline-none uppercase font-bold shrink-0"
          >
            <option value="all">ALL CATEGORIES</option>
            <option value="general">GENERAL</option>
            <option value="payment">PAYMENTS</option>
            <option value="bug_report">BUG REPORTS</option>
            <option value="squad">SQUAD OPS</option>
            <option value="system">SYSTEM</option>
            <option value="feature_request">FEATURE REQ</option>
          </select>

          <div className="relative flex-grow min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by subject or ID..."
              className="w-full border-2 border-black pl-9 pr-3 py-2 text-xs font-mono outline-none focus:border-[#5865F2]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-xs text-zinc-500 hover:text-black">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Ledger Cards */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="bg-pure-white border-4 border-black p-12 text-center brutal-shadow space-y-3">
            <span className="material-symbols-outlined text-5xl text-zinc-400">inbox</span>
            <h3 className="font-display-md text-xl uppercase font-black text-zinc-700">NO SUPPORT TICKETS FOUND</h3>
            <p className="text-xs text-zinc-500 font-mono">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'No tickets match your active filter criteria.'
                : 'You have not submitted any technical support tickets yet.'}
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-2 inline-flex items-center gap-2 bg-[#5865F2] hover:bg-black text-white font-mono text-xs uppercase px-5 py-2.5 border-2 border-black shadow-[2px_2px_0px_#000]"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Open First Support Ticket
            </button>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const author = users.find(u => u.id === ticket.userId);
            const isResolvedOrClosed = ['resolved', 'closed'].includes((ticket.status || '').toLowerCase());

            return (
              <div 
                key={ticket.id} 
                className="bg-pure-white border-4 border-black brutal-shadow p-6 sm:p-7 flex flex-col gap-4 hover:-translate-y-0.5 transition-transform"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="bg-stark-black text-white text-xs font-mono font-bold px-2 py-0.5">
                      #{ticket.id}
                    </span>
                    <span className="bg-zinc-100 text-zinc-800 border border-black text-[11px] font-mono font-bold px-2 py-0.5 uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">{getCategoryIcon(ticket.category)}</span>
                      {ticket.category.replace(/_/g, ' ')}
                    </span>
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>

                  <span className="text-[11px] font-mono text-zinc-500 font-bold shrink-0">
                    {new Date(ticket.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>

                {/* Card Body */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display-md text-lg sm:text-xl font-black uppercase text-black">
                      {ticket.subject}
                    </h3>
                    {ticket.affectedPage && (
                      <span className="bg-zinc-100 border border-zinc-400 text-zinc-700 text-[10px] font-mono px-2 py-0.5 shrink-0 uppercase">
                        Vector: {ticket.affectedPage}
                      </span>
                    )}
                  </div>

                  {/* Reason for Opening Ticket */}
                  <div className="bg-surface-container p-3.5 border-2 border-zinc-300 text-xs font-mono text-zinc-800 leading-relaxed whitespace-pre-wrap">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                      Reason for Inquiry / Technical Scope:
                    </span>
                    {ticket.description}
                  </div>

                  {currentUser.role === 'admin' && author && (
                    <div className="text-[11px] font-mono text-zinc-600 flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs">person</span>
                      Operative: <strong className="text-black">{author.name}</strong> ({author.email || author.id})
                    </div>
                  )}
                </div>

                {/* Card Action Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t-2 border-zinc-200">
                  <div className="text-[11px] font-mono text-zinc-500">
                    Live chat synchronized in Comms channel
                  </div>

                  <div className="flex items-center gap-3">
                    {isResolvedOrClosed ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(ticket.id, 'open')}
                        className="bg-zinc-200 hover:bg-zinc-300 text-black border-2 border-black font-mono text-xs uppercase px-3 py-2 cursor-pointer font-bold shadow-[2px_2px_0px_#000]"
                      >
                        Reopen Ticket
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(ticket.id, 'resolved')}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-emerald-600 font-mono text-xs uppercase px-3 py-2 cursor-pointer font-bold shadow-[2px_2px_0px_#000]"
                      >
                        Mark Resolved ✓
                      </button>
                    )}

                    <Link
                      to="/chat"
                      search={{ ticketId: ticket.id, conv: ticket.conversationId }}
                      className="bg-electric-blue hover:bg-black text-white border-2 border-black font-mono text-xs uppercase px-5 py-2 cursor-pointer font-bold shadow-[3px_3px_0px_#000] hover:shadow-none transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">forum</span>
                      OPEN CHAT IN COMMS →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
