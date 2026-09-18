import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/highlights")({
  component: Page1,
  head: () => ({
    meta: [
      { title: "Highlights | CodeSrijan" },
      { name: "description", content: "CodeSrijan highlights — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Highlights | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan highlights — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/highlights" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/highlights" }],
  }),
});

function Page1() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
{/*Main Content Canvas*/}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-16 md:gap-24 overflow-hidden">
      {/*Header Section*/}
      <header className="text-center flex flex-col items-center gap-stack-md mt-8">
      <div className="inline-block border-2 border-ink-black bg-surface-variant px-4 py-1 mb-4 transform -rotate-2 neo-shadow">
      <span className="font-label-mono-bold text-label-mono-bold text-ink-black uppercase tracking-widest">ARCHIVE / v2.4</span>
      </div>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-xl md:text-headline-xl text-ink-black uppercase">
                      Gallery &amp; <span className="text-electric-blue relative inline-block">Highlights<svg className="absolute w-full h-3 bottom-1 left-0 -z-10 text-primary-fixed-dim" preserveAspectRatio="none" viewBox="0 0 100 10"><path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" /></svg></span>
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-4">
                      The sweat, the bugs, the legendary commits. Relive the high-octane energy of past CodeSrijan hackathons. Raw, unfiltered, and compiled for your viewing pleasure.
                  </p>
      </header>
      {/*Demo Reel Video Player*/}
      <section className="w-full">
      <div className="flex items-center justify-between border-2 border-ink-black border-b-0 bg-slate-tech px-4 py-2 w-full md:w-3/4 mx-auto rounded-t-sm">
      <div className="flex gap-2">
      <div className="w-3 h-3 rounded-full bg-error border border-ink-black"></div>
      <div className="w-3 h-3 rounded-full bg-surface-dim border border-ink-black"></div>
      <div className="w-3 h-3 rounded-full bg-electric-blue border border-ink-black"></div>
      </div>
      <span className="font-label-mono-sm text-label-mono-sm text-studio-white">DEMO_REEL_FINAL_V3.mp4</span>
      </div>
      <div className="relative w-full md:w-3/4 mx-auto aspect-video bg-ink-black border-2 border-ink-black neo-shadow-blue group cursor-pointer overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity mix-blend-luminosity" data-alt="A high-energy, fast-paced montage frame of a hackathon environment. Developers are intensely coding in a dimly lit, industrial space illuminated by stark white and electric blue monitor glows. The scene captures a raw, tech-noir aesthetic with visible cables, energy drinks, and intense concentration on faces. Shot with a wide-angle lens, high contrast, neo-brutalist vibe." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBGXozPjo7u5jBw2lD_N77PxNuI69x9tziLemU245n3pNVS08cU0dPHdigkHaBW9lCWvooOltUzhf5ETgoczp8XbjocUxGTRXxkeMOr7239AgtD0gOYa8Fn2k3Q5t9vtU4KXphzlfTBRcY9dyhJr0uT3sU44Ht2ZRgO3gpeK_niot1QejMf6DSrWUYJCrULPX5fE7K5XDRw4I3uPklhYMLEh0lHgRO4gyPaZ6LxL1SGkgqgMFRJy_kA')" }}></div>
      <div className="absolute inset-0 flex items-center justify-center">
      <button className="w-20 h-20 bg-electric-blue border-2 border-ink-black flex items-center justify-center rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform active:shadow-none active:translate-x-1 active:translate-y-1">
      <span className="material-symbols-outlined text-studio-white text-5xl ml-2">play_arrow</span>
      </button>
      </div>
      <div className="absolute bottom-4 left-4 bg-ink-black border border-outline px-2 py-1">
      <span className="font-label-mono-sm text-label-mono-sm text-studio-white">03:42 / 10:00</span>
      </div>
      </div>
      </section>
      {/*Marquee Quotes*/}
      <section className="w-full border-y-4 border-ink-black bg-surface-variant py-4 transform -skew-y-1 my-8 relative z-10 overflow-hidden shadow-[0_8px_0_0_#0035D5]">
      <div className="marquee-container flex items-center h-full">
      <div className="marquee-content font-headline-md text-headline-md text-ink-black uppercase flex gap-12">
      <span>"I haven't slept in 48 hours and I feel alive."</span>
      <span className="text-electric-blue font-black">✦</span>
      <span>"The wifi went down, so we built our own protocol."</span>
      <span className="text-electric-blue font-black">✦</span>
      <span>"Powered entirely by caffeine and spite."</span>
      <span className="text-electric-blue font-black">✦</span>
      <span>"Deploying to production during a demo is a lifestyle."</span>
      <span className="text-electric-blue font-black">✦</span>
      <span>"I haven't slept in 48 hours and I feel alive."</span>
      <span className="text-electric-blue font-black">✦</span>
      <span>"The wifi went down, so we built our own protocol."</span>
      <span className="text-electric-blue font-black">✦</span>
      <span>"Powered entirely by caffeine and spite."</span>
      </div>
      </div>
      </section>
      </main>
      {/*Footer*/}
</div>
  );
}
