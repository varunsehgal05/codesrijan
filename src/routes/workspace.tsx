import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";

export const Route = createFileRoute("/workspace")({
  component: Page4,
});

function Page4() {
  const { currentUser, teams, users, chatMessages, hackathons, addChatMessage, submitProject, isLoaded } = useAppStore();
  const activeEvent = hackathons[0];
  const [chatInput, setChatInput] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [demoLink, setDemoLink] = useState("");

  const currentTeam = currentUser?.teamId ? teams.find(t => t.id === currentUser.teamId) : null;
  const teamMembers = currentTeam ? currentTeam.members.map(userId => users.find(u => u.id === userId)).filter(Boolean) : [];

  const teamChat = chatMessages.filter(m => m.teamId === currentTeam?.id);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser || !currentTeam) return;
    addChatMessage({
      authorId: currentUser.id,
      authorName: currentUser.name,
      teamId: currentTeam.id,
      content: chatInput.trim()
    });
    setChatInput("");
  };

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

  const handleFinalSubmit = async () => {
    if (!currentTeam || !repoLink) return alert("Repository link is required to submit!");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/submissions`, {
        teamId: currentTeam.id,
        repositoryUrl: repoLink,
        demoUrl: demoLink,
        projectTitle: currentTeam.name + " Project",
        description: "Submitted via CodeSrijan Workspace"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Project submitted successfully! Your submission is now recorded.");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit project.");
    }
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-stark-black flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-pure-white border-t-electric-blue rounded-full animate-spin mb-4"></div>
      <h1 className="font-display-lg text-pure-white text-2xl uppercase tracking-widest animate-pulse">ESTABLISHING SECURE LINK...</h1>
    </div>
  );

  if (!currentUser) return <div className="p-8 text-center bg-black text-white h-screen">Please login first.</div>; if (!currentTeam) {
    return (
      <div className="min-h-screen bg-stark-black p-8 flex items-center justify-center bg-pattern">
        <div className="bg-electric-blue p-10 brutal-border brutal-shadow-lg max-w-2xl w-full text-center flex flex-col items-center gap-6 relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pure-white opacity-10 transform rotate-45 translate-x-16 -translate-y-16"></div>
          <span className="material-symbols-outlined text-6xl text-pure-white mb-2">group_off</span>
          <h1 className="font-display-lg text-4xl text-pure-white uppercase">No Squad Detected</h1>
          <p className="font-body-md text-pure-white font-bold opacity-90 tracking-widest text-sm uppercase">
            You must align with an active team to access the central Workspace Matrix.
          </p>
          <Link to="/team" className="mt-4 px-8 py-4 bg-pure-white text-stark-black font-label-bold brutal-border brutal-shadow-hover hover:-translate-y-1 transition-transform uppercase flex items-center gap-2 group">
            <span className="material-symbols-outlined font-bold transition-transform group-hover:rotate-12">group_add</span>
            ACCESS TEAM HUB
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      {/*Main Workspace*/}
      <main className="flex-grow max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-12 flex flex-col gap-12">
        {/*Mission Control Header*/}
        <header className="bg-studio-white border-2 border-ink-black p-6 md:p-8 neo-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-label-mono-bold text-label-mono-bold text-electric-blue uppercase tracking-widest">[ ACTIVE TEAM: {currentTeam.name} ]</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black">Workspace Control</h1>
          </div>
          <div className="bg-ink-black text-electric-blue border-2 border-electric-blue px-6 py-4 flex flex-col items-center neo-shadow">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-studio-white mb-1">T-Minus Hackathon End</span>
            <CountdownClock targetDate={activeEvent?.submissionDeadline} />
          </div>
        </header>

        {/*Workspace Grid*/}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/*Left Sidebar (Roster & Chat)*/}
          <div className="flex flex-col gap-8 lg:col-span-1">
            {/*Squad Roster*/}
            <section className="bg-studio-white border-2 border-ink-black neo-shadow">
              <div className="bg-electric-blue border-b-2 border-ink-black p-3 flex justify-between items-center">
                <h2 className="font-label-mono-bold text-label-mono-bold text-on-primary uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  Squad Roster
                </h2>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {teamMembers.map(member => (
                  <div key={member?.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-ink-black rounded-none flex justify-center items-center font-bold uppercase relative bg-surface-dim">
                      {(member?.name || "?").charAt(0)}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FF00] border-t-2 border-l-2 border-ink-black"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md font-bold text-ink-black leading-tight">{member?.name}</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-slate-tech uppercase">{member?.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/*Terminal Chat*/}
            <section className="bg-ink-black border-2 border-ink-black neo-shadow flex-grow flex flex-col max-h-[400px]">
              <div className="bg-slate-tech border-b-2 border-ink-black p-3 flex justify-between items-center">
                <h2 className="font-label-mono-bold text-label-mono-bold text-studio-white uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">terminal</span> Commlink
                </h2>
              </div>
              <div className="p-4 flex-grow overflow-y-auto font-label-mono-sm text-label-mono-sm text-[#00FF00] flex flex-col gap-2">
                <p>&gt; System initialized. Secure channel open.</p>
                {teamChat.map(msg => (
                  <p key={msg.id}>&gt; <span className="text-electric-blue">{msg.authorName}:</span> {msg.content}</p>
                ))}
                <p className="mt-auto animate-pulse">_</p>
              </div>
              <form onSubmit={handleSendChat} className="border-t-2 border-ink-black p-2 bg-ink-black flex">
                <span className="text-[#00FF00] font-label-mono-bold text-label-mono-bold p-2">&gt;</span>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#00FF00] font-label-mono-sm text-label-mono-sm w-full focus:ring-0 placeholder:text-outline"
                  placeholder="Type message..." type="text" />
              </form>
            </section>
          </div>

          {/*Kanban Board & Submission*/}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="border-b-4 border-electric-blue pb-2 flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md font-bold text-electric-blue uppercase">In Progress</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-surface-dim border-2 border-dashed border-ink-black p-4 text-center">
                  <span className="material-symbols-outlined text-outline text-3xl mb-2 block">task</span>
                  <h4 className="font-body-md text-text-muted">No active missions detected.</h4>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="border-b-4 border-[#FFA500] pb-2 flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md font-bold text-ink-black uppercase">Final Submission</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-surface-bright border-2 border-ink-black p-4 neo-shadow flex flex-col gap-4">
                  <h4 className="font-headline-md text-ink-black uppercase border-b-2 border-ink-black pb-2">Submit Project</h4>
                  {currentTeam.isSubmitted ? (
                    <div className="text-center p-4 bg-error text-white font-bold border-2 border-ink-black neo-shadow uppercase">
                      Project Received and Locked for Judging!
                    </div>
                  ) : (
                    <>
                      <input
                        value={repoLink}
                        onChange={e => setRepoLink(e.target.value)}
                        className="font-body-sm w-full p-2 border-2 border-ink-black focus:outline-none focus:border-electric-blue" placeholder="GitHub Repository URL" type="url" />
                      <input
                        value={demoLink}
                        onChange={e => setDemoLink(e.target.value)}
                        className="font-body-sm w-full p-2 border-2 border-ink-black focus:outline-none focus:border-electric-blue" placeholder="Live Demo Link (Optional)" type="url" />

                      <button onClick={handleFinalSubmit} className="bg-[#FFA500] text-ink-black font-headline-md uppercase border-2 border-ink-black py-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform mt-2">
                        Mark as Final
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CountdownClock({ targetDate }: { targetDate?: string | undefined }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, active: false });

  useEffect(() => {
    if (!targetDate) return;

    const computeDifference = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) return { h: 0, m: 0, s: 0, active: false };
      return {
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
        active: true
      };
    };

    setTimeLeft(computeDifference());
    const timer = setInterval(() => setTimeLeft(computeDifference()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const hrs = String(timeLeft.h).padStart(2, "0");
  const mins = String(timeLeft.m).padStart(2, "0");
  const secs = String(timeLeft.s).padStart(2, "0");

  return (
    <div className="font-headline-md text-headline-md font-black tracking-widest font-code-snippet" id="countdown-timer">
      {hrs}:{mins}:{secs}
    </div>
  );
}
