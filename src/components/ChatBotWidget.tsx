import { useState, useRef, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { parseSrijanBotMessageNodes } from "../lib/srijanbot-nav";
import axios from "axios";

export function ChatBotWidget() {
    const { currentUser, hackathons = [], teams = [] } = useAppStore();
    const apiBaseUrl = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
    const routerState = useRouterState();
    const [isOpen, setIsOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    useEffect(() => setIsReady(true), []);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const initialGreeting = `SYSTEM WAKE. Greetings, ${currentUser?.name || 'Operative'}. I am SrijanBot. How can I assist your navigation today? [Explore Hackathons -> /hackathons]`;

    const [messages, setMessages] = useState<{ role: "bot" | "user", text: string }[]>([
        { role: "bot", text: initialGreeting }
    ]);

    // Auto-scroll to bottom of chat only when open
    useEffect(() => {
        if (!isOpen) return;
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages, isTyping, isOpen]);

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
                role: "bot",
                text: `SYSTEM RESET. Greetings, ${currentUser?.name || 'Operative'}. SrijanBot memory cleared. How can I assist you with hackathons, squads, submissions, or tech advice today? [Explore Hackathons -> /hackathons]`
            }
        ]);
        setInput("");
        setCopiedIndex(null);
    };

    const handleSend = async (messageText: string) => {
        if (!messageText.trim()) return;

        setMessages(prev => [...prev, { role: "user", text: messageText }]);
        setInput("");
        setIsTyping(true);

        try {
            const payload = {
                message: messageText,
                context: {
                    path: routerState.location.pathname
                }
            };

            // Smart local fallback response engine if API endpoint is unreachable
            let responseText = "";
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const cleanBase = apiBaseUrl.replace(/\/api\/?$/, '');
                const url = `${cleanBase}/api/ai/chat`;
                const res = await axios.post(url, payload, { headers });
                if (res.data?.reply) {
                    responseText = res.data.reply;
                    const q = messageText.toLowerCase();
                    if ((q.includes("deadline") || q.includes("end") || q.includes("when")) && responseText.includes("I am SrijanBot, your CodeSrijan guide")) {
                        const activeH = (teams && currentUser?.teamId && teams.find(t => t.id === currentUser.teamId)?.hackathonId)
                            ? (hackathons.find(h => h.id === teams.find(t => t.id === currentUser.teamId)?.hackathonId) || hackathons[0])
                            : (hackathons && hackathons[0]);
                        const hName = activeH?.name || activeH?.title || "CodeSrijan Impact Challenge — Free Edition";
                        const deadline = activeH?.submissionDeadline ? new Date(activeH.submissionDeadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST' : "November 14, 2026, 3:36 AM IST";
                        const endDate = activeH?.endDate ? new Date(activeH.endDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST' : "November 14, 2026, 5:36 AM IST";
                        responseText = `Official Tournament Schedule for "${hName}":\n• Final Submission Deadline: ${deadline}\n• Event Conclusion: ${endDate}\nAll deliverables must be finalized and transmitted in your Workspace before the countdown lockdown. [Open Workspace -> /workspace]`;
                    }
                }
            } catch (e) {
                console.warn("Backend AI endpoint fallback triggered.");
            }

            if (!responseText) {
                const q = messageText.toLowerCase();
                if (q.includes("stack") || q.includes("tech") || q.includes("architecture")) {
                    responseText = "Recommended Hackathon Tech Stack: Frontend: React / Next.js / TanStack + Tailwind CSS. Backend: Node.js (Express) or Python (FastAPI). Database: MongoDB or PostgreSQL. AI: OpenAI/Gemini SDKs. Rapid Prototyping Tip: Build end-to-end MVP features first before adding complex settings! [View Problem Statements -> /problems]";
                } else if (q.includes("pitch") || q.includes("presentation") || q.includes("demo")) {
                    responseText = "How to Prepare Your Winning Pitch: 1. The Hook (30s): Clear problem & user impact. 2. Live Demo (60-90s): Working prototype flow. 3. Technical Edge (30s): Architecture & uniqueness. 4. Feasibility & Roadmap (30s). Tip: Record an offline video backup in case of Wi-Fi issues! [Explore Hackathons -> /hackathons]";
                } else if (q.includes("submit") || q.includes("workspace") || q.includes("project")) {
                    responseText = "To submit your project, navigate to your Workspace sector, attach your GitHub repository link, and click [Deliver Payload -> /workspace].";
                } else if (q.includes("deadline") || q.includes("schedule") || q.includes("time") || q.includes("when") || q.includes("end") || q.includes("finish") || q.includes("start")) {
                    const activeH = (teams && currentUser?.teamId && teams.find(t => t.id === currentUser.teamId)?.hackathonId)
                        ? (hackathons.find(h => h.id === teams.find(t => t.id === currentUser.teamId)?.hackathonId) || hackathons[0])
                        : (hackathons && hackathons[0]);
                    const hName = activeH?.name || activeH?.title || "CodeSrijan Impact Challenge — Free Edition";
                    const deadline = activeH?.submissionDeadline ? new Date(activeH.submissionDeadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : "November 14, 2026, 3:36 AM IST";
                    const endDate = activeH?.endDate ? new Date(activeH.endDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : "November 14, 2026, 5:36 AM IST";
                    responseText = `Active Tournament Schedule for "${hName}":\n• Final Submission Deadline: ${deadline}\n• Event Conclusion: ${endDate}\nCheck the live chronological roadmap at [View Official Timeline -> /timeline].`;
                } else if (q.includes("team") || q.includes("squad") || q.includes("find") || q.includes("join") || q.includes("teammate")) {
                    responseText = "You can recruit squad members, find teammates by tech skill, or search for open teams in the [Recruitment Sector -> /recruitment].";
                } else if (q.includes("problem") || q.includes("statement") || q.includes("challenge")) {
                    responseText = "Explore assigned challenge tracks and technical problem statements under [Problem Statements -> /problems].";
                } else if (q.includes("support") || q.includes("help") || q.includes("ticket") || q.includes("contact")) {
                    responseText = "You can create an official support ticket or contact team leads directly at [Support Sector -> /support].";
                } else if (q.includes("admin") || q.includes("stats")) {
                    if (currentUser?.role === 'admin') {
                        responseText = "Admins can access live telemetry, active squads, and participant data at [Admin Panel -> /admin].";
                    } else {
                        responseText = "ACCESS DENIED. You do not have the required clearance to access the Admin Panel. [Go to Dashboard -> /dashboard]";
                    }
                } else if (q.includes("judge") || q.includes("evaluate") || q.includes("score")) {
                    if (currentUser?.role === 'admin' || currentUser?.role === 'judge') {
                        responseText = "Judges can access the evaluation matrices in the Judge Portal. [Open Evaluations -> /evaluations]";
                    } else {
                        responseText = "Evaluation access is restricted to official judges. Participant results will be posted on the leaderboard. [View Leaderboard -> /leaderboard]";
                    }
                } else {
                    responseText = `Greetings! I am SrijanBot, your CodeSrijan AI Assistant. You can explore [Hackathons Hub -> /hackathons], browse [Problem Statements -> /problems], recruit squad members at [Recruitment -> /recruitment], or open a [Support Ticket -> /support].`;
                }
            }

            setMessages(prev => [...prev, {
                role: "bot",
                text: responseText
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", text: "SYSTEM NOTICE. SrijanBot ready. Please ask any platform question. [Explore Hackathons -> /hackathons]" }]);
        } finally {
            setIsTyping(false);
        }
    };

    const parseMessageNodes = (text: string) => {
        return parseSrijanBotMessageNodes(text, {
            buttonClassName: "mt-2 block w-full text-center bg-electric-blue text-on-primary py-2 font-button-text text-button-text brutal-hover brutal-border flex items-center justify-center gap-1.5 cursor-pointer",
            containerClassName: "mt-2"
        });
    };

    const generateQuickSuggestions = () => {
        let suggs: string[] = [];

        if (currentUser?.role === 'admin') {
            suggs = [
                "Show hackathon stats",
                "Suggest Hackathon Tech Stack",
                "How to prepare pitch?",
                "View evaluations",
                "When is submission?"
            ];
        } else {
            suggs = [
                "Suggest Hackathon Tech Stack",
                "How to prepare pitch?",
                "When is submission?",
                "Find a teammate",
                "How do I submit?",
                "Where are problem statements?"
            ];
        }

        return suggs.map((sText, idx) => (
            <button
                key={idx}
                type="button"
                onClick={() => handleSend(sText)}
                aria-label={`Ask: ${sText}`}
                className="whitespace-nowrap px-3 py-1 bg-surface neo-border font-label-caps text-[11px] hover:bg-electric-blue hover:text-white active:bg-electric-blue/90 transition-colors cursor-pointer shrink-0"
            >
                {sText}
            </button>
        ));
    };

    return (
        <div className="fixed bottom-24 right-6 sm:bottom-28 sm:right-8 z-[100] flex flex-col items-end pointer-events-none">
            {isOpen && (
                <div className="bg-surface brutal-border brutal-shadow-lg w-[min(380px,calc(100vw-2rem))] h-[min(500px,calc(100dvh-9rem))] mb-4 flex flex-col overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <div className="bg-electric-blue text-white p-3.5 sm:p-4 border-b-4 border-ink-black flex justify-between items-center shrink-0">
                        <span className="font-headline-md uppercase text-base flex items-center gap-2">
                            <span className="material-symbols-outlined">smart_toy</span> SrijanBot
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                aria-label="Clear conversation"
                                title="Clear conversation"
                                onClick={handleClearConversation}
                                className="p-1 hover:text-ink-black hover:bg-white/20 active:bg-white/30 transition-colors rounded flex items-center justify-center cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-2xl">restart_alt</span>
                            </button>
                            <button
                                type="button"
                                aria-label="Close SrijanBot"
                                title="Close SrijanBot"
                                onClick={() => setIsOpen(false)}
                                className="hover:text-ink-black hover:bg-white/20 active:bg-white/30 p-1 rounded transition-colors rotate-0 hover:rotate-90 duration-200 flex items-center justify-center cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Chat History */}
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 bg-surface-container-lowest font-body-sm relative">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex max-w-[85%] ${m.role === 'bot' ? 'self-start flex-col gap-1' : 'self-end'}`}>
                                {m.role === 'bot' && i === 0 && (
                                    <div className="font-label-caps text-[10px] text-text-muted mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">security</span> OFFICIAL KNOWLEDGE
                                    </div>
                                )}
                                <div className={`p-3 brutal-border whitespace-pre-wrap relative ${m.role === 'bot' ? 'bg-surface text-ink-black' : 'bg-electric-blue text-on-primary'}`}>
                                    <div>
                                        {m.role === 'bot' ? parseMessageNodes(m.text) : m.text}
                                    </div>
                                    {m.role === 'bot' && (
                                        <div className="mt-2.5 pt-1.5 border-t border-ink-black/15 flex items-center justify-between text-[11px] font-mono">
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">SrijanBot</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyResponse(m.text, i)}
                                                aria-label={copiedIndex === i ? "Copied response to clipboard" : "Copy response"}
                                                title={copiedIndex === i ? "Copied!" : "Copy response"}
                                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                                                    copiedIndex === i
                                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-500"
                                                        : "text-zinc-600 hover:text-ink-black hover:bg-zinc-200/60"
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {copiedIndex === i ? "check" : "content_copy"}
                                                </span>
                                                <span>{copiedIndex === i ? "Copied!" : "Copy"}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="self-start p-3 brutal-border bg-surface text-ink-black max-w-[85%] flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-ink-black animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-ink-black animate-pulse delay-75"></div>
                                <div className="w-2 h-2 rounded-full bg-ink-black animate-pulse delay-150"></div>
                            </div>
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* Interaction Zone */}
                    <div className="p-3 bg-surface border-t-4 border-ink-black flex flex-col gap-3 shrink-0">
                        {/* Quick Suggestions */}
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            {generateQuickSuggestions()}
                        </div>
                        {/* Input Box */}
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex relative">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                aria-label="Message SrijanBot"
                                placeholder="Ask SrijanBot..."
                                className="w-full bg-surface-container-lowest brutal-border p-3 pr-12 font-body-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-blue"
                            />
                            <button
                                aria-label="Send message"
                                type="submit"
                                className="absolute right-0 top-0 bottom-0 px-3 bg-electric-blue text-white border-l-2 border-ink-black hover:bg-primary-fixed-dim hover:text-ink-black transition-colors flex items-center justify-center cursor-pointer"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {!isOpen && (
                <button
                    disabled={!isReady}
                    aria-label="Open SrijanBot help"
                    title="Open SrijanBot AI Assistant"
                    onClick={() => setIsOpen(true)}
                    className="bg-electric-blue text-white p-4 brutal-border brutal-shadow brutal-hover rounded-full flex items-center justify-center group relative block pointer-events-auto cursor-pointer"
                >
                    <span className="absolute -top-3 -left-3 bg-[#FFE100] text-ink-black text-[10px] uppercase font-bold px-2 py-0.5 brutal-border rotate-[-10deg]">Help</span>
                    <span className="material-symbols-outlined text-[32px] group-hover:rotate-12 transition-transform">smart_toy</span>
                </button>
            )}
        </div>
    );
}