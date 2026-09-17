import { useState } from "react";

export function ChatBotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: "bot" | "user", text: string }[]>([
        { role: "bot", text: "SYSTEM WAKE. How can I assist you with CodeSrijan today?" }
    ]);
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: "user", text: input }]);
        setInput("");

        // Mock bot response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: "bot",
                text: "Understood. The admin team has been notified. Check the /support page if you are blocked."
            }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {isOpen && (
                <div className="bg-surface neo-border neo-shadow w-80 h-96 mb-4 flex flex-col">
                    <div className="bg-electric-blue text-white p-3 neo-border border-b-2 flex justify-between items-center">
                        <span className="font-headline-md uppercase text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined">smart_toy</span> SrijanBot
                        </span>
                        <button onClick={() => setIsOpen(false)} className="hover:text-ink-black transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 bg-surface-container font-body-sm">
                        {messages.map((m, i) => (
                            <div key={i} className={`p-2 neo-border max-w-[85%] ${m.role === 'bot' ? 'bg-white self-start' : 'bg-electric-blue text-white self-end text-right'}`}>
                                {m.text}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="p-2 bg-white border-t-2 border-ink-black flex">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Query system..."
                            className="w-full focus:outline-none px-2 font-body-sm"
                        />
                        <button type="submit" className="text-electric-blue hover:text-ink-black px-2">
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </form>
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-electric-blue text-white p-4 neo-border neo-shadow hover:-translate-y-1 transition-transform rounded-full flex items-center justify-center group"
                >
                    <span className="material-symbols-outlined text-[32px] group-hover:rotate-12 transition-transform">smart_toy</span>
                </button>
            )}
        </div>
    );
}
