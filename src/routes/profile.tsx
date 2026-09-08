import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
  component: Page7,
  head: () => ({
    meta: [
      { title: "Profile | CodeSrijan" },
      { name: "description", content: "CodeSrijan profile — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Profile | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan profile — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/profile" }],
  }),
});

function Page7() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      <nav className="bg-surface dark:bg-ink-black w-full sticky top-0 z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto border-b-2 border-ink-black">
      <div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">
                  CodeSrijan
              </div>
      <div className="hidden md:flex items-center gap-8">
      <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/problems" >Problems</a>
      <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/recruitment" >Recruitment</a>
      <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/leaderboard" >Leaderboard</a>
      </div>
      <button className="bg-electric-blue text-on-primary font-button-text text-button-text px-6 py-3 border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-200">
                  Register Now
              </button>
      </nav>
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-margin-desktop py-16 flex flex-col gap-16 md:gap-24">
      {/*Profile Hero*/}
      <section className="flex flex-col md:flex-row items-start gap-8 bg-surface-container-lowest border-2 border-ink-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="shrink-0 relative">
      <img className="w-40 h-40 object-cover border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-alt="A striking neo-brutalist digital portrait of a young tech wizard. The avatar features a stylized, vibrant, vector-art style face with electric blue highlights against a crisp white background. Thick black outlines define the features, exuding a modern, high-octane hacker aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuARxT0_L0dJOF7V_0PDgEWc39tPJBTMiHfgT7ctM62RX9I9WOMp4cLOdOqBoEfDMV6Iio00ydGtvtNlAiHtKy0YPlPK_tl-jabKvUkwbo2AMiPO9NiR9hmMpl1wnQzhEqAAqt0I6rthhXp0C8YUOCwNJNqlD0XjpxX3sG4nPyqc9kWAcPaJiFLt-TDnhFuOu6-nfQDF_N1LIHKo6MJLkATYN0EjfEpa57agOCPSMiqRnYIhHUWyAyDT"/>
      </div>
      <div className="flex flex-col gap-4">
      <div>
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-ink-black tracking-tight">Alex Chen</h1>
      <p className="font-body-lg text-body-lg text-text-muted mt-2 max-w-2xl">Full-stack wizard building the future. Focused on decentralized web technologies and high-performance computing.</p>
      </div>
      <div className="flex items-center gap-2 text-ink-black font-label-caps text-label-caps mt-2">
      <span className="material-symbols-outlined" data-icon="location_on" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
      <span>San Francisco, CA</span>
      </div>
      {/*Tech Stack Grid*/}
      <div className="flex flex-wrap gap-3 mt-4">
      <span className="px-4 py-2 bg-yellow-300 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-label-caps text-label-caps text-ink-black uppercase">React</span>
      <span className="px-4 py-2 bg-orange-400 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-label-caps text-label-caps text-ink-black uppercase">Rust</span>
      <span className="px-4 py-2 bg-purple-400 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-label-caps text-label-caps text-ink-black uppercase">WebAssembly</span>
      <span className="px-4 py-2 bg-cyan-400 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-label-caps text-label-caps text-ink-black uppercase">Tailwind</span>
      </div>
      </div>
      </section>
      {/*Achievement Gallery*/}
      <section>
      <h2 className="font-headline-md text-headline-md text-ink-black mb-8 border-b-4 border-ink-black inline-block pb-2">Achievements</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/*Badge 1*/}
      <div className="bg-surface-container-lowest border-2 border-ink-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[4px] hover:-translate-x-[4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col items-center text-center gap-4 group cursor-pointer">
      <div className="w-24 h-24 bg-electric-blue border-2 border-ink-black rounded-full flex items-center justify-center text-on-primary group-hover:bg-yellow-400 group-hover:text-ink-black transition-colors">
      <span className="material-symbols-outlined text-4xl" data-icon="workspace_premium" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
      </div>
      <h3 className="font-button-text text-button-text text-ink-black uppercase tracking-wider">Top 10 Finalist</h3>
      <p className="font-body-md text-body-md text-text-muted">Global Hackathon 2023</p>
      </div>
      {/*Badge 2*/}
      <div className="bg-surface-container-lowest border-2 border-ink-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[4px] hover:-translate-x-[4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col items-center text-center gap-4 group cursor-pointer">
      <div className="w-24 h-24 bg-ink-black border-2 border-ink-black rounded-full flex items-center justify-center text-surface-bright group-hover:bg-cyan-400 group-hover:text-ink-black transition-colors">
      <span className="material-symbols-outlined text-4xl" data-icon="shield" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
      </div>
      <h3 className="font-button-text text-button-text text-ink-black uppercase tracking-wider">Security Specialist</h3>
      <p className="font-body-md text-body-md text-text-muted">DefCon Qualifier</p>
      </div>
      {/*Badge 3*/}
      <div className="bg-surface-container-lowest border-2 border-ink-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[4px] hover:-translate-x-[4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col items-center text-center gap-4 group cursor-pointer">
      <div className="w-24 h-24 bg-surface border-2 border-ink-black rounded-full flex items-center justify-center text-ink-black group-hover:bg-electric-blue group-hover:text-on-primary transition-colors">
      <span className="material-symbols-outlined text-4xl" data-icon="code_blocks" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>code_blocks</span>
      </div>
      <h3 className="font-button-text text-button-text text-ink-black uppercase tracking-wider">Open Source Contributor</h3>
      <p className="font-body-md text-body-md text-text-muted">100+ Merged PRs</p>
      </div>
      </div>
      </section>
      {/*Project History*/}
      <section>
      <h2 className="font-headline-md text-headline-md text-ink-black mb-8 border-b-4 border-ink-black inline-block pb-2">Hackathon History</h2>
      <div className="flex flex-col border-2 border-ink-black bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/*History Item 1*/}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b-2 border-ink-black hover:bg-canvas-gray transition-colors gap-4">
      <div className="flex items-center gap-4">
      <div className="w-4 h-4 bg-ink-black shrink-0"></div>
      <div>
      <h4 className="font-button-text text-button-text text-ink-black">EthGlobal Paris</h4>
      <p className="font-body-md text-body-md text-text-muted">Built a decentralized identity verifier.</p>
      </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
      <span className="px-3 py-1 bg-electric-blue text-on-primary font-label-caps text-label-caps border-2 border-ink-black">1st Place</span>
      <a className="text-ink-black hover:text-electric-blue transition-colors" href="/" title="View Repo">
      <span className="material-symbols-outlined text-3xl" data-icon="link" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
      </a>
      </div>
      </div>
      {/*History Item 2*/}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b-2 border-ink-black hover:bg-canvas-gray transition-colors gap-4">
      <div className="flex items-center gap-4">
      <div className="w-4 h-4 bg-ink-black shrink-0"></div>
      <div>
      <h4 className="font-button-text text-button-text text-ink-black">MIT Reality Hack</h4>
      <p className="font-body-md text-body-md text-text-muted">AR navigation tool for visually impaired.</p>
      </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
      <span className="px-3 py-1 bg-yellow-400 text-ink-black font-label-caps text-label-caps border-2 border-ink-black">Best UI/UX</span>
      <a className="text-ink-black hover:text-electric-blue transition-colors" href="/" title="View Repo">
      <span className="material-symbols-outlined text-3xl" data-icon="link" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
      </a>
      </div>
      </div>
      {/*History Item 3*/}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-canvas-gray transition-colors gap-4">
      <div className="flex items-center gap-4">
      <div className="w-4 h-4 bg-ink-black shrink-0"></div>
      <div>
      <h4 className="font-button-text text-button-text text-ink-black">Stanford TreeHacks</h4>
      <p className="font-body-md text-body-md text-text-muted">AI-driven climate predictive model.</p>
      </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
      <span className="px-3 py-1 bg-surface-container-high text-ink-black font-label-caps text-label-caps border-2 border-ink-black">Participant</span>
      <a className="text-ink-black hover:text-electric-blue transition-colors" href="/" title="View Repo">
      <span className="material-symbols-outlined text-3xl" data-icon="link" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
      </a>
      </div>
      </div>
      </div>
      </section>
      </main>
      {/*Footer*/}
      <footer className="bg-ink-black dark:bg-surface-container-lowest w-full mt-16 border-t-4 border-electric-blue flex flex-col md:flex-row justify-between items-start px-margin-desktop py-12 gap-8">
      <div className="font-display-lg text-headline-md text-surface-bright">
                  CodeSrijan
              </div>
      <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
      <a className="font-body-md text-body-md text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Sponsors</a>
      <a className="font-body-md text-body-md text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Community</a>
      <a className="font-body-md text-body-md text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Discord</a>
      <a className="font-body-md text-body-md text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >GitHub</a>
      <a className="font-body-md text-body-md text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Privacy Policy</a>
      <a className="font-body-md text-body-md text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors duration-300" href="/" >Code of Conduct</a>
      </div>
      <p className="font-body-md text-body-md text-surface-variant mt-4">
                      © 2024 CodeSrijan. Built for the community.
                  </p>
      </div>
      </footer>
    </div>
  );
}
