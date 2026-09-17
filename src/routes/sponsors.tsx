import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sponsors")({
    component: SponsorsPage,
    head: () => ({
        meta: [
            { title: "Sponsors & Partners | CodeSrijan" },
        ],
    }),
});

function SponsorsPage() {
    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <header className="w-full top-0 sticky z-50 bg-background border-b-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="flex justify-between items-center px-gutter py-stack-md max-w-[1200px] mx-auto">
                    <a className="font-headline-xl text-headline-xl font-bold text-deep-navy italic tracking-tighter" href="/">CodeSrijan</a>
                </div>
            </header>
            <main className="flex-grow max-w-[1200px] mx-auto px-gutter py-section-gap w-full">
                <div className="mb-6"><button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-fit cursor-pointer"><span className="material-symbols-outlined">arrow_back</span>GO BACK</button></div>
                <h1 className="font-display-lg uppercase text-stark-black mb-12 text-center">Platform Partners</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-surface border-2 border-stark-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center hover:-translate-y-2 transition-transform">
                        <div className="w-24 h-24 bg-surface-bright border-2 border-stark-black rounded-full mb-4 flex items-center justify-center font-headline-xl text-electric-blue">V</div>
                        <h3 className="font-headline-md text-ink-black">Vercel</h3>
                        <p className="font-body-md mt-2 text-on-surface-variant">Providing edge networking and lightning-fast deployment capabilities for CodeSrijan competitors.</p>
                    </div>
                    <div className="bg-surface border-2 border-stark-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center hover:-translate-y-2 transition-transform">
                        <div className="w-24 h-24 bg-surface-bright border-2 border-stark-black rounded-full mb-4 flex items-center justify-center font-headline-xl text-error">M</div>
                        <h3 className="font-headline-md text-ink-black">MongoDB</h3>
                        <p className="font-body-md mt-2 text-on-surface-variant">The official database of CodeSrijan. Delivering highly scalable NoSQL capabilities for real-time hackathon metrics.</p>
                    </div>
                    <div className="bg-surface border-2 border-stark-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center hover:-translate-y-2 transition-transform">
                        <div className="w-24 h-24 bg-surface-bright border-2 border-stark-black rounded-full mb-4 flex items-center justify-center font-headline-xl text-deep-navy">R</div>
                        <h3 className="font-headline-md text-ink-black">React</h3>
                        <p className="font-body-md mt-2 text-on-surface-variant">The core library driving our dynamic user interface. Build seamlessly and aggressively.</p>
                    </div>
                </div>
            </main>
            <footer className="w-full bg-deep-navy border-t-2 border-stark-black py-4 mt-auto">
                <div className="max-w-[1200px] mx-auto text-center font-body-md text-surface-bright">© 2026 CodeSrijan. Built with Electric Blue Energy.</div>
            </footer>
        </div>
    );
}
