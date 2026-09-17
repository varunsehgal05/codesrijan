import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/login")({
    component: LoginPage,
});

function LoginPage() {
    const { login } = useAppStore();
    const navigate = useNavigate({ from: "/login" });
    const [email, setEmail] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        login(email);
        setTimeout(() => navigate({ to: "/workspace" }), 300);
    };

    return (
        <div className="min-h-screen bg-surface-container-lowest bg-pattern flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative blurred background elements */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-electric-blue opacity-10 transform rotate-12 blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-lg bg-pure-white brutal-border brutal-shadow-lg relative z-10 flex flex-col">
                {/* Header Block */}
                <div className="bg-electric-blue border-b-2 border-stark-black p-6 flex justify-between items-center group cursor-pointer transition-colors hover:bg-deep-navy">
                    <Link to="/" className="font-headline-md italic uppercase text-pure-white flex items-center gap-2 group-hover:-translate-x-1 transition-transform">
                        <span className="material-symbols-outlined">arrow_back</span>
                        CodeSrijan Auth
                    </Link>
                    <span className="material-symbols-outlined sync-pulse text-pure-white">login</span>
                </div>

                {/* Content Block */}
                <div className="p-8 md:p-10 flex flex-col">

                    {/* Global Go Back Navigation */}
                    <div className="w-full mb-6">
                        <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
                            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                            GO BACK
                        </button>
                    </div>

                    <h1 className="font-display-lg text-headline-xl leading-none text-stark-black uppercase mb-2">
                        Welcome Back
                    </h1>
                    <p className="font-body-md text-on-surface-variant font-bold mb-8 uppercase tracking-widest text-sm">
                        ACCESS YOUR HACKER WORKSPACE
                    </p>

                    <form className="flex flex-col gap-6 w-full" onSubmit={handleLogin}>
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold text-stark-black uppercase">Email Address / Hacker Handle</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="system_override@codesrijan.com"
                                className="w-full bg-surface py-4 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="font-label-bold text-stark-black uppercase">Operation Password</label>
                                <Link to="/auth/otp" className="font-label-mono-sm text-electric-blue hover:underline uppercase">Forgot?</Link>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••••••"
                                className="w-full bg-surface py-4 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                            />
                        </div>

                        <button type="submit" className="mt-4 w-full bg-stark-black text-pure-white py-5 font-headline-md italic uppercase brutal-border brutal-shadow-lg transition-all hover:bg-electric-blue hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3">
                            INITIALIZE SESSION <span className="material-symbols-outlined">power_settings_new</span>
                        </button>
                    </form>

                    <div className="mt-8 border-t-2 border-stark-black pt-6 text-center">
                        <p className="font-label-bold text-stark-black">
                            DON'T HAVE A SQUAD YET?
                            <Link to="/register" className="ml-2 text-electric-blue hover:text-deep-navy border-b-2 border-electric-blue transition-colors">
                                REGISTER NOW
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
