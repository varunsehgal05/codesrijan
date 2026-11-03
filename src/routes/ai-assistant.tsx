import { createFileRoute, useLocation, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "../lib/store";
import { parseSrijanBotMessageNodes } from "../lib/srijanbot-nav";
import axios from "axios";

export const Route = createFileRoute("/ai-assistant")({
    component: AIAssistantPage,
});

const QUICK_PROMPTS = [
    "Suggest Hackathon Tech Stack",
    "How to prepare pitch?",
    "Best practices for MVP demo?",
    "When is the submission deadline?",
    "How do I submit our project?",
    "How do I create a squad?",
    "What hackathons are available?",
    "Where are problem statements?",
    "How are projects evaluated?",
    "Is this hackathon free or paid?"
];

function AIAssistantPage() {
    const { currentUser } = useAppStore();
    const location = useLocation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initialAIMessage = `SYSTEM INITIALIZED. Greetings, ${currentUser?.name || 'Operative'}. I am SrijanBot, your context-aware CodeSrijan Hackathon Copilot. I can assist with event schedules, squad recruitment, project submissions, tech stack recommendations, rules, and navigation. [Explore Hackathons -> /hackathons]`;

    const [messages, setMessages] = useState<Array<{ role: "ai" | "user"; content: string }>>([
        {
            role: "ai",
            content: initialAIMessage
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages, isTyping]);

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            throw new Error("Clipboard API unavailable");
        } catch {
            try {
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                textarea.style.top = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                const success = document.execCommand("copy");
                document.body.removeChild(textarea);
                return success;
            } catch (err) {
                console.error("Copy failed", err);
                return false;
            }
        }
    };

    const handleCopyResponse = async (text: string, index: number) => {
        const success = await copyToClipboard(text);
        if (success) {
            setCopiedIndex(index);
            setTimeout(() => {
                setCopiedIndex(prev => (prev === index ? null : prev));
            }, 2000);
        }
    };

    const handleClearConversation = () => {
        setMessages([
            {
                role: "ai",
                content: `SYSTEM RESET. Greetings, ${currentUser?.name || 'Operative'}. Copilot memory cleared and re-initialized. Ready for your questions on tech stack, pitch preparation, squads, or platform navigation. [Explore Hackathons -> /hackathons]`
            }
        ]);
        setInput("");
        setCopiedIndex(null);
    };

    const getLocalFallbackReply = (text: string): string => {
        const q = text.toLowerCase();
        if (q.includes("stack") || q.includes("tech") || q.includes("architecture")) {
            return "Recommended Hackathon Tech Stack: Frontend: React / Next.js / TanStack + Tailwind CSS. Backend: Node.js (Express) or Python (FastAPI). Database: MongoDB / PostgreSQL with Supabase or Prisma. Rapid prototyping tip: Prioritize core MVP flow over complex configurations! [Explore Problems -> /problems]";
        }
        if (q.includes("pitch") || q.includes("presentation") || q.includes("demo")) {
            return "Pitch Deck & Presentation Blueprint: 1. Hook (Problem & real-world pain point - 30s) 2. Solution & Live Working Demo (60-90s) 3. Technical Architecture & Innovation (30s) 4. Market Impact & Next Steps (30s). Tip: Rehearse live demos and keep a recorded video backup! [Explore Hackathons -> /hackathons]";
        }
        if (q.includes("mvp") || q.includes("best practice")) {
            return "Best Practices for Hackathon MVP: 1. Scope aggressively: one core killer feature working end-to-end beats five half-baked features. 2. Seed realistic demo data. 3. Polish UI feedback and loading states. 4. Record a backup screencast. [View Workspace -> /workspace]";
        }
        if (q.includes("deadline") || q.includes("schedule") || q.includes("time") || q.includes("when")) {
            return "Live submission deadlines, review milestones, and event schedules are listed in the [Hackathons Hub -> /timeline].";
        }
        if (q.includes("submit") || q.includes("workspace") || q.includes("deliver")) {
            return "To submit your project: Head to your team Workspace, attach your public repository URL, live deployment link, and demo recording, then click [Deliver Payload -> /workspace].";
        }
        if (q.includes("team") || q.includes("squad") || q.includes("create squad") || q.includes("recruit")) {
            return "You can recruit squad members, search candidates by skills, or form new teams in the [Recruitment Sector -> /recruitment].";
        }
        if (q.includes("hackathon") || q.includes("available") || q.includes("event")) {
            return "Check out active, upcoming, and past hackathons in our [Hackathons Hub -> /hackathons].";
        }
        if (q.includes("problem") || q.includes("statement") || q.includes("challenge")) {
            return "View assigned challenge tracks and technical problem statements in [Problem Statements -> /problems].";
        }
        if (q.includes("judge") || q.includes("evaluate") || q.includes("score") || q.includes("criteria")) {
            return "Evaluations are based on 4 pillars: Innovation (25%), Technical Execution (25%), Design & Usability (25%), and Feasibility/Impact (25%). Track results on the [Leaderboard -> /leaderboard].";
        }
        if (q.includes("free") || q.includes("paid") || q.includes("fee") || q.includes("cost")) {
            return "Participation in CodeSrijan hackathons is 100% free of charge! All verified student and developer squads can register with zero fees. [Register Now -> /hackathons]";
        }
        return `SrijanBot Copilot is ready to assist. You can explore [Hackathons -> /hackathons], browse [Problem Statements -> /problems], recruit squad members at [Recruitment -> /recruitment], or open a ticket at [Support -> /support].`;
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isTyping) return;

        const userMsg = text.trim();
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsTyping(true);

        try {
            const contextPayload = {
                path: location.pathname
            };

            const token = typeof window !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            let reply = "";

            try {
                const res = await axios.post(`${API_URL}/ai/chat`,
                    { message: userMsg, context: contextPayload },
                    { headers }
                );
                if (res.data?.reply) {
                    reply = res.data.reply;
                }
            } catch (networkErr) {
                console.warn("Backend AI endpoint fallback triggered in full-page copilot:", networkErr);
            }

            if (!reply) {
                reply = getLocalFallbackReply(userMsg);
            }

            setMessages(prev => [...prev, { role: "ai", content: reply }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: "ai",
                content: getLocalFallbackReply(userMsg)
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
        return parseSrijanBotMessageNodes(text);
    };

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <main className="flex-grow max-w-5xl mx-auto px-4 md:px-8 py-8 w-full flex flex-col h-[calc(100vh-80px)]">

                {/* Top Nav / Breadcrumb Toolbar */}
                <div className="w-full mb-4 flex items-center justify-between flex-wrap gap-2">
                    <button
                        onClick={() => window.history.back()}
                        aria-label="Go back"
                        className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer"
                    >
                        <span className="material-symbols-outlined group-hover:-translate-x-1">arrow_back</span>
                        BACK
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleClearConversation}
                            title="Clear conversation history"
                            aria-label="Clear conversation history"
                            className="flex items-center gap-1.5 text-xs font-mono font-bold bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 px-3 py-1.5 brutal-border brutal-shadow-sm brutal-hover transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                            <span>CLEAR CONVERSATION</span>
                        </button>
                        <div className="flex items-center gap-2 text-xs font-mono bg-electric-blue/10 text-electric-blue px-3 py-1.5 brutal-border">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            SRIJANBOT v2.4 ONLINE
                        </div>
                    </div>
                </div>

                {/* Header Section */}
                <section className="mb-4">
                    <h1 className="font-display-lg text-headline-md md:text-headline-lg uppercase text-ink-black border-l-8 border-electric-blue pl-4">
                        SrijanBot AI Copilot
                    </h1>
                    <p className="text-zinc-600 font-mono text-xs uppercase pl-4 mt-1 font-bold">
                        Context-Aware Platform Navigator • Grounded in Verified Live MongoDB Data
                    </p>
                </section>

                {/* Quick Prompts Bar */}
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {QUICK_PROMPTS.map((prompt, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => sendMessage(prompt)}
                            disabled={isTyping}
                            aria-label={`Prompt: ${prompt}`}
                            className="whitespace-nowrap bg-white hover:bg-electric-blue hover:text-on-primary text-ink-black text-xs font-mono font-bold px-3 py-1.5 brutal-border brutal-shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                {/* Chat Window */}
                <div className="flex-grow bg-surface-bright brutal-border brutal-shadow-lg flex flex-col overflow-hidden">
                    {/* Terminal Header Bar */}
                    <div className="bg-electric-blue text-white px-4 py-2.5 border-b-4 border-ink-black flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/30 inline-block"></span>
                                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/30 inline-block"></span>
                                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/30 inline-block"></span>
                            </div>
                            <span className="font-mono text-xs uppercase font-bold tracking-wider ml-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">terminal</span>
                                SRIJANBOT COPILOT TERMINAL
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleClearConversation}
                            title="Clear Chat"
                            aria-label="Clear Chat"
                            className="text-[11px] font-mono uppercase bg-white/10 hover:bg-white hover:text-ink-black px-2.5 py-1 border border-white/40 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                        >
                            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                            <span>Clear</span>
                        </button>
                    </div>

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
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-ink-black/10">
                                            <div className="flex items-center gap-2 font-label-bold uppercase text-xs text-electric-blue">
                                                <span className="material-symbols-outlined text-sm">smart_toy</span>
                                                SrijanBot Copilot
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyResponse(msg.content, idx)}
                                                aria-label={copiedIndex === idx ? "Copied response to clipboard" : "Copy response"}
                                                title={copiedIndex === idx ? "Copied!" : "Copy response to clipboard"}
                                                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono uppercase brutal-border transition-all cursor-pointer font-bold ${
                                                    copiedIndex === idx
                                                        ? "bg-emerald-100 text-emerald-800 border-emerald-600"
                                                        : "bg-zinc-100 hover:bg-electric-blue hover:text-white text-ink-black"
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {copiedIndex === idx ? "check" : "content_copy"}
                                                </span>
                                                <span>{copiedIndex === idx ? "Copied!" : "Copy"}</span>
                                            </button>
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
                                    <span className="font-mono text-xs uppercase text-zinc-600 font-bold ml-2">Consulting Data Matrix...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <div className="p-3 sm:p-4 bg-surface-container border-t-4 border-ink-black">
                        <form onSubmit={handleSend} className="flex gap-2 sm:gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about tech stacks, pitch prep, schedules, teams, rules, or submissions..."
                                aria-label="Ask about tech stacks, pitch prep, schedules, teams, rules, or submissions"
                                disabled={isTyping}
                                className="flex-grow min-w-0 bg-white border-2 border-ink-black p-3 sm:p-3.5 font-body-md focus:outline-none focus:ring-4 focus:ring-electric-blue text-xs sm:text-base"
                            />
                            <button
                                type="submit"
                                disabled={isTyping || !input.trim()}
                                aria-label="Send message"
                                className="bg-electric-blue text-on-primary font-label-bold px-4 sm:px-6 md:px-8 uppercase brutal-border brutal-shadow brutal-hover brutal-active transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm"
                            >
                                <span>SEND</span>
                                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}