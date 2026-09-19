import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/mentors")({
  component: AdminMentors,
});

function AdminMentors() {
  const { users } = useAppStore();
  const mentors = users.filter(u => u.role === 'mentor');

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            MENTORS DIRECTORY
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Assistance Personnel Matrix
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mentors.length === 0 ? (
          <div className="col-span-3 bg-surface-container p-12 brutal-border text-center font-mono opacity-60">
            [SYS] ZERO MENTOR NODES ALLOCATED.
          </div>
        ) : (
          mentors.map(j => (
            <div key={j.id} className="bg-pure-white brutal-border brutal-shadow p-6 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-5xl mb-4 text-[#FFD700]">school</span>
              <h3 className="font-headline-md uppercase text-xl truncate w-full">{j.name}</h3>
              <span className="bg-stark-black text-pure-white font-mono text-[10px] px-2 mt-2">{j.id}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
