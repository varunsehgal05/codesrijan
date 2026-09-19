import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/certificates")({
  component: AdminCertificates,
});

function AdminCertificates() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-[#FFD700] px-2 py-1 inline-block transform -skew-x-6">
            CERTIFICATES ENFORCEMENT
          </h2>
        </div>
      </div>

      <div className="bg-pure-white p-8 brutal-border brutal-shadow flex flex-col justify-center items-center gap-8 py-16">
        <span className="material-symbols-outlined text-[80px] text-electric-blue">workspace_premium</span>
        <p className="font-mono text-stark-black text-center text-sm max-w-lg">
          Automatically map participation grids against final submissions to batch-generate SHA-256 verifiable credentials.
        </p>
        <div className="flex gap-4">
          <button className="bg-stark-black text-pure-white px-8 py-4 font-label-bold uppercase brutal-border brutal-shadow-hover transition-all">
            GENERATE BATCH RUN
          </button>
        </div>
      </div>
    </div>
  );
}
