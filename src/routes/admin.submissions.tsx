import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/submissions")({
  component: AdminSubmissions,
});

function AdminSubmissions() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-[#FFD700] p-1 inline-block transform -skew-x-6">
            SUBMISSIONS LOCK
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Final Delivery Hub
          </p>
        </div>
      </div>

      <div className="bg-surface-container p-16 brutal-border text-center flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-max text-electric-blue animate-pulse">lock_person</span>
        <h3 className="font-display-lg uppercase text-2xl text-ink-black">Submission Vault Locked</h3>
        <p className="font-mono text-zinc-500 uppercase tracking-widest text-xs">No teams have completed their final project submission yet.</p>
      </div>
    </div>
  );
}
