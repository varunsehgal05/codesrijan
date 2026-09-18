import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
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

function LeaderboardPage() {
  const { teams } = useAppStore();

  // Generate deterministic mock scores if score doesn't exist to make it look realistic for the demo
  const rankedTeams = [...teams]
    .map(t => {
      let baseScore = t.isSubmitted ? 8000 : 2000;
      baseScore += (t.name.length * 100);
      baseScore += (t.members.length * 250);
      return { ...t, computedScore: baseScore };
    })
    .sort((a, b) => b.computedScore - a.computedScore);

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*Top Navigation*/}
      <nav className="w-full sticky top-0 z-50 bg-surface dark:bg-ink-black border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto">
          <div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">CodeSrijan</div>
          <div className="hidden md:flex gap-8 items-center font-button-text text-button-text">
            <a className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/problems" >Problems</a>
            <a className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/recruitment" >Recruitment</a>
            <a className="text-electric-blue border-b-2 border-electric-blue pb-1 hover:-translate-y-0.5 transition-transform duration-200" href="/leaderboard" >Leaderboard</a>
          </div>
          <div className="hidden md:block">
            <button className="bg-electric-blue text-on-primary font-button-text text-button-text px-6 py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200">
              Register Now
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 space-y-24">
        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>

        <section>
          <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-ink-black uppercase">Live Rankings</h1>
              <p className="font-body-lg text-on-surface mt-2">The battle for ultimate glory. Updated in real-time.</p>
            </div>
            <div className="font-label-caps text-label-caps bg-surface-bright brutal-border px-4 py-2 flex items-center gap-2 brutal-shadow">
              <span className="w-3 h-3 bg-electric-blue rounded-full animate-pulse block"></span>
              Live Tracking Engine Active
            </div>
          </div>

          <div className="bg-surface-container-lowest brutal-border brutal-shadow-lg overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b-2 border-ink-black">
                  <th className="py-4 px-6 font-button-text text-button-text text-ink-black">Rank</th>
                  <th className="py-4 px-6 font-button-text text-button-text text-ink-black">Team / Hacker</th>
                  <th className="py-4 px-6 font-button-text text-button-text text-ink-black text-right">Score</th>
                  <th className="py-4 px-6 font-button-text text-button-text text-ink-black text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="font-body-lg text-body-lg">
                {rankedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-6 text-center text-surface-variant font-label-md">
                      Awaiting global database synchronisation...
                    </td>
                  </tr>
                ) : (
                  rankedTeams.map((team, index) => {
                    const isTopThree = index < 3;
                    return (
                      <tr key={team.id} className={`border-b-2 border-ink-black transition-colors hover:bg-surface-container ${index === 0 ? "bg-surface-bright hover:bg-surface-variant" : ""}`}>
                        <td className={`py-6 px-6 font-headline-md ${index === 0 ? 'text-electric-blue' : 'text-ink-black'}`}>
                          {(index + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 brutal-border flex items-center justify-center ${index === 0 ? 'bg-electric-blue text-on-primary' : 'bg-surface-bright'}`}>
                              <span className="material-symbols-outlined" data-icon="terminal">{index === 0 ? 'emoji_events' : 'terminal'}</span>
                            </div>
                            <span className="font-button-text text-ink-black">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-6 px-6 font-button-text text-right text-ink-black">
                          {team.computedScore.toLocaleString()}
                        </td>
                        <td className="py-6 px-6 text-center">
                          {index === 0 ? (
                            <span className="material-symbols-outlined text-electric-blue font-bold">keyboard_double_arrow_up</span>
                          ) : (
                            <span className="material-symbols-outlined text-ink-black">horizontal_rule</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="bg-ink-black dark:bg-surface-container-lowest w-full mt-16 border-t-4 border-electric-blue flex flex-col md:flex-row justify-between items-start px-margin-desktop py-12 gap-8">
        <div className="font-display-lg text-headline-md text-surface-bright">CodeSrijan</div>
        <div className="flex flex-wrap gap-6 font-body-md text-body-md">
          <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/sponsors" >Sponsors</a>
          <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/community" >Community</a>
          <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/" >Discord</a>
          <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/" >GitHub</a>
          <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/privacy-policy" >Privacy Policy</a>
          <a className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300" href="/code-of-conduct" >Code of Conduct</a>
        </div>
        <div className="text-surface-variant font-body-md text-body-md mt-4 md:mt-0">
          © 2026 CodeSrijan. Built for the community.
        </div>
      </footer>
    </div>
  );
}

