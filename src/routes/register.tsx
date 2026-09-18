import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/register")({
    component: RegisterPage,
});

function RegisterPage() {
    const { register } = useAppStore();
    const navigate = useNavigate({ from: "/register" });
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errorMsg, setErrorMsg] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!name || !email || !password) return;

        try {
            await register({
                id: `u-${Date.now()}`,
                name,
                email,
                password,
                role: "student"
            });
            navigate({ to: "/workspace" });
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to generate identity.");
        }
    };

    return (
        <div className="min-h-screen bg-stark-black bg-pattern flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative blurred background elements */}
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-electric-blue opacity-20 blur-[100px] transform rotate-45 pointer-events-none"></div>

            <div className="w-full max-w-2xl bg-pure-white brutal-border brutal-shadow-lg relative z-10 flex flex-col mt-8 mb-8">
                {/* Header Block */}
                <div className="bg-electric-blue border-b-2 border-stark-black p-6 flex justify-between items-center group">
                    <Link to="/" className="font-headline-md italic uppercase text-pure-white flex items-center gap-2 group-hover:-translate-x-1 transition-transform">
                        <span className="material-symbols-outlined">arrow_back</span>
                        CodeSrijan Registration
                    </Link>
                    <span className="material-symbols-outlined text-pure-white">person_add</span>
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

                    <h1 className="font-display-lg text-headline-xl md:text-headline-xl leading-none text-stark-black uppercase mb-2">
                        JOIN THE <br /> <span className="text-electric-blue">RESISTANCE</span>
                    </h1>
                    <p className="font-body-md text-on-surface-variant font-bold mb-6 tracking-widest text-sm uppercase">
                        Create your hacker profile and start building.
                    </p>

                    {errorMsg && (
                        <div className="bg-error text-white p-4 mb-6 brutal-border flex items-center gap-2">
                            <span className="material-symbols-outlined">warning</span>
                            <span className="font-label-bold">{errorMsg}</span>
                        </div>
                    )}

                    <form className="flex flex-col gap-6 w-full" onSubmit={handleRegister}>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="font-label-bold text-stark-black uppercase">Given Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John"
                                    className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-label-bold text-stark-black uppercase">Surname</label>
                                <input
                                    type="text"
                                    placeholder="Doe"
                                    className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold text-stark-black uppercase">Preferred Hacker Handle</label>
                            <div className="flex items-center brutal-border brutal-shadow-hover bg-surface focus-within:-translate-y-1 transition-transform">
                                <span className="px-4 font-code-snippet text-electric-blue font-bold border-r-2 border-stark-black bg-surface-container">@</span>
                                <input
                                    type="text"
                                    placeholder="phantom_coder"
                                    className="w-full bg-transparent py-3 px-4 font-code-snippet text-stark-black focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold text-stark-black uppercase">Secure Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="comm_link@codesrijan.com"
                                className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold text-stark-black uppercase">Password Matrix</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a strong password"
                                className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                                required
                            />
                        </div>

                        <button type="submit" className="mt-8 w-full bg-electric-blue text-pure-white py-5 font-headline-md italic uppercase brutal-border brutal-shadow-lg transition-all hover:bg-stark-black hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3">
                            GENERATE IDENTITY <span className="material-symbols-outlined">how_to_reg</span>
                        </button>
                    </form>

                    <div className="mt-8 border-t-2 border-surface-variant pt-6 text-center">
                        <p className="font-label-bold text-on-surface-variant">
                            ALREADY DRAFTED?
                            <Link to="/login" className="ml-2 text-stark-black hover:text-electric-blue border-b-2 border-stark-black hover:border-electric-blue transition-colors">
                                INITIALIZE SESSION
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
