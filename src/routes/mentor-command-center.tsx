import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mentor-command-center")({
  component: Page5,
  head: () => ({
    meta: [
      { title: "Mentor Command Center | CodeSrijan" },
      { name: "description", content: "CodeSrijan mentor command center — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Mentor Command Center | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan mentor command center — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/mentor-command-center" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/mentor-command-center" }],
  }),
});

function Page5() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*Top Navigation (Generated from JSON)*/}
      <nav className="bg-surface border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full sticky top-0 z-50">
      <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto">
      <div className="font-display-lg text-headline-md font-extrabold text-ink-black">CodeSrijan</div>
      <div className="hidden md:flex gap-6 items-center">
      <a className="text-ink-black hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200 font-button-text text-button-text" href="/problems" >Problems</a>
      <a className="text-ink-black hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200 font-button-text text-button-text" href="/recruitment" >Recruitment</a>
      <a className="text-electric-blue border-b-2 border-electric-blue pb-1 font-button-text text-button-text" href="/leaderboard" >Leaderboard</a> {/*Active intent mismatch, but rendering tabs as requested*/}
      </div>
      <button className="bg-surface text-electric-blue font-button-text text-button-text px-4 py-2 border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform duration-200 active:translate-y-1 active:shadow-none">Register Now</button>
      </div>
      </nav>
      {/*Main Dashboard Content*/}
      <main className="flex-grow max-w-[1200px] mx-auto px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/*Header*/}
      <header className="col-span-12 mb-8">
      <h1 className="font-headline-lg text-headline-lg mb-2">Mentor Command Center</h1>
      <p className="font-body-lg text-body-lg text-text-muted">Overview of your assigned teams and schedule.</p>
      </header>
      {/*Left Column: Teams & Resources*/}
      <div className="col-span-12 md:col-span-8 flex flex-col gap-12">
      {/*Assigned Teams*/}
      <section>
      <h2 className="font-headline-md text-headline-md mb-6 border-b-2 border-ink-black pb-2 inline-block">Assigned Teams</h2>
      <div className="flex flex-col gap-6">
      {/*Team Card 1*/}
      <div className="neo-brutal-card p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start">
      <div>
      <h3 className="font-button-text text-button-text text-xl">Team Alpha Strike</h3>
      <span className="inline-block mt-2 font-label-caps text-label-caps bg-secondary-fixed text-on-secondary-fixed px-2 py-1 border border-ink-black">AI / ML Track</span>
      </div>
      <button className="neo-brutal-btn px-4 py-2 font-button-text text-button-text flex items-center gap-2">
      <span className="material-symbols-outlined">video_camera_front</span> Join Meet
                                  </button>
      </div>
      <div className="mt-4">
      <div className="flex justify-between mb-1 font-body-md text-body-md font-bold">
      <span>Progress</span>
      <span>75%</span>
      </div>
      <div className="w-full bg-surface-container h-4 border-2 border-ink-black">
      <div className="bg-electric-blue h-full" style={{ width: "75%" }}></div>
      </div>
      </div>
      <div className="mt-2 bg-error-container text-on-error-container p-3 border-2 border-ink-black flex items-start gap-2">
      <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
      <div>
      <p className="font-body-md text-body-md font-bold">Active Blocker:</p>
      <p className="font-body-md text-body-md">Struggling with GPU memory allocation in model training.</p>
      </div>
      </div>
      </div>
      {/*Team Card 2*/}
      <div className="neo-brutal-card p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start">
      <div>
      <h3 className="font-button-text text-button-text text-xl">Byte Me</h3>
      <span className="inline-block mt-2 font-label-caps text-label-caps bg-primary-fixed text-on-primary-fixed px-2 py-1 border border-ink-black">Web3 Track</span>
      </div>
      <button className="neo-brutal-btn px-4 py-2 font-button-text text-button-text flex items-center gap-2">
      <span className="material-symbols-outlined">video_camera_front</span> Join Meet
                                  </button>
      </div>
      <div className="mt-4">
      <div className="flex justify-between mb-1 font-body-md text-body-md font-bold">
      <span>Progress</span>
      <span>40%</span>
      </div>
      <div className="w-full bg-surface-container h-4 border-2 border-ink-black">
      <div className="bg-electric-blue h-full" style={{ width: "40%" }}></div>
      </div>
      </div>
      </div>
      </div>
      </section>
      {/*Technical Resources*/}
      <section>
      <h2 className="font-headline-md text-headline-md mb-6 border-b-2 border-ink-black pb-2 inline-block">Quick Docs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <a className="neo-brutal-card p-6 flex items-center gap-4 group cursor-pointer hover:bg-electric-blue hover:text-white transition-colors" href="/" >
      <span className="material-symbols-outlined text-4xl group-hover:text-white">api</span>
      <div>
      <h4 className="font-button-text text-button-text">API Guides</h4>
      <p className="font-body-md text-body-md opacity-80">Official sponsor endpoints</p>
      </div>
      </a>
      <a className="neo-brutal-card p-6 flex items-center gap-4 group cursor-pointer hover:bg-electric-blue hover:text-white transition-colors" href="/" >
      <span className="material-symbols-outlined text-4xl group-hover:text-white">rocket_launch</span>
      <div>
      <h4 className="font-button-text text-button-text">Deployment</h4>
      <p className="font-body-md text-body-md opacity-80">Vercel &amp; AWS setups</p>
      </div>
      </a>
      </div>
      </section>
      </div>
      {/*Right Column: Schedule & Feed*/}
      <div className="col-span-12 md:col-span-4 flex flex-col gap-12">
      {/*Mentorship Schedule*/}
      <section className="neo-brutal-card p-6 bg-surface-bright">
      <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
      <span className="material-symbols-outlined">calendar_month</span> Schedule
                      </h2>
      <div className="flex flex-col gap-4">
      <div className="border-l-4 border-electric-blue pl-4 py-2 relative">
      <div className="absolute w-3 h-3 bg-electric-blue border-2 border-ink-black rounded-full -left-[8px] top-4"></div>
      <p className="font-label-caps text-label-caps text-text-muted mb-1">10:00 AM - 10:30 AM</p>
      <p className="font-button-text text-button-text">Team Alpha Strike</p>
      <p className="font-body-md text-body-md text-sm">Architecture Review</p>
      </div>
      <div className="border-l-4 border-ink-black pl-4 py-2 relative opacity-60">
      <div className="absolute w-3 h-3 bg-ink-black rounded-full -left-[8px] top-4"></div>
      <p className="font-label-caps text-label-caps text-text-muted mb-1">11:30 AM - 12:00 PM</p>
      <p className="font-button-text text-button-text">Byte Me</p>
      <p className="font-body-md text-body-md text-sm">Smart Contract Audit</p>
      </div>
      </div>
      <button className="mt-6 w-full neo-brutal-btn px-4 py-3 font-button-text text-button-text text-center">Manage Calendar</button>
      </section>
      {/*Global Feed*/}
      <section className="neo-brutal-card p-6 bg-surface-container-low">
      <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
      <span className="material-symbols-outlined">notifications_active</span> Alerts
                      </h2>
      <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px]">
      <div className="bg-surface p-4 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <p className="font-label-caps text-label-caps text-electric-blue mb-1">Milestone Reached</p>
      <p className="font-body-md text-body-md"><strong>Team Alpha Strike</strong> just completed their initial MVP deployment.</p>
      <p className="font-label-caps text-label-caps text-xs text-text-muted mt-2">10 mins ago</p>
      </div>
      <div className="bg-error-container p-4 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-on-error-container">
      <p className="font-label-caps text-label-caps mb-1">Help Request</p>
      <p className="font-body-md text-body-md"><strong>Null Pointers</strong> need immediate assistance with MongoDB connection.</p>
      <p className="font-label-caps text-label-caps text-xs mt-2 opacity-80">25 mins ago</p>
      </div>
      </div>
      </section>
      </div>
      </main>
      {/*Footer (Generated from JSON)*/}
      <footer className="bg-ink-black w-full mt-16 border-t-4 border-electric-blue transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start px-margin-desktop py-12 gap-8 max-w-[1200px] mx-auto">
      <div>
      <div className="font-display-lg text-headline-md text-surface-bright mb-4">CodeSrijan</div>
      <p className="font-body-md text-body-md text-surface-bright">© 2026 CodeSrijan. Built for the community.</p>
      </div>
      <div className="grid grid-cols-2 md:flex md:flex-row gap-6 md:gap-8 font-body-md text-body-md">
      <a className="text-surface-variant hover:text-electric-blue transition-colors" href="/sponsors" >Sponsors</a>
      <a className="text-surface-variant hover:text-electric-blue transition-colors" href="/community" >Community</a>
      <a className="text-surface-variant hover:text-electric-blue transition-colors" href="/" >Discord</a>
      <a className="text-surface-variant hover:text-electric-blue transition-colors" href="/" >GitHub</a>
      <a className="text-surface-variant hover:text-electric-blue transition-colors" href="/privacy-policy" >Privacy Policy</a>
      <a className="text-surface-variant hover:text-electric-blue transition-colors" href="/code-of-conduct" >Code of Conduct</a>
      </div>
      </div>
      </footer>
    </div>
  );
}
