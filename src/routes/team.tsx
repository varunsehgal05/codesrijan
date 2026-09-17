import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/team")({
  component: Page6,
});

function Page6() {
  const { currentUser, teams, users, createTeam, joinTeam } = useAppStore();
  const [newTeamName, setNewTeamName] = useState("");
  const [joinTeamId, setJoinTeamId] = useState("");

  const currentTeam = currentUser?.teamId ? teams.find(t => t.id === currentUser.teamId) : null;
  const teamMembers = currentTeam ? currentTeam.members.map(userId => users.find(u => u.id === userId)).filter(Boolean) : [];

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !currentUser) return;
    createTeam(newTeamName, currentUser.id);
  };

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinTeamId || !currentUser) return;
    joinTeam(joinTeamId, currentUser.id);
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      <nav className="bg-surface dark:bg-ink-black w-full sticky top-0 z-50 border-b-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center px-margin-desktop py-4 max-w-[1200px] mx-auto hidden md:flex">
          <div className="font-display-lg text-headline-md font-extrabold text-ink-black dark:text-surface-bright">CodeSrijan</div>
          <div className="flex gap-gutter">
            <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/problems">Problems</a>
            <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/recruitment">Recruitment</a>
            <a className="font-button-text text-button-text text-ink-black dark:text-surface-bright hover:text-electric-blue hover:-translate-y-0.5 transition-transform duration-200" href="/leaderboard">Leaderboard</a>
          </div>
          <button className="bg-electric-blue text-on-primary font-button-text text-button-text px-6 py-2 neo-brutal-button">Register Now</button>
        </div>
      </nav>
      <main className="flex-grow max-w-[1200px] mx-auto w-full px-margin-desktop py-12 flex flex-col gap-12">
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>

        {!currentTeam ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Team */}
            <div className="bg-surface p-8 neo-brutal-card">
              <h1 className="font-display-lg text-headline-lg text-ink-black mb-4">Create Team</h1>
              <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Team Name"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="w-full bg-surface-bright py-4 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none"
                />
                <button type="submit" className="bg-electric-blue text-on-primary font-headline-md px-6 py-4 border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  CREATE SQUAD
                </button>
              </form>
            </div>

            {/* Join Team */}
            <div className="bg-surface p-8 neo-brutal-card">
              <h1 className="font-display-lg text-headline-lg text-ink-black mb-4">Join Team</h1>
              <form onSubmit={handleJoinTeam} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Team ID (e.g., t-12345)"
                  value={joinTeamId}
                  onChange={e => setJoinTeamId(e.target.value)}
                  className="w-full bg-surface-bright py-4 px-4 font-code-snippet text-stark-black brutal-border brutal-shadow-hover focus:outline-none"
                />
                <button type="submit" className="bg-ink-black text-pure-white font-headline-md px-6 py-4 border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  JOIN SQUAD
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <header className="bg-surface p-8 neo-brutal-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="font-display-lg text-display-lg text-ink-black mb-2">{currentTeam.name}</h1>
                <p className="font-body-lg text-body-lg text-text-muted">Team ID: <span className="font-code-snippet text-electric-blue">{currentTeam.id}</span></p>
              </div>
              <div className="flex flex-col gap-2 text-right">
                <span className="font-label-caps text-label-caps text-electric-blue">Active Challenge</span>
                <a className="font-headline-md text-headline-md text-ink-black hover:text-electric-blue underline decoration-2 underline-offset-4" href="/problems">
                  {currentTeam.problemId || "No challenge selected yet"}
                </a>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
              <div className="flex flex-col gap-gutter lg:col-span-1">
                <section className="bg-surface p-6 neo-brutal-card">
                  <h2 className="font-headline-lg text-headline-lg text-ink-black mb-6">Roster</h2>
                  <div className="flex flex-col gap-4">
                    {teamMembers.map(member => (
                      <div key={member?.id} className="flex items-center gap-4 p-4 border-2 border-ink-black bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="w-12 h-12 rounded-full border-2 border-ink-black flex items-center justify-center bg-electric-blue text-white font-bold text-xl uppercase">
                          {(member?.name || "?").charAt(0)}
                        </div>
                        <div className="flex-grow">
                          <div className="font-headline-md text-body-lg font-bold">{member?.name}</div>
                          <div className="font-label-caps text-label-caps text-text-muted">{currentTeam.leaderId === member?.id ? "Team Leader" : "Member"}</div>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-electric-blue border border-ink-black" title="Online"></div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="lg:col-span-2">
                <section className="bg-surface p-6 neo-brutal-card h-full flex flex-col justify-center items-center text-center">
                  <span className="material-symbols-outlined text-6xl text-ink-black mb-4">rocket_launch</span>
                  <h2 className="font-headline-lg text-headline-lg text-ink-black">Ready to build?</h2>
                  <p className="font-body-lg text-text-muted mt-2 mb-6 max-w-sm">Hop into the mission control workspace to start assigning tasks and tracking chat!</p>
                  <a href="/workspace" className="bg-electric-blue text-on-primary font-headline-md px-8 py-4 border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    ENTER WORKSPACE
                  </a>
                </section>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
