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
      <header className="w-full border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-surface sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-margin-desktop py-4 max-w-[1280px] mx-auto md:px-margin-desktop px-margin-mobile">
      {/*Brand Logo*/}
      <a className="font-headline-md text-headline-md font-black text-ink-black flex items-center gap-2 hover:-translate-y-0.5 hover:translate-x-0.5 transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none" href="/" >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                      CodeSrijan
                  </a>
      {/*Desktop Navigation*/}
{/*Trailing Action & Mobile Menu*/}
      <div className="flex items-center gap-4">
      <button className="hidden md:flex items-center justify-center bg-electric-blue text-on-primary font-body-lg text-body-lg border-2 border-ink-black neo-shadow-lg px-6 py-2 transition-transform neo-shadow-hover neo-shadow-active font-bold">
                          Register Now
                      </button>
      {/*Profile Avatar (Active Context)*/}
      <div className="md:hidden flex items-center justify-center w-10 h-10 border-2 border-electric-blue bg-electric-blue/10 rounded-full cursor-pointer overflow-hidden">
      <img alt="Profile" className="w-full h-full object-cover" data-alt="A pixel-art style, highly detailed 8-bit avatar of a young male developer with short dark hair, wearing a vibrant electric blue hoodie. The background is a solid bright yellow to provide sharp contrast. The image is rendered with raw, blocky edges typical of retro gaming, aligning perfectly with a neo-brutalist tech aesthetic. The lighting is flat but the colors are heavily saturated." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1l0tDc_4tzpFHPV49UgGwZCv6Pr_2LU0TIuu_y2IoW0uy8yvua5ywdLEqq5V--mvD6w0fajNfTYfA8nPia7PBJmndwdd57RLPfF81Ees921kWW3QAkvFDcUK6RtPpja9fg2fpFdt3ckFYN4WOrzYkjaVz9RzBdVfqE9ZLk21jmm62v_oWYJmFeGWhU_EsZ6X4X-ycdxqYNINdExI4Tu5rlbymONTaanItuh4HuQG9eW8yQ89G0NAA"/>
      </div>
      </div>
      </div>
      </header>
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
