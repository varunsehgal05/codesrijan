import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupport,
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

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Custom Delete Confirm Modal State (replaces window.confirm)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { currentUser, users } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
  const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${BASE}/admin/support`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setTickets(data);
      if (data.length > 0 && !selectedTicketId) {
        setSelectedTicketId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Fetch thread messages
  const fetchMessages = async (convId?: string) => {
    const targetConvId = convId || selectedTicket?.conversationId;
    if (!targetConvId) {
      setMessages([]);
      return;
    }
    try {
      setMessagesLoading(true);
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${BASE}/conversations/${targetConvId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch ticket messages", e);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTicket?.conversationId) {
      fetchMessages(selectedTicket.conversationId);
      const interval = setInterval(() => {
        fetchMessages(selectedTicket.conversationId);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedTicket?.conversationId) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${BASE}/conversations/${selectedTicket.conversationId}/messages`, {
        message: `[STAFF RESPONSE] ${newMessage.trim()}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage("");
      await fetchMessages(selectedTicket.conversationId);
      toast.success("Staff transmission dispatched.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to transmit message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.patch(`${BASE}/admin/support/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Ticket status updated to ${newStatus.toUpperCase()}`);
      await loadTickets();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeletingId(ticketToDelete.id);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.delete(`${BASE}/admin/support/${ticketToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Ticket permanently removed from support registry.");
      setTicketToDelete(null);
      if (selectedTicketId === ticketToDelete.id) {
        setSelectedTicketId(null);
      }
      await loadTickets();
    } catch (e) {
      toast.error("Failed to remove ticket.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyTranscript = () => {
    if (!selectedTicket) return;
    const authorUser = users.find(u => u.id === selectedTicket.userId);
    let transcript = `=== CODESRIJAN DISCORD TICKET TRANSCRIPT ===\n`;
    transcript += `Ticket ID: #${selectedTicket.id}\n`;
    transcript += `Subject: ${selectedTicket.subject}\n`;
    transcript += `Author: ${authorUser ? authorUser.name : selectedTicket.userId} (${authorUser?.email || 'N/A'})\n`;
    transcript += `Category: ${selectedTicket.category}\n`;
    transcript += `Priority: ${selectedTicket.priority}\n`;
    transcript += `Status: ${selectedTicket.status}\n`;
    transcript += `Created: ${new Date(selectedTicket.createdAt).toLocaleString()}\n`;
    transcript += `-------------------------------------------\n\n`;
    transcript += `[INITIAL DISPATCH]:\n${selectedTicket.description}\n\n`;
    transcript += `[THREAD MESSAGES]:\n`;
    messages.forEach(m => {
      const sender = users.find(u => u.id === m.senderId);
      const name = sender ? sender.name : 'Unknown';
      transcript += `[${new Date(m.createdAt).toLocaleTimeString()}] ${name}: ${m.message}\n`;
    });

    navigator.clipboard.writeText(transcript);
    toast.success("📋 Transcript copied to clipboard!");
  };

  const filteredTickets = tickets.filter(ticket => {
    const q = searchQuery.toLowerCase().trim();
    const user = users.find(u => u.id === ticket.userId);
    const matchesSearch = !q || 
      ticket.id.toLowerCase().includes(q) || 
      ticket.subject.toLowerCase().includes(q) || 
      ticket.description.toLowerCase().includes(q) ||
      user?.name?.toLowerCase().includes(q) ||
      user?.email?.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

    const normalizedStatus = (ticket.status || 'open').toLowerCase().replace(/[\s-]+/g, '_');
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

  const openTicketCount = tickets.filter(t => t.status === 'open').length;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { backgroundColor: '#FEF08A', color: '#854D0E', borderColor: '#000000' };
      case 'resolved':
        return { backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#000000' };
      case 'closed':
        return { backgroundColor: '#E5E7EB', color: '#1F2937', borderColor: '#000000' };
      case 'open':
      default:
        return { backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: '#000000' };
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      
      {/* Header Bar */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display-lg text-headline-xl uppercase text-pure-white bg-error px-2 py-1 inline-block transform -skew-x-6 tracking-tight leading-none">
              DISCORD SUPPORT TICKETING STATION
            </h2>
            <span className="bg-[#5865F2] text-pure-white font-mono text-xs font-bold px-2 py-1 border-2 border-stark-black">
              DISCORD BOT INTEGRATED
            </span>
          </div>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Global User Assistance, Channel Dispatch & Live Staff Response
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-code-snippet bg-stark-black text-pure-white px-5 py-2.5 border-2 border-stark-black font-bold uppercase tracking-widest flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[16px] text-error">warning</span>
            {openTicketCount} ACTIVE ALERTS
          </div>
          <Link
            to="/support"
            className="bg-surface-bright text-stark-black px-4 py-2.5 font-label-bold uppercase border-2 border-stark-black hover:bg-[#5865F2] hover:text-white transition-colors text-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            STUDENT VIEW ↗
          </Link>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-pure-white p-4 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[260px] relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, operative name, email, or issue..."
            className="w-full bg-surface-bright border-2 border-stark-black pl-9 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-electric-blue"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-bold uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-pure-white border-2 border-stark-black text-xs font-mono py-1.5 px-2 uppercase focus:outline-none"
            >
              <option value="all">ALL STATUSES</option>
              <option value="open">● OPEN</option>
              <option value="in_progress">⚡ IN PROGRESS</option>
              <option value="resolved">✓ RESOLVED</option>
              <option value="closed">✕ CLOSED</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-bold uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-pure-white border-2 border-stark-black text-xs font-mono py-1.5 px-2 uppercase focus:outline-none"
            >
              <option value="all">ALL DEPARTMENTS</option>
              <option value="bug_report">BUG REPORT</option>
              <option value="payment">PAYMENT / UPI</option>
              <option value="squad">SQUAD / TEAM</option>
              <option value="general">GENERAL INQUIRY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two-Column Discord Station: Channels/Tickets List + Live Staff Thread Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-pure-white min-h-[640px] overflow-hidden">
        
        {/* Left Column: Ticket Queue (Discord Channels) */}
        <div className="lg:col-span-5 border-b-2 lg:border-b-0 lg:border-r-2 border-stark-black bg-[#2F3136] text-pure-white flex flex-col">
          <div className="p-3 bg-[#202225] border-b-2 border-stark-black flex justify-between items-center text-xs font-mono uppercase tracking-widest text-zinc-300">
            <span>TICKET CHANNELS ({filteredTickets.length})</span>
            <span className="text-[#5865F2] font-bold">LIVE SYNC</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[640px] p-2 space-y-1.5">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-zinc-400">
                [SYS] SYNCHRONIZING GLOBAL TICKETS...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center font-mono text-xs text-zinc-400">
                NO TICKETS FOUND MATCHING CRITERIA.
              </div>
            ) : (
              filteredTickets.map(t => {
                const isSelected = t.id === selectedTicketId;
                const authorUser = users.find(u => u.id === t.userId);
                const isClosed = t.status === 'closed' || t.status === 'resolved';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3 rounded border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[#3C3F45] border-[#5865F2] shadow-sm' 
                        : 'bg-[#2F3136] border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[#5865F2] font-black text-sm">#</span>
                        <span className="font-mono text-xs font-bold truncate">
                          ticket-{t.id.slice(-6)}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border ${
                        t.status === 'in_progress'
                          ? 'bg-[#FEF08A] text-[#854D0E] border-black'
                          : isClosed 
                            ? 'bg-zinc-700 text-zinc-300 border-zinc-600' 
                            : 'bg-[#FEE2E2] text-[#991B1B] border-black'
                      }`}>
                        {t.status || 'open'}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-xs truncate mb-1">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                      <span className="text-zinc-400 truncate max-w-[140px]">
                        @{authorUser ? authorUser.name : t.userId.slice(-6)}
                      </span>
                      <span className={`uppercase font-bold text-[9px] px-1 rounded ${
                        t.priority === 'critical' ? 'bg-red-800 text-red-100' : 'text-zinc-400'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Staff Console & Thread */}
        <div className="lg:col-span-7 bg-[#36393F] text-zinc-100 flex flex-col justify-between">
          {selectedTicket ? (
            <>
              {/* Active Ticket Banner */}
              <div className="p-4 bg-[#2F3136] border-b-2 border-stark-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[#5865F2] font-black text-2xl">#</span>
                  <div>
                    <h3 className="font-bold text-white text-base truncate">
                      ticket-{selectedTicket.id.slice(-6)}: {selectedTicket.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-zinc-300 flex-wrap">
                      <span>Author: <strong>{users.find(u => u.id === selectedTicket.userId)?.name || selectedTicket.userId}</strong></span>
                      <span>•</span>
                      <span className="capitalize">{selectedTicket.category.replace('_', ' ')}</span>
                      {selectedTicket.affectedPage && (
                        <>
                          <span>•</span>
                          <span className="text-[#00E5FF]">Route: {selectedTicket.affectedPage}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Dropdown & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedTicket.status || 'open'}
                    onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                    style={getStatusBadgeStyle(selectedTicket.status)}
                    className="px-2.5 py-1.5 border-2 border-ink-black text-xs font-mono font-bold uppercase rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                  >
                    <option value="open">● OPEN</option>
                    <option value="in_progress">⚡ IN PROGRESS</option>
                    <option value="resolved">✓ RESOLVED</option>
                    <option value="closed">✕ CLOSED</option>
                  </select>

                  <button
                    onClick={handleCopyTranscript}
                    title="Export transcript to clipboard"
                    className="bg-[#202225] hover:bg-black text-zinc-200 px-2.5 py-1.5 rounded border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>

                  <button
                    onClick={() => setTicketToDelete(selectedTicket)}
                    className="bg-error hover:bg-red-800 text-white px-2.5 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Purge
                  </button>
                </div>
              </div>

              {/* Chat Thread Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px]">
                
                {/* Bot Embed Initial Transmission */}
                <div className="border-l-4 border-[#5865F2] bg-[#2F3136] p-4 rounded-r shadow-md space-y-3 font-sans">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#5865F2] text-white flex items-center justify-center font-bold text-xs">
                      🤖
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">CodeSrijan Ticket Bot</span>
                        <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1 rounded uppercase">BOT</span>
                        <span className="text-zinc-400 text-xs font-mono">
                          {new Date(selectedTicket.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        Direct Operative Intake Dispatch
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#202225] p-3 rounded border border-zinc-700/60">
                    <h4 className="font-bold text-white text-sm mb-1">{selectedTicket.subject}</h4>
                    <p className="text-zinc-300 text-xs whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1 border-t border-zinc-700/50">
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Category</span>
                      <span className="font-bold text-white capitalize">{selectedTicket.category.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Priority</span>
                      <span className="font-bold text-[#FFD700] uppercase">{selectedTicket.priority}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Ticket Ref</span>
                      <span className="text-zinc-200">#{selectedTicket.id.slice(-8)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">User Email</span>
                      <span className="text-zinc-200 truncate block">
                        {users.find(u => u.id === selectedTicket.userId)?.email || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Stream */}
                {messagesLoading && messages.length === 0 ? (
                  <div className="text-center py-6 font-mono text-zinc-400 text-xs">
                    Loading thread transmissions...
                  </div>
                ) : (
                  messages.map(msg => {
                    const sender = users.find(u => u.id === msg.senderId);
                    const isStaff = sender?.role === 'admin' || msg.message.startsWith('[STAFF RESPONSE]');

                    return (
                      <div key={msg.id} className="flex items-start gap-3 group hover:bg-[#32353B] -mx-4 px-4 py-2 rounded transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase border ${
                          isStaff 
                            ? 'bg-red-600 text-white border-red-400' 
                            : 'bg-electric-blue text-white border-cyan-300'
                        }`}>
                          {sender ? sender.name.substring(0, 2).toUpperCase() : 'OP'}
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${isStaff ? 'text-red-400' : 'text-[#00E5FF]'}`}>
                              {sender ? sender.name : (isStaff ? 'Tournament Staff' : 'Operative')}
                            </span>
                            {isStaff && (
                              <span className="bg-red-950 text-red-300 border border-red-700 text-[9px] font-bold px-1.5 rounded uppercase">
                                STAFF
                              </span>
                            )}
                            <span className="text-zinc-400 text-[11px] font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-zinc-200 text-sm mt-0.5 whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Staff Response Box */}
              <div className="p-4 bg-[#2F3136] border-t-2 border-stark-black">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-[#40444B] rounded px-3 py-2 border border-zinc-700 focus-within:border-electric-blue">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Transmit official staff reply to #ticket-${selectedTicket.id.slice(-6)}...`}
                    disabled={sendingMessage}
                    className="flex-1 bg-transparent text-white font-sans text-sm focus:outline-none placeholder-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="bg-electric-blue hover:bg-cyan-400 disabled:opacity-40 text-stark-black px-4 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{sendingMessage ? 'SENDING...' : 'DISPATCH'}</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#202225] flex items-center justify-center text-zinc-400 mb-4 border border-zinc-700">
                <span className="material-symbols-outlined text-3xl">inbox</span>
              </div>
              <h3 className="font-bold text-xl text-white">Select a Support Ticket</h3>
              <p className="font-mono text-xs text-zinc-400 mt-2 max-w-sm">
                Choose a ticket from the left channel list to inspect transmission history and dispatch official staff replies.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Neo-Brutalist Delete Confirmation Modal (Replaces window.confirm) */}
      {ticketToDelete && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setTicketToDelete(null); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b-2 border-stark-black pb-3">
              <span className="material-symbols-outlined text-error text-3xl">warning</span>
              <h3 className="font-headline-md text-lg uppercase text-stark-black">PERMANENT TICKET PURGE</h3>
            </div>

            <p className="font-code-snippet text-xs text-stark-black leading-relaxed">
              Are you sure you want to permanently purge ticket <strong className="bg-[#FEF08A] px-1">#{ticketToDelete.id}</strong> (<em>"{ticketToDelete.subject}"</em>)?
              This will permanently delete the ticket record and its conversation history.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTicket}
                disabled={deletingId === ticketToDelete.id}
                className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-error text-white hover:bg-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">{deletingId === ticketToDelete.id ? 'sync' : 'delete_forever'}</span>
                <span>{deletingId === ticketToDelete.id ? 'PURGING...' : 'CONFIRM PURGE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
