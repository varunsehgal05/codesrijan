import { useState, useRef, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { parseSrijanBotMessageNodes } from "../lib/srijanbot-nav";
import axios from "axios";

export function ChatBotWidget() {
    const { currentUser } = useAppStore();
    const apiBaseUrl = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
    const routerState = useRouterState();
    const [isOpen, setIsOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    useEffect(() => setIsReady(true), []);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<{ role: "bot" | "user", text: string }[]>([
        { role: "bot", text: `SYSTEM WAKE. Greetings, ${currentUser?.name || 'Operative'}. I am SrijanBot. How can I assist your navigation today?` }
    ]);

    // Auto-scroll to bottom of chat only when open
    useEffect(() => {
        if (!isOpen) return;
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages, isTyping, isOpen]);

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
                if (res.data?.reply) responseText = res.data.reply;
            } catch (e) {
                console.warn("Backend AI endpoint fallback triggered.");
            }

            if (!responseText) {
                const q = messageText.toLowerCase();
                if (q.includes("submit") || q.includes("workspace") || q.includes("project")) {
                    responseText = "To submit your project, navigate to your Workspace sector, attach your GitHub repository link, and click [Deliver Payload -> /workspace].";
                } else if (q.includes("deadline") || q.includes("schedule") || q.includes("time") || q.includes("when")) {
                    responseText = "Live submission deadlines and event milestones are displayed on the [Hackathons Hub -> /timeline].";
                } else if (q.includes("team") || q.includes("squad") || q.includes("find") || q.includes("join")) {
                    responseText = "You can recruit squad members or search for open teams in the [Recruitment Sector -> /recruitment].";
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
                    responseText = `Greetings! I am SrijanBot, your CodeSrijan AI Assistant. You can explore [Hackathons Hub -> /timeline], browse [Problem Statements -> /problems], or open a [Support Ticket -> /support].`;
                }
            }

            setMessages(prev => [...prev, {
                role: "bot",
                text: responseText
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", text: "SYSTEM NOTICE. SrijanBot ready. Please ask any platform question." }]);
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
        const studentSuggs = ["When is submission?", "Find a teammate", "How do I submit?"];
        const adminSuggs = ["Show hackathon stats"];

        let suggs = ["What is the deadline?", "Who is my team?"];
        if (currentUser?.role === 'admin') suggs = adminSuggs;
        if (currentUser?.role === 'student' || !currentUser) suggs = studentSuggs;

        return suggs.map((sText, idx) => (
            <button key={idx} onClick={() => handleSend(sText)} className="whitespace-nowrap px-3 py-1 bg-surface neo-border font-label-caps text-[11px] hover:bg-surface-variant transition-colors">
                {sText}
            </button>
        ));
    };

    return (
        <div className="fixed bottom-8 right-5 sm:bottom-12 sm:right-8 z-[100] flex flex-col items-end">
            {isOpen && (
                <div className="bg-surface brutal-border brutal-shadow-lg w-[min(380px,calc(100vw-2rem))] h-[min(550px,calc(100dvh-2rem))] mb-4 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-electric-blue text-white p-4 border-b-4 border-ink-black flex justify-between items-center shrink-0">
                        <span className="font-headline-md uppercase text-base flex items-center gap-2">
                            <span className="material-symbols-outlined">smart_toy</span> SrijanBot
                        </span>
                        <button aria-label="Close SrijanBot" onClick={() => setIsOpen(false)} className="hover:text-ink-black transition-colors rotate-0 hover:rotate-90 duration-200">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
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
                                <div className={`p-3 brutal-border whitespace-pre-wrap ${m.role === 'bot' ? 'bg-surface text-ink-black' : 'bg-electric-blue text-on-primary'}`}>
                                    {m.role === 'bot' ? parseMessageNodes(m.text) : m.text}
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
                            <button aria-label="Send message" type="submit" className="absolute right-0 top-0 bottom-0 px-3 bg-electric-blue text-white border-l-2 border-ink-black hover:bg-primary-fixed-dim hover:text-ink-black transition-colors flex items-center justify-center">
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
                    onClick={() => setIsOpen(true)}
                    className="bg-electric-blue text-white p-4 brutal-border brutal-shadow brutal-hover rounded-full flex items-center justify-center group relative mt-4 block pointer-events-auto"
                >
                    <span className="absolute -top-3 -left-3 bg-[#FFE100] text-ink-black text-[10px] uppercase font-bold px-2 py-0.5 brutal-border rotate-[-10deg]">Help</span>
                    <span className="material-symbols-outlined text-[32px] group-hover:rotate-12 transition-transform">smart_toy</span>
                </button>
            )}
        </div>
    );
}
