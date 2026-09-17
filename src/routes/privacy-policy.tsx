import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
    component: PrivacyPage,
    head: () => ({
        meta: [
            { title: "Privacy Policy | CodeSrijan" },
        ],
    }),
});

function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <header className="w-full top-0 sticky z-50 bg-background border-b-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="flex justify-between items-center px-gutter py-stack-md max-w-[1200px] mx-auto">
                    <a className="font-headline-xl text-headline-xl font-bold text-deep-navy italic tracking-tighter" href="/">CodeSrijan</a>
                </div>
            </header>
            <main className="flex-grow max-w-[1000px] mx-auto px-gutter py-section-gap w-full">
                <div className="mb-6"><button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-fit cursor-pointer"><span className="material-symbols-outlined">arrow_back</span>GO BACK</button></div>
                <div className="bg-pure-white border-2 border-stark-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="font-display-lg uppercase text-stark-black mb-8 border-b-4 border-electric-blue pb-4">Privacy Policy</h1>
                    <section className="space-y-6 form-body text-stark-black">
                        <div>
                            <h3 className="font-headline-sm uppercase tracking-tight text-deep-navy mb-2">1. Information Collection</h3>
                            <p>We collect essential identifier details including your legal name, university, and contact email purely for hackathon registration authentication.</p>
                        </div>
                        <div>
                            <h3 className="font-headline-sm uppercase tracking-tight text-deep-navy mb-2">2. Data Security</h3>
                            <p>Your team details and hackathon submissions are isolated in secure MongoDB environments. Only CodeSrijan admins and verified Judges have access.</p>
                        </div>
                        <div>
                            <h3 className="font-headline-sm uppercase tracking-tight text-deep-navy mb-2">3. Telemetry</h3>
                            <p>We log basic platform navigation telemetry strictly to ensure router stability and diagnose UX crashes. No third-party trackers are deployed.</p>
                        </div>
                    </section>
                </div>
            </main>
            <footer className="w-full bg-deep-navy border-t-2 border-stark-black py-4 mt-auto">
                <div className="max-w-[1200px] mx-auto text-center font-body-md text-surface-bright">© 2026 CodeSrijan. Built with Electric Blue Energy.</div>
            </footer>
        </div>
    );
}
