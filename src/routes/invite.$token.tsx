import { createFileRoute, Link, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/invite/$token")({
    component: TeamInviteComponent,
});

function TeamInviteComponent() {
    const { token } = Route.useParams();

    // Mock team payload based on token
    const teamContext = {
        teamName: "Neural Networks & Chill",
        roleNeeded: "Fullstack Architect",
        inviter: "@master_coder",
    };

    return (
        <div className="min-h-screen bg-stark-black bg-pattern flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative elements */}
            <div className="absolute -left-1/4 top-1/4 w-[800px] h-[200px] bg-electric-blue opacity-20 transform -rotate-45 blur-3xl rounded-full"></div>
            <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-destructive opacity-10 blur-3xl rounded-full pointer-events-none"></div>

            <div className="w-full max-w-2xl bg-pure-white brutal-border brutal-shadow-lg p-0 relative z-10 flex flex-col items-center">

                {/* Top Warning Ribbon */}
                <div className="w-full bg-electric-blue border-b-2 border-stark-black p-3 text-center">
                    <p className="font-code-snippet text-pure-white font-bold tracking-[0.2em] text-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined sync-pulse text-[16px]">priority_high</span>
                        DRAFT INVITATION INTERCEPTED
                        <span className="material-symbols-outlined sync-pulse text-[16px]">priority_high</span>
                    </p>
                </div>

                <div className="w-full p-8 md:p-12 border-b-4 border-stark-black flex flex-col items-center text-center">
                    <h1 className="font-display-lg text-headline-xl md:text-[64px] leading-none uppercase mb-6 transform -skew-x-3 text-stark-black drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        YOU'VE BEEN <br />
                        <span className="text-electric-blue">DRAFTED.</span>
                    </h1>

                    <p className="font-body-lg text-on-surface-variant max-w-md mx-auto mb-8">
                        Your tactical skills are required. <strong className="text-stark-black">{teamContext.inviter}</strong> has invited you to join the hack squad:
                    </p>

                    <div className="bg-surface-container w-full p-6 brutal-border">
                        <h3 className="font-display-lg text-headline-md uppercase text-deep-navy mb-2">"{teamContext.teamName}"</h3>
                        <div className="inline-block bg-stark-black text-pure-white font-label-caps tracking-widest px-4 py-2 mt-2">
                            ROLE: {teamContext.roleNeeded}
                        </div>
                    </div>
                </div>

                <div className="w-full p-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-container-lowest">
                    <Link to="/" className="w-full md:w-auto text-center bg-pure-white text-stark-black px-8 py-4 font-label-bold brutal-border brutal-shadow-hover transition-all hover:-translate-y-1">
                        DECLINE DRAFT
                    </Link>
                    <button className="w-full md:w-auto text-center bg-electric-blue text-pure-white px-10 py-5 font-headline-md italic uppercase brutal-border brutal-shadow-lg transition-all hover:bg-deep-navy hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3">
                        ACCEPT & DEPLOY <span className="material-symbols-outlined">rocket_launch</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
