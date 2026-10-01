import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";

export const Route = createFileRoute("/chat")({
  component: ChatDashboard,
});

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

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';
  const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

  useEffect(() => {
    if (!currentUser) navigate({ to: "/login" });
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    
    loadConversations();
    
    const socketUrl = API_URL.replace('/api', '');
    socketRef.current = io(socketUrl);
    
    // message:new listener moved to a separate effect
    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleNewMessage = (newMsg: any) => {
      if (activeConv && newMsg.conversationId === activeConv.id) {
        setMessages((prev) => {
          // Prevent duplicates if same message comes twice
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
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

      if (res.data.length > 0 && !activeConv) {
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
      // The socket event will append the message to the list
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

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto flex h-[85vh] border-4 border-ink-black neo-shadow bg-pure-white">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r-4 border-ink-black flex flex-col bg-surface">
          <div className="p-4 border-b-4 border-ink-black bg-primary flex justify-between items-center">
            <h2 className="font-display-lg text-xl uppercase text-stark-black tracking-tight">Comms Channels</h2>
            <button onClick={() => setIsSearchOpen(true)} className="bg-stark-black text-primary px-3 py-1 font-label-bold text-xs uppercase brutal-hover">
              + NEW MESSAGE
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center font-code-snippet text-text-muted mt-10">No channels available.</div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id} 
                  onClick={() => setActiveConv(conv)}
                  className={`p-4 border-b border-ink-black cursor-pointer brutal-hover transition-colors ${activeConv?.id === conv.id ? 'bg-electric-blue text-pure-white' : 'hover:bg-surface-container'}`}
                >
                  <p className="font-label-bold">
                    {conv.type === 'team' ? 'Squad Comm: ' : conv.type === 'direct' ? 'Direct Relay: ' : 'Admin/Support: '} 
                    {conv.id.substring(0,8)}
                  </p>
                  <p className={`font-code-snippet text-xs ${activeConv?.id === conv.id ? 'text-surface' : 'text-text-muted'}`}>
                    {conv.type.toUpperCase()} VECTOR
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="w-2/3 flex flex-col bg-surface-container-low relative">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b-4 border-ink-black bg-stark-black text-pure-white">
                <h3 className="font-display-lg uppercase tracking-wider">Channel // {activeConv.id}</h3>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center font-code-snippet text-text-muted mt-20 opacity-50">Secure transmission initialized... No messages yet.</div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md p-3 border-2 border-ink-black ${isMine ? 'bg-primary text-stark-black' : 'bg-surface-container-high text-stark-black'}`}>
                          <p className="font-label-bold text-xs mb-1 opacity-70">{isMine ? 'YOU' : msg.senderId.substring(0,8)}</p>
                          <p className="font-body-md whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t-4 border-ink-black bg-pure-white">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Transmit payload..."
                    className="flex-1 p-3 border-2 border-ink-black bg-surface font-code-snippet focus:outline-none focus:ring-2 ring-primary"
                  />
                  <button 
                    type="submit" 
                    className="bg-stark-black text-primary px-6 py-3 border-2 border-transparent font-label-bold uppercase brutal-hover hover:-translate-y-1"
                  >
                    SEND
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center font-display-lg text-2xl text-text-muted uppercase">
              SELECT A CHANNEL TO BEGIN
            </div>
          )}
        </div>
      </div>

      {/* User Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-stark-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-pure-white border-4 border-ink-black w-full max-w-lg neo-shadow flex flex-col max-h-[80vh]">
            <div className="p-4 border-b-4 border-ink-black bg-primary flex justify-between items-center">
              <h2 className="font-display-lg uppercase tracking-tight text-xl">New Direct Relay</h2>
              <button onClick={() => setIsSearchOpen(false)} className="text-2xl hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 border-b-4 border-ink-black">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Search operatives by name..."
                className="w-full border-2 border-ink-black p-3 font-code-snippet focus:outline-none focus:ring-2 ring-primary"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-surface-container-low">
              {searchResults.length === 0 && searchQuery && (
                <p className="text-center font-code-snippet text-text-muted mt-4">No operatives found matching "{searchQuery}"</p>
              )}
              {searchResults.map(user => (
                <div key={user.id} className="flex justify-between items-center p-3 border-2 border-ink-black bg-pure-white mb-2 brutal-shadow-sm hover:-translate-y-0.5 transition-transform">
                  <div>
                    <p className="font-label-bold">{user.name}</p>
                    <p className="text-xs text-text-muted font-code-snippet">{user.role.toUpperCase()} {user.skills ? `| ${user.skills}` : ''}</p>
                  </div>
                  <button 
                    onClick={() => startDirectMessage(user.id)}
                    className="bg-electric-blue text-pure-white px-4 py-2 font-label-bold text-xs border-2 border-ink-black hover:bg-ink-black transition-colors"
                  >
                    MESSAGE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
