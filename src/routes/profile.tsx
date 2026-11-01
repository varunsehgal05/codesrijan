import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useState, useEffect } from "react";
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
  const { currentUser, teams, registrations, hackathons, isLoaded, refetchData } = useAppStore();
  const userName = currentUser?.name || "Profile";
  const currentTeam = teams.find(t => t.id === currentUser?.teamId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [techStack, setTechStack] = useState(currentUser?.techStack?.join(", ") || "");
  const [saving, setSaving] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

  useEffect(() => {
    if (!isEditing) {
      setBio(currentUser?.bio || "");
      setTechStack(currentUser?.techStack?.join(", ") || "");
    }
  }, [currentUser, isEditing]);

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

  if (!isLoaded) return <p className="p-8">Loading profile...</p>;
  if (!currentUser) return <main className="p-8"><h1>Sign in to view your profile</h1><Link to="/login">Sign in</Link></main>;

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
            <div className="flex items-center gap-3">
              <Link to="/workspace" className="border-2 border-ink-black px-4 py-2 font-bold bg-white text-ink-black hover:bg-electric-blue hover:text-white transition-colors brutal-shadow flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="material-symbols-outlined text-sm">terminal</span> WORKSPACE
              </Link>
              <button onClick={() => setIsEditing(true)} className="border-2 border-ink-black px-4 py-2 font-bold hover:bg-electric-blue hover:text-white transition-colors brutal-shadow text-xs sm:text-sm">
                  EDIT PROFILE
              </button>
            </div>
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
            {currentUser?.profileImage ? <img className="w-40 h-40 object-cover border-2 border-ink-black" alt={userName + "'s profile"} src={currentUser.profileImage} /> : <div className="w-40 h-40 border-2 border-ink-black flex items-center justify-center font-bold text-4xl" aria-label="Profile initials">{userName.slice(0, 1)}</div>}
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-ink-black tracking-tight">{userName}</h1>
              {isEditing ? (
                  <textarea className="w-full mt-2 p-2 border-2 border-ink-black font-body-lg text-body-lg" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Write your bio..." />
              ) : (
                  <p className="font-body-lg text-body-lg text-text-muted mt-2 max-w-2xl">{bio || "No bio added yet."}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 text-ink-black font-label-caps text-label-caps">
                <span className="material-symbols-outlined" data-icon="location_on" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span>{currentUser?.college || "College not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-black font-label-caps text-label-caps">
                <span className="material-symbols-outlined text-electric-blue">diversity_3</span>
                <span>Network: <strong className="text-electric-blue">{(currentUser as any)?.friends?.length || 0}</strong> Comrades / Friends</span>
                {(currentUser as any)?.specialization && (
                  <span className="ml-2 px-2 py-0.5 bg-black text-white font-bold text-[10px] uppercase border border-ink-black">
                    {(currentUser as any)?.specialization}
                  </span>
                )}
              </div>
              {currentTeam && (
                <div className="flex items-center gap-2 text-ink-black font-label-caps text-label-caps">
                  <span className="material-symbols-outlined" data-icon="group" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span>Squad: <span className="font-bold text-electric-blue">{currentTeam.name}</span> ({currentTeam.id})</span>
                  {currentTeam.status === 'verified' && (
                    <span className="px-2 py-0.5 bg-emerald-500 text-white font-bold text-[10px] uppercase border border-ink-black flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified</span>VERIFIED
                    </span>
                  )}
                  {currentTeam.status === 'disqualified' && (
                    <span className="px-2 py-0.5 bg-error text-white font-bold text-[10px] uppercase border border-ink-black flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">gavel</span>DISQUALIFIED
                    </span>
                  )}
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
                    {!techStack.trim() && <p>No technology stack added yet.</p>}
                    {techStack.split(',').map((tech, idx) => (
                        <span key={idx} className="px-4 py-2 bg-yellow-300 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-label-caps text-label-caps text-ink-black uppercase">{tech.trim()}</span>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </section>
        <section>
          <h2 className="font-headline-md text-2xl mb-4">Achievements</h2>
          <p>View your issued awards in the <Link to="/certificates" className="underline">certificate center</Link>.</p>
        </section>
        <section>
          <h2 className="font-headline-md text-2xl mb-4">Hackathon History</h2>
          {registrations.length ? <ul className="space-y-3">{registrations.map(reg => <li key={reg.id} className="border-2 border-ink-black p-4">
            <strong>{hackathons.find(event => event.id === reg.hackathonId)?.name || reg.hackathonId}</strong>
            <p>Registration status: {reg.status}</p>
          </li>)}</ul> : <p>No hackathon registrations recorded.</p>}
        </section>
      </main>
      {/*Footer*/}
</div>
  );
}
