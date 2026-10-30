import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/register")({
    component: RegisterPage,
});

function RegisterPage() {
    const { register, currentUser } = useAppStore();
    const navigate = useNavigate({ from: "/register" });
    
    useEffect(() => {
        if (currentUser) {
            if (currentUser.role === 'admin') navigate({ to: "/admin" });
            else navigate({ to: "/workspace" });
        }
    }, [currentUser, navigate]);

    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [handle, setHandle] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [college, setCollege] = useState("");
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [errorMsg, setErrorMsg] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!name.trim()) {
            setErrorMsg("First name is required.");
            return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMsg("Valid email address is required.");
            return;
        }
        if (!college.trim()) {
            setErrorMsg("College/University name is required.");
            return;
        }
        if (!branch) {
            setErrorMsg("Please select your academic branch.");
            return;
        }
        if (!year) {
            setErrorMsg("Please select your year of study.");
            return;
        }
        if (!password || password.length < 8) {
            setErrorMsg("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        try {
            const fullName = lastName.trim() ? `${name.trim()} ${lastName.trim()}` : name.trim();
            const resData = await register({
                id: "", // Managed explicitly by backend now
                name: fullName,
                email: email.trim().toLowerCase(),
                password,
                role: "student",
                // @ts-ignore - appending payload variables currently outside our User UI schema definition
                college: college.trim(),
                branch,
                year,
                ...(handle.trim() ? { handle: handle.trim().replace(/^@/, '') } : {})
            });
            // Navigate to OTP verification screen WITHOUT exposing tokens or raw otp parameters
            navigate({
                to: '/auth/otp',
                search: {
                    uid: resData.userId,
                    email: email.trim().toLowerCase()
                }
            });
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to generate identity.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stark-black bg-pattern flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative blurred background elements */}
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-electric-blue opacity-20 blur-[100px] transform rotate-45 pointer-events-none"></div>

            <div className="w-full max-w-2xl bg-pure-white brutal-border brutal-shadow-lg relative z-10 flex flex-col mt-8 mb-8">
                {/* Header Block */}
                <div className="bg-electric-blue border-b-2 border-stark-black p-6 flex justify-between items-center group">
                    <Link to="/" className="font-headline-md italic uppercase text-pure-white flex items-center gap-2.5 group-hover:-translate-x-1 transition-transform">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <img src="/codesrijan-icon.png" alt="CodeSrijan Logo" className="w-6 h-6 object-contain bg-white rounded-xs p-0.5" />
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

                    <div className="flex items-center gap-3.5 mb-2">
                        <img src="/codesrijan-icon.png" alt="CodeSrijan Logo" className="w-12 h-12 object-contain" />
                        <div>
                            <h1 className="font-display-lg text-headline-xl md:text-headline-xl leading-none text-stark-black uppercase">
                                JOIN THE <span className="text-electric-blue">RESISTANCE</span>
                            </h1>
                        </div>
                    </div>
                    <p className="font-body-md text-on-surface-variant font-bold mb-6 tracking-widest text-sm uppercase">
                        Create your hacker profile and start building.
                    </p>

                    {errorMsg && (
                        <div role="alert" className="bg-error text-white p-4 mb-6 brutal-border flex items-center gap-2">
                            <span className="material-symbols-outlined">warning</span>
                            <span className="font-label-bold">{errorMsg}</span>
                        </div>
                    )}

                    <form className="flex flex-col gap-6 w-full" onSubmit={handleRegister}>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="reg-first-name" className="font-label-bold text-stark-black uppercase">First Name</label>
                                <input
                                    id="reg-first-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John"
                                    autoComplete="given-name"
                                    className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="reg-last-name" className="font-label-bold text-stark-black uppercase">Last Name</label>
                                <input
                                    id="reg-last-name"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    autoComplete="family-name"
                                    className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="reg-handle" className="font-label-bold text-stark-black uppercase">Preferred Hacker Handle</label>
                            <div className="flex items-center brutal-border brutal-shadow-hover bg-surface focus-within:-translate-y-1 transition-transform">
                                <span className="px-4 font-code-snippet text-electric-blue font-bold border-r-2 border-stark-black bg-surface-container">@</span>
                                <input
                                    id="reg-handle"
                                    type="text"
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value)}
                                    placeholder="phantom_coder"
                                    className="w-full bg-transparent py-3 px-4 font-code-snippet text-stark-black focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="reg-college" className="font-label-bold text-stark-black uppercase">College</label>
                                <input
                                    id="reg-college"
                                    type="text"
                                    value={college}
                                    onChange={(e) => setCollege(e.target.value)}
                                    autoComplete="organization"
                                    placeholder="Institute of Tech"
                                    className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border focus:ring-2 focus:ring-electric-blue focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="reg-branch" className="font-label-bold text-stark-black uppercase">Branch</label>
                                <select
                                    id="reg-branch"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border focus:ring-2 focus:ring-electric-blue focus:outline-none"
                                    required
                                >
                                    <option value="" disabled>Select Branch</option>
                                    <option value="CSE">CSE</option>
                                    <option value="IT">IT</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EE">EE</option>
                                    <option value="ME">ME</option>
                                    <option value="CE">CE</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="reg-year" className="font-label-bold text-stark-black uppercase">Year</label>
                                <select
                                    id="reg-year"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border focus:ring-2 focus:ring-electric-blue focus:outline-none"
                                    required
                                >
                                    <option value="" disabled>Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                    <option value="5">5th Year / Dual</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="reg-email" className="font-label-bold text-stark-black uppercase">Secure Email</label>
                            <input
                                id="reg-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                                placeholder="comm_link@codesrijan.com"
                                className="w-full bg-surface py-3 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="reg-password" className="font-label-bold text-stark-black uppercase">Password Matrix</label>
                            <div className="relative">
                                <input
                                    id="reg-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Create a strong password (min 8 characters)"
                                    className="w-full bg-surface py-3 px-4 pr-12 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue focus:-translate-y-1 transition-transform"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-gray hover:text-electric-blue"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        <button 
                            id="reg-submit-btn"
                            type="submit" 
                            disabled={loading}
                            className={`mt-8 w-full text-pure-white py-5 font-headline-md italic uppercase brutal-border brutal-shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${loading ? 'bg-surface-variant text-slate-gray' : 'bg-electric-blue hover:bg-stark-black hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'}`}
                        >
                            {loading ? 'GENERATING...' : 'GENERATE IDENTITY'} {!loading && <span className="material-symbols-outlined">how_to_reg</span>}
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
