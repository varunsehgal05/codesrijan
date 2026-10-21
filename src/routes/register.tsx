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

    // Multi-step state: 1 = Hacker Identity, 2 = Account Security
    const [step, setStep] = useState<1 | 2>(1);

    // Step 1: Hacker Identity
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [handle, setHandle] = useState("");
    const [college, setCollege] = useState("");
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");

    // Step 2: Account Security
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // UI Feedback
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

    // Live Password Criteria Calculations
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const criteriaMetCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
    const getPasswordStrength = () => {
        if (!password) return { label: "", color: "", bg: "", percent: "0%" };
        if (criteriaMetCount <= 1) return { label: "Weak", color: "text-[#F87171]", bg: "bg-[#F87171]", percent: "25%" };
        if (criteriaMetCount <= 3) return { label: "Fair", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]", percent: "60%" };
        return { label: "Strong", color: "text-[#22C55E]", bg: "bg-[#22C55E]", percent: "100%" };
    };
    const strength = getPasswordStrength();

    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

    // Validate Step 1 before proceeding
    const handleContinueToStep2 = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        const errors: Record<string, string> = {};

        if (!name.trim()) errors.name = "First name is required.";
        if (!college.trim()) errors.college = "College/Institute is required.";
        if (!branch) errors.branch = "Please select your academic branch.";
        if (!year) errors.year = "Please select your year of study.";

        setStep1Errors(errors);
        if (Object.keys(errors).length === 0) {
            setStep(2);
        }
    };

    // Final Submission on Step 2
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMsg("Please provide a valid email address.");
            return;
        }

        if (!hasMinLength) {
            setErrorMsg("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match. Please verify both entries.");
            return;
        }

        setLoading(true);
        try {
            const fullName = lastName.trim() ? `${name.trim()} ${lastName.trim()}` : name.trim();
            const resData = await register({
                id: "",
                name: fullName,
                email: email.trim().toLowerCase(),
                password,
                role: "student",
                college: college.trim(),
                branch,
                year,
                handle: handle.trim() ? handle.trim().replace(/^@/, '') : undefined
            });

            // Navigate to OTP verification screen WITHOUT exposing tokens or otp parameters
            navigate({
                to: '/auth/otp',
                search: {
                    uid: resData.userId,
                    email: email.trim().toLowerCase()
                }
            });
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F14] text-[#F4F7FB] flex items-center justify-center p-4 sm:p-8 md:p-10 relative overflow-hidden">
            {/* Subtle atmospheric ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#7C3AED]/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-[#22D3EE]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-2xl bg-[#121A26] border border-[#223249] rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden my-6">
                {/* Header Ribbon */}
                <div className="bg-[#182334] border-b border-[#223249] px-6 py-5 flex items-center justify-between">
                    <Link
                        to="/"
                        className="text-sm font-semibold text-[#A9B5C5] hover:text-[#22D3EE] flex items-center gap-2 transition-colors"
                        aria-label="Return to homepage"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        CodeSrijan Home
                    </Link>
                    <span className="text-xs uppercase tracking-wider font-mono px-2.5 py-1 rounded bg-[#223249] text-[#22D3EE] font-semibold">
                        Season 2026
                    </span>
                </div>

                {/* Progress Stepper Bar */}
                <div className="px-6 sm:px-10 pt-6 pb-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono uppercase tracking-wider text-[#A9B5C5]">
                                Step {step} of 2:
                            </span>
                            <span className="text-sm font-bold text-[#F4F7FB]">
                                {step === 1 ? "Hacker Identity" : "Account Security"}
                            </span>
                        </div>
                        <span className="text-xs font-mono text-[#22D3EE]">
                            {step === 1 ? "50% Complete" : "100% Ready"}
                        </span>
                    </div>

                    {/* Step Indicators */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                                step === 1
                                    ? "bg-[#182334] border-[#7C3AED] shadow-sm shadow-[#7C3AED]/20"
                                    : "bg-[#121A26] border-[#223249] hover:border-[#64748B]"
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    step === 1
                                        ? "bg-[#7C3AED] text-white"
                                        : "bg-[#22C55E]/20 text-[#22C55E]"
                                }`}
                            >
                                {step === 2 ? (
                                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                                ) : (
                                    "1"
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[#F4F7FB] truncate">1. Identity</p>
                                <p className="text-[11px] text-[#A9B5C5] truncate">Academic Profile</p>
                            </div>
                        </button>

                        <div
                            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                                step === 2
                                    ? "bg-[#182334] border-[#7C3AED] shadow-sm shadow-[#7C3AED]/20"
                                    : "bg-[#121A26] border-[#223249] opacity-75"
                            }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    step === 2
                                        ? "bg-[#7C3AED] text-white"
                                        : "bg-[#223249] text-[#A9B5C5]"
                                }`}
                            >
                                2
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[#F4F7FB] truncate">2. Security</p>
                                <p className="text-[11px] text-[#A9B5C5] truncate">Credentials & Email</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Card Content */}
                <div className="p-6 sm:p-10 flex flex-col">
                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F7FB] mb-1">
                            {step === 1 ? "Build Your Hacker Identity" : "Secure Your Credentials"}
                        </h1>
                        <p className="text-sm text-[#A9B5C5]">
                            {step === 1
                                ? "Enter your student and college details to prepare your competition pass."
                                : "Set up your email and password. A 6-digit verification code will be sent to confirm."}
                        </p>
                    </div>

                    {errorMsg && (
                        <div
                            role="alert"
                            className="bg-[#F87171]/10 border border-[#F87171] text-[#F87171] p-4 rounded-xl mb-6 flex items-start gap-3"
                        >
                            <span className="material-symbols-outlined text-xl flex-shrink-0 mt-0.5">error</span>
                            <span className="text-sm font-medium leading-relaxed">{errorMsg}</span>
                        </div>
                    )}

                    {/* STEP 1: HACKER IDENTITY */}
                    {step === 1 && (
                        <form className="flex flex-col gap-5 w-full" onSubmit={handleContinueToStep2} noValidate>
                            {/* Name Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="reg-first-name" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                        First Name <span className="text-[#F87171]">*</span>
                                    </label>
                                    <input
                                        id="reg-first-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (step1Errors.name) setStep1Errors(prev => ({ ...prev, name: "" }));
                                        }}
                                        placeholder="Alex"
                                        autoComplete="given-name"
                                        required
                                        className={`w-full bg-[#182334] text-[#F4F7FB] placeholder-[#64748B] rounded-xl px-4 py-3 min-h-[48px] border transition-all focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
                                            step1Errors.name ? "border-[#F87171]" : "border-[#223249] focus:border-[#7C3AED]"
                                        }`}
                                    />
                                    {step1Errors.name && (
                                        <p className="text-xs text-[#F87171] mt-1">{step1Errors.name}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="reg-last-name" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                        Last Name
                                    </label>
                                    <input
                                        id="reg-last-name"
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Rivera"
                                        autoComplete="family-name"
                                        className="w-full bg-[#182334] text-[#F4F7FB] placeholder-[#64748B] rounded-xl px-4 py-3 min-h-[48px] border border-[#223249] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Hacker Handle */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="reg-handle" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                    Hacker Handle (Optional)
                                </label>
                                <div className="flex items-center rounded-xl bg-[#182334] border border-[#223249] focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/30 transition-all overflow-hidden">
                                    <span className="px-3.5 py-3 font-mono text-sm text-[#22D3EE] bg-[#223249]/50 select-none">
                                        @
                                    </span>
                                    <input
                                        id="reg-handle"
                                        type="text"
                                        value={handle}
                                        onChange={(e) => setHandle(e.target.value)}
                                        placeholder="cyber_pilot"
                                        className="w-full bg-transparent px-3 py-3 min-h-[48px] text-[#F4F7FB] placeholder-[#64748B] focus:outline-none font-mono text-sm"
                                    />
                                </div>
                                <p className="text-[11px] text-[#64748B]">Display name for leaderboards and team chat.</p>
                            </div>

                            {/* College / Institution */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="reg-college" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                    College / University <span className="text-[#F87171]">*</span>
                                </label>
                                <input
                                    id="reg-college"
                                    type="text"
                                    value={college}
                                    onChange={(e) => {
                                        setCollege(e.target.value);
                                        if (step1Errors.college) setStep1Errors(prev => ({ ...prev, college: "" }));
                                    }}
                                    autoComplete="organization"
                                    placeholder="e.g. National Institute of Technology"
                                    required
                                    className={`w-full bg-[#182334] text-[#F4F7FB] placeholder-[#64748B] rounded-xl px-4 py-3 min-h-[48px] border transition-all focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
                                        step1Errors.college ? "border-[#F87171]" : "border-[#223249] focus:border-[#7C3AED]"
                                    }`}
                                />
                                {step1Errors.college && (
                                    <p className="text-xs text-[#F87171] mt-1">{step1Errors.college}</p>
                                )}
                            </div>

                            {/* Academic Branch & Year */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="reg-branch" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                        Branch / Stream <span className="text-[#F87171]">*</span>
                                    </label>
                                    <select
                                        id="reg-branch"
                                        value={branch}
                                        onChange={(e) => {
                                            setBranch(e.target.value);
                                            if (step1Errors.branch) setStep1Errors(prev => ({ ...prev, branch: "" }));
                                        }}
                                        required
                                        className={`w-full bg-[#182334] text-[#F4F7FB] rounded-xl px-4 py-3 min-h-[48px] border transition-all focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
                                            step1Errors.branch ? "border-[#F87171]" : "border-[#223249] focus:border-[#7C3AED]"
                                        }`}
                                    >
                                        <option value="" disabled className="bg-[#182334] text-[#64748B]">Select Academic Branch</option>
                                        <option value="CSE" className="bg-[#182334]">Computer Science & Engineering (CSE)</option>
                                        <option value="IT" className="bg-[#182334]">Information Technology (IT)</option>
                                        <option value="AI_DS" className="bg-[#182334]">AI & Data Science</option>
                                        <option value="ECE" className="bg-[#182334]">Electronics & Communication (ECE)</option>
                                        <option value="EE" className="bg-[#182334]">Electrical Engineering (EE)</option>
                                        <option value="ME" className="bg-[#182334]">Mechanical Engineering (ME)</option>
                                        <option value="CE" className="bg-[#182334]">Civil Engineering (CE)</option>
                                        <option value="Other" className="bg-[#182334]">Other / Interdisciplinary</option>
                                    </select>
                                    {step1Errors.branch && (
                                        <p className="text-xs text-[#F87171] mt-1">{step1Errors.branch}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="reg-year" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                        Year of Study <span className="text-[#F87171]">*</span>
                                    </label>
                                    <select
                                        id="reg-year"
                                        value={year}
                                        onChange={(e) => {
                                            setYear(e.target.value);
                                            if (step1Errors.year) setStep1Errors(prev => ({ ...prev, year: "" }));
                                        }}
                                        required
                                        className={`w-full bg-[#182334] text-[#F4F7FB] rounded-xl px-4 py-3 min-h-[48px] border transition-all focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
                                            step1Errors.year ? "border-[#F87171]" : "border-[#223249] focus:border-[#7C3AED]"
                                        }`}
                                    >
                                        <option value="" disabled className="bg-[#182334] text-[#64748B]">Select Current Year</option>
                                        <option value="1" className="bg-[#182334]">1st Year (Freshman)</option>
                                        <option value="2" className="bg-[#182334]">2nd Year (Sophomore)</option>
                                        <option value="3" className="bg-[#182334]">3rd Year (Junior)</option>
                                        <option value="4" className="bg-[#182334]">4th Year (Senior)</option>
                                        <option value="5" className="bg-[#182334]">5th Year / Dual Degree / Masters</option>
                                    </select>
                                    {step1Errors.year && (
                                        <p className="text-xs text-[#F87171] mt-1">{step1Errors.year}</p>
                                    )}
                                </div>
                            </div>

                            {/* Continue to Step 2 Action */}
                            <button
                                type="submit"
                                className="mt-4 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-[#F4F7FB] font-bold py-3.5 px-6 rounded-xl min-h-[48px] shadow-lg shadow-[#7C3AED]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                            >
                                Continue to Account Security
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        </form>
                    )}

                    {/* STEP 2: ACCOUNT SECURITY */}
                    {step === 2 && (
                        <form className="flex flex-col gap-5 w-full" onSubmit={handleRegister} noValidate>
                            {/* Email Field */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                    Email Address <span className="text-[#F87171]">*</span>
                                </label>
                                <input
                                    id="reg-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="username"
                                    placeholder="hacker@codesrijan.com"
                                    required
                                    className="w-full bg-[#182334] text-[#F4F7FB] placeholder-[#64748B] rounded-xl px-4 py-3 min-h-[48px] border border-[#223249] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 transition-all"
                                />
                                <p className="text-[11px] text-[#64748B]">
                                    Your 6-digit confirmation code will be dispatched to this inbox.
                                </p>
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                    Password <span className="text-[#F87171]">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="reg-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        placeholder="Create a secure password"
                                        required
                                        className="w-full bg-[#182334] text-[#F4F7FB] placeholder-[#64748B] rounded-xl pl-4 pr-12 py-3 min-h-[48px] border border-[#223249] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B5C5] hover:text-[#F4F7FB] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>

                                {/* Live Password Guidance Checklist */}
                                <div className="mt-2 p-3.5 bg-[#182334] border border-[#223249] rounded-xl flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[#A9B5C5]">Password Requirements</span>
                                        {strength.label && (
                                            <span className={`text-xs font-mono font-bold ${strength.color}`}>
                                                {strength.label} Strength
                                            </span>
                                        )}
                                    </div>

                                    {/* Strength Progress Bar */}
                                    {password && (
                                        <div className="w-full bg-[#223249] h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${strength.bg}`}
                                                style={{ width: strength.percent }}
                                            />
                                        </div>
                                    )}

                                    {/* Checklist Items */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs" aria-live="polite">
                                        <div className={`flex items-center gap-2 ${hasMinLength ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                                            <span className="material-symbols-outlined text-base">
                                                {hasMinLength ? "check_circle" : "radio_button_unchecked"}
                                            </span>
                                            <span>At least 8 characters</span>
                                        </div>

                                        <div className={`flex items-center gap-2 ${hasUppercase ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                                            <span className="material-symbols-outlined text-base">
                                                {hasUppercase ? "check_circle" : "radio_button_unchecked"}
                                            </span>
                                            <span>1 uppercase letter (A-Z)</span>
                                        </div>

                                        <div className={`flex items-center gap-2 ${hasNumber ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                                            <span className="material-symbols-outlined text-base">
                                                {hasNumber ? "check_circle" : "radio_button_unchecked"}
                                            </span>
                                            <span>1 numeric digit (0-9)</span>
                                        </div>

                                        <div className={`flex items-center gap-2 ${hasSpecial ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                                            <span className="material-symbols-outlined text-base">
                                                {hasSpecial ? "check_circle" : "radio_button_unchecked"}
                                            </span>
                                            <span>1 special symbol (!@#$)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="reg-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-[#A9B5C5]">
                                    Confirm Password <span className="text-[#F87171]">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="reg-confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                        placeholder="Confirm your password"
                                        required
                                        className={`w-full bg-[#182334] text-[#F4F7FB] placeholder-[#64748B] rounded-xl pl-4 pr-12 py-3 min-h-[48px] border transition-all focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
                                            passwordsMismatch
                                                ? "border-[#F87171]"
                                                : passwordsMatch
                                                ? "border-[#22C55E]"
                                                : "border-[#223249] focus:border-[#7C3AED]"
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B5C5] hover:text-[#F4F7FB] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showConfirmPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>

                                {/* Inline Match Status */}
                                {confirmPassword.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                                        {passwordsMatch ? (
                                            <>
                                                <span className="material-symbols-outlined text-sm text-[#22C55E]">check_circle</span>
                                                <span className="text-[#22C55E] font-medium">Passwords match</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm text-[#F87171]">cancel</span>
                                                <span className="text-[#F87171] font-medium">Passwords do not match</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Dual Navigation Controls */}
                            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-[#182334] hover:bg-[#223249] text-[#A9B5C5] hover:text-[#F4F7FB] border border-[#223249] font-semibold py-3 px-5 rounded-xl min-h-[48px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                    Back to Identity
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading || !hasMinLength || password !== confirmPassword}
                                    className={`w-full sm:flex-1 py-3.5 px-6 font-bold rounded-xl min-h-[48px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25 cursor-pointer ${
                                        loading || !hasMinLength || password !== confirmPassword
                                            ? "bg-[#223249] text-[#64748B] cursor-not-allowed shadow-none"
                                            : "bg-[#7C3AED] hover:bg-[#6D28D9] text-[#F4F7FB] active:scale-[0.99]"
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                            <span>Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Create Account & Verify</span>
                                            <span className="material-symbols-outlined text-lg">verified</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Bottom Login Link */}
                    <div className="mt-8 pt-6 border-t border-[#223249] text-center">
                        <p className="text-xs sm:text-sm text-[#A9B5C5]">
                            Already registered for CodeSrijan?{" "}
                            <Link
                                to="/login"
                                className="font-semibold text-[#22D3EE] hover:text-white underline underline-offset-4 transition-colors"
                            >
                                Initialize Session
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
