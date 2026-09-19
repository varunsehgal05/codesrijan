import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const { users, teams } = useAppStore();

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow">
        <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-[#00FF00] px-2 py-1 inline-block transform -skew-x-6">
          GLOBAL ANALYTICS HUD
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-pure-white p-8 brutal-border brutal-shadow flex flex-col justify-between h-[200px]">
          <span className="font-label-bold uppercase text-text-muted">Total Active Operatives</span>
          <span className="font-display-lg text-[60px] leading-none text-stark-black">{users.length}</span>
        </div>
        <div className="bg-pure-white p-8 brutal-border brutal-shadow flex flex-col justify-between h-[200px]">
          <span className="font-label-bold uppercase text-text-muted">Deployed Squads</span>
          <span className="font-display-lg text-[60px] leading-none text-electric-blue">{teams.length}</span>
        </div>
        <div className="bg-pure-white p-8 brutal-border brutal-shadow flex flex-col justify-between h-[200px]">
          <span className="font-label-bold uppercase text-text-muted">Global Uptime</span>
          <span className="font-display-lg text-[60px] leading-none text-success">99.9%</span>
        </div>
      </div>

      <div className="bg-stark-black p-12 brutal-border brutal-shadow font-code-snippet text-success text-center">
        &gt; ALL SYSTEMS NOMINAL.
      </div>
    </div>
  );
}
