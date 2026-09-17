import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
    component: AdminLayout,
});

function AdminLayout() {
    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-stark-black text-pure-white border-r-4 border-electric-blue flex flex-col">
                <div className="p-6 border-b-2 border-electric-blue">
                    <h1 className="font-headline-md text-headline-md italic tracking-tighter">
                        <span className="text-electric-blue">ADMIN</span> COMMAND
                    </h1>
                </div>
                      
                <div className="p-4 border-t-2 border-electric-blue">
                    <Link
                        to="/"
                        className="block text-center bg-destructive text-pure-white px-4 py-3 font-label-bold text-label-bold brutal-border brutal-shadow transition-all"
                    >
                        Exit Terminal
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow flex-1 bg-surface-container-lowest p-6 md:p-8 lg:p-12 overflow-y-auto bg-pattern relative z-0">
                <Outlet />
            </main>
        </div>
    );
}
