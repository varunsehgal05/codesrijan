import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/gallery")({
  component: AdminGallery,
});

function AdminGallery() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-electric-blue px-2 py-1 inline-block transform -skew-x-6">
          MEDIA GALLERY
        </h2>
        <button className="bg-stark-black text-pure-white font-label-bold uppercase px-6 py-2 brutal-border transition-all">
          UPLOAD ARTIFACT
        </button>
      </div>
      <div className="bg-surface p-16 font-mono text-center brutal-border brutal-shadow text-zinc-500">
        GALLERY ARRAYS EMPTY. UPLOAD EVENT MEDIA.
      </div>
    </div>
  );
}
