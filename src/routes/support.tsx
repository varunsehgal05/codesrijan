import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

function SupportPage() {
  const { currentUser, users } = useAppStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");

  // New Ticket Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [affectedPage, setAffectedPage] = useState("");
  const [priority, setPriority] = useState("normal");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
      if (data.length > 0 && !selectedTicketId) {
        setSelectedTicketId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch tickets", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 12000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Fetch messages for selected ticket's conversation
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
      const msgInterval = setInterval(() => {
        fetchMessages(selectedTicket.conversationId);
      }, 5000);
      return () => clearInterval(msgInterval);
    } else {
      setMessages([]);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedTicket?.conversationId) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${BASE}/conversations/${selectedTicket.conversationId}/messages`, {
        message: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage("");
      await fetchMessages(selectedTicket.conversationId);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to transmit message.");
    } finally {
      setSendingMessage(false);
    }
  };

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
      toast.success("🎫 Support ticket thread initialized successfully.");
      setIsFormOpen(false);
      setSubject("");
      setDescription("");
      setAffectedPage("");
      await fetchTickets();
      if (res.data?.id) {
        setSelectedTicketId(res.data.id);
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
      toast.success(`Ticket marked as ${nextStatus.toUpperCase().replace('_', ' ')}`);
      await fetchTickets();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update ticket status.");
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
    transcript += `Affected Page: ${selectedTicket.affectedPage || 'N/A'}\n`;
    transcript += `-------------------------------------------\n\n`;
    transcript += `[INITIAL DISPATCH]:\n${selectedTicket.description}\n\n`;
    transcript += `[THREAD MESSAGES]:\n`;
    messages.forEach(m => {
      const sender = users.find(u => u.id === m.senderId);
      const name = sender ? sender.name : (m.senderId === currentUser?.id ? 'You' : 'Staff');
      transcript += `[${new Date(m.createdAt).toLocaleTimeString()}] ${name}: ${m.message}\n`;
    });

    navigator.clipboard.writeText(transcript);
    toast.success("📋 Complete ticket transcript copied to clipboard!");
  };

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-pure-white p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <span className="material-symbols-outlined text-5xl text-error mb-4">lock</span>
          <h2 className="font-display-lg text-2xl uppercase text-stark-black">AUTHENTICATION REQUIRED</h2>
          <p className="font-code-snippet text-xs text-on-surface-variant mt-2 uppercase tracking-widest">
            Please log in to access the Discord Support Transmission Channels.
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
    if (statusFilter === 'active') {
      matchesStatus = normalizedStatus === 'open' || normalizedStatus === 'in_progress';
    } else if (statusFilter === 'closed') {
      matchesStatus = normalizedStatus === 'closed' || normalizedStatus === 'resolved';
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || 'open').toLowerCase().replace(/[\s-]+/g, '_');
    if (s === 'in_progress') {
      return <span className="bg-[#FEF08A] text-[#854D0E] border border-stark-black px-2 py-0.5 text-[10px] font-mono font-bold uppercase">⚡ IN PROGRESS</span>;
    }
    if (s === 'resolved') {
      return <span className="bg-[#DCFCE7] text-[#166534] border border-stark-black px-2 py-0.5 text-[10px] font-mono font-bold uppercase">✓ RESOLVED</span>;
    }
    if (s === 'closed') {
      return <span className="bg-[#E5E7EB] text-[#1F2937] border border-stark-black px-2 py-0.5 text-[10px] font-mono font-bold uppercase">✕ CLOSED</span>;
    }
    return <span className="bg-[#FEE2E2] text-[#991B1B] border border-stark-black px-2 py-0.5 text-[10px] font-mono font-bold uppercase">● OPEN</span>;
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      
      {/* Discord Server Header */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#5865F2] text-pure-white border-2 border-stark-black flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none">
                DISCORD TICKET BOT
              </h2>
              <span className="bg-[#5865F2] text-pure-white font-mono text-[10px] font-bold px-2 py-0.5 border border-stark-black">
                BOT VERIFIED
              </span>
            </div>
            <p className="font-code-snippet text-xs text-on-surface-variant mt-1.5 uppercase tracking-widest">
              {currentUser.role === 'admin' ? 'Global Support Dispatch Directorate' : 'Real-Time Helpdesk & Issue Channels'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {currentUser.role === 'admin' ? (
            <Link
              to="/admin/support"
              className="bg-electric-blue text-pure-white px-5 py-3 font-label-bold uppercase brutal-border hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              ADMIN CONSOLE ↗
            </Link>
          ) : (
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-[#5865F2] text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 cursor-pointer text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              {isFormOpen ? 'CANCEL' : 'TALK TO ADMIN'}
            </button>
          )}
        </div>
      </div>

      {/* Main Discord App Layout (Sidebar + Thread Channel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-pure-white min-h-[640px] overflow-hidden">
        
        {/* Left Discord Sidebar (Channels & Tickets) */}
        <div className="lg:col-span-4 border-b-2 lg:border-b-0 lg:border-r-2 border-stark-black bg-[#2F3136] text-pure-white flex flex-col">
          
          {/* Channel Search & Filter */}
          <div className="p-4 border-b-2 border-stark-black bg-[#202225] flex flex-col gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-sm">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find or start a conversation..."
                className="w-full bg-[#1e1f22] border border-zinc-700 text-xs font-mono text-white pl-9 pr-3 py-2 rounded focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("active")}
                className={`flex-1 py-1 text-[11px] font-mono font-bold uppercase rounded transition-colors ${statusFilter === 'active' ? 'bg-[#5865F2] text-white' : 'bg-[#35373C] text-zinc-300 hover:bg-[#3c3e44]'}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("closed")}
                className={`flex-1 py-1 text-[11px] font-mono font-bold uppercase rounded transition-colors ${statusFilter === 'closed' ? 'bg-[#5865F2] text-white' : 'bg-[#35373C] text-zinc-300 hover:bg-[#3c3e44]'}`}
              >
                Resolved
              </button>
              <button
                onClick={() => setStatusFilter("all")}
                className={`flex-1 py-1 text-[11px] font-mono font-bold uppercase rounded transition-colors ${statusFilter === 'all' ? 'bg-[#5865F2] text-white' : 'bg-[#35373C] text-zinc-300 hover:bg-[#3c3e44]'}`}
              >
                All
              </button>
            </div>
          </div>

          {/* Ticket Channels List */}
          <div className="flex-1 overflow-y-auto max-h-[580px] p-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex justify-between items-center">
              <span>SUPPORT CHANNELS ({filteredTickets.length})</span>
              <span className="text-zinc-500 text-[10px]">{statusFilter.toUpperCase()}</span>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-zinc-400 uppercase">
                No ticket channels found.
              </div>
            ) : (
              filteredTickets.map(t => {
                const isSelected = t.id === selectedTicketId;
                const author = users.find(u => u.id === t.userId);
                const isClosed = t.status === 'closed' || t.status === 'resolved';

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3 rounded transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-[#3C3F45] text-white border-l-4 border-[#5865F2] shadow-sm' 
                        : 'hover:bg-[#35373C] text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[#5865F2] font-black text-sm">#</span>
                        <span className="font-mono text-xs font-bold truncate">
                          ticket-{t.id.slice(-6)}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        isClosed ? 'bg-zinc-700 text-zinc-300' : 'bg-red-900/60 text-red-200 border border-red-700'
                      }`}>
                        {t.status || 'open'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-zinc-200 truncate">
                      {t.subject}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">{getCategoryIcon(t.category)}</span>
                        {t.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link 
                          to="/chat"
                          search={{ conv: t.conversationId }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#00E5FF] hover:underline"
                        >
                          Open Comms
                        </Link>
                        {currentUser.role === 'admin' && (
                          <Link 
                            to="/admin/support"
                            onClick={(e) => e.stopPropagation()}
                            className="text-amber-400 hover:underline"
                          >
                            Manage
                          </Link>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Discord Channel Thread View */}
        <div className="lg:col-span-8 bg-[#36393F] text-zinc-100 flex flex-col justify-between">
          
          {selectedTicket ? (
            <>
              {/* Channel Thread Header */}
              <div className="p-4 bg-[#2F3136] border-b-2 border-stark-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[#5865F2] font-black text-xl">#</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base truncate">
                        ticket-{selectedTicket.id.slice(-6)}: {selectedTicket.subject}
                      </h3>
                      {getStatusBadge(selectedTicket.status)}
                      <span className="bg-zinc-800 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700 uppercase">
                        PRIORITY: {selectedTicket.priority}
                      </span>
                    </div>
                    {selectedTicket.affectedPage && (
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Route: <span className="text-[#00E5FF]">{selectedTicket.affectedPage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleCopyTranscript}
                    title="Export transcript to clipboard"
                    className="bg-[#202225] hover:bg-black text-zinc-200 px-3 py-1.5 rounded border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Transcript
                  </button>

                  <Link
                    to="/chat"
                    search={{ conv: selectedTicket.conversationId }}
                    className="bg-[#202225] hover:bg-electric-blue hover:text-white text-zinc-200 px-3 py-1.5 rounded border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">forum</span>
                    Open Comms
                  </Link>

                  {/* Status Toggle Buttons */}
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                    <>
                      {selectedTicket.status !== 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(selectedTicket.id, 'in_progress')}
                          className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">bolt</span>
                          In Progress
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Resolve
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, 'closed')}
                        className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">lock</span>
                        Close
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, 'open')}
                      className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Chat & Thread Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px]">
                
                {/* Discord Bot Welcome Embed Card */}
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
                          {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        Support Intake Protocol Initiated
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
                      <span className="text-zinc-400 block text-[10px] uppercase">Operative</span>
                      <span className="text-zinc-200 truncate block">
                        {users.find(u => u.id === selectedTicket.userId)?.name || selectedTicket.userId.slice(-6)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conversation Stream */}
                {messagesLoading && messages.length === 0 ? (
                  <div className="text-center py-6 font-mono text-zinc-400 text-xs">
                    Loading channel transmission history...
                  </div>
                ) : (
                  messages.map(msg => {
                    const sender = users.find(u => u.id === msg.senderId);
                    const isCurrentUser = msg.senderId === currentUser.id;
                    const isAdmin = sender?.role === 'admin';

                    return (
                      <div key={msg.id} className="flex items-start gap-3 group hover:bg-[#32353B] -mx-4 px-4 py-2 rounded transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase border ${
                          isAdmin 
                            ? 'bg-red-600 text-white border-red-400' 
                            : isCurrentUser 
                              ? 'bg-electric-blue text-white border-cyan-300' 
                              : 'bg-zinc-700 text-zinc-200 border-zinc-600'
                        }`}>
                          {sender ? sender.name.substring(0, 2).toUpperCase() : 'OP'}
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${isAdmin ? 'text-red-400' : isCurrentUser ? 'text-[#00E5FF]' : 'text-zinc-200'}`}>
                              {sender ? sender.name : (isCurrentUser ? 'You' : 'Operative')}
                            </span>
                            {isAdmin && (
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

              {/* Message Reply Box */}
              <div className="p-4 bg-[#2F3136] border-t-2 border-stark-black">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-[#40444B] rounded px-3 py-2 border border-zinc-700 focus-within:border-[#5865F2]">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Reply to #ticket-${selectedTicket.id.slice(-6)}...`}
                    disabled={sendingMessage}
                    className="flex-1 bg-transparent text-white font-sans text-sm focus:outline-none placeholder-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-40 text-white px-4 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{sendingMessage ? 'SENDING...' : 'SEND'}</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#202225] flex items-center justify-center text-zinc-400 mb-4 border border-zinc-700">
                <span className="material-symbols-outlined text-3xl">forum</span>
              </div>
              <h3 className="font-bold text-xl text-white">Select a Support Ticket</h3>
              <p className="font-mono text-xs text-zinc-400 mt-2 max-w-sm">
                Choose a channel from the sidebar to view transmission logs, or click "➕ Open New Ticket" to file an issue.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Discord Style New Ticket Intake Modal */}
      {isFormOpen && currentUser.role !== 'admin' && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#5865F2] text-pure-white p-4 border-b-4 border-stark-black flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">confirmation_number</span>
                <h3 className="font-headline-md uppercase tracking-wider text-lg">OPEN SUPPORT TICKET CHANNEL</h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-pure-white hover:text-black transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 flex flex-col gap-5">
              
              {/* Category Card Selector (Discord Style) */}
              <div>
                <label className="font-label-bold uppercase text-xs tracking-widest block mb-2">Select Issue Department</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'bug_report', label: 'Bug Report', icon: 'bug_report' },
                    { id: 'payment', label: 'Payment / UPI', icon: 'payments' },
                    { id: 'squad', label: 'Squad / Team', icon: 'groups' },
                    { id: 'general', label: 'General / Query', icon: 'chat' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 text-left border-2 border-stark-black flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        category === cat.id 
                          ? 'bg-[#5865F2] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                          : 'bg-surface-bright text-stark-black hover:bg-zinc-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                      <span className="font-mono text-xs font-bold uppercase">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Payload */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs tracking-widest">Ticket Subject / Title</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g., Cannot upload payment receipt / Squad member missing"
                  className="bg-pure-white border-2 border-stark-black p-3 font-mono text-sm focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs tracking-widest">Priority Clearance</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="bg-pure-white border-2 border-stark-black p-3 font-mono text-sm uppercase focus:outline-none"
                  >
                    <option value="low">Low (General guidance)</option>
                    <option value="normal">Normal (Standard inquiry)</option>
                    <option value="high">High (Hindering tournament progress)</option>
                    <option value="critical">Critical (Hard blocker / submission failure)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold uppercase text-xs tracking-widest">Affected Route / Page</label>
                  <input
                    type="text"
                    value={affectedPage}
                    onChange={e => setAffectedPage(e.target.value)}
                    placeholder="e.g. /workspace, /hackathons, /payment"
                    className="bg-pure-white border-2 border-stark-black p-3 font-mono text-sm focus:outline-none focus:border-[#5865F2]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold uppercase text-xs tracking-widest">Issue Description & Evidence</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detail the exact sequence of events, errors encountered, or assistance required..."
                  className="bg-pure-white border-2 border-stark-black p-3 font-mono text-sm focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="bg-[#FEF08A] border-2 border-stark-black p-3 font-mono text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-900">info</span>
                <span>Opening this ticket automatically establishes an official Discord channel for you and tournament administrators.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-3 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 border-2 border-stark-black font-label-bold uppercase bg-[#5865F2] text-pure-white hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-2 text-xs"
                >
                  <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'bolt'}</span>
                  <span>{loading ? 'CREATING CHANNEL...' : 'CREATE TICKET CHANNEL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
