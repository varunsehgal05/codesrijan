import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: Page11,
  head: () => ({
    meta: [
      { title: "About | CodeSrijan" },
      { name: "description", content: "CodeSrijan about — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "About | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan about — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

function Page11() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*Pattern Background*/}
      <div className="fixed inset-0 z-[-1] opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000000 2px, transparent 2px)", backgroundSize: "32px 32px" }}></div>
      {/*TopNavBar*/}
      <header className="bg-surface dark:bg-ink-black w-full sticky top-0 z-50 border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto">
          <div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">CodeSrijan</div>
          <nav className="hidden md:flex gap-8 items-center">
            <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/problems" >Problems</a>
            <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/recruitment" >Recruitment</a>
            <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/leaderboard" >Leaderboard</a>
            <a className="font-button-text text-button-text text-electric-blue border-b-2 border-electric-blue pb-1 hover:-translate-y-0.5 transition-transform duration-200" href="/about" >About</a>
          </nav>
          <button className="font-button-text text-button-text text-electric-blue dark:text-primary-fixed-dim bg-transparent border-2 border-electric-blue px-6 py-2 rounded-DEFAULT neo-shadow hover:-translate-y-0.5 transition-transform duration-200 active:translate-y-1 active:shadow-none hidden md:block">
            Register Now
          </button>
          <button className="md:hidden text-ink-black">
            <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>menu</span>
          </button>
        </div>
      </header>
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-16 flex flex-col gap-24">
        {/*Hero Section*/}
        <section className="flex flex-col items-center text-center gap-8 relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-electric-blue rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-20 -right-10 w-40 h-40 bg-[#00f0ff] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: "1s" }}></div>
          <h1 className="font-display-lg text-display-lg text-ink-black uppercase relative z-10">
            <span className="block transform -rotate-2 bg-electric-blue text-white px-4 border-4 border-ink-black neo-shadow-lg inline-block mb-4">Unleash</span>
            Your Potential
          </h1>
          <p className="font-body-lg text-body-lg text-text-muted max-w-2xl relative z-10 border-l-4 border-electric-blue pl-4 text-left">
            CodeSrijan is not just a hackathon; it's a crucible for innovation. We bring together the brightest minds to forge solutions for tomorrow's challenges in a high-octane, neo-brutalist environment where code meets creativity.
          </p>
        </section>
        {/*Mission & Vision Bento*/}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-bright border-2 border-ink-black neo-shadow p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue transform translate-x-12 -translate-y-12 rotate-45 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="font-label-caps text-label-caps text-electric-blue uppercase border-2 border-ink-black inline-block px-2 py-1 bg-white self-start">The Mission</div>
            <h2 className="font-headline-lg text-headline-lg text-ink-black relative z-10">To Empower Creators.</h2>
            <p className="font-body-md text-body-md text-on-surface relative z-10">
              Provide a robust platform for developers to test their mettle, collaborate on impactful projects, and push the boundaries of software engineering in a competitive yet supportive arena.
            </p>
            <div className="mt-auto flex justify-end">
              <span className="material-symbols-outlined text-4xl text-ink-black" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
            </div>
          </div>
          <div className="bg-ink-black text-white border-2 border-ink-black neo-shadow p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00f0ff] opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="font-label-caps text-label-caps text-ink-black bg-white uppercase border-2 border-white inline-block px-2 py-1 self-start">The Vision</div>
            <h2 className="font-headline-lg text-headline-lg text-white relative z-10">Build the Future.</h2>
            <p className="font-body-md text-body-md text-surface-dim relative z-10">
              To be the premier destination for technological advancement, where raw talent meets unparalleled opportunity, resulting in solutions that redefine industry standards.
            </p>
            <div className="mt-auto flex justify-end">
              <span className="material-symbols-outlined text-4xl text-electric-blue" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
            </div>
          </div>
        </section>
        {/*Organizing Committee*/}
        <section className="flex flex-col gap-12">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-lg text-headline-lg text-ink-black uppercase bg-electric-blue text-white px-4 border-2 border-ink-black neo-shadow inline-block transform -rotate-1">The Crew</h2>
            <div className="flex-grow h-0.5 bg-ink-black"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/*Member 1*/}
            <div className="bg-white border-2 border-ink-black neo-shadow flex flex-col items-center p-4 gap-4 neo-shadow-hover transition-all duration-200 cursor-pointer">
              <div className="w-full aspect-square border-2 border-ink-black bg-[#ffeb3b] flex items-center justify-center overflow-hidden">
                <img className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" data-alt="A stylized 3D avatar of a young male developer with glasses and a hoodie, vibrant solid colors, flat shading, neo-brutalist style against a yellow background, high contrast, energetic mood." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjQTUzJUAZ5I901ZGruPp6xedoRKZ08iHNeGLD8_T-HHi_ddaOwAIQxDOm4XjIiGaQDzN8ophUJI1vLAkBPoIaNxxHawGLWogSrIcTm3TtfLGtTAHOnmmD4ueYx2oK9D_Z7DWiRqzbsVxunE-frnaO69c3IoQkYtAe3jFU_I2UZNJQj6-3GZQlpeHubQ1z7Wf3IWYOZ4QZ9YgXKQbY_HnOl-kYqHWY_-_eLiyl0Y3uguOYkJ5d8PeU" />
              </div>
              <div className="text-center w-full">
                <div className="font-headline-md text-headline-md text-ink-black text-xl border-b-2 border-ink-black pb-1 mb-1">Alex Chen</div>
                <div className="font-label-caps text-label-caps text-electric-blue">Lead Organizer</div>
              </div>
            </div>
            {/*Member 2*/}
            <div className="bg-white border-2 border-ink-black neo-shadow flex flex-col items-center p-4 gap-4 neo-shadow-hover transition-all duration-200 cursor-pointer">
              <div className="w-full aspect-square border-2 border-ink-black bg-[#ff00ff] flex items-center justify-center overflow-hidden">
                <img className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" data-alt="A stylized 3D avatar of a young female designer with colorful hair and futuristic headphones, vibrant solid colors, flat shading, neo-brutalist style against a magenta background, high contrast, creative mood." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCibB1LO3nFjPzOr-GNSdUAng045HKMw4F8_q2rcJPy5Syvbt4XZmyzB9l5pWX0WLK_AekUIyBYXMkWA0gn5STrhM4EL13y-QTD9gnCd3DZq485u9aqFnAWKAAY5QPWyphuyk8mChB_tJL1mKO5fwGL8qSU0nI6mbb3A6iz_lU3lDTagviaV6Nb0CHOsIiIOcNboEfUTjeMj_4Ge_lVXek1gLETqIKHlshhqv_6PSU3S0gW3P5GfOeW" />
              </div>
              <div className="text-center w-full">
                <div className="font-headline-md text-headline-md text-ink-black text-xl border-b-2 border-ink-black pb-1 mb-1">Sam Rivera</div>
                <div className="font-label-caps text-label-caps text-electric-blue">Tech Lead</div>
              </div>
            </div>
            {/*Member 3*/}
            <div className="bg-white border-2 border-ink-black neo-shadow flex flex-col items-center p-4 gap-4 neo-shadow-hover transition-all duration-200 cursor-pointer">
              <div className="w-full aspect-square border-2 border-ink-black bg-[#00ff9d] flex items-center justify-center overflow-hidden">
                <img className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" data-alt="A stylized 3D avatar of a young non-binary person with a confident smirk, wearing tech-wear, vibrant solid colors, flat shading, neo-brutalist style against a mint green background, high contrast, sharp mood." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPy0opCK3wA0SyFFe5YESTaZKDG2Uq77Wa33hahPRz1fqNXOErLt82gjjT419kCbts8l0PGd3gEmGrMk7rTpYJZ7QHNYxeOtyd3Uzmqf29qjxIgu4p2v3h1_N_w-HubdCi-fB0-GgjXyqDDklfhG0KdlZ22hp1RL3kSv0dcjBH3MEPpvYiPyQ1ZLB4GJVwIJsHIHaBRPUZn5jAw8N9u8XArvWca9tnasKISFq2AfF_IwJjlhEIq_qz" />
              </div>
              <div className="text-center w-full">
                <div className="font-headline-md text-headline-md text-ink-black text-xl border-b-2 border-ink-black pb-1 mb-1">Jordan Lee</div>
                <div className="font-label-caps text-label-caps text-electric-blue">Design Head</div>
              </div>
            </div>
            {/*Member 4*/}
            <div className="bg-white border-2 border-ink-black neo-shadow flex flex-col items-center p-4 gap-4 neo-shadow-hover transition-all duration-200 cursor-pointer">
              <div className="w-full aspect-square border-2 border-ink-black bg-[#ff5722] flex items-center justify-center overflow-hidden">
                <img className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" data-alt="A stylized 3D avatar of a young male with a beanie and a serious expression, vibrant solid colors, flat shading, neo-brutalist style against a bright orange background, high contrast, focused mood." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfA5_7Kar9qQ7FYMya3khe1z3xeBYiA0Drm-hn7vTACvbolP3TE-45AI_qwsz9KC4i_BltqAmoWiBWp1Z_hz1klMVBl_knskikzTZYCf1eBBq9n4sR2l5v__cZlyN-h2L6dsctxWuy8hU9P8FLh2ftma-3ESAzQYlcIFDStdg7IX7pQwkHWzWdPlqr0Ti6o7p9ObMBxboJtZgltwP6Sy8JFRa4M0S8vx0S0Lm03Za4ykexexMnr3-R" />
              </div>
              <div className="text-center w-full">
                <div className="font-headline-md text-headline-md text-ink-black text-xl border-b-2 border-ink-black pb-1 mb-1">Casey Smith</div>
                <div className="font-label-caps text-label-caps text-electric-blue">Logistics</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/*Footer*/}
      <footer className="bg-ink-black dark:bg-surface-container-lowest w-full mt-16 border-t-4 border-electric-blue">
        <div className="flex flex-col md:flex-row justify-between items-start px-margin-desktop py-12 gap-8 max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4">
            <div className="font-display-lg text-headline-md text-surface-bright">CodeSrijan</div>
            <div className="font-body-md text-body-md text-surface-bright opacity-80">© 2026 CodeSrijan. Built for the community.</div>
          </div>
          <div className="flex flex-wrap gap-6 font-body-md text-body-md">
            <a className="text-surface-variant hover:text-electric-blue transition-colors duration-300" href="/sponsors" >Sponsors</a>
            <a className="text-surface-variant hover:text-electric-blue transition-colors duration-300" href="/community" >Community</a>
            <a className="text-surface-variant hover:text-electric-blue transition-colors duration-300" href="/" >Discord</a>
            <a className="text-surface-variant hover:text-electric-blue transition-colors duration-300" href="/" >GitHub</a>
            <a className="text-surface-variant hover:text-electric-blue transition-colors duration-300" href="/privacy-policy" >Privacy Policy</a>
            <a className="text-surface-variant hover:text-electric-blue transition-colors duration-300" href="/code-of-conduct" >Code of Conduct</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
