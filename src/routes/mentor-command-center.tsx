import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";

export const Route = createFileRoute("/mentor-command-center")({
  component: Page5,
  head: () => ({
    meta: [
      { title: "Mentor Command Center | CodeSrijan" },
    ],
  }),
});

function Page5() {
  const { currentUser } = useAppStore();
  const [teams, setTeams] = useState<any[]>([]);

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

  useEffect(() => {
    if (currentUser?.role === 'mentor' || currentUser?.role === 'admin') {
      const token = localStorage.getItem("codesrijan_auth_token");
      axios.get(`${API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setTeams(res.data))
        .catch(err => console.error("Could not fetch teams for mentor view", err));
    }
  }, [currentUser, API_URL]);

  if (!currentUser) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*Top Navigation (Generated from JSON)*/}
      {/*Main Dashboard Content*/}
      <main className="flex-grow max-w-[1200px] mx-auto px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/*Header*/}
        <header className="col-span-12 mb-8">
          <h1 className="font-headline-lg text-headline-lg mb-2">Mentor Command Center</h1>
          <p className="font-body-lg text-body-lg text-text-muted">Overview of your assigned teams and schedule.</p>
        </header>
        {/*Left Column: Teams & Resources*/}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-12">
          {/*Assigned Teams*/}
          <section>
            <h2 className="font-headline-md text-headline-md mb-6 border-b-2 border-ink-black pb-2 inline-block">Global Active Teams</h2>
            <div className="flex flex-col gap-6">
              {teams.filter(t => !t.isSubmitted).length === 0 ? (
                <div className="neo-brutal-card p-6 text-center text-text-muted font-mono font-bold tracking-widest uppercase">
                  No teams currently in forming or active phase.
                </div>
              ) : (
                teams.filter(t => !t.isSubmitted).map(team => (
                  <div key={team.id} className="neo-brutal-card p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-button-text text-button-text text-xl">{team.name}</h3>
                        <span className="inline-block mt-2 font-label-caps text-label-caps bg-secondary-fixed text-on-secondary-fixed px-2 py-1 border border-ink-black">
                          {team.problemStatementId || 'General Track'}
                        </span>
                      </div>
                      <button className="neo-brutal-btn px-4 py-2 font-button-text text-button-text flex items-center gap-2" onClick={() => window.location.href = '/mentor'}>
                        <span className="material-symbols-outlined">video_camera_front</span> Join Meet
                      </button>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between mb-1 font-body-md text-body-md font-bold">
                        <span>Progress Level</span>
                        <span>{team.memberIds?.length || 1} / {team.maxMembers || 4} Members</span>
                      </div>
                      <div className="w-full bg-surface-container h-4 border-2 border-ink-black relative overflow-hidden">
                        <div className="bg-electric-blue h-full" style={{ width: `${((team.memberIds?.length || 1) / (team.maxMembers || 4)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
          {/*Technical Resources*/}
          <section>
            <h2 className="font-headline-md text-headline-md mb-6 border-b-2 border-ink-black pb-2 inline-block">Quick Docs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <a className="neo-brutal-card p-6 flex items-center gap-4 group cursor-pointer hover:bg-electric-blue hover:text-white transition-colors" href="/" >
                <span className="material-symbols-outlined text-4xl group-hover:text-white">api</span>
                <div>
                  <h4 className="font-button-text text-button-text">API Guides</h4>
                  <p className="font-body-md text-body-md opacity-80">Official sponsor endpoints</p>
                </div>
              </a>
              <a className="neo-brutal-card p-6 flex items-center gap-4 group cursor-pointer hover:bg-electric-blue hover:text-white transition-colors" href="/" >
                <span className="material-symbols-outlined text-4xl group-hover:text-white">rocket_launch</span>
                <div>
                  <h4 className="font-button-text text-button-text">Deployment</h4>
                  <p className="font-body-md text-body-md opacity-80">Vercel &amp; AWS setups</p>
                </div>
              </a>
            </div>
          </section>
        </div>
        {/*Right Column: Schedule & Feed*/}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-12">
          {/*Mentorship Schedule*/}
          <section className="neo-brutal-card p-6 bg-surface-bright">
            <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">calendar_month</span> Schedule
            </h2>
            <div className="flex flex-col gap-4">
              <div className="border-l-4 border-electric-blue pl-4 py-2 relative">
                <div className="absolute w-3 h-3 bg-electric-blue border-2 border-ink-black rounded-full -left-[8px] top-4"></div>
                <p className="font-label-caps text-label-caps text-text-muted mb-1">10:00 AM - 10:30 AM</p>
                <p className="font-button-text text-button-text">Team Alpha Strike</p>
                <p className="font-body-md text-body-md text-sm">Architecture Review</p>
              </div>
              <div className="border-l-4 border-ink-black pl-4 py-2 relative opacity-60">
                <div className="absolute w-3 h-3 bg-ink-black rounded-full -left-[8px] top-4"></div>
                <p className="font-label-caps text-label-caps text-text-muted mb-1">11:30 AM - 12:00 PM</p>
                <p className="font-button-text text-button-text">Byte Me</p>
                <p className="font-body-md text-body-md text-sm">Smart Contract Audit</p>
              </div>
            </div>
            <button className="mt-6 w-full neo-brutal-btn px-4 py-3 font-button-text text-button-text text-center">Manage Calendar</button>
          </section>
          {/*Global Feed*/}
          <section className="neo-brutal-card p-6 bg-surface-container-low">
            <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">notifications_active</span> Alerts
            </h2>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px]">
              <div className="bg-surface p-4 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-label-caps text-label-caps text-electric-blue mb-1">Milestone Reached</p>
                <p className="font-body-md text-body-md"><strong>Team Alpha Strike</strong> just completed their initial MVP deployment.</p>
                <p className="font-label-caps text-label-caps text-xs text-text-muted mt-2">10 mins ago</p>
              </div>
              <div className="bg-error-container p-4 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-on-error-container">
                <p className="font-label-caps text-label-caps mb-1">Help Request</p>
                <p className="font-body-md text-body-md"><strong>Null Pointers</strong> need immediate assistance with MongoDB connection.</p>
                <p className="font-label-caps text-label-caps text-xs mt-2 opacity-80">25 mins ago</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      {/*Footer (Generated from JSON)*/}
    </div>
  );
}
