import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/leaderboard")({
  component: Page13,
  head: () => ({
    meta: [
      { title: "Leaderboard | CodeSrijan" },
      { name: "description", content: "CodeSrijan leaderboard — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Leaderboard | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan leaderboard — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/leaderboard" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/leaderboard" }],
  }),
});

function Page13() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*Top Navigation (from JSON)*/}
      <nav className="w-full sticky top-0 z-50 bg-surface dark:bg-ink-black border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto">
      <div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">CodeSrijan</div>
      <div className="hidden md:flex gap-8 items-center font-button-text text-button-text">
      <a className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/problems" >Problems</a>
      <a className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/recruitment" >Recruitment</a>
      {/*Active State applied based on context (Leaderboard)*/}
      <a className="text-electric-blue border-b-2 border-electric-blue pb-1 hover:-translate-y-0.5 transition-transform duration-200" href="/leaderboard" >Leaderboard</a>
      </div>
      <div className="hidden md:block">
      <button className="bg-electric-blue text-on-primary font-button-text text-button-text px-6 py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200">
                          Register Now
                      </button>
      </div>
      {/*Mobile Menu Icon*/}
      <div className="md:hidden">
      <span className="material-symbols-outlined text-3xl" data-icon="menu">menu</span>
      </div>
      </div>
      </nav>
      <main className="max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 space-y-24">
      {/*Leaderboard Section*/}
      <section>
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
      <div>
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-ink-black uppercase">Live Rankings</h1>
      <p className="font-body-lg text-on-surface mt-2">The battle for ultimate glory. Updated in real-time.</p>
      </div>
      <div className="font-label-caps text-label-caps bg-surface-bright brutal-border px-4 py-2 flex items-center gap-2 brutal-shadow">
      <span className="w-3 h-3 bg-electric-blue rounded-full animate-pulse block"></span>
                          Live Updates Active
                      </div>
      </div>
      {/*Leaderboard Table Container*/}
      <div className="bg-surface-container-lowest brutal-border brutal-shadow-lg overflow-x-auto">
      <table className="w-full text-left border-collapse">
      <thead>
      <tr className="bg-surface-container border-b-2 border-ink-black">
      <th className="py-4 px-6 font-button-text text-button-text text-ink-black">Rank</th>
      <th className="py-4 px-6 font-button-text text-button-text text-ink-black">Team</th>
      <th className="py-4 px-6 font-button-text text-button-text text-ink-black text-right">Score</th>
      <th className="py-4 px-6 font-button-text text-button-text text-ink-black text-center">Trend</th>
      </tr>
      </thead>
      <tbody className="font-body-lg text-body-lg">
      {/*Top 1*/}
      <tr className="border-b-2 border-ink-black bg-[#ffdad6] bg-opacity-30 transition-colors hover:bg-opacity-50">
      <td className="py-6 px-6 font-headline-md text-electric-blue">01</td>
      <td className="py-6 px-6">
      <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-electric-blue brutal-border flex items-center justify-center text-on-primary">
      <span className="material-symbols-outlined" data-icon="terminal">terminal</span>
      </div>
      <span className="font-button-text text-ink-black">Null Pointers</span>
      </div>
      </td>
      <td className="py-6 px-6 font-button-text text-right text-ink-black">9,420</td>
      <td className="py-6 px-6 text-center">
      <span className="material-symbols-outlined text-electric-blue font-bold" data-icon="keyboard_double_arrow_up">keyboard_double_arrow_up</span>
      </td>
      </tr>
      {/*Top 2*/}
      <tr className="border-b-2 border-ink-black hover:bg-surface-container transition-colors">
      <td className="py-6 px-6 font-headline-md text-ink-black">02</td>
      <td className="py-6 px-6">
      <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-surface-bright brutal-border flex items-center justify-center">
      <span className="material-symbols-outlined" data-icon="bug_report">bug_report</span>
      </div>
      <span className="font-button-text text-ink-black">Syntax Errors</span>
      </div>
      </td>
      <td className="py-6 px-6 font-button-text text-right text-ink-black">8,950</td>
      <td className="py-6 px-6 text-center">
      <span className="material-symbols-outlined text-ink-black" data-icon="horizontal_rule">horizontal_rule</span>
      </td>
      </tr>
      {/*Top 3*/}
      <tr className="border-b-2 border-ink-black hover:bg-surface-container transition-colors">
      <td className="py-6 px-6 font-headline-md text-ink-black">03</td>
      <td className="py-6 px-6">
      <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-surface-bright brutal-border flex items-center justify-center">
      <span className="material-symbols-outlined" data-icon="code">code</span>
      </div>
      <span className="font-button-text text-ink-black">Byte Me</span>
      </div>
      </td>
      <td className="py-6 px-6 font-button-text text-right text-ink-black">8,100</td>
      <td className="py-6 px-6 text-center">
      <span className="material-symbols-outlined text-error font-bold" data-icon="keyboard_arrow_down">keyboard_arrow_down</span>
      </td>
      </tr>
      </tbody>
      </table>
      <div className="p-6 text-center bg-surface-container-low border-t-2 border-ink-black">
      <button className="font-label-caps text-label-caps text-electric-blue hover:underline">LOAD MORE TEAMS</button>
      </div>
      </div>
      </section>
      </main>
      {/*Footer (from JSON)*/}
      <footer className="bg-ink-black dark:bg-surface-container-lowest w-full mt-16 border-t-4 border-electric-blue flex flex-col md:flex-row justify-between items-start px-margin-desktop py-12 gap-8">
      <div className="font-display-lg text-headline-md text-surface-bright">CodeSrijan</div>
      <div className="flex flex-wrap gap-6 font-body-md text-body-md">
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Sponsors</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Community</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Discord</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/" >GitHub</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Privacy Policy</a>
      <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Code of Conduct</a>
      </div>
      <div className="text-surface-variant font-body-md text-body-md mt-4 md:mt-0">
                  © 2024 CodeSrijan. Built for the community.
              </div>
      </footer>
    </div>
  );
}
