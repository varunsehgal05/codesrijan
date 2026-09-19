import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/leaderboard")({
  component: AdminLeaderboard,
});

function AdminLeaderboard() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-stark-black text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            LEADERBOARD PUBLISH
          </h2>
        </div>
        <button className="bg-success text-pure-white px-8 py-3 brutal-border brutal-shadow font-label-bold uppercase">
          Publish Standings
        </button>
      </div>

      <div className="bg-surface-container p-16 brutal-border text-center flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-text-muted">format_list_numbered_rtl</span>
        <h3 className="font-display-lg uppercase text-2xl text-ink-black">Awaiting Final Scores</h3>
        <p className="font-mono text-zinc-500 uppercase tracking-widest text-xs">Evaluations are not fully compiled yet.</p>
      </div>
    </div>
  );
}
