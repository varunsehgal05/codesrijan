import { createFileRoute } from "@tanstack/react-router";

import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/users")({
    component: AdminUsers,
});

function AdminUsers() {
    const { users, teams } = useAppStore();

    // Mapping real users to required grid payload shapes.
    const displayUsers = users.map(u => {
        const userTeam = teams.find(t => t.id === u.teamId);
        return {
            id: u.id,
            name: (u.name) || ((u as any).firstName + ' ' + (u as any).lastName) || "Unknown User",
            team: userTeam ? userTeam.name : "Free Agent",
            role: (u.role || 'student').toUpperCase(),
            status: ((u as any).accountStatus === 'active' || u.role) ? 'Active' : 'Inactive',
        };
    });

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            {/* Header Panel */}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
                        USERS & SQUADS
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
                        Directory and Recruitment Status
                    </p>
                </div>
                <button onClick={() => alert("Initiating manual user injection sequence...")} className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold brutal-border brutal-shadow-hover transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined">person_add</span>
                    Force Add User
                </button>
            </div>

            {/* Data Grid HUD */}
            <div className="bg-pure-white brutal-border brutal-shadow overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-stark-black text-pure-white">
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">ID</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Hacker Name</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Squad</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-r-2 border-electric-blue border-b-4">Role Focus</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue">Status</th>
                            <th className="p-4 font-label-bold uppercase tracking-widest border-b-4 border-electric-blue border-l-2 bg-electric-blue text-pure-white text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayUsers.map((u, i) => (
                            <tr key={u.id || i} className="border-b-2 border-stark-black hover:bg-surface-container transition-colors group">
                                <td className="p-4 font-code-snippet text-sm border-r-2 border-stark-black">{u.id}</td>
                                <td className="p-4 font-label-bold text-stark-black border-r-2 border-stark-black">{u.name}</td>
                                <td className="p-4 font-body-md border-r-2 border-stark-black">{u.team}</td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <span className="inline-block px-2 py-1 bg-surface-container-high text-stark-black font-code-snippet text-xs brutal-border">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 border-r-2 border-stark-black">
                                    <span className={`inline-flex items-center gap-2 px-2 py-1 font-label-bold text-xs brutal-border ${u.status === 'Active' ? 'bg-electric-blue text-pure-white' :
                                        u.status === 'Looking for Team' ? 'bg-[#FFD700] text-stark-black' :
                                            'bg-surface-variant text-on-surface-variant'
                                        }`}>
                                        <span className="w-2 h-2 rounded-full bg-current block"></span>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => alert(`Opening edit modal for ${u.id}...`)} className="bg-stark-black text-pure-white px-3 py-1 font-label-caps text-xs brutal-border brutal-shadow-hover opacity-0 group-hover:opacity-100 transition-all">
                                        EDIT
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
