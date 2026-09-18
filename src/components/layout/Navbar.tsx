import { Link } from "@tanstack/react-router";
import { useAppStore } from "../../lib/store";

export function Navbar() {
    const { currentUser } = useAppStore();

    return (
        <nav className="w-full sticky top-0 z-50 bg-surface dark:bg-ink-black border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto">
                <Link to="/" className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">
                    CodeSrijan
                </Link>
                <div className="hidden md:flex gap-8 items-center font-button-text text-button-text">
                    {currentUser ? (
                        <>
                            <Link to="/problems" className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" activeProps={{ className: "text-electric-blue border-b-2 border-electric-blue pb-1" }}>Problems</Link>
                            <Link to="/recruitment" className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" activeProps={{ className: "text-electric-blue border-b-2 border-electric-blue pb-1" }}>Recruitment</Link>
                            <Link to="/leaderboard" className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" activeProps={{ className: "text-electric-blue border-b-2 border-electric-blue pb-1" }}>Leaderboard</Link>
                        </>
                    ) : (
                        <Link to="/about" className="text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" activeProps={{ className: "text-electric-blue border-b-2 border-electric-blue pb-1" }}>About Platform</Link>
                    )}
                </div>
                <div className="hidden md:block">
                    {currentUser ? (
                        <Link to="/dashboard" className="bg-ink-black text-surface-bright font-button-text text-button-text px-6 py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <div className="flex gap-4">
                            <Link to="/login" className="bg-surface text-ink-black font-button-text text-button-text px-6 py-3 border-2 border-ink-black transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                Login
                            </Link>
                            <Link to="/register" className="bg-electric-blue text-on-primary font-button-text text-button-text px-6 py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200">
                                Register Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
