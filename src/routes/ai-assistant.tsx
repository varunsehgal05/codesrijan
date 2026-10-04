import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";

export const Route = createFileRoute("/ai-assistant")({
    component: AIAssistantPage,
});

function AIAssistantPage() {
    const [messages, setMessages] = useState([
        { role: "ai", content: "HELLO HACKER. I AM THE CODESRIJAN SYNTHETIC HELPER. HOW MAY I ASSIST YOUR BUILD TODAY?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const location = useLocation();
    const { currentUser } = useAppStore();
    const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsTyping(true);

        try {
            const contextPayload = {
                path: location.pathname,
                role: currentUser?.role || 'guest',
                email: currentUser?.email,
                name: currentUser?.name,
                teamId: currentUser?.teamId,
                userId: currentUser?.id
            };

            const token = localStorage.getItem("codesrijan_auth_token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.post(`${API_URL}/ai/chat`,
                { message: userMsg, context: contextPayload },
                { headers }
            );

            setMessages(prev => [...prev, { role: "ai", content: res.data.reply }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { role: "ai", content: "CRITICAL: Neural Node connection lost. Offline." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-12 w-full flex flex-col h-[calc(100vh-100px)]">

                <div className="w-full mb-6">
                    <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
                        <span className="material-symbols-outlined group-hover:-translate-x-1">arrow_back</span> GO BACK
                    </button>
                </div>

                <section className="mb-8">
                    <h1 className="font-display-lg text-headline-lg uppercase text-ink-black border-l-8 border-electric-blue pl-4">Syntax Bot Support</h1>
                </section>

                {/* Chat Window */}
                <div className="flex-grow bg-surface-bright brutal-border brutal-shadow-lg flex flex-col overflow-hidden">
                    {/* Messages Area */}
                    <div className="flex-grow p-6 overflow-y-auto flex flex-col gap-6 bg-surface-container-lowest">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 brutal-border brutal-shadow ${msg.role === 'user' ? 'bg-electric-blue text-on-primary ml-auto' : 'bg-white text-ink-black'}`}>
                                    {msg.role === 'ai' && (
                                        <div className="flex items-center gap-2 mb-2 font-label-bold uppercase text-surface-variant">
                                            <span className="material-symbols-outlined text-sm">smart_toy</span> Oracle AI
                                        </div>
                                    )}
                                    <p className="font-body-lg leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white text-ink-black p-4 brutal-border brutal-shadow flex items-center gap-2">
                                    <span className="w-2 h-2 bg-electric-blue animate-bounce"></span>
                                    <span className="w-2 h-2 bg-electric-blue animate-bounce" style={{ animationDelay: '100ms' }}></span>
                                    <span className="w-2 h-2 bg-electric-blue animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Form */}
                    <div className="p-4 bg-surface-container border-t-4 border-ink-black">
                        <form onSubmit={handleSend} className="flex gap-4">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about rules, teams, or submissions..."
                                className="flex-grow bg-white border-2 border-ink-black p-4 font-body-lg focus:outline-none focus:ring-4 focus:ring-electric-blue"
                            />
                            <button
                                type="submit"
                                disabled={isTyping}
                                className="bg-electric-blue text-on-primary font-label-bold px-8 uppercase brutal-border brutal-shadow brutal-hover brutal-active transition-all disabled:opacity-50"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
