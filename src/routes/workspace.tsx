import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace")({
  component: Page4,
  head: () => ({
    meta: [
      { title: "Team Workspace | CodeSrijan" },
      { name: "description", content: "CodeSrijan team workspace — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Team Workspace | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan team workspace — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/workspace" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/workspace" }],
  }),
});

function Page4() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      <nav className="bg-surface dark:bg-ink-black w-full border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-margin-desktop py-4 max-w-[1200px] mx-auto">
      <div className="font-headline-md text-headline-md font-black text-ink-black dark:text-surface uppercase tracking-tight">
                      CodeSrijan
                  </div>
      <div className="hidden md:flex gap-gutter items-center">
      <a className="text-ink-black dark:text-surface font-body-md text-body-md hover:-translate-y-0.5 hover:translate-x-0.5 transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none" href="/problems" >Problems</a>
      <a className="text-ink-black dark:text-surface font-body-md text-body-md hover:-translate-y-0.5 hover:translate-x-0.5 transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none" href="/recruitment" >Recruitment</a>
      <a className="text-ink-black dark:text-surface font-body-md text-body-md hover:-translate-y-0.5 hover:translate-x-0.5 transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none" href="/leaderboard" >Leaderboard</a>
      </div>
      <button className="bg-electric-blue text-on-primary font-body-lg text-body-lg border-2 border-ink-black px-6 py-2 neo-shadow neo-shadow-hover neo-shadow-active transition-all">
                      Register Now
                  </button>
      </div>
      </nav>
      {/*Main Workspace*/}
      <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-12 flex flex-col gap-12">
      {/*Mission Control Header*/}
      <header className="bg-studio-white border-2 border-ink-black p-6 md:p-8 neo-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex flex-col gap-2">
      <span className="font-label-mono-bold text-label-mono-bold text-electric-blue uppercase tracking-widest">[ ACTIVE CHALLENGE ]</span>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black">Quantum Encryption API</h1>
      </div>
      <div className="bg-ink-black text-electric-blue border-2 border-electric-blue px-6 py-4 flex flex-col items-center neo-shadow">
      <span className="font-label-mono-sm text-label-mono-sm uppercase text-studio-white mb-1">T-Minus</span>
      <div className="font-headline-md text-headline-md font-black tracking-widest" id="countdown-timer">
                          14:22:09
                      </div>
      </div>
      </header>
      {/*Workspace Grid*/}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/*Left Sidebar (Roster & Chat)*/}
      <div className="flex flex-col gap-8 lg:col-span-1">
      {/*Squad Roster*/}
      <section className="bg-studio-white border-2 border-ink-black neo-shadow">
      <div className="bg-electric-blue border-b-2 border-ink-black p-3">
      <h2 className="font-label-mono-bold text-label-mono-bold text-on-primary uppercase tracking-wide flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">group</span>
                                  Squad Roster
                              </h2>
      </div>
      <div className="p-4 flex flex-col gap-3">
      {/*Member 1*/}
      <div className="flex items-center gap-3">
      <div className="w-10 h-10 border-2 border-ink-black rounded-none overflow-hidden relative">
      <img className="w-full h-full object-cover" data-alt="A neo-brutalist styled avatar portrait of a developer with short dark hair, wearing geometric neon glasses. High contrast lighting, stark ink black shadows, vibrant electric blue background. Technical, gritty, modern aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmLV94zXN6lsCPoRuljUsVUQ05Z0sITcpj0XKIjYACAwSs0H0tes5cokJk92AFNBxK_pJS7XebRXUl2iuYphgsZC_Np6Zx6NslhymrVRzEyWVUC7yFdYYAOipzB5-4yIoGDm9Tyad_-GtgWfof31Zw4e5tOZLDDDZC9xBHrydKQ-LPOAFov9t2CtEZakjU1Jjtbv1eWRYfWCMQkw2JtmWMDZD0jZDIYi58SivWQ7FfPnprmsQuWTQt"/>
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FF00] border-t-2 border-l-2 border-ink-black"></div>
      </div>
      <div className="flex flex-col">
      <span className="font-body-md text-body-md font-bold text-ink-black leading-tight">Alex M.</span>
      <span className="font-label-mono-sm text-label-mono-sm text-slate-tech">Backend</span>
      </div>
      </div>
      {/*Member 2*/}
      <div className="flex items-center gap-3">
      <div className="w-10 h-10 border-2 border-ink-black rounded-none overflow-hidden relative">
      <img className="w-full h-full object-cover" data-alt="A neo-brutalist styled avatar portrait of a developer with a shaved head and facial hair, looking intensely at the camera. High contrast lighting, stark ink black shadows, vibrant warning yellow background. Technical, gritty, modern aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0PSrRzzcPFJozIBgY0sK9w4xLVwyKKJ29fP5a_jgc7-4hIh1Q3VCd0tcWJ8__74WSmaQpOr_JTKhCISw1WblDeyHxO3Ip-OzEoVdaBwhKlZfkmpPMupZkopd_DyOgu8-oGbqvGPm0oTQgdWqd2cEE_RVKhLCuiIH8v8mV0n76Lui0fAi6AuOoF62JkFN9H0TpWyHvnJDD6IsI5p6Dbr2mr5Q6IgxKe2XCWH1r-bNKs0Gztu2ZnzEw"/>
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#FFA500] border-t-2 border-l-2 border-ink-black"></div>
      </div>
      <div className="flex flex-col">
      <span className="font-body-md text-body-md font-bold text-ink-black leading-tight">Sam T.</span>
      <span className="font-label-mono-sm text-label-mono-sm text-slate-tech">Frontend</span>
      </div>
      </div>
      {/*Member 3*/}
      <div className="flex items-center gap-3">
      <div className="w-10 h-10 border-2 border-ink-black rounded-none overflow-hidden relative bg-surface-dim flex items-center justify-center">
      <span className="material-symbols-outlined text-outline">person</span>
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-error border-t-2 border-l-2 border-ink-black"></div>
      </div>
      <div className="flex flex-col">
      <span className="font-body-md text-body-md font-bold text-ink-black leading-tight">J. Doe</span>
      <span className="font-label-mono-sm text-label-mono-sm text-slate-tech">DevOps (AFK)</span>
      </div>
      </div>
      </div>
      </section>
      {/*Terminal Chat*/}
      <section className="bg-ink-black border-2 border-ink-black neo-shadow flex-grow flex flex-col max-h-[400px]">
      <div className="bg-slate-tech border-b-2 border-ink-black p-3 flex justify-between items-center">
      <h2 className="font-label-mono-bold text-label-mono-bold text-studio-white uppercase tracking-wide flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">terminal</span>
                                  Commlink
                              </h2>
      <div className="flex gap-1">
      <div className="w-3 h-3 border-2 border-ink-black bg-error"></div>
      <div className="w-3 h-3 border-2 border-ink-black bg-[#FFA500]"></div>
      <div className="w-3 h-3 border-2 border-ink-black bg-[#00FF00]"></div>
      </div>
      </div>
      <div className="p-4 flex-grow overflow-y-auto font-label-mono-sm text-label-mono-sm text-[#00FF00] flex flex-col gap-2">
      <p>&gt; System initialized.</p>
      <p>&gt; <span className="text-electric-blue">Alex M:</span> pushed fix for auth routing.</p>
      <p>&gt; <span className="text-[#FFA500]">Sam T:</span> checking deploy logs now.</p>
      <p>&gt; <span className="text-error">CRITICAL:</span> Build failed on worker 3.</p>
      <p>&gt; <span className="text-[#FFA500]">Sam T:</span> nvm, found the typo in the env var.</p>
      <p className="mt-auto animate-pulse">_</p>
      </div>
      <div className="border-t-2 border-ink-black p-2 bg-ink-black flex">
      <span className="text-[#00FF00] font-label-mono-bold text-label-mono-bold p-2">&gt;</span>
      <input className="bg-transparent border-none outline-none text-[#00FF00] font-label-mono-sm text-label-mono-sm w-full focus:ring-0 placeholder:text-outline" placeholder="Type message..." type="text"/>
      </div>
      </section>
      </div>
      {/*Kanban Board*/}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/*Column: Backlog*/}
      <div className="flex flex-col gap-4">
      <div className="border-b-4 border-ink-black pb-2 flex justify-between items-center">
      <h3 className="font-headline-md text-headline-md font-bold text-ink-black uppercase">Backlog</h3>
      <span className="bg-surface-variant border-2 border-ink-black px-2 py-1 font-label-mono-bold text-label-mono-bold">4</span>
      </div>
      <div className="flex flex-col gap-4">
      {/*Card*/}
      <div className="bg-studio-white border-2 border-ink-black p-4 neo-shadow cursor-pointer hover:bg-surface-dim transition-colors">
      <div className="flex justify-between items-start mb-2">
      <span className="border border-ink-black px-2 py-0.5 font-label-mono-sm text-label-mono-sm uppercase text-slate-tech bg-surface-container">API</span>
      <span className="font-label-mono-sm text-label-mono-sm text-ink-black">#102</span>
      </div>
      <h4 className="font-body-md text-body-md font-bold text-ink-black mb-2 leading-tight">Design Rate Limiter Middleware</h4>
      <div className="flex justify-between items-center mt-4">
      <div className="w-6 h-6 border-2 border-ink-black bg-surface-variant"></div>
      <span className="material-symbols-outlined text-outline">more_horiz</span>
      </div>
      </div>
      {/*Card*/}
      <div className="bg-studio-white border-2 border-ink-black p-4 neo-shadow cursor-pointer hover:bg-surface-dim transition-colors">
      <div className="flex justify-between items-start mb-2">
      <span className="border border-ink-black px-2 py-0.5 font-label-mono-sm text-label-mono-sm uppercase text-slate-tech bg-surface-container">DB</span>
      <span className="font-label-mono-sm text-label-mono-sm text-ink-black">#105</span>
      </div>
      <h4 className="font-body-md text-body-md font-bold text-ink-black mb-2 leading-tight">Migrate schema for user sessions</h4>
      <div className="flex justify-between items-center mt-4">
      <div className="w-6 h-6 border-2 border-ink-black bg-surface-variant"></div>
      <span className="material-symbols-outlined text-outline">more_horiz</span>
      </div>
      </div>
      </div>
      </div>
      {/*Column: In Progress*/}
      <div className="flex flex-col gap-4">
      <div className="border-b-4 border-electric-blue pb-2 flex justify-between items-center">
      <h3 className="font-headline-md text-headline-md font-bold text-electric-blue uppercase">In Progress</h3>
      <span className="bg-electric-blue text-on-primary border-2 border-ink-black px-2 py-1 font-label-mono-bold text-label-mono-bold">2</span>
      </div>
      <div className="flex flex-col gap-4">
      {/*Card*/}
      <div className="bg-studio-white border-2 border-electric-blue p-4 neo-shadow-hover cursor-pointer border-l-8 transition-transform transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-2">
      <span className="border border-ink-black px-2 py-0.5 font-label-mono-sm text-label-mono-sm uppercase text-studio-white bg-error">CRITICAL</span>
      <span className="font-label-mono-sm text-label-mono-sm text-ink-black">#099</span>
      </div>
      <h4 className="font-body-md text-body-md font-bold text-ink-black mb-2 leading-tight">Implement Quantum Entanglement Auth</h4>
      <div className="w-full bg-surface-container h-3 border-2 border-ink-black mt-2 mb-4">
      <div className="bg-electric-blue h-full w-[60%] border-r-2 border-ink-black"></div>
      </div>
      <div className="flex justify-between items-center mt-2">
      <div className="w-6 h-6 border-2 border-ink-black bg-electric-blue rounded-full"></div>
      <span className="material-symbols-outlined text-ink-black">bolt</span>
      </div>
      </div>
      </div>
      </div>
      {/*Column: Testing*/}
      <div className="flex flex-col gap-4">
      <div className="border-b-4 border-[#FFA500] pb-2 flex justify-between items-center">
      <h3 className="font-headline-md text-headline-md font-bold text-ink-black uppercase">Testing</h3>
      <span className="bg-[#FFA500] border-2 border-ink-black px-2 py-1 font-label-mono-bold text-label-mono-bold">1</span>
      </div>
      <div className="flex flex-col gap-4">
      {/*Card*/}
      <div className="bg-studio-white border-2 border-ink-black p-4 neo-shadow cursor-pointer hover:bg-surface-dim transition-colors">
      <div className="flex justify-between items-start mb-2">
      <span className="border border-ink-black px-2 py-0.5 font-label-mono-sm text-label-mono-sm uppercase text-slate-tech bg-[#FFA500]">QA</span>
      <span className="font-label-mono-sm text-label-mono-sm text-ink-black">#095</span>
      </div>
      <h4 className="font-body-md text-body-md font-bold text-ink-black mb-2 leading-tight">Load test WebSocket connections</h4>
      <div className="flex justify-between items-center mt-4">
      <div className="w-6 h-6 border-2 border-ink-black bg-surface-variant overflow-hidden">
      <img className="w-full h-full object-cover" data-alt="A small neo-brutalist avatar portrait of a developer. Bright flat colors, stark black borders, high contrast. Technical aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKfoAaq3lTHCdUW6ai8XcapmVG62m6rWyzaYoY83NXtPc9AsTLiz67k2kEKTNjJ79pNGuCJKpPUwtE5YxvUL0FsBTWVesJW2HzewQQHIh70FHeHU_7P0ZHBOnTZ_N9YgL1QEtpwcPM7mBffc3MITqTs8z8OSqgs7xtKQ5rudiDHPwym-b_qIuyI6v3t93JbhYF1zFSSNyQy2Giz8j_znfhg_ybfbbRTaMdc9od0nIRnbwUEwddD4gJ"/>
      </div>
      <span className="material-symbols-outlined text-outline">science</span>
      </div>
      </div>
      </div>
      </div>
      </div>
      </div>
      </main>
      {/*Footer*/}
      <footer className="bg-ink-black dark:bg-surface-container-highest w-full border-t-4 border-ink-black mt-16">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-12 gap-gutter max-w-[1200px] mx-auto">
      <div className="font-headline-md text-headline-md text-electric-blue uppercase tracking-tight">
                      CodeSrijan
                  </div>
      <div className="flex gap-gutter flex-wrap justify-center">
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >Discord</a>
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >GitHub</a>
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >Twitter</a>
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >Sponsors</a>
      <a className="font-body-md text-body-md text-surface-variant dark:text-on-surface-variant hover:text-electric-blue transition-colors" href="/" >Privacy</a>
      </div>
      <div className="font-body-md text-body-md text-surface dark:text-ink-black text-center md:text-right">
                      © 2024 CodeSrijan. Built for the high-octane developer.
                  </div>
      </div>
      </footer>

    </div>
  );
}
