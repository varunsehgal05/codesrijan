import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/certificates")({
    component: CertificatesPage,
});

function CertificatesPage() {
    const { currentUser, teams } = useAppStore();
    const [verifyId, setVerifyId] = useState("");
    const [verificationResult, setVerificationResult] = useState<null | { valid: boolean; holder?: string }>(null);

    // Check if current user is eligible for a certificate
    let isEligible = false;
    let userTeam = null;

    if (currentUser?.teamId) {
        userTeam = teams.find(t => t.id === currentUser.teamId);
        if (userTeam?.isSubmitted) {
            isEligible = true;
        }
    }

    const handleVerify = () => {
        // Mock Verification Logic
        if (verifyId.startsWith("CS-") && verifyId.length > 8) {
            setVerificationResult({ valid: true, holder: "Verified Student" });
        } else {
            setVerificationResult({ valid: false });
        }
    };

    const handleGenerate = () => {
        if (!isEligible) {
            alert("You need to submit a project before generating a certificate!");
            return;
        }
        alert(`Certificate generated for ${currentUser?.name}! (Mock PDF Download Triggered)`);
    };

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            {/* Navbar */}
            <nav className="w-full sticky top-0 z-50 bg-surface dark:bg-ink-black border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto">
                    <div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">CodeSrijan</div>
                    <div className="hidden md:flex gap-8 items-center font-button-text text-button-text">
                        <a className="text-ink-black dark:text-surface-bright hover:-translate-y-0.5" href="/problems">Problems</a>
                        <a className="text-ink-black dark:text-surface-bright hover:-translate-y-0.5" href="/leaderboard">Leaderboard</a>
                        <a className="text-electric-blue border-b-2 border-electric-blue pb-1" href="/certificates">Certificates</a>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 space-y-16 w-full">
                {/* Go Back */}
                <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
                    <span className="material-symbols-outlined group-hover:-translate-x-1">arrow_back</span> GO BACK
                </button>

                {/* Hero */}
                <section className="space-y-4">
                    <h1 className="font-display-lg text-display-lg uppercase text-ink-black">Verification Center</h1>
                    <p className="font-body-lg text-body-lg text-surface-variant max-w-2xl">
                        Cryptographically signed proof of participation. Generate your diploma after submitting your hackathon build, or verify an existing certificate ID to ensure authenticity.
                    </p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Generate Card */}
                    <div className="bg-surface-bright brutal-border brutal-shadow p-8 flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-electric-blue rounded-none flex items-center justify-center text-on-primary mb-6 brutal-border">
                                <span className="material-symbols-outlined">workspace_premium</span>
                            </div>
                            <h2 className="font-headline-lg text-ink-black uppercase">Claim Your Diploma</h2>
                            <p className="font-body-md text-surface-variant mt-4 mb-8">
                                Your certificate is permanently unlocked once your team leader submits the final repository link and demo video.
                            </p>
                        </div>

                        <div className="bg-surface-container-low p-4 border-l-4 border-electric-blue mb-6">
                            <p className="font-label-caps text-label-caps text-ink-black mb-1">Status:</p>
                            {isEligible ? (
                                <p className="font-body-md text-success flex items-center gap-2"><span className="material-symbols-outlined">check_circle</span> Submission Verified</p>
                            ) : (
                                <p className="font-body-md text-error flex items-center gap-2"><span className="material-symbols-outlined">cancel</span> Awaiting Project Submission</p>
                            )}
                        </div>

                        <button
                            onClick={handleGenerate}
                            className={`w-full py-4 uppercase font-label-bold brutal-border brutal-shadow flex justify-center items-center gap-2 transition-all ${isEligible ? 'bg-electric-blue text-on-primary brutal-hover brutal-active' : 'bg-surface-container text-surface-variant cursor-not-allowed opacity-50'}`}
                            disabled={!isEligible}
                        >
                            <span className="material-symbols-outlined">download</span> Generate PDF
                        </button>
                    </div>

                    {/* Verify Card */}
                    <div className="bg-surface dark:bg-ink-black brutal-border brutal-shadow p-8 flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-white text-ink-black rounded-none flex items-center justify-center mb-6 brutal-border">
                                <span className="material-symbols-outlined">verified</span>
                            </div>
                            <h2 className="font-headline-lg text-ink-black dark:text-surface-bright uppercase">Verify Authenticity</h2>
                            <p className="font-body-md text-surface-variant mt-4 mb-8">
                                CodeSrijan issues unique identification hashes to all issued diplomas. Enter a Certificate ID below to confirm its validity and recipient.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="e.g. CS-0943-AB"
                                value={verifyId}
                                onChange={(e) => setVerifyId(e.target.value)}
                                className="w-full bg-surface-bright brutal-border p-4 font-body-lg text-ink-black focus:outline-none focus:ring-2 focus:ring-electric-blue"
                            />
                            <button
                                onClick={handleVerify}
                                className="w-full bg-surface-bright text-ink-black border-2 border-ink-black brutal-shadow py-4 uppercase font-label-bold brutal-hover brutal-active transition-all"
                            >
                                Scan Database
                            </button>

                            {verificationResult && (
                                <div className={`mt-4 p-4 brutal-border flex items-start gap-4 animate-fade-in ${verificationResult.valid ? 'bg-success text-on-primary' : 'bg-error text-on-primary'}`}>
                                    <span className="material-symbols-outlined">{verificationResult.valid ? 'verified_user' : 'gpp_bad'}</span>
                                    <div>
                                        <p className="font-label-bold uppercase">{verificationResult.valid ? 'Certificate Valid' : 'Record Not Found'}</p>
                                        {verificationResult.valid && <p className="font-body-sm mt-1">Issued to: {verificationResult.holder}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-ink-black dark:bg-surface-container-lowest w-full mt-auto border-t-4 border-electric-blue px-margin-desktop py-12 text-center text-surface-variant font-body-md">
                © 2026 CodeSrijan. Built for the community.
            </footer>
        </div>
    );
}
