import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";

export const Route = createFileRoute("/mentor")({
  component: Page2,
  head: () => ({
    meta: [
      { title: "Mentor Control | CodeSrijan" },
    ],
  }),
});

function Page2() {
  const { currentUser } = useAppStore();
  const [teams, setTeams] = useState<any[]>([]);
  const [mentorRequests, setMentorRequests] = useState<any[]>([]);
  const [meetLink, setMeetLink] = useState("");
  const [activeReqId, setActiveReqId] = useState("");

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');

  useEffect(() => {
    if (currentUser?.role === 'mentor' || currentUser?.role === 'admin') {
      const token = localStorage.getItem("codesrijan_auth_token");
      axios.get(`${API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setTeams(res.data))
        .catch(err => console.error("Could not fetch teams for mentor view", err));
        
      axios.get(`${API_URL}/mentor/requests/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setMentorRequests(res.data))
        .catch(err => console.error("Could not fetch mentor requests", err));
    }
  }, [currentUser, API_URL]);

  if (!currentUser) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar (Shared Component)*/}
      {/*Main Content Canvas*/}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-desktop max-md:px-margin-mobile py-stack-lg flex flex-col gap-gutter">
        {/*Dashboard Header*/}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-4 border-ink-black pb-stack-md">
          <div>
            <span className="mono-tag bg-slate-tech text-studio-white px-2 py-1 hard-border-thin inline-block mb-2">[ SYSTEM: ACTIVE ]</span>
            <h1 className="font-headline-xl text-headline-xl max-md:font-headline-lg-mobile max-md:text-headline-lg-mobile text-ink-black uppercase">Mentor Control</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="bg-surface text-ink-black font-label-mono-bold text-label-mono-bold px-4 py-2 hard-border flex items-center gap-2 hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              SYNC DATA
            </button>
          </div>
        </header>

        {/* SOS Signals Grid */}
        <section className="flex flex-col gap-stack-md">
          <h2 className="font-headline-md text-headline-md border-b-2 border-error pb-2 flex items-center gap-2 text-error">
            <span className="material-symbols-outlined">sos</span>
            Active SOS Dispatch Signals
          </h2>
          {mentorRequests.length === 0 ? (
            <div className="bg-studio-white hard-border hard-shadow p-6 text-center font-label-mono-bold">NO DISTRESS SIGNALS DETECTED.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentorRequests.map(req => (
                <article key={req.id} className="bg-studio-white hard-border hard-shadow flex flex-col p-4 border-l-4 border-l-error">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-mono-bold text-xs uppercase bg-error text-white px-2">SQUAD: {req.teamId}</span>
                    <span className={`font-label-mono-bold text-[10px] uppercase px-2 ${req.status === 'pending' ? 'bg-warning' : 'bg-success text-white'}`}>{req.status}</span>
                  </div>
                  <h3 className="font-body-lg font-bold uppercase truncate">{req.topic}</h3>
                  <p className="font-body-md text-on-surface-variant text-sm mt-2 line-clamp-3 mb-4 flex-grow">{req.description}</p>
                  
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="Meet/Zoom Link" className="w-full bg-surface-container font-code-snippet text-xs p-2 border border-ink-black" 
                        onChange={(e) => { setMeetLink(e.target.value); setActiveReqId(req.id); }} 
                        value={activeReqId === req.id ? meetLink : ""}
                      />
                      <button 
                        onClick={async () => {
                          if (!meetLink || activeReqId !== req.id) return alert("Provide a meet link first!");
                          try {
                            const token = localStorage.getItem("codesrijan_auth_token");
                            await axios.post(`${API_URL}/mentor/requests/${req.id}/accept`, { meetLink }, { headers: { Authorization: `Bearer ${token}` } });
                            window.location.reload();
                          } catch(e) { alert("Failed to accept"); }
                        }}
                        className="bg-electric-blue text-white px-3 font-bold hover:bg-black transition-colors"
                      >
                        ACCEPT
                      </button>
                    </div>
                  )}
                  {req.status === 'accepted' && (
                    <div className="bg-surface p-2 mt-2 font-code-snippet text-xs border border-ink-black break-all">
                      Meeting Linked: {req.meetLink}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/*Bento Grid Layout*/}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/*Assigned Teams (Primary - Spans 8 cols on md)*/}
          <section className="md:col-span-8 flex flex-col gap-stack-md">
            <h2 className="font-headline-md text-headline-md border-b-2 border-ink-black pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-electric-blue">group</span>
              Global Active Teams
            </h2>
            <div className="flex flex-col gap-4">
              {teams.filter(t => !t.isSubmitted).length === 0 ? (
                <div className="bg-studio-white hard-border hard-shadow p-6 text-center font-label-mono-bold">NO TEAMS FOUND.</div>
              ) : (
                teams.filter(t => !t.isSubmitted).map((team, index) => (
                  <article key={team.id} className="bg-studio-white hard-border hard-shadow p-0 flex flex-col relative overflow-hidden group">
                    <div className={`${index % 2 === 0 ? 'bg-electric-blue' : 'bg-slate-tech'} px-4 py-2 border-b-2 border-ink-black flex justify-between items-center text-studio-white`}>
                      <span className="font-label-mono-bold text-label-mono-bold uppercase truncate">TEAM: {team.name}</span>
                      <span className="mono-tag bg-ink-black px-2 py-0.5">NOMINAL</span>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-body-lg text-body-lg font-bold">{team.problemStatementId || "General Hackathon"}</h3>
                          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">{team.description || "Building something awesome."}</p>
                        </div>
                        <button onClick={() => window.location.href = '/workspace'} className="bg-surface text-ink-black font-label-mono-bold text-label-mono-bold px-3 py-1 hard-border hard-shadow-hover transition-all flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          WORKSPACE
                        </button>
                      </div>
                      {/*Progress Bar*/}
                      <div className="flex items-center gap-2 w-full mt-2">
                        <span className="mono-tag text-ink-black w-[40px]">{Math.floor(((team.memberIds?.length || 1) / (team.maxMembers || 4)) * 100)}%</span>
                        <div className="h-[12px] bg-surface flex-grow hard-border-thin overflow-hidden flex">
                          <div className={`h-full ${index % 2 === 0 ? 'bg-electric-blue' : 'bg-slate-tech'} border-r border-ink-black`} style={{ width: `${((team.memberIds?.length || 1) / (team.maxMembers || 4)) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
          {/*Right Column (Spans 4 cols on md)*/}
          <section className="md:col-span-4 flex flex-col gap-gutter">
            {/*Priority Alerts*/}
            <div className="bg-studio-white hard-border hard-shadow flex flex-col h-full">
              <div className="bg-ink-black text-studio-white px-4 py-3 border-b-2 border-ink-black flex items-center justify-between">
                <h2 className="font-label-mono-bold text-label-mono-bold uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-electric-blue">notifications_active</span>
                  Priority Alerts
                </h2>
                <span className="bg-error text-studio-white mono-tag px-2 py-0.5">2 NEW</span>
              </div>
              <div className="p-4 flex flex-col gap-4 flex-grow overflow-y-auto max-h-[300px]">
                {/*Alert Item*/}
                <div className="border-l-4 border-error pl-3 py-1">
                  <span className="mono-tag text-error block mb-1">10:42 AM</span>
                  <p className="font-body-md text-body-md font-bold leading-tight">NEURAL_NINJAS requested urgent technical review.</p>
                </div>
                {/*Alert Item*/}
                <div className="border-l-4 border-electric-blue pl-3 py-1">
                  <span className="mono-tag text-electric-blue block mb-1">09:15 AM</span>
                  <p className="font-body-md text-body-md leading-tight">System broadcast: Lunch will be served at 12:30 PM in Hall B.</p>
                </div>
                {/*Alert Item*/}
                <div className="border-l-4 border-slate-tech pl-3 py-1 opacity-60">
                  <span className="mono-tag text-slate-tech block mb-1">08:00 AM</span>
                  <p className="font-body-md text-body-md leading-tight">Hackathon officially started. All repos unlocked.</p>
                </div>
              </div>
            </div>
            {/*Guidance Schedule*/}
            <div className="bg-studio-white hard-border hard-shadow flex flex-col">
              <div className="bg-electric-blue text-studio-white px-4 py-3 border-b-2 border-ink-black">
                <h2 className="font-label-mono-bold text-label-mono-bold uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  Schedule
                </h2>
              </div>
              <div className="p-0">
                {/*Schedule Item*/}
                <div className="flex border-b border-ink-black border-dashed last:border-b-0">
                  <div className="w-20 bg-surface-variant flex flex-col items-center justify-center p-2 border-r border-ink-black">
                    <span className="font-label-mono-bold text-label-mono-bold">11:00</span>
                    <span className="mono-tag text-on-surface-variant">AM</span>
                  </div>
                  <div className="p-3">
                    <p className="font-body-md text-body-md font-bold">Architecture Review</p>
                    <p className="font-label-mono-sm text-label-mono-sm text-on-surface-variant mt-1">TEAM: QUANTUM_LEAP</p>
                  </div>
                </div>
                {/*Schedule Item*/}
                <div className="flex border-b border-ink-black border-dashed last:border-b-0 bg-surface-tint/10">
                  <div className="w-20 bg-electric-blue text-studio-white flex flex-col items-center justify-center p-2 border-r border-ink-black">
                    <span className="font-label-mono-bold text-label-mono-bold">02:30</span>
                    <span className="mono-tag opacity-80">PM</span>
                  </div>
                  <div className="p-3">
                    <p className="font-body-md text-body-md font-bold">Pitch Deck Workshop</p>
                    <p className="font-label-mono-sm text-label-mono-sm text-on-surface-variant mt-1">MAIN STAGE (ALL)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        {/*Quick Docs Grid*/}
        <section className="mt-4 border-t-4 border-ink-black pt-stack-md">
          <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-ink-black">library_books</span>
            Quick Resources
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a className="bg-studio-white p-4 hard-border hard-shadow hard-shadow-hover transition-all flex flex-col items-center justify-center text-center gap-2 group" href="/" >
              <div className="w-12 h-12 bg-slate-tech text-studio-white flex items-center justify-center rounded-none group-hover:bg-electric-blue transition-colors">
                <span className="material-symbols-outlined text-[24px]">api</span>
              </div>
              <span className="font-label-mono-bold text-label-mono-bold uppercase mt-2">API Docs</span>
            </a>
            <a className="bg-studio-white p-4 hard-border hard-shadow hard-shadow-hover transition-all flex flex-col items-center justify-center text-center gap-2 group" href="/" >
              <div className="w-12 h-12 bg-slate-tech text-studio-white flex items-center justify-center rounded-none group-hover:bg-electric-blue transition-colors">
                <span className="material-symbols-outlined text-[24px]">dns</span>
              </div>
              <span className="font-label-mono-bold text-label-mono-bold uppercase mt-2">DB Schema</span>
            </a>
            <a className="bg-studio-white p-4 hard-border hard-shadow hard-shadow-hover transition-all flex flex-col items-center justify-center text-center gap-2 group" href="/" >
              <div className="w-12 h-12 bg-slate-tech text-studio-white flex items-center justify-center rounded-none group-hover:bg-electric-blue transition-colors">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
              </div>
              <span className="font-label-mono-bold text-label-mono-bold uppercase mt-2">Rules</span>
            </a>
            <a className="bg-studio-white p-4 hard-border hard-shadow hard-shadow-hover transition-all flex flex-col items-center justify-center text-center gap-2 group" href="/" >
              <div className="w-12 h-12 bg-slate-tech text-studio-white flex items-center justify-center rounded-none group-hover:bg-electric-blue transition-colors">
                <span className="material-symbols-outlined text-[24px]">support_agent</span>
              </div>
              <span className="font-label-mono-bold text-label-mono-bold uppercase mt-2">Organizer Contact</span>
            </a>
          </div>
        </section>
      </main>
      {/*Footer (Shared Component)*/}
    </div>
  );
}
