import { createFileRoute, Outlet, Link, useRouterState, Navigate } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
export const Route = createFileRoute("/admin")({
    component: AdminLayout,
});

const ADMIN_LINKS = [
    { label: "Dashboard", path: "/admin", icon: "dashboard" },
    { label: "Hackathons", path: "/admin/hackathons", icon: "event" },
    { label: "Participants", path: "/admin/users", icon: "person" },
    { label: "Teams", path: "/admin/teams", icon: "groups" },
    { label: "Problems", path: "/admin/problems", icon: "extension" },
    { label: "Submissions", path: "/admin/submissions", icon: "upload_file" },
    { label: "Judges", path: "/admin/judges", icon: "gavel" },
    { label: "Evaluations", path: "/admin/evaluations", icon: "assessment" },
    { label: "Mentors", path: "/admin/mentors", icon: "school" },
    { label: "Announcements", path: "/admin/announcements", icon: "campaign" },
    { label: "Leaderboard", path: "/admin/leaderboard", icon: "leaderboard" },
    { label: "Certificates", path: "/admin/certificates", icon: "workspace_premium" },
    { label: "Recruitment", path: "/admin/recruitment", icon: "work" },
    { label: "Support", path: "/admin/support", icon: "support_agent" },
    { label: "Sponsors", path: "/admin/sponsors", icon: "payments" },
    { label: "Gallery", path: "/admin/gallery", icon: "photo_library" },
    { label: "Analytics", path: "/admin/analytics", icon: "analytics" },
    { label: "Activity Logs", path: "/admin/logs", icon: "history" },
    { label: "Settings", path: "/admin/settings", icon: "settings" },
];

function AdminLayout() {
    const activeRoute = useRouterState({ select: (s) => s.location.pathname });
    const { currentUser, isLoaded } = useAppStore();

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-stark-black flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 border-4 border-pure-white border-t-error rounded-full animate-spin mb-4"></div>
                <h1 className="font-display-lg text-error text-2xl uppercase tracking-widest animate-pulse">VERIFYING ADMIN CLEARANCE...</h1>
            </div>
        );
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row font-body-md overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-stark-black text-pure-white border-r-4 border-electric-blue flex flex-col h-screen sticky top-0">
                <div className="p-6 border-b-2 border-electric-blue shrink-0 flex items-center justify-between">
                    <h1 className="font-headline-md text-headline-md italic tracking-tighter">
                        <span className="text-electric-blue">ADMIN</span> COMMAND
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto w-full py-4 px-3 flex flex-col gap-2 custom-scrollbar">
                    {ADMIN_LINKS.map(link => {
                        const isActive = activeRoute === link.path || (link.path !== '/admin' && activeRoute.startsWith(link.path));
                        return (
                            <Link key={link.path} to={link.path} className={`flex items-center gap-3 px-4 py-3 font-label-md transition-all brutal-border ${isActive ? 'bg-electric-blue text-pure-white translate-x-2 brutal-shadow' : 'bg-stark-black text-pure-white hover:bg-electric-blue/20 hover:translate-x-1'}`}>
                                <span className="material-symbols-outlined">{link.icon}</span>
                                {link.label}
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t-2 border-electric-blue shrink-0">
                    <Link
                        to="/"
                        className="flex justify-center items-center gap-2 w-full text-center bg-destructive text-pure-white px-4 py-3 font-label-bold text-label-bold brutal-border brutal-shadow-hover transition-all uppercase hover:-translate-y-1"
                    >
                        <span className="material-symbols-outlined font-bold">logout</span>
                        Exit Terminal
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow flex-1 bg-surface-container-lowest overflow-y-auto bg-pattern relative z-0 h-screen">
                <Outlet />
            </main>
        </div>
    );
}
