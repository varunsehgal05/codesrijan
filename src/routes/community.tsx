import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/community")({
    component: CommunityPage,
    head: () => ({
        meta: [
            { title: "Community | CodeSrijan" },
            { name: "description", content: "Join the CodeSrijan hacker community." },
        ],
    }),
});

function CommunityPage() {
    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <header className="w-full top-0 sticky z-50 bg-background border-b-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="flex justify-between items-center px-gutter py-stack-md max-w-[1200px] mx-auto">
                    <a className="font-headline-xl text-headline-xl font-bold text-deep-navy italic tracking-tighter" href="/">CodeSrijan</a>
                </div>
            </header>
            <main className="flex-grow max-w-[1200px] mx-auto px-gutter py-section-gap">
                <div className="mb-6"><button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-fit cursor-pointer"><span className="material-symbols-outlined">arrow_back</span>GO BACK</button></div>
                <h1 className="font-display-lg uppercase text-stark-black mb-6">CodeSrijan Community</h1>
                <div className="bg-surface-container-lowest border-2 border-stark-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="font-headline-md mb-4 text-deep-navy">Welcome to the Matrix</h2>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        CodeSrijan is more than just a hackathon; it's a living ecosystem of student developers, seasoned mentors, and forward-thinking recruiters. Join our Discord server to connect with teammates, find project inspiration, and ask technical queries in real-time.
                    </p>
                    <button className="mt-8 bg-electric-blue text-pure-white font-label-bold px-8 py-4 border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">Join Discord Server</button>
                </div>
            </main>
            <footer className="w-full bg-deep-navy border-t-2 border-stark-black py-4 mt-auto">
                <div className="max-w-[1200px] mx-auto text-center font-body-md text-surface-bright">© 2026 CodeSrijan. Built with Electric Blue Energy.</div>
            </footer>
        </div>
    );
}
