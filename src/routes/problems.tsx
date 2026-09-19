import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/problems")({
  component: Page12,
  head: () => ({
    meta: [
      { title: "Problems | CodeSrijan" },
      { name: "description", content: "CodeSrijan problems — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Problems | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan problems — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/problems" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/problems" }],
  }),
});

function Page12() {
  const { currentUser, problems } = useAppStore();

  if (!currentUser) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      {/*Main Content*/}
      <main className="flex-grow flex flex-col items-center px-margin-desktop py-16 w-full max-w-[1200px] mx-auto gap-16">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>

        {/*Header & Search*/}
        <section className="w-full flex flex-col gap-8 relative z-10">
          <div className="flex flex-col gap-4">
            <h1 className="font-display-lg text-display-lg md:text-display-lg text-headline-lg-mobile text-ink-black">Active Challenges</h1>
            <p className="font-body-lg text-body-lg text-text-muted max-w-2xl">Browse the latest high-octane problem statements from top sponsors. Build, break, and innovate.</p>
          </div>
          <div className="relative w-full max-w-4xl group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="material-symbols-outlined text-ink-black text-3xl">search</span>
            </div>
            <input className="w-full bg-white border-4 border-ink-black py-5 pl-14 pr-6 font-body-lg text-body-lg text-ink-black placeholder-outline outline-none focus:border-electric-blue focus:neo-shadow-lg transition-all duration-200 neo-shadow-sm" placeholder="Search problem statements, sponsors, or tags..." type="text" />
          </div>
          {/*Filters*/}
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="bg-electric-blue text-on-primary border-2 border-ink-black px-4 py-2 font-label-caps text-label-caps neo-shadow-sm neo-shadow-hover transition-all duration-200">ALL</button>
            <button className="bg-white text-ink-black border-2 border-ink-black px-4 py-2 font-label-caps text-label-caps neo-shadow-sm hover:bg-electric-blue hover:text-white transition-all duration-200">WEB3</button>
            <button className="bg-white text-ink-black border-2 border-ink-black px-4 py-2 font-label-caps text-label-caps neo-shadow-sm hover:bg-electric-blue hover:text-white transition-all duration-200">AI / ML</button>
            <button className="bg-white text-ink-black border-2 border-ink-black px-4 py-2 font-label-caps text-label-caps neo-shadow-sm hover:bg-electric-blue hover:text-white transition-all duration-200">FINTECH</button>
            <button className="bg-white text-ink-black border-2 border-ink-black px-4 py-2 font-label-caps text-label-caps neo-shadow-sm hover:bg-electric-blue hover:text-white transition-all duration-200">OPEN SOURCE</button>
          </div>
        </section>
        {/*Problems Grid*/}
        <section className="w-full relative z-10">
          {problems.length === 0 ? (
            <div className="bg-surface-container-lowest border-4 border-ink-black py-16 text-center neo-shadow flex flex-col items-center">
              <span className="material-symbols-outlined text-outline text-6xl mb-4">cloud_off</span>
              <p className="font-headline-md text-ink-black uppercase">No Active Problem Statements</p>
              <p className="font-body-md text-text-muted mt-2">Awaiting global database synchronisation from Sponsors and Admins.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {problems.map((prob) => (
                <div key={prob.id} className="bg-white border-4 border-ink-black p-6 flex flex-col gap-6 neo-shadow-sm hover:neo-shadow-lg transition-all duration-300 h-full relative overflow-hidden group">
                  <div className={`absolute -right-16 -top-16 font-label-caps text-label-caps px-16 py-2 rotate-45 border-b-2 border-ink-black shadow-sm transition-colors z-20 ${prob.difficulty === 'HARD' || prob.difficulty === 'EXTREME' ? 'bg-ink-black text-white group-hover:bg-electric-blue' : 'bg-electric-blue text-white group-hover:bg-ink-black'}`}>
                    {prob.difficulty}
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-label-caps text-label-caps text-electric-blue">{prob.category}</span>
                      <h3 className="font-headline-md text-headline-md text-ink-black line-clamp-2">{prob.title}</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-text-muted line-clamp-3 flex-grow">
                    {prob.description}
                  </p>
                  <div className="w-full h-1 bg-ink-black my-2"></div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline">PRIZE POOL</span>
                      <span className="font-headline-md text-headline-md text-electric-blue">${prob.prizePool.toLocaleString()}</span>
                    </div>
                    <button onClick={() => alert("Loading full problem parameters...")} className="bg-ink-black text-white font-button-text text-button-text px-6 py-3 border-2 border-ink-black neo-shadow-sm neo-shadow-hover neo-shadow-active transition-all duration-200 flex items-center gap-2">
                      View Details
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {/*Footer*/}
    </div>
  );
}
