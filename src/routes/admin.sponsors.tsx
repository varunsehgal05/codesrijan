import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/sponsors")({
  component: AdminSponsors,
});

function AdminSponsors() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-[#FFD700] px-2 py-1 inline-block transform -skew-x-6">
            SPONSORS & PARTNERS
          </h2>
        </div>
        <button className="bg-electric-blue text-pure-white px-6 py-2 brutal-border font-bold uppercase transition-all hover:bg-stark-black">
          ADD PARTNER
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="aspect-square bg-surface-container brutal-border flex items-center justify-center opacity-50">
            <span className="material-symbols-outlined text-4xl text-text-muted">add_photo_alternate</span>
          </div>
        ))}
      </div>
    </div>
  );
}
