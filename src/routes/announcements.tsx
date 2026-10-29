import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/announcements")({
  component: PublicAnnouncements,
  head: () => ({
    meta: [
      { title: "Broadcasts & Bulletins | CodeSrijan" },
      { name: "description", content: "Official event dispatches, platform updates, tournament announcements, and schedule briefings for CodeSrijan." },
    ],
  }),
});

function PublicAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "GLOBAL" | "ARENA" | "HIGH">("ALL");

  useEffect(() => {
    axios.get(`${API_BASE}/announcements`)
      .then(res => {
        setAnnouncements(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load announcements matrix:", err);
        setLoading(false);
      });
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      // Filter by type / priority
      if (filterType === "GLOBAL" && ann.type !== "global") return false;
      if (filterType === "ARENA" && (ann.type === "global" || !ann.targetId)) return false;
      if (filterType === "HIGH") {
        const text = `${ann.title} ${ann.content} ${ann.priority || ''}`.toLowerCase();
        if (!text.includes("urgent") && !text.includes("important") && !text.includes("critical") && !text.includes("high") && ann.priority !== "high") {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (ann.title || "").toLowerCase().includes(q);
        const matchContent = (ann.content || "").toLowerCase().includes(q);
        const matchTarget = (ann.targetId || "").toLowerCase().includes(q);
        return matchTitle || matchContent || matchTarget;
      }
      return true;
    });
  }, [announcements, filterType, searchQuery]);

  const copyShareLink = (annId: string) => {
    const url = `${window.location.origin}/announcements#${annId}`;
    navigator.clipboard.writeText(url);
    toast.success("Broadcast anchor copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-background pb-20 flex flex-col">
      <main className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 flex-grow">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 font-mono text-xs font-bold text-stark-black hover:text-electric-blue transition-colors cursor-pointer bg-pure-white px-3 py-1.5 border-2 border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            RETURN TO PREVIOUS SECTOR
          </button>
          <div className="font-mono text-xs text-zinc-500 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            LIVE BROADCAST FREQUENCY: ACTIVE
          </div>
        </div>

        {/* Master Announcement Header */}
        <header className="bg-pure-white p-6 sm:p-8 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-electric-blue"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-stark-black text-pure-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
                  COMMAND DISPATCH
                </span>
                <span className="text-electric-blue font-mono text-xs font-bold">
                  // OFFICIAL TRANSMISSION LOG
                </span>
              </div>
              <h1 className="font-display-lg text-2xl sm:text-4xl text-stark-black uppercase font-black tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-electric-blue">campaign</span>
                SYSTEM BROADCASTS
              </h1>
              <p className="font-mono text-xs text-zinc-600 mt-2 max-w-2xl leading-relaxed">
                Official tournament directives, deadline updates, rubric calibrations, and operational bulletins published by the CodeSrijan Directorate.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
              <div className="bg-surface-container border-2 border-stark-black p-3 text-center flex-1 md:flex-initial">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block font-bold">DISPATCHES</span>
                <span className="font-display-sm text-xl font-black text-stark-black">{announcements.length}</span>
              </div>
              <div className="bg-surface-container border-2 border-stark-black p-3 text-center flex-1 md:flex-initial">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block font-bold">STATUS</span>
                <span className="font-display-sm text-sm font-black text-emerald-600 uppercase">ONLINE</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-6 pt-6 border-t-2 border-stark-black flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stark-black text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bulletins, keywords, target arenas..."
                className="w-full bg-surface-container border-2 border-stark-black py-2.5 pl-10 pr-3 font-mono text-xs text-stark-black placeholder-zinc-500 outline-none focus:border-electric-blue focus:bg-white transition-all uppercase"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-zinc-500 hover:text-stark-black bg-white px-1.5 py-0.5 border border-stark-black"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {[
                { id: "ALL", label: "ALL BULLETINS", icon: "inbox" },
                { id: "GLOBAL", label: "GLOBAL ONLY", icon: "public" },
                { id: "ARENA", label: "ARENA TARGETED", icon: "sports_esports" },
                { id: "HIGH", label: "HIGH PRIORITY", icon: "priority_high" }
              ].map((tab) => {
                const isSelected = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id as any)}
                    className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-electric-blue text-white border-stark-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-[1.02]"
                        : "bg-surface-container text-stark-black border-stark-black hover:bg-zinc-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Content Stream */}
        <section className="space-y-6">
          {loading ? (
            <div className="bg-pure-white p-16 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
              <span className="material-symbols-outlined text-4xl animate-spin text-electric-blue mb-3 block">sync</span>
              ESTABLISHING LINK TO COMMAND BROADCAST ARRAY...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-pure-white p-16 border-4 border-stark-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-surface-container border-2 border-stark-black rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-zinc-400">notifications_off</span>
              </div>
              <h2 className="font-headline-md text-xl uppercase font-black text-stark-black">
                {searchQuery || filterType !== "ALL" ? "NO MATCHING DISPATCHES" : "NO ACTIVE TRANSMISSIONS"}
              </h2>
              <p className="font-mono text-xs text-zinc-500 uppercase max-w-sm">
                {searchQuery || filterType !== "ALL"
                  ? "No announcements match your search or filter configuration. Reset filters to view all."
                  : "The tournament directorate has not dispersed any alerts across this frequency."}
              </p>
              {(searchQuery || filterType !== "ALL") && (
                <button
                  onClick={() => { setSearchQuery(""); setFilterType("ALL"); }}
                  className="bg-stark-black text-white px-4 py-2 font-mono text-xs font-bold border-2 border-stark-black hover:bg-electric-blue cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  RESET DISPATCH FILTERS
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements.map((ann) => {
                const isGlobal = ann.type === "global";
                const isUrgent = `${ann.title} ${ann.content} ${ann.priority || ''}`.toLowerCase().includes("urgent") ||
                                 `${ann.title} ${ann.content} ${ann.priority || ''}`.toLowerCase().includes("critical") ||
                                 ann.priority === "high";

                return (
                  <article
                    id={ann.id}
                    key={ann.id}
                    className="bg-pure-white border-4 border-stark-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden"
                  >
                    {/* Top Status Strip */}
                    <div className={`p-3 border-b-3 border-stark-black flex justify-between items-center ${
                      isUrgent
                        ? "bg-rose-500 text-white"
                        : isGlobal
                        ? "bg-stark-black text-white"
                        : "bg-electric-blue text-white"
                    }`}>
                      <div className="font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">
                          {isUrgent ? "priority_high" : isGlobal ? "public" : "sports_esports"}
                        </span>
                        <span>{isUrgent ? "CRITICAL ALERT" : isGlobal ? "GLOBAL BULLETIN" : "ARENA TARGETED"}</span>
                        {ann.targetId && (
                          <span className="opacity-80 text-[9px]">({ann.targetId})</span>
                        )}
                      </div>

                      <div className="font-mono text-[9px] uppercase tracking-wider opacity-90">
                        {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : "RECENT"}
                      </div>
                    </div>

                    {/* Main Content Body */}
                    <div className="p-5 flex-grow flex flex-col gap-3">
                      <h3 className="font-headline-md text-lg sm:text-xl font-black uppercase text-stark-black leading-tight">
                        {ann.title}
                      </h3>

                      <div className="font-mono text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed flex-grow">
                        {ann.content}
                      </div>
                    </div>

                    {/* Bottom Metadata & Tools */}
                    <div className="p-3 bg-surface-container border-t-2 border-stark-black flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">
                        REF: {ann.id?.slice(0, 8) || "DISPATCH"}
                      </span>

                      <button
                        onClick={() => copyShareLink(ann.id)}
                        className="text-stark-black hover:text-electric-blue font-bold flex items-center gap-1 cursor-pointer"
                        title="Copy direct anchor link"
                      >
                        <span className="material-symbols-outlined text-xs">share</span>
                        <span>SHARE</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
