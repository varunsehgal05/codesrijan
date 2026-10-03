import { Link } from "@tanstack/react-router";
import { useAppStore } from "../../lib/store";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const { currentUser, isLoaded } = useAppStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const renderNavLinks = (isMobile = false) => {
        const linkClasses = isMobile 
            ? "block text-ink-black dark:text-surface-bright text-lg py-2" 
            : "text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200 whitespace-nowrap";
        
        const activeClasses = isMobile ? "text-electric-blue font-bold" : "text-electric-blue border-b-2 border-electric-blue pb-1";

        if (!isLoaded) return null;

        if (currentUser) {
            return (
                <>
                    <Link to="/problems" className={linkClasses} activeProps={{ className: activeClasses }} onClick={() => isMobile && toggleMobileMenu()}>Problems</Link>
                    <Link to="/recruitment" className={linkClasses} activeProps={{ className: activeClasses }} onClick={() => isMobile && toggleMobileMenu()}>Recruitment</Link>
                    <Link to="/announcements" className={linkClasses} activeProps={{ className: activeClasses }} onClick={() => isMobile && toggleMobileMenu()}>Announcements</Link>
                    <Link to="/leaderboard" className={linkClasses} activeProps={{ className: activeClasses }} onClick={() => isMobile && toggleMobileMenu()}>Leaderboard</Link>
                    <Link to="/chat" className={linkClasses} activeProps={{ className: activeClasses }} onClick={() => isMobile && toggleMobileMenu()}>Comms</Link>
                    <Link to="/support" className={linkClasses} activeProps={{ className: activeClasses }} onClick={() => isMobile && toggleMobileMenu()}>Help & Support</Link>
                </>
            );
        }
        
        return <Link to="/about" className={linkClasses} activeProps={{ className: activeClasses }} onClick={() => isMobile && toggleMobileMenu()}>About Platform</Link>;
    };

    return (
        <nav className="w-full sticky top-0 z-50 bg-surface dark:bg-ink-black border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center px-4 xl:px-8 py-4 max-w-[1400px] mx-auto overflow-x-visible">
                {/* Logo */}
                <Link to="/" className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright shrink-0">
                    CodeSrijan
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden xl:flex gap-4 2xl:gap-6 items-center font-button-text text-button-text mx-4 flex-wrap justify-center">
                    {!isLoaded ? (
                        <div className="flex gap-4 animate-pulse">
                            <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="w-28 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    ) : renderNavLinks()}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden xl:flex shrink-0 gap-3 2xl:gap-4 pr-1">
                    {!isLoaded ? (
                        <div className="flex gap-4 animate-pulse">
                            <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                    ) : currentUser ? (
                        <>
                            {currentUser.role === 'admin' && (
                                <Link to="/admin" className="bg-electric-blue text-pure-white font-button-text text-button-text px-4 py-2 lg:px-6 lg:py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200 flex items-center gap-2 whitespace-nowrap">
                                    <span className="material-symbols-outlined text-[18px]">shield_person</span>
                                    Admin Panel
                                </Link>
                            )}
                            <Link to="/dashboard" className="bg-ink-black text-surface-bright font-button-text text-button-text px-4 py-2 lg:px-6 lg:py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200 whitespace-nowrap">
                                Go to Dashboard
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="bg-surface text-ink-black font-button-text text-button-text px-4 py-2 lg:px-6 lg:py-3 border-2 border-ink-black transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                                Login
                            </Link>
                            <Link to="/register" className="bg-electric-blue text-on-primary font-button-text text-button-text px-4 py-2 lg:px-6 lg:py-3 brutal-border brutal-shadow brutal-hover brutal-active transition-all duration-200 whitespace-nowrap">
                                Register Now
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger Button */}
                <div className="xl:hidden flex items-center ml-auto">
                    <button onClick={toggleMobileMenu} className="p-2 text-ink-black dark:text-surface-bright focus:outline-none">
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="xl:hidden absolute top-full left-0 w-full bg-surface dark:bg-ink-black border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col px-6 py-6 gap-2">
                    {renderNavLinks(true)}
                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t-2 border-ink-black">
                        {currentUser ? (
                            <>
                                {currentUser.role === 'admin' && (
                                    <Link to="/admin" onClick={toggleMobileMenu} className="bg-electric-blue text-pure-white font-button-text text-button-text px-4 py-3 brutal-border brutal-shadow text-center flex justify-center items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">shield_person</span>
                                        Admin Panel
                                    </Link>
                                )}
                                <Link to="/dashboard" onClick={toggleMobileMenu} className="bg-ink-black text-surface-bright font-button-text text-button-text px-4 py-3 brutal-border brutal-shadow text-center">
                                    Go to Dashboard
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={toggleMobileMenu} className="bg-surface text-ink-black font-button-text text-button-text px-4 py-3 border-2 border-ink-black text-center">
                                    Login
                                </Link>
                                <Link to="/register" onClick={toggleMobileMenu} className="bg-electric-blue text-on-primary font-button-text text-button-text px-4 py-3 brutal-border brutal-shadow text-center">
                                    Register Now
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
