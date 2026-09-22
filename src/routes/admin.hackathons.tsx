import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/hackathons")({
    component: AdminHackathons,
});

function AdminHackathons() {
    const matches = useMatches();
    const isExact = matches[matches.length - 1]?.routeId === Route.id;
    const { hackathons } = useAppStore();

    if (!isExact) {
        return <Outlet />;
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            {/* Header Panel */}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
                        EVENT MATRICES
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        Hackathon Deployment Configurations
                    </p>
                </div>
                <Link to="/admin/hackathons/create" className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold brutal-border brutal-shadow-hover transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined">add_circle</span>
                    Initialize Event
                </Link>
            </div>

            {/* Data Grid HUD */}
            <div className="bg-pure-white brutal-border brutal-shadow overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-stark-black text-pure-white">
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">ID</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Designation</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Theme / Sector</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Dates</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue">Status</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue border-l-2 bg-electric-blue text-pure-white text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hackathons.map((h) => (
                            <tr key={h.id} className="border-b-2 border-stark-black hover:bg-surface-container transition-colors group">
                                <td className="p-4 font-code-snippet text-sm border-r-2 border-stark-black">{h.id}</td>
                                <td className="p-4 font-label-bold text-stark-black border-r-2 border-stark-black uppercase">{h.name}</td>
                                <td className="p-4 font-code-snippet text-xs border-r-2 border-stark-black">{(h as any).theme || 'N/A'}</td>
                                <td className="p-4 border-r-2 border-stark-black font-code-snippet text-xs text-on-surface-variant">
                                    {new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()}
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <span className={`inline-flex items-center gap-2 px-2 py-1 font-label-bold text-[10px] uppercase brutal-border ${h.status === 'registration_open' ? 'bg-electric-blue text-pure-white' :
                                            h.status === 'running' ? 'bg-[#FFD700] text-stark-black' :
                                                h.status === 'completed' ? 'bg-stark-black text-pure-white' :
                                                    'bg-surface-variant text-on-surface-variant'
                                        }`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current block"></span>
                                        {h.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => alert(`Configuring Matrix for ${h.name}...`)} className="bg-stark-black text-pure-white px-3 py-1 font-label-caps text-xs brutal-border brutal-shadow-hover opacity-0 group-hover:opacity-100 transition-all">
                                        ACCESS
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {hackathons.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500 font-label-bold uppercase tracking-widest">
                                    [NO ACTIVE EVENT VECTORS IDENTIFIED]
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
