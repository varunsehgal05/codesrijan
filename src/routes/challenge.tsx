import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/challenge")({
  component: Page9,
  head: () => ({
    meta: [
      { title: "Challenge Detail | CodeSrijan" },
      { name: "description", content: "CodeSrijan challenge detail — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Challenge Detail | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan challenge detail — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/challenge" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/challenge" }],
  }),
});

function Page9() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      <nav className="bg-surface dark:bg-ink-black text-electric-blue dark:text-primary-fixed-dim font-button-text text-button-text w-full sticky top-0 z-50 border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto">
      <a className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright" href="/" >CodeSrijan</a>
      <div className="hidden md:flex gap-8 items-center">
      <a className="text-electric-blue border-b-2 border-electric-blue pb-1 active:translate-y-1 active:shadow-none transition-transform duration-200" href="/problems" >Problems</a>
      <a className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200 active:translate-y-1 active:shadow-none" href="/recruitment" >Recruitment</a>
      <a className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200 active:translate-y-1 active:shadow-none" href="/leaderboard" >Leaderboard</a>
      </div>
      <button className="bg-electric-blue text-on-primary font-button-text text-button-text neo-border neo-shadow px-6 py-3 hidden md:block">
                      Register Now
                  </button>
      <button className="md:hidden text-ink-black">
      <span className="material-symbols-outlined text-3xl">menu</span>
      </button>
      </div>
      </nav>
      {/*Main Content*/}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-margin-desktop py-16 flex flex-col gap-16">
      {/*Hero Section*/}
      <header className="flex flex-col gap-6 relative">
      <div className="inline-flex items-center gap-2 font-label-caps text-label-caps bg-[#FFFF00] text-ink-black neo-border px-3 py-1 w-max">
      <span className="material-symbols-outlined text-sm">bolt</span> PRIORITY: HIGH
                  </div>
      <h1 className="font-display-lg text-display-lg hidden md:block text-ink-black uppercase leading-tight tracking-tighter w-full lg:w-3/4">Quantum State Orchestration Engine</h1>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:hidden text-ink-black uppercase leading-tight tracking-tighter">Quantum State Orchestration Engine</h1>
      <p className="font-body-lg text-body-lg w-full lg:w-2/3 text-text-muted mt-4">
                      Develop a decentralized synchronization protocol for distributed quantum nodes. The system must achieve state consensus within sub-millisecond latency constraints while resisting Byzantine faults in a high-noise environment.
                  </p>
      <div className="flex gap-4 mt-6">
      <button className="bg-electric-blue text-on-primary font-button-text text-button-text neo-border neo-shadow px-8 py-4 uppercase">
                          Accept Challenge
                      </button>
      <button className="bg-surface text-ink-black font-button-text text-button-text neo-border neo-shadow px-8 py-4 uppercase flex items-center gap-2">
      <span className="material-symbols-outlined">forum</span> Discuss
                      </button>
      </div>
      </header>
      {/*Bento Grid Content*/}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/*Left Column: Specs & Rubric*/}
      <div className="lg:col-span-8 flex flex-col gap-12">
      {/*Technical Constraints*/}
      <section className="bg-surface-bright neo-border neo-shadow p-8 relative overflow-hidden">
      <div className="absolute -right-4 -top-4 opacity-10">
      <span className="material-symbols-outlined text-[120px]">code_blocks</span>
      </div>
      <h2 className="font-headline-md text-headline-md mb-6 uppercase flex items-center gap-3">
      <span className="material-symbols-outlined text-electric-blue">memory</span>
                              Technical Constraints
                          </h2>
      <div className="font-label-caps text-label-caps text-ink-black bg-surface-container p-6 neo-border leading-loose whitespace-pre-wrap">
      &gt; LATENCY_THRESHOLD: &lt; 0.5ms
      &gt; FAULT_TOLERANCE: Byzantine (f ≤ 33%)
      &gt; NODE_COUNT: 10,000+
      &gt; ENVIRONMENT: High-noise simulated quantum network
      &gt; ALLOWED_LANGUAGES: Rust, C++, Go
      &gt; DEPLOYMENT: Docker containerized, multi-arch
                          </div>
      </section>
      {/*Evaluation Rubric*/}
      <section className="flex flex-col gap-6">
      <h2 className="font-headline-md text-headline-md uppercase">Evaluation Rubric</h2>
      {/*Rubric Item*/}
      <div className="bg-surface neo-border p-6 flex flex-col gap-4 relative">
      <div className="flex justify-between items-center font-button-text text-button-text">
      <span>Innovation &amp; Architecture</span>
      <span className="text-electric-blue text-2xl">40%</span>
      </div>
      <div className="w-full bg-surface-container neo-border h-4 overflow-hidden relative">
      <div className="absolute top-0 left-0 h-full bg-electric-blue w-[40%] border-r-2 border-ink-black"></div>
      </div>
      <p className="text-sm text-text-muted">Novelty of the synchronization approach and overall system design elegance.</p>
      </div>
      {/*Rubric Item*/}
      <div className="bg-surface neo-border p-6 flex flex-col gap-4 relative">
      <div className="flex justify-between items-center font-button-text text-button-text">
      <span>Performance &amp; Latency</span>
      <span className="text-electric-blue text-2xl">30%</span>
      </div>
      <div className="w-full bg-surface-container neo-border h-4 overflow-hidden relative">
      <div className="absolute top-0 left-0 h-full bg-electric-blue w-[30%] border-r-2 border-ink-black"></div>
      </div>
      <p className="text-sm text-text-muted">Adherence to the sub-millisecond constraint under simulated heavy load.</p>
      </div>
      {/*Rubric Item*/}
      <div className="bg-surface neo-border p-6 flex flex-col gap-4 relative">
      <div className="flex justify-between items-center font-button-text text-button-text">
      <span>Fault Tolerance (BFT)</span>
      <span className="text-electric-blue text-2xl">30%</span>
      </div>
      <div className="w-full bg-surface-container neo-border h-4 overflow-hidden relative">
      <div className="absolute top-0 left-0 h-full bg-electric-blue w-[30%] border-r-2 border-ink-black"></div>
      </div>
      <p className="text-sm text-text-muted">System stability during active node failure and adversarial injection.</p>
      </div>
      </section>
      </div>
      {/*Right Column: Meta & Resources*/}
      <div className="lg:col-span-4 flex flex-col gap-8">
      {/*Active Teams Tracker*/}
      <div className="bg-electric-blue text-on-primary neo-border neo-shadow p-6">
      <h3 className="font-headline-md text-headline-md mb-2">Active Teams</h3>
      <div className="text-[64px] font-display-lg leading-none mb-4">142</div>
      <div className="flex -space-x-4">
      <div className="w-12 h-12 bg-surface neo-border rounded-full flex items-center justify-center text-ink-black font-button-text">A</div>
      <div className="w-12 h-12 bg-surface neo-border rounded-full flex items-center justify-center text-ink-black font-button-text">B</div>
      <div className="w-12 h-12 bg-surface neo-border rounded-full flex items-center justify-center text-ink-black font-button-text">C</div>
      <div className="w-12 h-12 bg-surface-container-highest neo-border rounded-full flex items-center justify-center text-ink-black font-button-text text-sm">+139</div>
      </div>
      </div>
      {/*Resources List*/}
      <div className="flex flex-col gap-4">
      <h3 className="font-button-text text-button-text uppercase mb-2">Required Resources</h3>
      <a className="bg-surface hover:bg-surface-bright neo-border neo-shadow p-4 flex items-center justify-between group cursor-pointer transition-all" href="/" >
      <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-electric-blue">dataset</span>
      <span className="font-button-text text-ink-black">Quantum Noise Dataset v3</span>
      </div>
      <span className="material-symbols-outlined text-ink-black group-hover:text-electric-blue transition-colors">download</span>
      </a>
      <a className="bg-surface hover:bg-surface-bright neo-border neo-shadow p-4 flex items-center justify-between group cursor-pointer transition-all" href="/" >
      <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-electric-blue">api</span>
      <span className="font-button-text text-ink-black">Sim Node API Docs</span>
      </div>
      <span className="material-symbols-outlined text-ink-black group-hover:text-electric-blue transition-colors">arrow_forward</span>
      </a>
      </div>
      </div>
      </div>
      </main>
      {/*Footer*/}
      <footer className="bg-ink-black dark:bg-surface-container-lowest text-surface-bright dark:text-ink-black font-body-md text-body-md w-full mt-16 border-t-4 border-electric-blue flat no shadows">
      <div className="flex flex-col md:flex-row justify-between items-start px-margin-desktop py-12 gap-8 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-4">
      <span className="font-display-lg text-headline-md text-surface-bright">CodeSrijan</span>
      <p className="text-surface-variant">© 2024 CodeSrijan. Built for the community.</p>
      </div>
      <div className="flex flex-wrap gap-6 items-center">
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Sponsors</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Community</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Discord</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >GitHub</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Privacy Policy</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Code of Conduct</a>
      </div>
      </div>
      </footer>
    </div>
  );
}
