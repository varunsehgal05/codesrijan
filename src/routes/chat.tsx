import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";

export const Route = createFileRoute("/chat")({
  component: ChatDashboard,
});

const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

function ChatDashboard() {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [filterMode, setFilterMode] = useState("all");
  const [searchConvQuery, setSearchConvQuery] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');
  const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

  useEffect(() => {
    if (!currentUser) navigate({ to: "/login" });
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    
    loadConversations();
    
    const socketUrl = API_URL.replace('/api', '');
    socketRef.current = io(socketUrl);
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleNewMessage = (newMsg: any) => {
      if (activeConv && newMsg.conversationId === activeConv.id) {
        setMessages((prev) => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      // Update last message in conversation list
      setConversations(prevConvs => prevConvs.map(c => {
          if (c.id === newMsg.conversationId) {
              return { ...c, lastMessage: newMsg.message, lastMessageAt: newMsg.createdAt, lastMessageSenderId: newMsg.senderId };
          }
          return c;
      }));
    };

    socketRef.current.on('message:new', handleNewMessage);
    return () => {
      socketRef.current?.off('message:new', handleNewMessage);
    };
  }, [activeConv]);

  useEffect(() => {
    if (!activeConv || !socketRef.current) return;
    
    socketRef.current.emit('conversation:join', activeConv.id);
    loadMessages(activeConv.id);

    return () => {
      socketRef.current?.emit('conversation:leave', activeConv.id);
    };
  }, [activeConv]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
      
      const params = new URLSearchParams(window.location.search);
      const targetConvId = params.get('conv');

      if (targetConvId) {
        const target = res.data.find((c: any) => c.id === targetConvId);
        if (target) {
            setActiveConv(target);
            return;
        }
      }

      if (res.data.length > 0 && !activeConv && !targetConvId) {
        setActiveConv(res.data[0]);
      }
    } catch (e) {
      console.error("Failed to load conversations");
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${BASE}/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      console.error("Failed to load messages");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;
    
    const text = inputText;
    setInputText("");
    
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${BASE}/conversations/${activeConv.id}/messages`, 
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.error("Failed to send message");
    }
  };

  const handleSearchUsers = (q: string) => {
    setSearchQuery(q);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const token = localStorage.getItem("codesrijan_auth_token");
        const res = await axios.get(`${BASE}/users/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data.filter((u: any) => u.id !== currentUser?.id));
      } catch (e) {
        console.error("User search failed");
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUser?.id]);

  const startDirectMessage = async (userId: string) => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.post(`${BASE}/conversations/direct`, 
        { targetUserId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      await loadConversations();
      setActiveConv(res.data);
    } catch (e) {
      console.error("Failed to start DM");
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filterMode !== 'all' && c.type !== filterMode) return false;
    
    if (searchConvQuery) {
        const q = searchConvQuery.toLowerCase();
        const matchName = c.targetName?.toLowerCase().includes(q);
        const matchRole = c.targetRole?.toLowerCase().includes(q);
        const matchMsg = c.lastMessage?.toLowerCase().includes(q);
        const matchTicket = c.supportTicket?.id.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchMsg && !matchTicket) return false;
    }
    return true;
  });

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto flex h-[85vh] border-4 border-ink-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-pure-white overflow-hidden">
        
        {/* Sidebar */}
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r-4 border-ink-black flex-col bg-surface z-10 shrink-0 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b-4 border-ink-black bg-stark-black flex justify-between items-center text-pure-white">
            <h2 className="font-display-lg text-lg uppercase tracking-tight">Communications</h2>
            <button onClick={() => setIsSearchOpen(true)} className="bg-primary text-stark-black w-8 h-8 flex items-center justify-center border-2 border-transparent font-bold brutal-hover" title="New Message">
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
          
          <div className="p-4 border-b-4 border-ink-black bg-pure-white space-y-4">
            <div className="flex bg-surface border-2 border-ink-black focus-within:ring-2 focus-within:ring-electric-blue/20 transition-all">
              <span className="material-symbols-outlined p-2 text-text-muted">search</span>
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchConvQuery}
                onChange={e => setSearchConvQuery(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none font-code-snippet text-sm w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['all', 'direct', 'team', 'support'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilterMode(f)}
                  className={`text-[10px] font-label-bold uppercase px-3 py-1.5 border-2 border-ink-black transition-colors ${filterMode === f ? 'bg-electric-blue text-pure-white border-electric-blue' : 'bg-surface hover:bg-surface-container'}`}
                >
                  {f} {f === 'all' && `(${conversations.length})`}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                 <span className="material-symbols-outlined text-4xl text-text-muted/30 mb-2">forum</span>
                 <p className="font-code-snippet text-sm text-text-muted">No channels match criteria.</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div 
                  key={conv.id} 
                  onClick={() => setActiveConv(conv)}
                  className={`p-4 border-b-2 border-ink-black cursor-pointer transition-colors relative group ${activeConv?.id === conv.id ? 'bg-electric-blue text-pure-white' : 'bg-pure-white hover:bg-surface-container'}`}
                >
                  {/* Decorative Active Indicator */}
                  {activeConv?.id === conv.id && (
                     <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                  )}

                  <div className="flex justify-between items-start mb-1 pl-1">
                    <p className="font-label-bold flex items-center gap-2 truncate max-w-[70%]">
                      {conv.type === 'direct' && <span className={`w-2 h-2 rounded-full ${activeConv?.id === conv.id ? 'bg-pure-white' : 'bg-success'}`}></span>}
                      {conv.type === 'team' && <span className="material-symbols-outlined text-[14px]">groups</span>}
                      {conv.type === 'support' && <span className="material-symbols-outlined text-[14px]">confirmation_number</span>}
                      <span className="truncate">{conv.targetName || conv.id.substring(0,8)}</span>
                    </p>
                    <span className={`text-[10px] font-label-bold whitespace-nowrap ${activeConv?.id === conv.id ? 'text-pure-white opacity-80' : 'text-text-muted'}`}>
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  
                  <p className={`font-code-snippet text-[11px] mb-2 pl-1 truncate ${activeConv?.id === conv.id ? 'text-pure-white opacity-90' : 'text-primary-dark font-bold'}`}>
                    {conv.targetRole}
                  </p>
                  
                  <p className={`font-body-md text-sm line-clamp-2 pl-1 leading-snug ${activeConv?.id === conv.id ? 'text-pure-white opacity-95' : 'text-on-surface-variant'}`}>
                    {conv.lastMessage ? (
                      <>
                        {conv.lastMessageSenderId === currentUser.id && <span className="opacity-50 text-xs mr-1 font-label-bold">You:</span>}
                        {conv.lastMessage.startsWith('[Ticket Created]') ? conv.lastMessage.substring(16) : conv.lastMessage}
                      </>
                    ) : (
                       <span className="italic opacity-50 text-xs">Secure channel opened</span>
                    )}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex-col bg-surface-container-low relative min-w-0 ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b-4 border-ink-black bg-pure-white flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-2 md:gap-4">
                  <button onClick={() => setActiveConv(null)} className="md:hidden p-2 -ml-2 text-ink-black hover:bg-surface-container rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-stark-black rounded-full flex items-center justify-center text-pure-white font-display-lg text-lg md:text-xl uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                     {activeConv.type === 'support' ? <span className="material-symbols-outlined">headset_mic</span> : 
                      activeConv.type === 'team' ? <span className="material-symbols-outlined">diversity_3</span> : 
                      (activeConv.targetName ? activeConv.targetName.charAt(0) : 'U')}
                  </div>
                  <div>
                    <h3 className="font-display-lg uppercase tracking-wider flex items-center gap-2 text-stark-black text-base md:text-lg">
                      {activeConv.targetName || activeConv.id}
                    </h3>
                    <p className="font-code-snippet text-xs text-on-surface-variant mt-0.5 uppercase tracking-widest flex items-center gap-2">
                       {activeConv.type === 'direct' && <><span className="w-1.5 h-1.5 rounded-full bg-success"></span> Online &middot; </>}
                       {activeConv.targetRole}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeConv.type === 'support' && (
                    <Link to={currentUser?.role === 'admin' ? "/admin/support" : "/support"} className="hidden sm:flex bg-surface-bright text-stark-black px-4 py-2 font-label-bold text-xs uppercase hover:bg-electric-blue hover:text-pure-white border-2 border-stark-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[2px] translate-y-[2px] hover:translate-x-0 hover:translate-y-0">
                      View Ticket Details
                    </Link>
                  )}
                  <button className="text-stark-black p-2 hover:bg-surface-container rounded-full transition-colors flex items-center"><span className="material-symbols-outlined">more_vert</span></button>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                {messages.length === 0 ? (
                  <div className="text-center font-code-snippet text-text-muted mt-auto mb-auto flex flex-col items-center">
                    <div className="w-20 h-20 border-4 border-ink-black flex items-center justify-center rounded-full mb-6 bg-pure-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                       <span className="material-symbols-outlined text-4xl text-stark-black">chat</span>
                    </div>
                    <p className="text-xl uppercase tracking-widest font-display-lg text-stark-black mb-2">Start the conversation</p>
                    <p className="text-sm">Send a message to {activeConv.targetName || 'this channel'}.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSystem = msg.message.startsWith('[Ticket Created]');
                    const isMine = msg.senderId === currentUser.id;
                    
                    if (isSystem) {
                       return (
                          <div key={msg.id} className="w-full flex flex-col items-center my-8">
                             <div className="flex items-center w-full max-w-lg mb-4">
                                <hr className="flex-1 border-ink-black/20" />
                                <span className="px-4 font-label-bold text-[10px] text-text-muted uppercase tracking-widest">SYSTEM</span>
                                <hr className="flex-1 border-ink-black/20" />
                             </div>
                             <div className="bg-surface p-5 border-2 border-ink-black max-w-lg w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-label-bold mb-3 flex items-center gap-2 text-sm">
                                  <span className="material-symbols-outlined text-error">confirmation_number</span>
                                  Support ticket created
                                </p>
                                <p className="font-code-snippet text-sm bg-pure-white p-3 border border-ink-black/10">
                                  {msg.message.substring(16)}
                                </p>
                                {activeConv.supportTicket && (
                                  <div className="mt-4 flex gap-4 text-xs font-label-bold uppercase text-text-muted">
                                    <span>Ticket #{activeConv.supportTicket.id.substring(0,8)}</span>
                                    <span>&middot;</span>
                                    <span>Priority: {activeConv.supportTicket.priority}</span>
                                  </div>
                                )}
                             </div>
                          </div>
                       );
                    }

                    return (
                      <div key={msg.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className="flex flex-col max-w-[85%] md:max-w-[70%] group">
                          {/* Sender name for group chats or inbound messages */}
                          {!isMine && activeConv.type !== 'direct' && (
                             <span className="font-label-bold text-[10px] mb-1 opacity-70 ml-1">
                               {msg.senderId.substring(0,8)}
                             </span>
                          )}
                          
                          <div className="flex items-end gap-2 group-hover:relative relative">
                             {/* Message Actions (Hover) */}
                             <div className={`hidden group-hover:flex absolute top-0 ${isMine ? '-left-20' : '-right-20'} bg-pure-white border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] items-center`}>
                                <button className="p-1 hover:bg-surface-container transition-colors text-text-muted hover:text-electric-blue" title="Reply"><span className="material-symbols-outlined text-[16px]">reply</span></button>
                                <button className="p-1 hover:bg-surface-container transition-colors text-text-muted hover:text-error" title="React"><span className="material-symbols-outlined text-[16px]">add_reaction</span></button>
                             </div>

                             <div className={`p-3.5 border-2 border-ink-black ${isMine ? 'bg-electric-blue text-pure-white rounded-tl-xl rounded-tr-xl rounded-bl-xl shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.1)]' : 'bg-pure-white text-stark-black rounded-tl-xl rounded-tr-xl rounded-br-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'}`}>
                               <p className="font-body-md whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                             </div>
                          </div>
                          
                          <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-label-bold uppercase tracking-widest ${isMine ? 'justify-end text-text-muted' : 'justify-start text-text-muted pl-1'}`}>
                             {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t-4 border-ink-black bg-surface-container shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] z-10">
                <form onSubmit={sendMessage} className="flex flex-col bg-pure-white border-2 border-ink-black focus-within:ring-2 focus-within:ring-electric-blue/50 focus-within:border-electric-blue transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full p-4 min-h-[70px] max-h-[150px] resize-y bg-transparent font-body-md focus:outline-none"
                  />
                  <div className="flex justify-between items-center p-2 border-t-2 border-ink-black/10 bg-surface/50">
                    <div className="flex gap-1">
                       <button type="button" className="w-10 h-10 text-text-muted hover:text-electric-blue transition-colors flex items-center justify-center rounded-full hover:bg-pure-white hover:shadow-sm" title="Attach file"><span className="material-symbols-outlined">attach_file</span></button>
                       <button type="button" className="w-10 h-10 text-text-muted hover:text-electric-blue transition-colors flex items-center justify-center rounded-full hover:bg-pure-white hover:shadow-sm" title="Mention"><span className="material-symbols-outlined">alternate_email</span></button>
                       <button type="button" className="w-10 h-10 text-text-muted hover:text-electric-blue transition-colors flex items-center justify-center rounded-full hover:bg-pure-white hover:shadow-sm" title="Emoji"><span className="material-symbols-outlined">sentiment_satisfied</span></button>
                    </div>
                    <button 
                      type="submit" 
                      disabled={!inputText.trim()}
                      className="bg-stark-black text-pure-white px-6 py-2.5 font-label-bold uppercase flex items-center gap-2 hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0 rounded-none border-2 border-transparent"
                    >
                      SEND <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-low">
               <div className="w-24 h-24 border-4 border-ink-black bg-pure-white flex items-center justify-center rounded-full mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                 <span className="material-symbols-outlined text-5xl text-electric-blue">forum</span>
               </div>
               <h2 className="font-display-lg text-3xl text-stark-black uppercase tracking-tight mb-2">Communications</h2>
               <p className="font-code-snippet text-text-muted">Select a conversation to begin securely transmitting.</p>
            </div>
          )}
        </div>

        {/* Right Details Panel - Support Ticket Context */}
        {activeConv?.type === 'support' && activeConv.supportTicket && (
           <div className="w-1/4 border-l-4 border-ink-black bg-pure-white hidden xl:flex flex-col shrink-0 z-10 relative overflow-y-auto">
             <div className="p-4 border-b-4 border-ink-black bg-surface flex items-center justify-between sticky top-0">
               <h3 className="font-display-lg uppercase tracking-wider flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary-dark">info</span> Details
               </h3>
             </div>
             
             <div className="p-6">
                <div className="mb-8">
                  <p className="font-label-bold text-[10px] text-text-muted uppercase tracking-widest mb-1.5">TICKET ID</p>
                  <p className="font-code-snippet text-sm font-bold bg-surface p-2 border-2 border-ink-black inline-block">#{activeConv.supportTicket.id.substring(0,12)}</p>
                </div>

                <div className="mb-8">
                  <p className="font-label-bold text-[10px] text-text-muted uppercase tracking-widest mb-2">STATUS</p>
                  <p className={`font-label-bold text-xs uppercase inline-block px-3 py-1.5 border-2 border-ink-black ${activeConv.supportTicket.status === 'open' ? 'bg-error text-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : activeConv.supportTicket.status === 'resolved' ? 'bg-success text-pure-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-surface-container text-stark-black'}`}>
                    {activeConv.supportTicket.status}
                  </p>
                </div>

                <div className="mb-8">
                  <p className="font-label-bold text-[10px] text-text-muted uppercase tracking-widest mb-1.5">PRIORITY</p>
                  <p className="font-code-snippet text-sm uppercase font-bold text-error">{activeConv.supportTicket.priority || 'Normal'}</p>
                </div>

                <div className="mb-8">
                  <p className="font-label-bold text-[10px] text-text-muted uppercase tracking-widest mb-1.5">CATEGORY</p>
                  <p className="font-code-snippet text-sm bg-surface-bright p-3 border-l-4 border-primary-dark">{activeConv.supportTicket.category}</p>
                </div>

                <div className="mb-8">
                  <p className="font-label-bold text-[10px] text-text-muted uppercase tracking-widest mb-1.5">REQUESTER</p>
                  <div className="flex items-center gap-3 bg-surface p-3 border-2 border-ink-black">
                     <div className="w-8 h-8 bg-stark-black rounded-full text-pure-white flex items-center justify-center font-bold">
                        {activeConv.supportTicket.userId.substring(0,1).toUpperCase()}
                     </div>
                     <div>
                        <p className="font-code-snippet text-xs font-bold">{activeConv.supportTicket.userId.substring(0,8)}</p>
                        <p className="font-label-bold text-[10px] opacity-70">STUDENT</p>
                     </div>
                  </div>
                </div>
                
                <div className="mt-12 pt-6 border-t-2 border-ink-black border-dashed">
                  <Link to="/support" className="w-full flex items-center justify-center gap-2 bg-pure-white text-stark-black px-4 py-3 border-4 border-ink-black font-label-bold uppercase hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] hover:bg-ink-black hover:text-pure-white">
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Manage Ticket
                  </Link>
                </div>
             </div>
           </div>
        )}
      </div>

      {/* User Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-stark-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-pure-white border-4 border-ink-black w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b-4 border-ink-black bg-primary flex justify-between items-center">
              <h2 className="font-display-lg uppercase tracking-tight text-2xl">New Conversation</h2>
              <button onClick={() => setIsSearchOpen(false)} className="text-2xl hover:text-error transition-colors w-8 h-8 flex items-center justify-center hover:bg-pure-white rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-5 border-b-4 border-ink-black bg-surface">
              <label className="font-label-bold text-xs uppercase mb-2 block">Search operative / team</label>
              <div className="flex bg-pure-white border-4 border-ink-black focus-within:ring-2 ring-primary">
                 <span className="material-symbols-outlined p-3 border-r-4 border-ink-black bg-surface-bright">search</span>
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => handleSearchUsers(e.target.value)}
                   placeholder="e.g. Aarav Sharma"
                   className="w-full p-3 font-code-snippet focus:outline-none"
                   autoFocus
                 />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 bg-surface-container-low min-h-[200px]">
              {searchResults.length === 0 ? (
                <div className="text-center mt-10">
                   {searchQuery.length < 2 ? (
                      <p className="font-code-snippet text-text-muted">Type at least 2 characters to search.</p>
                   ) : (
                      <p className="font-code-snippet text-text-muted">No operatives found matching "{searchQuery}"</p>
                   )}
                </div>
              ) : (
                searchResults.map(user => (
                  <div key={user.id} className="flex justify-between items-center p-4 border-4 border-ink-black bg-pure-white mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-bright border-2 border-ink-black flex items-center justify-center font-display-lg uppercase">
                         {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-label-bold text-lg leading-tight">{user.name}</p>
                        <p className="text-[10px] text-text-muted font-label-bold uppercase tracking-widest">{user.role} {user.skills ? `· ${user.skills}` : ''}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => startDirectMessage(user.id)}
                      className="bg-electric-blue text-pure-white px-4 py-2 font-label-bold text-xs border-2 border-ink-black hover:bg-ink-black transition-colors"
                    >
                      START
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
