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
  const { currentUser } = useAppStore();

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
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/*Card 1*/}
          <div className="bg-white border-4 border-ink-black p-6 flex flex-col gap-6 neo-shadow-sm hover:neo-shadow-lg transition-all duration-300 h-full relative overflow-hidden group">
            <div className="absolute -right-16 -top-16 bg-electric-blue text-white font-label-caps text-label-caps px-16 py-2 rotate-45 border-b-2 border-ink-black shadow-sm group-hover:bg-ink-black transition-colors z-20">
              HARD
            </div>
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-label-caps text-label-caps text-electric-blue">BLOCKCHAIN / DEFI</span>
                <h3 className="font-headline-md text-headline-md text-ink-black line-clamp-2">Decentralized Autonomous Escrow Protocol</h3>
              </div>
            </div>
            <p className="font-body-md text-body-md text-text-muted line-clamp-3 flex-grow">
              Build a trustless escrow smart contract system on Ethereum that handles multi-party dispute resolution using a decentralized jury system.
            </p>
            <div className="w-full h-1 bg-ink-black my-2"></div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-outline">PRIZE POOL</span>
                <span className="font-headline-md text-headline-md text-electric-blue">$15,000</span>
              </div>
              <button onClick={() => alert("Loading full problem parameters...")} className="bg-ink-black text-white font-button-text text-button-text px-6 py-3 border-2 border-ink-black neo-shadow-sm neo-shadow-hover neo-shadow-active transition-all duration-200 flex items-center gap-2">
                View Details
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
          {/*Card 2*/}
          <div className="bg-white border-4 border-ink-black p-6 flex flex-col gap-6 neo-shadow-sm hover:neo-shadow-lg transition-all duration-300 h-full relative overflow-hidden group">
            <div className="absolute -right-16 -top-16 bg-ink-black text-white font-label-caps text-label-caps px-16 py-2 rotate-45 border-b-2 border-ink-black shadow-sm group-hover:bg-electric-blue transition-colors z-20">
              EXTREME
            </div>
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-label-caps text-label-caps text-electric-blue">AI / ML</span>
                <h3 className="font-headline-md text-headline-md text-ink-black line-clamp-2">Real-time Anomaly Detection Engine</h3>
              </div>
            </div>
            <p className="font-body-md text-body-md text-text-muted line-clamp-3 flex-grow">
              Develop an ultra-low latency machine learning model to detect anomalies in high-frequency trading data streams with sub-millisecond response times.
            </p>
            <div className="w-full h-1 bg-ink-black my-2"></div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-outline">PRIZE POOL</span>
                <span className="font-headline-md text-headline-md text-electric-blue">$25,000</span>
              </div>
              <button onClick={() => alert("Loading full problem parameters...")} className="bg-ink-black text-white font-button-text text-button-text px-6 py-3 border-2 border-ink-black neo-shadow-sm neo-shadow-hover neo-shadow-active transition-all duration-200 flex items-center gap-2">
                View Details
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
          {/*Card 3*/}
          <div className="bg-white border-4 border-ink-black p-6 flex flex-col gap-6 neo-shadow-sm hover:neo-shadow-lg transition-all duration-300 h-full relative overflow-hidden group">
            <div className="absolute -right-16 -top-16 bg-white border-4 border-ink-black text-ink-black font-label-caps text-label-caps px-16 py-2 rotate-45 shadow-sm group-hover:bg-electric-blue group-hover:text-white transition-colors z-20">
              EASY
            </div>
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-label-caps text-label-caps text-electric-blue">WEB / MOBILE</span>
                <h3 className="font-headline-md text-headline-md text-ink-black line-clamp-2">Accessible Voting Interface UI</h3>
              </div>
            </div>
            <p className="font-body-md text-body-md text-text-muted line-clamp-3 flex-grow">
              Design and build a highly accessible, cross-platform voting interface prioritizing WCAG 2.1 AAA compliance and low-bandwidth performance.
            </p>
            <div className="w-full h-1 bg-ink-black my-2"></div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-outline">PRIZE POOL</span>
                <span className="font-headline-md text-headline-md text-electric-blue">$5,000</span>
              </div>
              <button onClick={() => alert("Loading full problem parameters...")} className="bg-ink-black text-white font-button-text text-button-text px-6 py-3 border-2 border-ink-black neo-shadow-sm neo-shadow-hover neo-shadow-active transition-all duration-200 flex items-center gap-2">
                View Details
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
          {/*Card 4*/}
          <div className="bg-white border-4 border-ink-black p-6 flex flex-col gap-6 neo-shadow-sm hover:neo-shadow-lg transition-all duration-300 h-full relative overflow-hidden group">
            <div className="absolute -right-16 -top-16 bg-electric-blue text-white font-label-caps text-label-caps px-16 py-2 rotate-45 border-b-2 border-ink-black shadow-sm group-hover:bg-ink-black transition-colors z-20">
              MEDIUM
            </div>
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-label-caps text-label-caps text-electric-blue">INFRASTRUCTURE</span>
                <h3 className="font-headline-md text-headline-md text-ink-black line-clamp-2">Serverless Edge Caching Layer</h3>
              </div>
            </div>
            <p className="font-body-md text-body-md text-text-muted line-clamp-3 flex-grow">
              Create a distributed, serverless caching layer utilizing Cloudflare Workers to optimize delivery of dynamic API payloads.
            </p>
            <div className="w-full h-1 bg-ink-black my-2"></div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-outline">PRIZE POOL</span>
                <span className="font-headline-md text-headline-md text-electric-blue">$10,000</span>
              </div>
              <button onClick={() => alert("Loading full problem parameters...")} className="bg-ink-black text-white font-button-text text-button-text px-6 py-3 border-2 border-ink-black neo-shadow-sm neo-shadow-hover neo-shadow-active transition-all duration-200 flex items-center gap-2">
                View Details
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
        <button className="mt-8 bg-surface text-ink-black font-button-text text-button-text px-8 py-4 border-4 border-ink-black neo-shadow-sm neo-shadow-hover neo-shadow-active transition-all duration-200 flex items-center gap-2 hover:bg-ink-black hover:text-white">
          <span className="material-symbols-outlined">refresh</span>
          Load More Problems
        </button>
      </main>
      {/*Footer*/}
    </div>
  );
}
