import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/")({
    component: AdminTelemetry,
});

function AdminTelemetry() {
    const { users, teams, chatMessages } = useAppStore();

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            {/* Header Panel */}
            <div className="bg-pure-white p-6 brutal-border brutal-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
                        TELEMETRY
                    </h2>
                    <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm">
                        LIVE HACKATHON SYSTEMS OVERVIEW
                    </p>
                </div>
                <div className="bg-stark-black text-electric-blue font-code-snippet p-3 brutal-border flex items-center gap-3 w-full md:w-auto">
                    <span className="material-symbols-outlined sync-pulse text-2xl">lens_blur</span>
                    <span>SYSTEM: NOMINAL</span>
                </div>
            </div>

            {/* Grid HUD */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric 1 */}
                <div className="bg-electric-blue text-pure-white p-6 brutal-border brutal-shadow hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-label-bold text-label-bold uppercase">Registration Volume</span>
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <h3 className="font-display-lg text-display-lg leading-none">{users.length}</h3>
                    <p className="font-code-snippet pt-2 mt-4 border-t-2 border-stark-black text-sm">Total users connected</p>
                </div>

                {/* Metric 2 */}
                <div className="bg-pure-white text-stark-black p-6 brutal-border brutal-shadow hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-label-bold text-label-bold uppercase">Active Squads</span>
                        <span className="material-symbols-outlined">groups</span>
                    </div>
                    <h3 className="font-display-lg text-display-lg leading-none">{teams.length}</h3>
                    <p className="font-code-snippet pt-2 mt-4 border-t-2 border-stark-black text-sm text-electric-blue">Formed and registered</p>
                </div>

                {/* Metric 3 */}
                <div className="bg-pure-white text-stark-black p-6 brutal-border brutal-shadow hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-label-bold text-label-bold uppercase">Terminal Messages</span>
                        <span className="material-symbols-outlined">chat</span>
                    </div>
                    <h3 className="font-display-lg text-display-lg leading-none">{chatMessages.length}</h3>
                    <p className="font-code-snippet pt-2 mt-4 border-t-2 border-stark-black text-sm">Cross-squad comms sent</p>
                </div>

                {/* Metric 4 */}
                <div className="bg-destructive text-pure-white p-6 brutal-border brutal-shadow hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-label-bold text-label-bold uppercase">Server Health</span>
                        <span className="material-symbols-outlined">dns</span>
                    </div>
                    <h3 className="font-display-lg text-display-lg leading-none">98%</h3>
                    <p className="font-code-snippet pt-2 mt-4 border-t-2 border-stark-black text-sm text-stark-black font-bold">ALL SYSTEMS GO</p>
                </div>
            </div>

            {/* Live Activity Stream & Submission Streams */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                <div className="bg-pure-white brutal-border brutal-shadow flex flex-col h-full min-h-[400px]">
                    <div className="bg-stark-black text-pure-white p-4 border-b-2 border-stark-black flex justify-between items-center">
                        <h3 className="font-label-bold text-label-bold uppercase tracking-widest">Live Activity Log</h3>
                        <span className="material-symbols-outlined text-sm">history</span>
                    </div>
                    <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                        <ul className="flex flex-col">
                            {teams.map(team => (
                                <li key={`t-${team.id}`} className="px-6 py-4 border-b border-surface-variant flex items-center gap-4 hover:bg-surface-container transition-colors">
                                    <span className="bg-surface-container-high text-stark-black p-2 brutal-border">
                                        <span className="material-symbols-outlined block text-[16px]">group_add</span>
                                    </span>
                                    <div>
                                        <p className="font-label-bold text-sm">Squad Formation: "{team.name}"</p>
                                        <p className="font-code-snippet text-xs text-on-surface-variant">{team.members.length} members • System Log</p>
                                    </div>
                                </li>
                            ))}
                            {users.map(user => (
                                <li key={`u-${user.id}`} className="px-6 py-4 border-b border-surface-variant flex items-center gap-4 hover:bg-surface-container transition-colors">
                                    <span className="bg-electric-blue text-pure-white p-2 brutal-border">
                                        <span className="material-symbols-outlined block text-[16px]">person_add</span>
                                    </span>
                                    <div>
                                        <p className="font-label-bold text-sm">New User Registration</p>
                                        <p className="font-code-snippet text-xs text-on-surface-variant">@{user.name.toLowerCase().replace(/\s/g, '_')} • System Log</p>
                                    </div>
                                </li>
                            ))}
                            {teams.filter(t => t.isSubmitted).map(team => (
                                <li key={`sub-${team.id}`} className="px-6 py-4 border-b border-surface-variant flex items-center gap-4 hover:bg-surface-container transition-colors">
                                    <span className="bg-electric-blue text-pure-white p-2 brutal-border">
                                        <span className="material-symbols-outlined block text-[16px]">cloud_upload</span>
                                    </span>
                                    <div>
                                        <p className="font-label-bold text-sm">Final Submission Complete</p>
                                        <p className="font-code-snippet text-xs text-on-surface-variant">{team.name} • System Log</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Admin Controls Panel */}
                <div className="bg-pure-white brutal-border brutal-shadow flex flex-col h-full min-h-[400px]">
                    <div className="bg-electric-blue text-pure-white p-4 border-b-2 border-stark-black flex justify-between items-center">
                        <h3 className="font-label-bold text-label-bold uppercase tracking-widest">Rounds & Fees Management</h3>
                        <span className="material-symbols-outlined text-sm">settings</span>
                    </div>
                    <div className="p-6 flex flex-col gap-6">
                        {/* Rounds Control */}
                        <div className="p-4 border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-surface relative">
                            <span className="absolute -top-3 left-4 bg-ink-black text-white px-2 font-label-caps text-xs">Event Stages</span>
                            <div className="flex justify-between items-center mt-2">
                                <div>
                                    <h4 className="font-headline-md text-ink-black uppercase">Round 2: Main Hackathon</h4>
                                    <p className="font-body-sm text-text-muted">Currently active. Ends in 24 hours.</p>
                                </div>
                                <button onClick={() => alert("Advancing to the next event stage...")} className="bg-electric-blue text-white p-2 border-2 border-ink-black hover:-translate-y-1 transition-transform">
                                    Next Round
                                </button>
                            </div>
                        </div>

                        {/* Submitted Projects Queue */}
                        <div className="p-4 border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-surface relative">
                            <span className="absolute -top-3 left-4 bg-ink-black text-white px-2 font-label-caps text-xs">Submission Queue</span>
                            <div className="flex flex-col gap-2 mt-2">
                                {teams.filter(t => t.isSubmitted).map(team => (
                                    <div key={`s-${team.id}`} className="flex justify-between items-center bg-surface-bright p-2 border border-ink-black">
                                        <span className="font-body-sm text-ink-black">Team: {team.name}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => alert(`Opening repo: ${team.repositoryUrl}`)} className="bg-[#00FF00] text-ink-black px-2 border-2 border-ink-black text-xs font-bold">REPO</button>
                                        </div>
                                    </div>
                                ))}
                                {teams.filter(t => t.isSubmitted).length === 0 && (
                                    <div className="text-center p-2 text-outline text-sm">No submissions yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
