import { Link } from "@tanstack/react-router";

export function Footer() {
    return (
        <footer className="w-full mt-auto bg-[#0a0f1d] text-white border-t-4 border-stark-black font-mono shrink-0 relative z-10">
            {/* Top accent line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-electric-blue via-yellow-400 to-purple-600" />

            <div className="max-w-[1300px] w-full mx-auto px-4 sm:px-6 md:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b-2 border-zinc-800">
                    {/* Brand Column */}
                    <div className="space-y-4 md:col-span-1">
                        <Link to="/" className="inline-flex items-center gap-3 group">
                            <img
                                src="/codesrijan-icon.png"
                                alt="CodeSrijan Logo"
                                className="w-8 h-8 object-contain group-hover:scale-105 transition-transform bg-white/10 p-1 rounded-xs border border-zinc-700"
                            />
                            <span className="font-display-lg text-2xl font-black uppercase tracking-tight text-white group-hover:text-electric-blue transition-colors">
                                Code<span className="text-electric-blue">Srijan</span>
                            </span>
                        </Link>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            The student-driven competitive hackathon matrix. Form squads, build payloads, and deploy artifacts under zero-cost infrastructure.
                        </p>
                        <div className="inline-flex items-center gap-2 bg-[#060a14] border border-zinc-700 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>MAINFRAME LIVE // 99.98% UPTIME</span>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-electric-blue mb-3 pb-1 border-b border-zinc-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">terminal</span> ARENA & MISSIONS
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li><Link to="/hackathons" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Hackathons Directory</Link></li>
                            <li><Link to="/problems" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Problem Statements</Link></li>
                            <li><Link to="/recruitment" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Squad Directorate</Link></li>
                            <li><Link to="/leaderboard" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Global Leaderboard</Link></li>
                            <li><Link to="/timeline" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Milestones & Timeline</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-electric-blue mb-3 pb-1 border-b border-zinc-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">support_agent</span> COMMS & SUPPORT
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li><Link to="/ai-assistant" className="text-zinc-300 hover:text-white hover:underline transition-colors block">SrijanBot AI Copilot</Link></li>
                            <li><Link to="/chat" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Comms Command Hub</Link></li>
                            <li><Link to="/announcements" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Directives & Announcements</Link></li>
                            <li><Link to="/support" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Support Desk & SOS</Link></li>
                            <li><Link to="/faq" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Frequently Asked Questions</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-electric-blue mb-3 pb-1 border-b border-zinc-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">policy</span> GOVERNANCE & LEGAL
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li><Link to="/sponsors" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Sponsor Network</Link></li>
                            <li><Link to="/code-of-conduct" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Operative Code of Conduct</Link></li>
                            <li><Link to="/privacy-policy" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Data Privacy Policy</Link></li>
                            <li><Link to="/host-event" className="text-zinc-300 hover:text-white hover:underline transition-colors block">Host a Hackathon</Link></li>
                            <li><Link to="/admin-login" className="text-zinc-500 hover:text-zinc-400 block text-[11px] pt-1">Administrative Terminal</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-400 font-mono">
                    <p>© 2026 CodeSrijan. Engineered with zero-cost open architecture for student builders.</p>
                    <div className="flex items-center gap-4 text-[11px]">
                        <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">
                            ZERO-BUDGET ARCHITECTURE
                        </span>
                        <span className="text-electric-blue">SECURE AES-256</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
