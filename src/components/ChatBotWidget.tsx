import { useState, useRef, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import axios from "axios";

export function ChatBotWidget() {
    const { currentUser, apiBaseUrl } = useAppStore();
    const routerState = useRouterState();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<{ role: "bot" | "user", text: string }[]>([
        { role: "bot", text: `SYSTEM WAKE. Greetings, ${currentUser?.name || 'Operative'}. I am SrijanBot. How can I assist your navigation today?` }
    ]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = async (messageText: string) => {
        if (!messageText.trim()) return;

        setMessages(prev => [...prev, { role: "user", text: messageText }]);
        setInput("");
        setIsTyping(true);

        try {
            const payload = {
                message: messageText,
                context: {
                    path: routerState.location.pathname,
                    role: currentUser?.role || 'guest',
                    name: currentUser?.name,
                    email: currentUser?.email,
                    teamId: currentUser?.teamId,
                    userId: currentUser?.id
                }
            };

            // In a pure local setup without the backend running, we gracefully fallback
            let responseText = "I couldn't find an official answer to this question. [Create Support Ticket]";
            try {
                const res = await axios.post(`${apiBaseUrl}/api/ai/chat`, payload);
                if (res.data?.reply) responseText = res.data.reply;
            } catch (e) {
                console.warn("Backend AI unreachable, returning simulated text.");
            }

            setMessages(prev => [...prev, {
                role: "bot",
                text: responseText
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", text: "SYSTEM ERROR. Neural link severed." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const parseMessageNodes = (text: string) => {
        // Find things like [Open Submission] and turn them into Action Buttons
        const buttonRegex = /\[(.*?)\]/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = buttonRegex.exec(text)) !== null) {
            // Push text before the match
            if (match.index > lastIndex) {
                parts.push(<span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>);
            }

            const buttonText = match[1];
            let targetPath = "/";

            // Action Router
            if (buttonText.includes("Support")) targetPath = "/support";
            if (buttonText.includes("Submission") || buttonText.includes("My Team")) targetPath = "/workspace";
            if (buttonText.includes("Find a Squad") || buttonText.includes("Create Team")) targetPath = "/recruitment";
            if (buttonText.includes("Dashboard")) targetPath = "/admin";
            if (buttonText.includes("Evaluations")) targetPath = "/evaluations";
            if (buttonText.includes("Schedule")) targetPath = "/about";

            parts.push(
                <Link key={match.index} to={targetPath} className="mt-2 block w-full text-center bg-electric-blue text-on-primary py-2 font-button-text text-button-text brutal-hover brutal-border">
                    {buttonText} {buttonText.includes("Open") && <span className="material-symbols-outlined text-[14px]">arrow_forward</span>}
                </Link>
            );
            lastIndex = buttonRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
        }

        return parts;
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
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {isOpen && (
                <div className="bg-surface brutal-border brutal-shadow-lg w-[380px] h-[550px] mb-4 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-electric-blue text-white p-4 border-b-4 border-ink-black flex justify-between items-center shrink-0">
                        <span className="font-headline-md uppercase text-base flex items-center gap-2">
                            <span className="material-symbols-outlined">smart_toy</span> SrijanBot
                        </span>
                        <button onClick={() => setIsOpen(false)} className="hover:text-ink-black transition-colors rotate-0 hover:rotate-90 duration-200">
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
                                placeholder="Ask SrijanBot..."
                                className="w-full bg-surface-container-lowest brutal-border p-3 pr-12 font-body-md focus:outline-none focus:border-electric-blue"
                            />
                            <button type="submit" className="absolute right-0 top-0 bottom-0 px-3 bg-electric-blue text-white border-l-2 border-ink-black hover:bg-primary-fixed-dim hover:text-ink-black transition-colors flex items-center justify-center">
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {!isOpen && (
                <button
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
