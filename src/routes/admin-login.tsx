import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin-login")({
    component: AdminLoginPage,
});

function AdminLoginPage() {
    const { login } = useAppStore();
    const navigate = useNavigate({ from: "/admin-login" });
    const [adminId, setAdminId] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!adminId) return;

        try {
            await login(adminId); // We will pass "admin" or "admin@codesrijan.com" as the ID to trigger the backend override
            navigate({ to: "/admin" });
        } catch (err: any) {
            setErrorMsg(err.message || "Admin authorization rejected.");
        }
    };

    return (
        <div className="min-h-screen bg-ink-black text-white flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-surface p-8 neo-border border-4 border-electric-blue text-ink-black relative group shadow-[8px_8px_0px_0px_rgba(0,53,213,1)]">
                <div className="absolute -top-4 -right-4 bg-error text-white p-2 font-code-snippet text-xs transform rotate-6 border border-ink-black z-10">
                    RESTRICTED AREA
                </div>
                <div className="flex flex-col items-center mb-8 gap-2">
                    <span className="material-symbols-outlined text-[64px] text-electric-blue bg-ink-black p-2 neo-border">admin_panel_settings</span>
                    <h1 className="font-headline-lg uppercase text-ink-black text-center mt-2 leading-tight">Admin<br />Console Access</h1>
                </div>

                <form className="flex flex-col gap-6" onSubmit={handleAdminLogin}>
                    {errorMsg && (
                        <div className="bg-error text-white p-3 font-code-snippet text-xs mb-2 neo-border">
                            [!] {errorMsg}
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <label className="font-label-caps uppercase text-xs font-bold text-ink-black">Operative ID</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-black">badge</span>
                            <input
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                className="w-full neo-border bg-white p-3 pl-10 font-code-snippet focus:outline-none focus:border-electric-blue focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                placeholder="e.g. admin"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-caps uppercase text-xs font-bold text-ink-black">Clearance Passphrase</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-black">key</span>
                            <input type="password" className="w-full neo-border bg-white p-3 pl-10 font-code-snippet focus:outline-none focus:border-electric-blue focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all" placeholder="•••••••••" required />
                        </div>
                    </div>

                    <button type="submit" className="bg-electric-blue text-white py-4 font-headline-md uppercase neo-border hover:bg-ink-black transition-colors mt-2">
                        Initialize Session
                    </button>

                    <Link to="/" className="text-center font-label-caps text-xs text-text-muted hover:text-electric-blue transition-colors underline underline-offset-2">
                        ← Return to Public Matrix
                    </Link>
                </form>
            </div>
        </div>
    );
}
