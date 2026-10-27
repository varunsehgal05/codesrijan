import { createFileRoute, useLocation, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";

export const Route = createFileRoute("/ai-assistant")({
    component: AIAssistantPage,
});

const QUICK_PROMPTS = [
    "What hackathons are available?",
    "How do I create a squad?",
    "When is the submission deadline?",
    "How do I submit our project?",
    "Is this hackathon free or paid?",
    "Where are problem statements?"
];

function AIAssistantPage() {
    const { currentUser } = useAppStore();
    const location = useLocation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Array<{ role: "ai" | "user"; content: string }>>([
        {
            role: "ai",
            content: `SYSTEM INITIALIZED. Greetings, ${currentUser?.name || 'Operative'}. I am SrijanBot, your context-aware CodeSrijan Hackathon Copilot. I can assist with event schedules, squad recruitment, project submissions, rules, and navigation. [Explore Hackathons -> /hackathons]`
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isTyping) return;

        const userMsg = text.trim();
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

            const reply = res.data?.reply || "SYSTEM NOTICE: Response received without payload. [View Dashboard -> /dashboard]";
            setMessages(prev => [...prev, { role: "ai", content: reply }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: "ai",
                content: "CRITICAL: Neural Node connection lost. Offline fallback activated. [Contact Support -> /support]"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const parseMessageNodes = (text: string) => {
        const buttonRegex = /\[(.*?)\]/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = buttonRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(
                    <span key={lastIndex} className="whitespace-pre-wrap">
                        {text.substring(lastIndex, match.index)}
                    </span>
                );
            }

            const rawText = match[1] || "";
            let buttonText = rawText;
            let targetPath = "/dashboard";

            if (rawText.includes("->")) {
                const split = rawText.split("->");
                buttonText = (split[0] || "").trim();
                targetPath = (split[1] || "/dashboard").trim();
            } else {
                if (buttonText.includes("Support")) targetPath = "/support";
                else if (buttonText.includes("Workspace") || buttonText.includes("Submission")) targetPath = "/workspace";
                else if (buttonText.includes("Recruitment") || buttonText.includes("Squad")) targetPath = "/recruitment";
                else if (buttonText.includes("Dashboard")) targetPath = "/dashboard";
                else if (buttonText.includes("Hackathon")) targetPath = "/hackathons";
                else if (buttonText.includes("Timeline")) targetPath = "/timeline";
                else if (buttonText.includes("Problems")) targetPath = "/problems";
                else if (buttonText.includes("Leaderboard")) targetPath = "/leaderboard";
                else if (buttonText.includes("Certificates")) targetPath = "/certificates";
                else if (buttonText.includes("Payment")) targetPath = "/payment";
            }

            parts.push(
                <div key={match.index} className="mt-3 pt-2 border-t-2 border-ink-black/20">
                    <Link
                        to={targetPath}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-electric-blue text-on-primary font-label-bold text-sm uppercase brutal-border brutal-shadow brutal-hover brutal-active transition-all cursor-pointer"
                    >
                        <span>{buttonText}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                </div>
            );
            lastIndex = buttonRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(
                <span key={lastIndex} className="whitespace-pre-wrap">
                    {text.substring(lastIndex)}
                </span>
            );
        }

        return parts.length > 0 ? parts : text;
    };

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-5xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col h-[calc(100vh-80px)]">

                {/* Top Nav / Breadcrumb */}
                <div className="w-full mb-4 flex items-center justify-between">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer"
                    >
                        <span className="material-symbols-outlined group-hover:-translate-x-1">arrow_back</span>
                        BACK
                    </button>
                    <div className="flex items-center gap-2 text-xs font-mono bg-electric-blue/10 text-electric-blue px-3 py-1 brutal-border">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        SRIJANBOT v2.4 ONLINE
                    </div>
                </div>

                {/* Header Section */}
                <section className="mb-4">
                    <h1 className="font-display-lg text-headline-md md:text-headline-lg uppercase text-ink-black border-l-8 border-electric-blue pl-4">
                        SrijanBot AI Copilot
                    </h1>
                    <p className="text-surface-variant font-mono text-xs uppercase pl-4 mt-1">
                        Context-Aware Platform Navigator • Grounded in Verified Live MongoDB Data
                    </p>
                </section>

                {/* Quick Prompts Bar */}
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {QUICK_PROMPTS.map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(prompt)}
                            disabled={isTyping}
                            className="whitespace-nowrap bg-white hover:bg-electric-blue hover:text-on-primary text-ink-black text-xs font-mono font-bold px-3 py-1.5 brutal-border brutal-shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                {/* Chat Window */}
                <div className="flex-grow bg-surface-bright brutal-border brutal-shadow-lg flex flex-col overflow-hidden">
                    {/* Messages Area */}
                    <div className="flex-grow p-4 md:p-6 overflow-y-auto flex flex-col gap-4 bg-surface-container-lowest">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] md:max-w-[75%] p-4 brutal-border brutal-shadow ${
                                        msg.role === 'user'
                                            ? 'bg-electric-blue text-on-primary ml-auto'
                                            : 'bg-white text-ink-black'
                                    }`}
                                >
                                    {msg.role === 'ai' && (
                                        <div className="flex items-center gap-2 mb-2 font-label-bold uppercase text-xs text-electric-blue pb-2 border-b border-ink-black/10">
                                            <span className="material-symbols-outlined text-sm">smart_toy</span>
                                            SrijanBot Copilot
                                        </div>
                                    )}
                                    <div className="font-body-md md:font-body-lg leading-relaxed">
                                        {msg.role === 'ai' ? parseMessageNodes(msg.content) : msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white text-ink-black p-4 brutal-border brutal-shadow flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-electric-blue animate-bounce"></span>
                                    <span className="w-2.5 h-2.5 bg-electric-blue animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2.5 h-2.5 bg-electric-blue animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    <span className="font-mono text-xs uppercase text-surface-variant ml-2">Consulting Data Matrix...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <div className="p-4 bg-surface-container border-t-4 border-ink-black">
                        <form onSubmit={handleSend} className="flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about schedules, teams, rules, or submissions..."
                                disabled={isTyping}
                                className="flex-grow bg-white border-2 border-ink-black p-3.5 font-body-md focus:outline-none focus:ring-4 focus:ring-electric-blue"
                            />
                            <button
                                type="submit"
                                disabled={isTyping || !input.trim()}
                                className="bg-electric-blue text-on-primary font-label-bold px-6 md:px-8 uppercase brutal-border brutal-shadow brutal-hover brutal-active transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                            >
                                <span>SEND</span>
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
