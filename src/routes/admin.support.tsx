import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupport,
});

function AdminSupport() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white bg-error px-2 py-1 inline-block transform -skew-x-6">
            GLOBAL SUPPORT TICKETS
          </h2>
        </div>
        <div className="font-mono bg-stark-black text-pure-white px-4 py-2 brutal-border">0 ACTIVE ALERTS</div>
      </div>

      <div className="bg-pure-white brutal-border brutal-shadow p-12 text-center text-stark-black font-code-snippet">
        INFRASTRUCTURE IS NOMINAL. NO USER SUPPORT TICKETS DETECTED.
      </div>
    </div>
  );
}
