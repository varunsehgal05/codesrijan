import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mentor")({
  component: Page2,
  head: () => ({
    meta: [
      { title: "Mentor Control | CodeSrijan" },
      { name: "description", content: "CodeSrijan mentor control — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Mentor Control | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan mentor control — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/mentor" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/mentor" }],
  }),
});

function Page2() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar (Shared Component)*/}
      <nav className="bg-surface dark:bg-ink-black w-full border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 relative">
      <div className="flex justify-between items-center w-full px-margin-desktop max-md:px-margin-mobile py-4 max-w-[1280px] mx-auto">
      {/*Brand*/}
      <a className="font-headline-md text-headline-md font-black text-ink-black dark:text-surface flex items-center gap-2" href="/" >
      <span className="material-symbols-outlined text-electric-blue" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                      CodeSrijan
                  </a>
      {/*Desktop Navigation*/}
      <div className="hidden md:flex items-center gap-stack-lg">
      <a className="font-button-text text-button-text text-ink-black dark:text-surface hover:-translate-y-0.5 hover:translate-x-0.5 transition-transform" href="/problems" >Problems</a>
      <a className="font-button-text text-button-text text-electric-blue border-b-4 border-electric-blue hover:-translate-y-0.5 hover:translate-x-0.5 transition-transform" href="/recruitment" >Recruitment</a>
      <a className="font-button-text text-button-text text-ink-black dark:text-surface hover:-translate-y-0.5 hover:translate-x-0.5 transition-transform" href="/leaderboard" >Leaderboard</a>
      </div>
      {/*Trailing Action*/}
      <div className="flex items-center gap-4">
      <button className="hidden md:block bg-electric-blue text-studio-white font-label-mono-bold text-label-mono-bold px-6 py-2 hard-border hard-shadow hard-shadow-hover hard-shadow-active transition-all">
                          Register Now
                      </button>
      <button className="md:hidden text-ink-black">
      <span className="material-symbols-outlined text-[32px]">menu</span>
      </button>
      </div>
      </div>
      </nav>
      {/*Main Content Canvas*/}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-desktop max-md:px-margin-mobile py-stack-lg flex flex-col gap-gutter">
      {/*Dashboard Header*/}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-4 border-ink-black pb-stack-md">
      <div>
      <span className="mono-tag bg-slate-tech text-studio-white px-2 py-1 hard-border-thin inline-block mb-2">[ SYSTEM: ACTIVE ]</span>
      <h1 className="font-headline-xl text-headline-xl max-md:font-headline-lg-mobile max-md:text-headline-lg-mobile text-ink-black uppercase">Mentor Control</h1>
      </div>
      <div className="flex gap-2">
      <button className="bg-surface text-ink-black font-label-mono-bold text-label-mono-bold px-4 py-2 hard-border flex items-center gap-2 hover:bg-surface-variant transition-colors">
      <span className="material-symbols-outlined text-[20px]">refresh</span>
                          SYNC DATA
                      </button>
      </div>
      </header>
      {/*Bento Grid Layout*/}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
      {/*Assigned Teams (Primary - Spans 8 cols on md)*/}
      <section className="md:col-span-8 flex flex-col gap-stack-md">
      <h2 className="font-headline-md text-headline-md border-b-2 border-ink-black pb-2 flex items-center gap-2">
      <span className="material-symbols-outlined text-electric-blue">group</span>
                          Assigned Teams
                      </h2>
      <div className="flex flex-col gap-4">
      {/*Team Card 1 - Warning*/}
      <article className="bg-studio-white hard-border hard-shadow p-0 flex flex-col relative overflow-hidden group">
      <div className="bg-error px-4 py-2 border-b-2 border-ink-black flex justify-between items-center text-studio-white">
      <span className="font-label-mono-bold text-label-mono-bold">TEAM: NEURAL_NINJAS</span>
      <span className="mono-tag bg-ink-black px-2 py-0.5">BLOCKER DETECTED</span>
      </div>
      <div className="p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
      <div>
      <h3 className="font-body-lg text-body-lg font-bold">API Integration Failure</h3>
      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">Struggling with OAuth2 token refresh flow on the backend.</p>
      </div>
      <button className="bg-ink-black text-studio-white font-label-mono-bold text-label-mono-bold px-3 py-1 hard-border hard-shadow-hover transition-all flex items-center gap-1 shrink-0">
      <span className="material-symbols-outlined text-[16px]">chat</span>
                                          INTERVENE
                                      </button>
      </div>
      {/*Progress Bar*/}
      <div className="flex items-center gap-2 w-full mt-2">
      <span className="mono-tag text-ink-black w-[40px]">45%</span>
      <div className="h-[12px] bg-surface flex-grow hard-border-thin overflow-hidden flex">
      <div className="h-full bg-error w-[45%] border-r border-ink-black"></div>
      </div>
      </div>
      </div>
      </article>
      {/*Team Card 2 - Nominal*/}
      <article className="bg-studio-white hard-border hard-shadow p-0 flex flex-col relative overflow-hidden group">
      <div className="bg-electric-blue px-4 py-2 border-b-2 border-ink-black flex justify-between items-center text-studio-white">
      <span className="font-label-mono-bold text-label-mono-bold">TEAM: QUANTUM_LEAP</span>
      <span className="mono-tag bg-ink-black px-2 py-0.5">NOMINAL</span>
      </div>
      <div className="p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
      <div>
      <h3 className="font-body-lg text-body-lg font-bold">Frontend Polishing</h3>
      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">Implementing drag-and-drop interfaces for the main dashboard.</p>
      </div>
      <button className="bg-surface text-ink-black font-label-mono-bold text-label-mono-bold px-3 py-1 hard-border hard-shadow-hover transition-all flex items-center gap-1 shrink-0">
      <span className="material-symbols-outlined text-[16px]">visibility</span>
                                          VIEW
                                      </button>
      </div>
      {/*Progress Bar*/}
      <div className="flex items-center gap-2 w-full mt-2">
      <span className="mono-tag text-ink-black w-[40px]">82%</span>
      <div className="h-[12px] bg-surface flex-grow hard-border-thin overflow-hidden flex">
      <div className="h-full bg-electric-blue w-[82%] border-r border-ink-black"></div>
      </div>
      </div>
      </div>
      </article>
      {/*Team Card 3 - Nominal*/}
      <article className="bg-studio-white hard-border hard-shadow p-0 flex flex-col relative overflow-hidden group">
      <div className="bg-slate-tech px-4 py-2 border-b-2 border-ink-black flex justify-between items-center text-studio-white">
      <span className="font-label-mono-bold text-label-mono-bold">TEAM: BYTE_ME</span>
      <span className="mono-tag bg-ink-black px-2 py-0.5">NOMINAL</span>
      </div>
      <div className="p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
      <div>
      <h3 className="font-body-lg text-body-lg font-bold">Database Schema Design</h3>
      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">Finalizing relational models before starting API routes.</p>
      </div>
      <button className="bg-surface text-ink-black font-label-mono-bold text-label-mono-bold px-3 py-1 hard-border hard-shadow-hover transition-all flex items-center gap-1 shrink-0">
      <span className="material-symbols-outlined text-[16px]">visibility</span>
                                          VIEW
                                      </button>
      </div>
      {/*Progress Bar*/}
      <div className="flex items-center gap-2 w-full mt-2">
      <span className="mono-tag text-ink-black w-[40px]">25%</span>
      <div className="h-[12px] bg-surface flex-grow hard-border-thin overflow-hidden flex">
      <div className="h-full bg-slate-tech w-[25%] border-r border-ink-black"></div>
      </div>
      </div>
      </div>
      </article>
      </div>
      </section>
      {/*Right Column (Spans 4 cols on md)*/}
      <section className="md:col-span-4 flex flex-col gap-gutter">
      {/*Priority Alerts*/}
      <div className="bg-studio-white hard-border hard-shadow flex flex-col h-full">
      <div className="bg-ink-black text-studio-white px-4 py-3 border-b-2 border-ink-black flex items-center justify-between">
      <h2 className="font-label-mono-bold text-label-mono-bold uppercase flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px] text-electric-blue">notifications_active</span>
                                  Priority Alerts
                              </h2>
      <span className="bg-error text-studio-white mono-tag px-2 py-0.5">2 NEW</span>
      </div>
      <div className="p-4 flex flex-col gap-4 flex-grow overflow-y-auto max-h-[300px]">
      {/*Alert Item*/}
      <div className="border-l-4 border-error pl-3 py-1">
      <span className="mono-tag text-error block mb-1">10:42 AM</span>
      <p className="font-body-md text-body-md font-bold leading-tight">NEURAL_NINJAS requested urgent technical review.</p>
      </div>
      {/*Alert Item*/}
      <div className="border-l-4 border-electric-blue pl-3 py-1">
      <span className="mono-tag text-electric-blue block mb-1">09:15 AM</span>
      <p className="font-body-md text-body-md leading-tight">System broadcast: Lunch will be served at 12:30 PM in Hall B.</p>
      </div>
      {/*Alert Item*/}
      <div className="border-l-4 border-slate-tech pl-3 py-1 opacity-60">
      <span className="mono-tag text-slate-tech block mb-1">08:00 AM</span>
      <p className="font-body-md text-body-md leading-tight">Hackathon officially started. All repos unlocked.</p>
      </div>
      </div>
      </div>
      {/*Guidance Schedule*/}
      <div className="bg-studio-white hard-border hard-shadow flex flex-col">
      <div className="bg-electric-blue text-studio-white px-4 py-3 border-b-2 border-ink-black">
      <h2 className="font-label-mono-bold text-label-mono-bold uppercase flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                  Schedule
                              </h2>
      </div>
      <div className="p-0">
      {/*Schedule Item*/}
      <div className="flex border-b border-ink-black border-dashed last:border-b-0">
      <div className="w-20 bg-surface-variant flex flex-col items-center justify-center p-2 border-r border-ink-black">
      <span className="font-label-mono-bold text-label-mono-bold">11:00</span>
      <span className="mono-tag text-on-surface-variant">AM</span>
      </div>
      <div className="p-3">
      <p className="font-body-md text-body-md font-bold">Architecture Review</p>
      <p className="font-label-mono-sm text-label-mono-sm text-on-surface-variant mt-1">TEAM: QUANTUM_LEAP</p>
      </div>
      </div>
      {/*Schedule Item*/}
      <div className="flex border-b border-ink-black border-dashed last:border-b-0 bg-surface-tint/10">
      <div className="w-20 bg-electric-blue text-studio-white flex flex-col items-center justify-center p-2 border-r border-ink-black">
      <span className="font-label-mono-bold text-label-mono-bold">02:30</span>
      <span className="mono-tag opacity-80">PM</span>
      </div>
      <div className="p-3">
      <p className="font-body-md text-body-md font-bold">Pitch Deck Workshop</p>
      <p className="font-label-mono-sm text-label-mono-sm text-on-surface-variant mt-1">MAIN STAGE (ALL)</p>
      </div>
      </div>
      </div>
      </div>
      </section>
      </div>
      {/*Quick Docs Grid*/}
      <section className="mt-4 border-t-4 border-ink-black pt-stack-md">
      <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
      <span className="material-symbols-outlined text-ink-black">library_books</span>
                      Quick Resources
                  </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <a className="bg-studio-white p-4 hard-border hard-shadow hard-shadow-hover transition-all flex flex-col items-center justify-center text-center gap-2 group" href="/" >
      <div className="w-12 h-12 bg-slate-tech text-studio-white flex items-center justify-center rounded-none group-hover:bg-electric-blue transition-colors">
      <span className="material-symbols-outlined text-[24px]">api</span>
      </div>
      <span className="font-label-mono-bold text-label-mono-bold uppercase mt-2">API Docs</span>
      </a>
      <a className="bg-studio-white p-4 hard-border hard-shadow hard-shadow-hover transition-all flex flex-col items-center justify-center text-center gap-2 group" href="/" >
      <div className="w-12 h-12 bg-slate-tech text-studio-white flex items-center justify-center rounded-none group-hover:bg-electric-blue transition-colors">
      <span className="material-symbols-outlined text-[24px]">dns</span>
      </div>
      <span className="font-label-mono-bold text-label-mono-bold uppercase mt-2">DB Schema</span>
      </a>
      <a className="bg-studio-white p-4 hard-border hard-shadow hard-shadow-hover transition-all flex flex-col items-center justify-center text-center gap-2 group" href="/" >
      <div className="w-12 h-12 bg-slate-tech text-studio-white flex items-center justify-center rounded-none group-hover:bg-electric-blue transition-colors">
      <span className="material-symbols-outlined text-[24px]">gavel</span>
      </div>
      <span className="font-label-mono-bold text-label-mono-bold uppercase mt-2">Rules</span>
      </a>
      <a className="bg-studio-white p-4 hard-border hard-shadow hard-shadow-hover transition-all flex flex-col items-center justify-center text-center gap-2 group" href="/" >
      <div className="w-12 h-12 bg-slate-tech text-studio-white flex items-center justify-center rounded-none group-hover:bg-electric-blue transition-colors">
      <span className="material-symbols-outlined text-[24px]">support_agent</span>
      </div>
      <span className="font-label-mono-bold text-label-mono-bold uppercase mt-2">Organizer Contact</span>
      </a>
      </div>
      </section>
      </main>
      {/*Footer (Shared Component)*/}
      <footer className="bg-ink-black dark:bg-surface-container-highest w-full border-t-4 border-ink-black mt-16 z-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-12 gap-gutter max-w-[1280px] mx-auto">
      <div className="flex flex-col items-center md:items-start gap-2">
      <span className="font-headline-md text-headline-md text-electric-blue flex items-center gap-2">
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                          CodeSrijan
                      </span>
      <p className="font-body-md text-body-md text-surface dark:text-ink-black text-center md:text-left">© 2024 CodeSrijan. Built for the high-octane developer.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >Discord</a>
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >GitHub</a>
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >Twitter</a>
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >Sponsors</a>
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >Privacy</a>
      </div>
      </div>
      </footer>
    </div>
  );
}
