import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/profile")({
  component: Page7,
  head: () => ({
    meta: [
      { title: "Profile | CodeSrijan" },
      { name: "description", content: "CodeSrijan profile — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:title", content: "Profile | CodeSrijan" },
      { property: "og:description", content: "CodeSrijan profile — the student-run hackathon platform for builders, mentors and recruiters." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/profile" }],
  }),
});

function Page7() {
  const { currentUser, teams, refetchData } = useAppStore();
  const userName = currentUser?.name || "Alex Chen";
  const currentTeam = teams.find(t => t.id === currentUser?.teamId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(currentUser?.bio || "Full-stack wizard building the future. Focused on decentralized web technologies and high-performance computing.");
  const [techStack, setTechStack] = useState(currentUser?.techStack?.join(", ") || "React, Rust, WebAssembly, Tailwind");
  const [saving, setSaving] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');

  const handleSave = async () => {
    setSaving(true);
    try {
        const token = localStorage.getItem("codesrijan_auth_token");
        await axios.put(`${API_URL}/users/profile`, {
            bio,
            techStack: techStack.split(',').map(s => s.trim()).filter(Boolean)
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (refetchData) await refetchData();
        setIsEditing(false);
    } catch (err) {
        console.error("Failed to save profile", err);
        toast.error("Failed to save profile.");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/*TopNavBar*/}
<main className="flex-grow w-full max-w-[1200px] mx-auto px-margin-desktop py-16 flex flex-col gap-16 md:gap-24">

        {/* Global Go Back Navigation */}
        <div className="w-full mb-6 flex justify-between items-center">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="border-2 border-ink-black px-4 py-2 font-bold hover:bg-electric-blue hover:text-white transition-colors brutal-shadow">
                EDIT PROFILE
            </button>
          ) : (
            <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="border-2 border-ink-black px-4 py-2 font-bold hover:bg-gray-200 transition-colors brutal-shadow" disabled={saving}>
                    CANCEL
                </button>
                <button onClick={handleSave} className="border-2 border-ink-black px-4 py-2 font-bold bg-electric-blue text-white hover:bg-blue-600 transition-colors brutal-shadow" disabled={saving}>
                    {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
            </div>
          )}
        </div>

        {/*Profile Hero*/}
        <section className="flex flex-col md:flex-row items-start gap-8 bg-surface-container-lowest border-2 border-ink-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="shrink-0 relative">
            <img className="w-40 h-40 object-cover border-2 border-ink-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-alt="A striking neo-brutalist digital portrait of a young tech wizard. The avatar features a stylized, vibrant, vector-art style face with electric blue highlights against a crisp white background. Thick black outlines define the features, exuding a modern, high-octane hacker aesthetic." src={currentUser?.profileImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuARxT0_L0dJOF7V_0PDgEWc39tPJBTMiHfgT7ctM62RX9I9WOMp4cLOdOqBoEfDMV6Iio00ydGtvtNlAiHtKy0YPlPK_tl-jabKvUkwbo2AMiPO9NiR9hmMpl1wnQzhEqAAqt0I6rthhXp0C8YUOCwNJNqlD0XjpxX3sG4nPyqc9kWAcPaJiFLt-TDnhFuOu6-nfQDF_N1LIHKo6MJLkATYN0EjfEpa57agOCPSMiqRnYIhHUWyAyDT"} />
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-ink-black tracking-tight">{userName}</h1>
              {isEditing ? (
                  <textarea className="w-full mt-2 p-2 border-2 border-ink-black font-body-lg text-body-lg" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Write your bio..." />
              ) : (
                  <p className="font-body-lg text-body-lg text-text-muted mt-2 max-w-2xl">{bio}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 text-ink-black font-label-caps text-label-caps">
                <span className="material-symbols-outlined" data-icon="location_on" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span>{currentUser?.college || "San Francisco, CA"}</span>
              </div>
              {currentTeam && (
                <div className="flex items-center gap-2 text-ink-black font-label-caps text-label-caps">
                  <span className="material-symbols-outlined" data-icon="group" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span>Squad: <span className="font-bold text-electric-blue">{currentTeam.name}</span> ({currentTeam.id})</span>
                  <Link to="/workspace" className="ml-4 px-3 py-1 bg-electric-blue text-white font-bold text-xs uppercase hover:bg-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">ENTER WORKSPACE</Link>
                </div>
              )}
            </div>
            {/*Tech Stack Grid*/}
            <div className="flex flex-col gap-2 mt-4">
              {isEditing ? (
                  <div>
                    <label className="font-bold text-sm uppercase">Tech Stack (Comma Separated)</label>
                    <input className="w-full mt-1 p-2 border-2 border-ink-black font-body-md" value={techStack} onChange={e => setTechStack(e.target.value)} placeholder="React, Node.js, Python..." />
                  </div>
              ) : (
                  <div className="flex flex-wrap gap-3">
                    {techStack.split(',').map((tech, idx) => (
                        <span key={idx} className="px-4 py-2 bg-yellow-300 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-label-caps text-label-caps text-ink-black uppercase">{tech.trim()}</span>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </section>
        {/*Achievement Gallery*/}
        <section>
          <h2 className="font-headline-md text-headline-md text-ink-black mb-8 border-b-4 border-ink-black inline-block pb-2">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/*Badge 1*/}
            <div className="bg-surface-container-lowest border-2 border-ink-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[4px] hover:-translate-x-[4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col items-center text-center gap-4 group cursor-pointer">
              <div className="w-24 h-24 bg-electric-blue border-2 border-ink-black rounded-full flex items-center justify-center text-on-primary group-hover:bg-yellow-400 group-hover:text-ink-black transition-colors">
                <span className="material-symbols-outlined text-4xl" data-icon="workspace_premium" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <h3 className="font-button-text text-button-text text-ink-black uppercase tracking-wider">Top 10 Finalist</h3>
              <p className="font-body-md text-body-md text-text-muted">Global Hackathon 2023</p>
            </div>
            {/*Badge 2*/}
            <div className="bg-surface-container-lowest border-2 border-ink-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[4px] hover:-translate-x-[4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col items-center text-center gap-4 group cursor-pointer">
              <div className="w-24 h-24 bg-ink-black border-2 border-ink-black rounded-full flex items-center justify-center text-surface-bright group-hover:bg-cyan-400 group-hover:text-ink-black transition-colors">
                <span className="material-symbols-outlined text-4xl" data-icon="shield" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              </div>
              <h3 className="font-button-text text-button-text text-ink-black uppercase tracking-wider">Security Specialist</h3>
              <p className="font-body-md text-body-md text-text-muted">DefCon Qualifier</p>
            </div>
            {/*Badge 3*/}
            <div className="bg-surface-container-lowest border-2 border-ink-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[4px] hover:-translate-x-[4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col items-center text-center gap-4 group cursor-pointer">
              <div className="w-24 h-24 bg-surface border-2 border-ink-black rounded-full flex items-center justify-center text-ink-black group-hover:bg-electric-blue group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-4xl" data-icon="code_blocks" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>code_blocks</span>
              </div>
              <h3 className="font-button-text text-button-text text-ink-black uppercase tracking-wider">Open Source Contributor</h3>
              <p className="font-body-md text-body-md text-text-muted">100+ Merged PRs</p>
            </div>
          </div>
        </section>
        {/*Project History*/}
        <section>
          <h2 className="font-headline-md text-headline-md text-ink-black mb-8 border-b-4 border-ink-black inline-block pb-2">Hackathon History</h2>
          <div className="flex flex-col border-2 border-ink-black bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/*History Item 1*/}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b-2 border-ink-black hover:bg-canvas-gray transition-colors gap-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-ink-black shrink-0"></div>
                <div>
                  <h4 className="font-button-text text-button-text text-ink-black">EthGlobal Paris</h4>
                  <p className="font-body-md text-body-md text-text-muted">Built a decentralized identity verifier.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="px-3 py-1 bg-electric-blue text-on-primary font-label-caps text-label-caps border-2 border-ink-black">1st Place</span>
                <a className="text-ink-black hover:text-electric-blue transition-colors" href="/" title="View Repo">
                  <span className="material-symbols-outlined text-3xl" data-icon="link" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                </a>
              </div>
            </div>
            {/*History Item 2*/}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b-2 border-ink-black hover:bg-canvas-gray transition-colors gap-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-ink-black shrink-0"></div>
                <div>
                  <h4 className="font-button-text text-button-text text-ink-black">MIT Reality Hack</h4>
                  <p className="font-body-md text-body-md text-text-muted">AR navigation tool for visually impaired.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="px-3 py-1 bg-yellow-400 text-ink-black font-label-caps text-label-caps border-2 border-ink-black">Best UI/UX</span>
                <a className="text-ink-black hover:text-electric-blue transition-colors" href="/" title="View Repo">
                  <span className="material-symbols-outlined text-3xl" data-icon="link" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                </a>
              </div>
            </div>
            {/*History Item 3*/}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-canvas-gray transition-colors gap-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-ink-black shrink-0"></div>
                <div>
                  <h4 className="font-button-text text-button-text text-ink-black">Stanford TreeHacks</h4>
                  <p className="font-body-md text-body-md text-text-muted">AI-driven climate predictive model.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="px-3 py-1 bg-surface-container-high text-ink-black font-label-caps text-label-caps border-2 border-ink-black">Participant</span>
                <a className="text-ink-black hover:text-electric-blue transition-colors" href="/" title="View Repo">
                  <span className="material-symbols-outlined text-3xl" data-icon="link" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/*Footer*/}
</div>
  );
}
