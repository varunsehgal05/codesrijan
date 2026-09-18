import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/recruitment")({
  component: Page10,
  head: () => ({
    meta: [
      { title: "Recruitment | CodeSrijan" },
      { name: "description", content: "CodeSrijan recruitment — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Recruitment | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan recruitment — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/recruitment" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/recruitment" }],
  }),
});

function Page10() {
  const { currentUser } = useAppStore();

  if (!currentUser) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      {/*Main Canvas*/}
      <main className="flex-grow max-w-[1200px] w-full mx-auto px-margin-desktop py-16 flex flex-col gap-12">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>

        {/*Header Section*/}
        <header className="flex flex-col gap-4 md:flex-row justify-between items-end border-b-4 border-ink-black pb-8">
          <div className="max-w-2xl">
            <h1 className="font-headline-lg text-headline-lg text-ink-black uppercase tracking-tight mb-2">Recruitment Marketplace</h1>
            <p className="font-body-lg text-body-lg text-text-muted">Find your squad. Build the next big thing. High-octane networking for developers, designers, and visionaries.</p>
          </div>
          {/*Toggle Find/Join*/}
          <div className="flex bg-surface-container-high neo-border p-1 w-full md:w-auto relative group neo-shadow-sm self-start md:self-end mt-4 md:mt-0">
            {/*Simple CSS active state toggle simulation for demonstration*/}
            <button onClick={() => alert("Currently browsing active squads.")} className="flex-1 md:w-40 px-4 py-2 font-button-text text-button-text text-on-primary bg-electric-blue neo-border neo-shadow transition-all z-10" id="toggle-find">Find a Squad</button>
            <button onClick={() => alert("Switching to Squad Builder...")} className="flex-1 md:w-40 px-4 py-2 font-button-text text-button-text text-ink-black bg-surface hover:bg-surface-variant transition-all border-y-2 border-r-2 border-transparent hover:border-ink-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-1" id="toggle-join">Join a Squad</button>
          </div>
        </header>
        <div className="flex flex-col md:flex-row gap-gutter relative">
          {/*Filters Sidebar*/}
          <aside className="w-full md:w-1/4 flex flex-col gap-8 sticky top-[120px] h-fit">
            <div className="bg-surface neo-border p-6 neo-shadow flex flex-col gap-6">
              <h2 className="font-headline-md text-headline-md text-ink-black flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>filter_alt</span>
                Filters
              </h2>
              {/*Roles Filter*/}
              <div className="flex flex-col gap-3">
                <h3 className="font-label-caps text-label-caps text-ink-black uppercase border-b-2 border-ink-black pb-1">Roles</h3>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input defaultChecked className="neo-checkbox sr-only" type="checkbox" />
                    <div className="w-5 h-5 neo-border bg-surface transition-colors flex items-center justify-center group-hover:bg-surface-variant">
                      <svg className="w-3 h-3 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" /></svg>
                    </div>
                  </div>
                  <span className="font-body-md text-body-md text-ink-black group-hover:text-electric-blue">Frontend</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input className="neo-checkbox sr-only" type="checkbox" />
                    <div className="w-5 h-5 neo-border bg-surface transition-colors flex items-center justify-center group-hover:bg-surface-variant">
                      <svg className="w-3 h-3 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" /></svg>
                    </div>
                  </div>
                  <span className="font-body-md text-body-md text-ink-black group-hover:text-electric-blue">Backend</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input className="neo-checkbox sr-only" type="checkbox" />
                    <div className="w-5 h-5 neo-border bg-surface transition-colors flex items-center justify-center group-hover:bg-surface-variant">
                      <svg className="w-3 h-3 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" /></svg>
                    </div>
                  </div>
                  <span className="font-body-md text-body-md text-ink-black group-hover:text-electric-blue">UI/UX Designer</span>
                </label>
              </div>
              {/*Tech Stack Filter*/}
              <div className="flex flex-col gap-3">
                <h3 className="font-label-caps text-label-caps text-ink-black uppercase border-b-2 border-ink-black pb-1">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="bg-electric-blue text-on-primary font-label-caps text-label-caps px-3 py-1 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">React</button>
                  <button className="bg-surface text-ink-black font-label-caps text-label-caps px-3 py-1 neo-border hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">Python</button>
                  <button className="bg-surface text-ink-black font-label-caps text-label-caps px-3 py-1 neo-border hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">Node.js</button>
                  <button className="bg-surface text-ink-black font-label-caps text-label-caps px-3 py-1 neo-border hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">Figma</button>
                </div>
              </div>
            </div>
          </aside>
          {/*Feed / Cards Area*/}
          <section className="w-full md:w-3/4 flex flex-col gap-8">
            {/*Search Bar*/}
            <div className="w-full relative">
              <input className="w-full bg-surface neo-border p-4 pl-12 font-body-lg text-body-lg text-ink-black focus:outline-none focus:border-electric-blue focus:shadow-[0_0_0_2px_#0035D5] transition-all placeholder:text-outline" placeholder="Search for skills, projects, or users..." type="text" />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-ink-black">search</span>
            </div>
            {/*Grid of Cards (Bento-ish)*/}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/*Card 1: Team Seeking Talent*/}
              <article className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4 relative group hover:-translate-y-1 transition-transform duration-300">
                {/*Status Badge*/}
                <div className="absolute -top-3 -right-3 bg-[#FFE100] text-ink-black font-label-caps text-label-caps px-3 py-1 neo-border neo-shadow z-10 rotate-3 group-hover:rotate-6 transition-transform">
                  Looking for 1 more
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 neo-border bg-surface-container-low shrink-0 overflow-hidden">
                    <img alt="" className="w-full h-full object-cover grayscale contrast-125" data-alt="A stylized geometric avatar in bold electric blue and ink black, representing a tech team. Flat vector art style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbpfqme1Ql_RzNA9w5XU01gjamFflJsE8OEP36Ae7iNrriWN9vD8vktlBUGxYAzHMFEttU_qsTNR1MhwgxroILGz1A1CWzQ_hXqVcgjRD8ik9g-BVaq2E8M5AR0W4dhr1NfeDWNkE0QLo0Yf7BzRjw4NbJB626DJRuTgxisMC2k8GaLFhrmztOi5lZG01BQxPjxkqtqp2XHMLHD9t45yY04VTymblvwOcrXWvgGMVSzwzOJ9yLEZ1u" />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-[24px] leading-tight text-ink-black uppercase mb-1">Project Neo-Web</h3>
                    <p className="font-body-md text-body-md text-text-muted">Building a decentralized AI agent hub.</p>
                  </div>
                </div>
                <div className="h-0.5 w-full bg-ink-black my-2"></div>
                <div className="flex-grow">
                  <p className="font-label-caps text-label-caps text-ink-black mb-2">Seeking:</p>
                  <ul className="flex flex-col gap-2 font-body-md text-body-md text-ink-black">
                    <li className="flex items-center gap-2"><div className="w-2 h-2 bg-electric-blue"></div> Backend Eng (Python/Go)</li>
                  </ul>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  <span className="font-label-caps text-[12px] bg-canvas-gray neo-border px-2 py-0.5">AI</span>
                  <span className="font-label-caps text-[12px] bg-canvas-gray neo-border px-2 py-0.5">Web3</span>
                </div>
                <button onClick={() => alert("Your application has been successfully routed to Project Neo-Web!")} className="mt-4 w-full bg-electric-blue text-on-primary neo-border py-2 font-button-text text-button-text hover:bg-primary-fixed-dim hover:text-ink-black transition-colors">Apply to Join</button>
              </article>
              {/*Card 2: Hacker Seeking Team*/}
              <article className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4 relative group hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 neo-border bg-surface-container-low shrink-0 overflow-hidden rounded-full">
                    <img alt="" className="w-full h-full object-cover" data-alt="A high-contrast black and white portrait photo of a young developer wearing glasses, set against a bright yellow background. Neo-brutalist aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrUKTXMUPbWQxPQt5f6SMtD95MULUhQjOF2FLyW9hbDgQGbQGbbsaZiErEc6lS5IwmAflNZUdCqFXbNTqFRJwWxmelI_fVUFMl7u-u00l3tAb0HfUamsdOaT8yAUqJ4nWBUlzFmnZR1PTjoBwx3nCH0Vkyu8Kb10OqSGc_fbRNNTxpNGURh-uqHXB4o6radTvS54Q3LhBCUNzw80B68tUcaHF8iz5wbfONbbvX93-bSSOZ1zZoezAN" />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-[24px] leading-tight text-ink-black uppercase mb-1">Alex Chen</h3>
                    <p className="font-body-md text-body-md text-text-muted">Full-stack React wizard.</p>
                  </div>
                </div>
                <div className="h-0.5 w-full bg-ink-black my-2"></div>
                <div className="flex-grow">
                  <p className="font-body-md text-body-md text-ink-black italic">"Looking for a fast-paced team building consumer tech. I build fast and ship faster."</p>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  <span className="font-label-caps text-[12px] bg-canvas-gray neo-border px-2 py-0.5">React</span>
                  <span className="font-label-caps text-[12px] bg-canvas-gray neo-border px-2 py-0.5">Tailwind</span>
                  <span className="font-label-caps text-[12px] bg-canvas-gray neo-border px-2 py-0.5">Node.js</span>
                </div>
                <button onClick={() => alert("Invitation successfully sent to Alex Chen. They will be notified via email.")} className="mt-4 w-full bg-surface text-ink-black neo-border py-2 font-button-text text-button-text hover:bg-electric-blue hover:text-white transition-colors">Invite to Squad</button>
              </article>
              {/*Card 3: Team Seeking Talent (Spanning)*/}
              <article className="bg-electric-blue text-white neo-border neo-shadow p-6 flex flex-col gap-4 relative group hover:-translate-y-1 transition-transform duration-300 lg:col-span-2">
                {/*Status Badge*/}
                <div className="absolute -top-3 -right-3 bg-[#00E5FF] text-ink-black font-label-caps text-label-caps px-3 py-1 neo-border neo-shadow z-10 -rotate-2 group-hover:-rotate-4 transition-transform">
                  URGENT: Hackathon Tomorrow
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 neo-border bg-ink-black shrink-0 overflow-hidden flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                    </div>
                    <div>
                      <h3 className="font-headline-md text-[32px] leading-tight text-white uppercase mb-1">Syntax Error</h3>
                      <p className="font-body-md text-body-md text-primary-fixed-dim">We broke production, but we're winning this hackathon.</p>
                    </div>
                  </div>
                  <div className="bg-ink-black p-4 neo-border w-full md:w-auto">
                    <p className="font-label-caps text-label-caps text-primary-fixed-dim mb-1">Seeking:</p>
                    <p className="font-button-text text-[20px] text-white">UI/UX Designer</p>
                  </div>
                </div>
                <div className="h-0.5 w-full bg-ink-black my-2"></div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <span className="font-label-caps text-[12px] bg-ink-black text-white neo-border px-2 py-0.5 border-white">Figma</span>
                    <span className="font-label-caps text-[12px] bg-ink-black text-white neo-border px-2 py-0.5 border-white">Prototyping</span>
                  </div>
                  <button onClick={() => { alert("Welcome to Syntax Error! Rerouting to your new squad workspace."); window.location.href = '/workspace'; }} className="w-full md:w-auto bg-surface text-ink-black neo-border py-3 px-8 font-button-text text-button-text hover:bg-ink-black hover:text-white hover:border-white transition-colors neo-btn shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">Join Squad NOW</button>
                </div>
              </article>
            </div>
            {/*Load More*/}
            <div className="flex justify-center mt-8">
              <button className="bg-surface text-ink-black neo-border px-8 py-3 font-button-text text-button-text hover:bg-surface-variant transition-colors flex items-center gap-2">
                Load More Entries
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
          </section>
        </div>
      </main>
      {/*Footer*/}
    </div>
  );
}
