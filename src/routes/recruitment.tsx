import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";

export const Route = createFileRoute("/recruitment")({
  component: Page10,
  head: () => ({
    meta: [
      { title: "Recruitment | CodeSrijan" },
    ],
  }),
});

function Page10() {
  const { currentUser } = useAppStore();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

  useEffect(() => {
    if (currentUser) {
      const token = localStorage.getItem("codesrijan_auth_token");
      axios.get(`${API_URL}/recruitment`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setProfiles(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Could not fetch recruitment profiles", err);
          setLoading(false);
        });
    }
  }, [currentUser, API_URL]);

  if (!currentUser) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
      {/*Main Canvas*/}
      <main className="flex-grow max-w-[1200px] w-full mx-auto px-margin-desktop py-16 flex flex-col gap-12">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>

        {/*Header Section*/}
        <header className="flex flex-col gap-4 md:flex-row justify-between items-end border-b-4 border-ink-black pb-8">
          <div className="max-w-2xl">
            <h1 className="font-headline-lg text-headline-lg text-ink-black uppercase tracking-tight mb-2">Recruitment Marketplace</h1>
            <p className="font-body-lg text-body-lg text-text-muted">Find your squad. Build the next big thing. High-octane networking for developers, designers, and visionaries.</p>
          </div>
          {/*Toggle Find/Join*/}
          <div className="flex bg-surface-container-high neo-border p-1 w-full md:w-auto relative group neo-shadow-sm self-start md:self-end mt-4 md:mt-0">
            {/*Simple CSS active state toggle simulation for demonstration*/}
            <button onClick={() => alert("Currently browsing active squads.")} className="flex-1 md:w-40 px-4 py-2 font-button-text text-button-text text-on-primary bg-electric-blue neo-border neo-shadow transition-all z-10" id="toggle-find">Find a Squad</button>
            <button onClick={() => alert("Switching to Squad Builder...")} className="flex-1 md:w-40 px-4 py-2 font-button-text text-button-text text-ink-black bg-surface hover:bg-surface-variant transition-all border-y-2 border-r-2 border-transparent hover:border-ink-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-1" id="toggle-join">Join a Squad</button>
          </div>
        </header>
        <div className="flex flex-col md:flex-row gap-gutter relative">
          {/*Filters Sidebar*/}
          <aside className="w-full md:w-1/4 flex flex-col gap-8 sticky top-[120px] h-fit">
            <div className="bg-surface neo-border p-6 neo-shadow flex flex-col gap-6">
              <h2 className="font-headline-md text-headline-md text-ink-black flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>filter_alt</span>
                Filters
              </h2>
              {/*Roles Filter*/}
              <div className="flex flex-col gap-3">
                <h3 className="font-label-caps text-label-caps text-ink-black uppercase border-b-2 border-ink-black pb-1">Roles</h3>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input defaultChecked className="neo-checkbox sr-only" type="checkbox" />
                    <div className="w-5 h-5 neo-border bg-surface transition-colors flex items-center justify-center group-hover:bg-surface-variant">
                      <svg className="w-3 h-3 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" /></svg>
                    </div>
                  </div>
                  <span className="font-body-md text-body-md text-ink-black group-hover:text-electric-blue">Frontend</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input className="neo-checkbox sr-only" type="checkbox" />
                    <div className="w-5 h-5 neo-border bg-surface transition-colors flex items-center justify-center group-hover:bg-surface-variant">
                      <svg className="w-3 h-3 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" /></svg>
                    </div>
                  </div>
                  <span className="font-body-md text-body-md text-ink-black group-hover:text-electric-blue">Backend</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input className="neo-checkbox sr-only" type="checkbox" />
                    <div className="w-5 h-5 neo-border bg-surface transition-colors flex items-center justify-center group-hover:bg-surface-variant">
                      <svg className="w-3 h-3 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="4" /></svg>
                    </div>
                  </div>
                  <span className="font-body-md text-body-md text-ink-black group-hover:text-electric-blue">UI/UX Designer</span>
                </label>
              </div>
              {/*Tech Stack Filter*/}
              <div className="flex flex-col gap-3">
                <h3 className="font-label-caps text-label-caps text-ink-black uppercase border-b-2 border-ink-black pb-1">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="bg-electric-blue text-on-primary font-label-caps text-label-caps px-3 py-1 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">React</button>
                  <button className="bg-surface text-ink-black font-label-caps text-label-caps px-3 py-1 neo-border hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">Python</button>
                  <button className="bg-surface text-ink-black font-label-caps text-label-caps px-3 py-1 neo-border hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">Node.js</button>
                  <button className="bg-surface text-ink-black font-label-caps text-label-caps px-3 py-1 neo-border hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">Figma</button>
                </div>
              </div>
            </div>
          </aside>
          {/*Feed / Cards Area*/}
          <section className="w-full md:w-3/4 flex flex-col gap-8">
            {/*Search Bar*/}
            <div className="w-full relative">
              <input className="w-full bg-surface neo-border p-4 pl-12 font-body-lg text-body-lg text-ink-black focus:outline-none focus:border-electric-blue focus:shadow-[0_0_0_2px_#0035D5] transition-all placeholder:text-outline" placeholder="Search for skills, projects, or users..." type="text" />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-ink-black">search</span>
            </div>
            {/*Grid of Cards (Bento-ish)*/}
            {loading ? (
              <div className="text-center font-mono py-12 text-zinc-500 uppercase">SCANNING RECRUITMENT NODES...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center bg-surface neo-border p-12 mt-8">
                <h2 className="font-headline-md text-ink-black uppercase">No Active Recruits</h2>
                <p className="font-mono text-zinc-500 mt-2">Zero matching profiles found in the registry.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {profiles.map((profile, idx) => (
                  <article key={idx} className="bg-surface neo-border neo-shadow p-6 flex flex-col gap-4 relative group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 neo-border flex items-center justify-center bg-electric-blue text-white overflow-hidden uppercase font-black text-2xl">
                        {(profile.name || "A").substring(0, 1)}
                      </div>
                      <div>
                        <h3 className="font-headline-md text-[24px] leading-tight text-ink-black uppercase mb-1">{profile.name || `User ${profile.userId.substring(0, 5)}`}</h3>
                        <p className="font-body-md text-body-md text-text-muted">{profile.headline || 'Web Developer'}</p>
                      </div>
                    </div>
                    <div className="h-0.5 w-full bg-ink-black my-2"></div>
                    <div className="flex-grow">
                      <p className="font-body-md text-body-md text-ink-black italic">"{profile.bio || 'Looking for an aggressive team focused on fast iteration.'}"</p>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {(profile.skills || ['React', 'Node.js']).map((skill: string, i: number) => (
                        <span key={i} className="font-label-caps text-[12px] bg-canvas-gray neo-border px-2 py-0.5">{skill}</span>
                      ))}
                    </div>
                    <button onClick={() => alert("Dispatching invitation ping... Developer functionality simulated.")} className="mt-4 w-full bg-surface text-ink-black neo-border py-2 font-button-text text-button-text hover:bg-electric-blue hover:text-white transition-colors">Dispatch Invite</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      {/*Footer*/}
    </div>
  );
}
