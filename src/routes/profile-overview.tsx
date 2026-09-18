import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile-overview")({
  component: Page8,
  head: () => ({
    meta: [
      { title: "Profile Overview | CodeSrijan" },
      { name: "description", content: "CodeSrijan profile overview — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Profile Overview | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan profile overview — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/profile-overview" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/profile-overview" }],
  }),
});

function Page8() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar Component*/}
<main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg z-10 relative">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>
    
        {/*Hero Profile Section*/}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/*Avatar & Primary Info*/}
          <div className="lg:col-span-4 flex flex-col gap-stack-md bg-studio-white border-2 border-ink-black p-6 neo-shadow">
            <div className="w-32 h-32 border-2 border-ink-black neo-shadow-lg mx-auto bg-surface-variant overflow-hidden mb-4">
              <img alt="Alex Chen Avatar" className="w-full h-full object-cover" data-alt="A high-contrast, graphic illustration of a young male developer in a neo-brutalist style. He has short messy dark hair, thick black-rimmed glasses, and is looking slightly off-camera with a determined expression. The portrait uses heavy black outlines, stark shadows, and flat colors, primarily relying on studio white and electric blue. The background is a stark, textured light gray." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNt5LmVfZwQth-41U-u_jPGWZ79Tw4nOcVEEl6EUsMPxKbSg-n0CW-cnGybqk8aQ3SdjRM4VGdpYZRWX6wWVoXH37QXLvEm7LqTU9h2IftHTJRdAymh-MI5PEgaHpwX-r8sKTSgVkfivQ1lzIVGfERCDhOIhXSLse7fHfY8tizodAzWV1iAIaq8sgjbIS0zyIYEF7HH1YqQCiJxew-dmrrTLHAGmo3RpFFgqwpiX3tPr19MTZI2CqX" />
            </div>
            <div className="text-center flex flex-col gap-unit">
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-ink-black font-black uppercase">Alex Chen</h1>
              <p className="font-label-mono-bold text-label-mono-bold text-slate-tech tracking-wider">[ @achen_codes ]</p>
            </div>
            <div className="border-t-2 border-ink-black mt-4 pt-4 flex flex-col gap-unit">
              <p className="font-body-md text-body-md text-on-surface-variant font-medium">Full-stack breaker of things. Building fast, breaking faster. ☕</p>
            </div>
            <div className="flex gap-2 justify-center mt-2">
              <a className="p-2 border-2 border-ink-black bg-surface hover:bg-electric-blue hover:text-studio-white transition-colors" href="/" >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>code</span>
              </a>
              <a className="p-2 border-2 border-ink-black bg-surface hover:bg-electric-blue hover:text-studio-white transition-colors" href="/" >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
              </a>
            </div>
          </div>
          {/*Stats & Tech Stack*/}
          <div className="lg:col-span-8 flex flex-col gap-stack-md">
            {/*Stats Grid*/}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-studio-white border-2 border-ink-black p-4 neo-shadow flex flex-col items-center justify-center">
                <span className="font-headline-md text-headline-md text-electric-blue font-black">12</span>
                <span className="font-label-mono-sm text-label-mono-sm text-slate-tech mt-1 uppercase">Hackathons</span>
              </div>
              <div className="bg-studio-white border-2 border-ink-black p-4 neo-shadow flex flex-col items-center justify-center">
                <span className="font-headline-md text-headline-md text-electric-blue font-black">4</span>
                <span className="font-label-mono-sm text-label-mono-sm text-slate-tech mt-1 uppercase">Podiums</span>
              </div>
              <div className="bg-studio-white border-2 border-ink-black p-4 neo-shadow flex flex-col items-center justify-center">
                <span className="font-headline-md text-headline-md text-electric-blue font-black">890</span>
                <span className="font-label-mono-sm text-label-mono-sm text-slate-tech mt-1 uppercase">Commits</span>
              </div>
              <div className="bg-studio-white border-2 border-ink-black p-4 neo-shadow flex flex-col items-center justify-center">
                <span className="font-headline-md text-headline-md text-electric-blue font-black">2.4k</span>
                <span className="font-label-mono-sm text-label-mono-sm text-slate-tech mt-1 uppercase">Pts</span>
              </div>
            </div>
            {/*Tech Stack Cloud*/}
            <div className="bg-studio-white border-2 border-ink-black flex flex-col h-full neo-shadow">
              <div className="bg-slate-tech text-studio-white px-4 py-2 border-b-2 border-ink-black">
                <h2 className="font-label-mono-bold text-label-mono-bold uppercase tracking-widest">[ CURRENT_STACK ]</h2>
              </div>
              <div className="p-6 flex flex-wrap gap-3">
                <span className="px-3 py-1 border-2 border-ink-black bg-electric-blue text-studio-white font-label-mono-bold text-label-mono-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-default">React</span>
                <span className="px-3 py-1 border-2 border-ink-black bg-surface text-ink-black font-label-mono-bold text-label-mono-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-default">TypeScript</span>
                <span className="px-3 py-1 border-2 border-ink-black bg-electric-blue text-studio-white font-label-mono-bold text-label-mono-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-default">Rust</span>
                <span className="px-3 py-1 border-2 border-ink-black bg-surface text-ink-black font-label-mono-bold text-label-mono-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-default">PostgreSQL</span>
                <span className="px-3 py-1 border-2 border-ink-black bg-surface text-ink-black font-label-mono-bold text-label-mono-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-default">Docker</span>
                <span className="px-3 py-1 border-2 border-ink-black bg-surface text-ink-black font-label-mono-bold text-label-mono-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-default">GraphQL</span>
                <span className="px-3 py-1 border-2 border-ink-black bg-surface text-ink-black font-label-mono-bold text-label-mono-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-default">Next.js</span>
                <span className="px-3 py-1 border-2 border-ink-black bg-surface text-ink-black font-label-mono-bold text-label-mono-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-default">Tailwind</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/*Footer Component*/}
</div>
  );
}
