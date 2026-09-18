import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/code-of-conduct")({
    component: ConductPage,
    head: () => ({
        meta: [
            { title: "Code of Conduct | CodeSrijan" },
        ],
    }),
});

function ConductPage() {
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
                    <h1 className="font-display-lg uppercase text-stark-black mb-8 border-b-4 border-electric-blue pb-4">Code of Conduct</h1>
                    <section className="space-y-6 form-body text-stark-black">
                        <div className="p-4 bg-error-container border-l-4 border-error text-on-error-container font-label-bold">
                            Zero Tolerance Policy: Harassment in any form, direct or systematic, will result in immediate disqualification and campus expulsion.
                        </div>
                        <div>
                            <h3 className="font-headline-sm uppercase tracking-tight text-deep-navy mb-2">Respect The Build</h3>
                            <p>Hackers must respect the venue, the local network endpoints, and other competitors' workstation areas. Do not tamper with external projects.</p>
                        </div>
                        <div>
                            <h3 className="font-headline-sm uppercase tracking-tight text-deep-navy mb-2">Originality Clause</h3>
                            <p>Submitting ripped boilerplate repositories with no significant algorithmic alteration constitutes plagiarism. CodeSrijan is meant to showcase raw talent.</p>
                        </div>
                    </section>
                </div>
            </main>
</div>
    );
}
