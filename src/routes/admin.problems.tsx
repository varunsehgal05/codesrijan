import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/problems")({
  component: AdminProblems,
});

function AdminProblems() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            PROBLEM STATEMENTS
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Challenge Directives Manager
          </p>
        </div>
        <button className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold brutal-border brutal-shadow-hover transition-all uppercase flex items-center gap-2">
          <span className="material-symbols-outlined">add_task</span>
          New Statement
        </button>
      </div>

      <div className="bg-surface-container p-16 brutal-border text-center flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-text-muted">assignment_late</span>
        <h3 className="font-display-lg uppercase text-2xl text-ink-black">No Active Directives</h3>
        <p className="font-mono text-zinc-500 uppercase tracking-widest text-xs">Run the Mongoose array creation toolkit to seed Problem Statements.</p>
      </div>
    </div>
  );
}
