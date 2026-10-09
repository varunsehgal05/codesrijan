import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/host-event")({
    component: HostEventPage,
});

function HostEventPage() {
    const [formData, setFormData] = useState({
        institutionName: "",
        coordinatorEmail: "",
        eventType: "Offline Hackathon Round",
        estimatedCapacity: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const subject = encodeURIComponent(`Host CodeSrijan Event Proposal - ${formData.institutionName}`);
        const body = encodeURIComponent(
            `Hello CodeSrijan Team,\n\nWe are interested in hosting a CodeSrijan event at our campus. Here are the details:\n\n` +
            `Institution Name: ${formData.institutionName}\n` +
            `Coordinator Email: ${formData.coordinatorEmail}\n` +
            `Event Type: ${formData.eventType}\n` +
            `Estimated Capacity: ${formData.estimatedCapacity}\n\n` +
            `Looking forward to partnering with you.\n\nBest Regards,\n${formData.institutionName} Coordinator`
        );

        window.location.href = `mailto:codesrijan@gmail.com?subject=${subject}&body=${body}`;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col relative overflow-hidden font-sans">
            {/* Background elements for modern look */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-electric-blue rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse" style={{animationDelay: "2s"}}></div>
            </div>

            <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-12 flex flex-col md:flex-row gap-16 relative z-10">

                {/* Left Column */}
                <div className="w-full md:w-1/2 flex flex-col gap-8 justify-center">
                    <div className="mb-2">
                        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-electric-blue transition-colors group w-fit cursor-pointer uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                            Go Back
                        </button>
                    </div>

                    <div>
                        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-white mb-6">
                            Host <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-purple-500">CodeSrijan</span><br/> in your Campus
                        </h1>
                        <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                            Partner with us to organize localized rounds, community meetups, or host the grand finale. Tap into our hacker network and robust platform infrastructure to elevate your institution's tech culture.
                        </p>
                    </div>

                    <div className="flex flex-col gap-5 mt-4">
                        <div className="group flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm cursor-default">
                            <div className="bg-electric-blue/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-electric-blue text-[28px]">campaign</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-100 mb-1">Massive Reach</h3>
                                <p className="text-gray-400 text-sm">Access an active community of 10,000+ registered hackers and developers across the country.</p>
                            </div>
                        </div>
                        <div className="group flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm cursor-default">
                            <div className="bg-purple-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined text-purple-400 text-[28px]">dashboard_customize</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-100 mb-1">Event Telemetry</h3>
                                <p className="text-gray-400 text-sm">Track offline footfall, manage registrations, and monitor submissions via our admin dashboard.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="w-full md:w-1/2 flex items-center">
                    <div className="w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-electric-blue to-purple-500 opacity-20 blur-2xl"></div>
                        
                        <h2 className="text-2xl font-bold text-white mb-2">Partnership Application</h2>
                        <p className="text-gray-400 text-sm mb-8">Fill out the details below and our team will get in touch.</p>
                        
                        <form className="flex flex-col gap-5 relative z-10" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Institution Name</label>
                                <input 
                                    name="institutionName"
                                    value={formData.institutionName}
                                    onChange={handleChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent transition-all" 
                                    placeholder="e.g. Neo Tech Institute" 
                                    type="text" 
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Coordinator Email</label>
                                <input 
                                    name="coordinatorEmail"
                                    value={formData.coordinatorEmail}
                                    onChange={handleChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent transition-all" 
                                    placeholder="hello@institute.edu" 
                                    type="email" 
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Event Type</label>
                                <div className="relative">
                                    <select 
                                        name="eventType"
                                        value={formData.eventType}
                                        onChange={handleChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent transition-all appearance-none cursor-pointer"
                                    >
                                        <option className="bg-gray-800 text-white" value="Offline Hackathon Round">Offline Hackathon Round</option>
                                        <option className="bg-gray-800 text-white" value="Online Workshop Series">Online Workshop Series</option>
                                        <option className="bg-gray-800 text-white" value="Pre-Event Meetup">Pre-Event Meetup</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Estimated Capacity</label>
                                <input 
                                    name="estimatedCapacity"
                                    value={formData.estimatedCapacity}
                                    onChange={handleChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent transition-all" 
                                    placeholder="Number of attendees" 
                                    type="number"
                                    min="10"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="mt-4 w-full bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-500 hover:to-electric-blue text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <span>Send Proposal</span>
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            </button>
                        </form>
                    </div>
                </div>

            </main>
        </div>
    );
}
