import { Link } from "@tanstack/react-router";

export function Footer() {
    return (
        <footer className="bg-ink-black dark:bg-surface-container-lowest w-full mt-auto border-t-4 border-electric-blue flex flex-col md:flex-row justify-between items-start px-margin-desktop py-12 gap-8 shrink-0">
            <div className="font-display-lg text-headline-md text-surface-bright">CodeSrijan</div>
            <div className="flex flex-wrap gap-6 font-body-md text-body-md">
                <Link to="/sponsors" className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300">Sponsors</Link>
                <Link to="/privacy-policy" className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300">Privacy Policy</Link>
                <Link to="/code-of-conduct" className="text-surface-variant hover:text-surface-bright hover:text-electric-blue transition-colors transition-all duration-300">Code of Conduct</Link>
            </div>
            <div className="text-surface-variant font-body-md text-body-md mt-4 md:mt-0">
                © 2026 CodeSrijan. Built for the community.
            </div>
        </footer>
    );
}
