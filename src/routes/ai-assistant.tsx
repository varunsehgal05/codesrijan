import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/ai-assistant")({
    component: AIAssistantPage,
});

function AIAssistantPage() {
    const [messages, setMessages] = useState([
        { role: "ai", content: "HELLO HACKER. I AM THE CODESRIJAN SYNTHETIC HELPER. HOW MAY I ASSIST YOUR BUILD TODAY?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const predefinedAnswers: Record<string, string> = {
        "team": "To form a team, navigate to the Recruitment page, find available hackers, or go to the Team Hub and Create a Squad. You need at least 1 member, max 4.",
        "submit": "Project Submissions are handled inside your Project Workspace. You must supply a Github Repository URL and a live Demo Link to be eligible for judging.",
        "prize": "The total prize pool is 100,000 INR! 1st gets 50K, 2nd gets 30K, 3rd gets 20K. Plus Swag for all finalists.",
        "mentor": "Mentors are assigned 24 hours before hacking concludes. Check your Team Hub or Workspace Chat to see if a Mentor has dropped in.",
        "hello": "GREETINGS! ARE YOU READY TO DESTROY THE COMPETITION?",
        "help": "You can ask me about Teams, Submissions, Prizes, Mentorship, or General Rules!"
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsTyping(true);

        // Mock AI delay
        setTimeout(() => {
            const lowerInput = userMsg.toLowerCase();
            let answer = "I'm sorry, my databanks don't have information on that specific protocol. Please reach out to an Organizer on the Discord server!";

            for (const [key, val] of Object.entries(predefinedAnswers)) {
                if (lowerInput.includes(key)) {
                    answer = val;
                    break;
                }
            }

            setMessages(prev => [...prev, { role: "ai", content: answer }]);
            setIsTyping(false);
        }, 1500);
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
