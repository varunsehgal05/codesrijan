import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/recruitment")({
  component: AdminRecruitment,
});

function AdminRecruitment() {
  const [matching, setMatching] = useState(false);

  const mockMatch = () => {
      setMatching(true);
      setTimeout(() => {
          alert("Auto-matching algorithm complete. 0 orphans found.");
          setMatching(false);
      }, 1500);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
        <div>
            <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-success px-2 py-1 inline-block transform -skew-x-6">
                RECRUITMENT ENGINE
            </h2>
            <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">Squad Formation & Orphan Assignment</p>
        </div>
        <button onClick={mockMatch} disabled={matching} className="bg-stark-black text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined">{matching ? 'sync' : 'group_add'}</span>
            {matching ? 'CALCULATING MATCHES...' : 'FORCE AUTO-MATCH'}
        </button>
      </div>

      <div className="bg-pure-white p-24 font-code-snippet uppercase text-center border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-on-surface-variant flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl opacity-50">hub</span>
        ALL PARTICIPANTS SUCCESSFULLY ALLOCATED TO SQUADS. NO ORPHAN NODES DETECTED.
      </div>
    </div>
  );
}
