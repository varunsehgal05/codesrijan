import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/admin/gallery")({
  component: AdminGallery,
});

function AdminGallery() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const mockUpload = () => {
      setLoadingId("uploading");
      setTimeout(() => {
          toast("Media pipeline currently offline. Please use CLI bucket upload.");
          setLoadingId(null);
      }, 1000);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
        <div>
            <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-electric-blue px-2 py-1 inline-block transform -skew-x-6">
            MEDIA GALLERY
            </h2>
            <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">Global Asset Management</p>
        </div>
        <button onClick={mockUpload} disabled={loadingId === "uploading"} className="bg-stark-black text-pure-white font-label-bold uppercase px-6 py-3 border-2 border-stark-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50">
          <span className="material-symbols-outlined">{loadingId === "uploading" ? 'sync' : 'upload'}</span>
          {loadingId === "uploading" ? 'TRANSFERRING...' : 'UPLOAD ARTIFACT'}
        </button>
      </div>
      <div className="bg-pure-white p-24 font-code-snippet uppercase text-center border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-on-surface-variant flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl opacity-50">perm_media</span>
        GALLERY ARRAYS EMPTY. UPLOAD EVENT MEDIA TO POPULATE.
      </div>
    </div>
  );
}
