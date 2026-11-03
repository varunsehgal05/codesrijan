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
  const userName = currentUser?.name || "Hacker";
  const currentTeam = teams.find(t => t.id === currentUser?.teamId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile Form States with robust pre-population fallbacks
  const getInitialName = () => {
    if (!currentUser) return "";
    const anyUser = currentUser as any;
    if (currentUser.name) return currentUser.name;
    if (anyUser.fullName) return anyUser.fullName;
    if (anyUser.firstName) return `${anyUser.firstName} ${anyUser.lastName || ''}`.trim();
    if (currentUser.email) return currentUser.email.split('@')[0];
    return "";
  };

  const getInitialHandle = () => {
    if (!currentUser) return "";
    const anyUser = currentUser as any;
    if (anyUser.handle) return anyUser.handle;
    if (anyUser.hackerHandle) return anyUser.hackerHandle;
    if (anyUser.username) return anyUser.username;
    const n = getInitialName();
    if (n) return n.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
    if (currentUser.email) return currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return "";
  };

  const [name, setName] = useState(getInitialName);
  const [handle, setHandle] = useState(getInitialHandle);
  const [college, setCollege] = useState(currentUser?.college || "");
  const [branch, setBranch] = useState((currentUser as any)?.branch || "CSE");
  const [year, setYear] = useState((currentUser as any)?.year || "4th Year");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [techStack, setTechStack] = useState(currentUser?.techStack?.join(", ") || "");
  const [specialization, setSpecialization] = useState((currentUser as any)?.specialization || "FULLSTACK");
  const [mobile, setMobile] = useState((currentUser as any)?.mobile || (currentUser as any)?.phone || "");
  const [github, setGithub] = useState((currentUser as any)?.github || "");
  const [linkedin, setLinkedin] = useState((currentUser as any)?.linkedin || "");
  const [portfolio, setPortfolio] = useState((currentUser as any)?.portfolio || "");
  const [recruitmentStatus, setRecruitmentStatus] = useState((currentUser as any)?.recruitmentStatus || "open");

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

  // Synchronize form when currentUser changes or toggling edit mode
  useEffect(() => {
    if (currentUser) {
      const uName = getInitialName();
      const uHandle = getInitialHandle();

      setName(uName);
      setHandle(uHandle);
      setCollege(currentUser.college || (currentUser as any).institution || "");
      setBranch((currentUser as any).branch || "CSE");
      setYear((currentUser as any).year || "4th Year");
      setBio(currentUser.bio || "");
      setTechStack(currentUser.techStack?.join(", ") || "");
      setSpecialization((currentUser as any).specialization || "FULLSTACK");
      setMobile((currentUser as any).mobile || (currentUser as any).phone || "");
      setGithub((currentUser as any).github || (currentUser as any).githubUrl || "");
      setLinkedin((currentUser as any).linkedin || (currentUser as any).linkedinUrl || "");
      setPortfolio((currentUser as any).portfolio || (currentUser as any).portfolioUrl || "");
      setRecruitmentStatus((currentUser as any).recruitmentStatus || "open");
    }
  }, [currentUser, isEditing]);

  const handleHandleChange = (val: string) => {
    // Strictly sanitize handle: no spaces, lowercase, numbers, underscores, hyphens
    const sanitized = val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
    setHandle(sanitized);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cleanHandle = handle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');

    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.put(`${API_URL}/users/profile`, {
        name: name.trim(),
        handle: cleanHandle,
        college: college.trim(),
        branch,
        year,
        bio: bio.trim(),
        techStack: techStack.split(',').map(s => s.trim()).filter(Boolean),
        specialization,
        phone: mobile.trim(),
        mobile: mobile.trim(),
        github: github.trim(),
        linkedin: linkedin.trim(),
        portfolio: portfolio.trim(),
        recruitmentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Hacker profile record updated!");
      if (refetchData) await refetchData();
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to save profile", err);
      toast.error(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-stark-black border-t-electric-blue rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-sm font-bold uppercase">Loading Hacker Profile Record...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-8 border-4 border-stark-black shadow-[8px_8px_0_#000] text-center">
          <h1 className="font-headline-lg text-2xl uppercase font-black mb-3">Authentication Required</h1>
          <p className="font-body-md text-text-muted mb-6">Sign in to access and manage your developer dossier.</p>
          <Link to="/login" className="inline-block w-full bg-electric-blue text-white py-3 font-bold uppercase border-2 border-stark-black shadow-[4px_4px_0_#000]">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background pb-20">
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-8">
        
        {/* Global Go Back & Action Toolbar */}
        <div className="w-full flex justify-between items-center">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer text-xs uppercase"
          >
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1 text-sm">arrow_back</span>
            GO BACK
          </button>
          
          {!isEditing ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/workspace" 
                className="border-2 border-ink-black px-4 py-2 font-bold bg-white text-ink-black hover:bg-electric-blue hover:text-white transition-colors shadow-[3px_3px_0_#000] flex items-center gap-1.5 text-xs uppercase cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">terminal</span> WORKSPACE
              </Link>
              <button 
                onClick={() => setIsEditing(true)} 
                className="border-2 border-ink-black px-5 py-2 font-bold bg-electric-blue text-white hover:bg-black transition-colors shadow-[3px_3px_0_#000] text-xs uppercase cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">edit</span> EDIT PROFILE
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setIsEditing(false)} 
                className="border-2 border-ink-black px-4 py-2 font-bold bg-white text-ink-black hover:bg-zinc-200 transition-colors shadow-[3px_3px_0_#000] text-xs uppercase cursor-pointer" 
                disabled={saving}
              >
                CANCEL
              </button>
              <button 
                type="button"
                onClick={handleSave} 
                className="border-2 border-ink-black px-6 py-2 font-bold bg-electric-blue text-white hover:bg-black transition-colors shadow-[3px_3px_0_#000] text-xs uppercase cursor-pointer flex items-center gap-1.5" 
                disabled={saving}
              >
                <span className="material-symbols-outlined text-sm">save</span>
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <section className="bg-pure-white border-4 border-stark-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {isEditing ? (
            /* ================= EDIT MODE ================= */
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="border-b-2 border-stark-black pb-3 flex justify-between items-center">
                <div>
                  <h2 className="font-headline-md text-xl md:text-2xl font-black uppercase text-stark-black">
                    EDIT OPERATIVE DOSSIER
                  </h2>
                  <p className="font-mono text-xs text-zinc-600 mt-0.5">
                    Update all personal information, institutional credentials, and public developer profiles.
                  </p>
                </div>
                <span className="bg-electric-blue text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
                  EDIT PROTOCOL
                </span>
              </div>

              {/* Grid 1: Name and Handle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-xs uppercase text-stark-black">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Varun Sehgal"
                    className="p-3 bg-surface border-2 border-stark-black font-body-md text-xs focus:outline-none focus:border-electric-blue font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-xs uppercase text-stark-black">Hacker Handle (@Username - NO SPACES) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-mono font-black text-electric-blue text-sm select-none">@</span>
                    <input
                      type="text"
                      required
                      value={handle}
                      onChange={e => handleHandleChange(e.target.value)}
                      placeholder="varun_sehgal"
                      className="w-full pl-8 pr-3 py-3 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue font-bold lowercase"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    ℹ️ Spaces automatically convert to underscores. Allowed: a-z, 0-9, _, -
                  </span>
                </div>
              </div>

              {/* Grid 2: College, Branch, Year, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-xs uppercase text-stark-black">College / University</label>
                  <input
                    type="text"
                    value={college}
                    onChange={e => setCollege(e.target.value)}
                    placeholder="e.g. JUET / Stanford"
                    className="p-3 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-xs uppercase text-stark-black">Branch / Major</label>
                  <select
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="p-3 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue uppercase cursor-pointer"
                  >
                    <option value="CSE">CSE (Computer Science)</option>
                    <option value="IT">IT (Information Tech)</option>
                    <option value="ECE">ECE (Electronics)</option>
                    <option value="EE">EE (Electrical)</option>
                    <option value="ME">ME (Mechanical)</option>
                    <option value="CE">CE (Civil)</option>
                    <option value="OTHER">Other Discipline</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-xs uppercase text-stark-black">Academic Year</label>
                  <select
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="p-3 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Alumni / Industry">Alumni / Industry</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-xs uppercase text-stark-black">Phone / Contact</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="+91 9876543210"
                    className="p-3 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue"
                  />
                </div>
              </div>

              {/* Grid 3: Specialization and Recruitment Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-xs uppercase text-stark-black">Primary Specialization</label>
                  <select
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    className="p-3 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue uppercase font-bold cursor-pointer"
                  >
                    <option value="FULLSTACK">💻 FULLSTACK DEVELOPER</option>
                    <option value="FRONTEND">⚡ FRONTEND SPECIALIST</option>
                    <option value="BACKEND">🛠️ BACKEND ARCHITECT</option>
                    <option value="AI / ML">🧠 AI / ML ENGINEER</option>
                    <option value="CYBERSECURITY">🛡️ CYBERSECURITY AUDITOR</option>
                    <option value="UI/UX DESIGN">🎨 UI/UX DESIGNER</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-bold text-xs uppercase text-stark-black">Recruitment Availability</label>
                  <select
                    value={recruitmentStatus}
                    onChange={e => setRecruitmentStatus(e.target.value)}
                    className="p-3 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue uppercase font-bold cursor-pointer"
                  >
                    <option value="open">🟢 OPEN FOR RECRUITMENT / SQUADS</option>
                    <option value="closed">🔴 CLOSED / SQUAD LOCKED</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-xs uppercase text-stark-black">Hacker Bio / Directive</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Share your strengths, current projects, hackathon goals, and engineering philosophy..."
                  className="w-full p-3 bg-surface border-2 border-stark-black font-body-md text-xs focus:outline-none focus:border-electric-blue"
                />
              </div>

              {/* Tech Stack */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-xs uppercase text-stark-black">
                  Tech Stack (Comma Separated)
                </label>
                <input
                  type="text"
                  value={techStack}
                  onChange={e => setTechStack(e.target.value)}
                  placeholder="React, TypeScript, Node.js, Express, MongoDB, Tailwind, Docker, Python"
                  className="p-3 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue"
                />
              </div>

              {/* Grid 4: Social / External Links */}
              <div className="border-t-2 border-stark-black pt-4">
                <span className="font-label-bold text-xs uppercase text-stark-black block mb-3">
                  🔗 Developer Portfolio & Social Links
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] text-zinc-600 uppercase font-bold">GitHub URL</label>
                    <input
                      type="url"
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      className="p-2.5 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] text-zinc-600 uppercase font-bold">LinkedIn URL</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="p-2.5 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[11px] text-zinc-600 uppercase font-bold">Personal Portfolio</label>
                    <input
                      type="url"
                      value={portfolio}
                      onChange={e => setPortfolio(e.target.value)}
                      placeholder="https://mywebsite.dev"
                      className="p-2.5 bg-surface border-2 border-stark-black font-mono text-xs focus:outline-none focus:border-electric-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-stark-black">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="border-2 border-stark-black px-5 py-3 font-bold bg-white text-ink-black hover:bg-zinc-200 uppercase text-xs shadow-[3px_3px_0_#000] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="border-2 border-stark-black px-8 py-3 font-black bg-electric-blue text-white hover:bg-black uppercase text-xs shadow-[4px_4px_0_#000] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  {saving ? 'UPDATING DOSSIER...' : 'SAVE CHANGES →'}
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar Column */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                {currentUser?.profileImage ? (
                  <img
                    className="w-36 h-36 object-cover border-4 border-stark-black shadow-[4px_4px_0_#000]"
                    alt={userName + "'s profile"}
                    src={currentUser.profileImage}
                  />
                ) : (
                  <div
                    className="w-36 h-36 border-4 border-stark-black bg-electric-blue text-white flex items-center justify-center font-black text-5xl uppercase shadow-[4px_4px_0_#000]"
                    aria-label="Profile initials"
                  >
                    {userName.slice(0, 1)}
                  </div>
                )}
                
                <span className="px-3 py-1 bg-stark-black text-white text-[11px] font-mono font-bold uppercase tracking-wider border-2 border-stark-black">
                  {(currentUser as any)?.role || 'STUDENT'}
                </span>

                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-stark-black ${
                  (currentUser as any)?.recruitmentStatus === 'closed' ? 'bg-zinc-200 text-zinc-700' : 'bg-emerald-300 text-black'
                }`}>
                  {(currentUser as any)?.recruitmentStatus === 'closed' ? 'SQUAD LOCKED' : 'OPEN FOR RECRUITMENT'}
                </span>
              </div>

              {/* Information Column */}
              <div className="flex flex-col gap-4 w-full">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-headline-lg text-3xl md:text-4xl text-ink-black font-black uppercase tracking-tight">
                      {userName}
                    </h1>
                    <span className="font-mono font-bold text-electric-blue text-sm md:text-base">
                      @{(currentUser as any)?.handle || userName.toLowerCase().replace(/\s+/g, '_')}
                    </span>
                    <span className="px-2.5 py-0.5 bg-yellow-300 text-black font-mono font-bold text-xs uppercase border-2 border-stark-black shadow-[2px_2px_0_#000]">
                      {(currentUser as any)?.specialization || 'FULLSTACK'}
                    </span>
                  </div>

                  <p className="font-mono text-xs md:text-sm text-zinc-700 mt-2 max-w-3xl leading-relaxed italic">
                    "{bio || "Tactical developer ready to deploy robust solutions in the CodeSrijan hackathon arena."}"
                  </p>
                </div>

                {/* Institutional & Contact Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3 border-t-2 border-zinc-200 text-xs">
                  <div className="flex items-center gap-2 text-ink-black font-mono">
                    <span className="material-symbols-outlined text-electric-blue text-lg">school</span>
                    <span><strong>College:</strong> {college || "JUET"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-ink-black font-mono">
                    <span className="material-symbols-outlined text-electric-blue text-lg">badge</span>
                    <span><strong>Program:</strong> {branch} • {year}</span>
                  </div>

                  <div className="flex items-center gap-2 text-ink-black font-mono">
                    <span className="material-symbols-outlined text-electric-blue text-lg">mail</span>
                    <span className="truncate">{currentUser.email}</span>
                  </div>

                  {mobile && (
                    <div className="flex items-center gap-2 text-ink-black font-mono">
                      <span className="material-symbols-outlined text-electric-blue text-lg">call</span>
                      <span><strong>Phone:</strong> {mobile}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-ink-black font-mono">
                    <span className="material-symbols-outlined text-electric-blue text-lg">diversity_3</span>
                    <span><strong>Network:</strong> <strong className="text-electric-blue">{(currentUser as any)?.friends?.length || 0}</strong> Comrades</span>
                  </div>
                </div>

                {/* Squad Banner */}
                {currentTeam ? (
                  <div className="p-3 bg-amber-50 border-2 border-stark-black flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0_#000]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-electric-blue">groups</span>
                      <span className="font-mono text-xs">
                        <strong>Active Squad:</strong> <span className="font-bold text-electric-blue">{currentTeam.name}</span> (#{currentTeam.id})
                      </span>
                      {currentTeam.status === 'verified' && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white font-bold text-[10px] uppercase border border-ink-black">
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <Link
                      to="/workspace"
                      className="px-3 py-1 bg-electric-blue text-white font-bold text-xs uppercase border border-stark-black hover:bg-black transition-colors shadow-[2px_2px_0_#000]"
                    >
                      ENTER WORKSPACE →
                    </Link>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 border-2 border-dashed border-zinc-400 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-zinc-600">
                      Currently unaffiliated (Free Agent). Join or assemble an operative squad in Recruitment!
                    </span>
                    <Link
                      to="/recruitment"
                      className="px-3 py-1 bg-black text-white font-bold text-xs uppercase border border-stark-black hover:bg-electric-blue transition-colors"
                    >
                      Browse Squads ↗
                    </Link>
                  </div>
                )}

                {/* Tech Stack Tags */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[11px] font-mono uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">terminal</span> Verified Tech Stack
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(!techStack.trim() && (!currentUser.techStack || currentUser.techStack.length === 0)) ? (
                      <p className="text-xs font-mono text-zinc-500">No technology stack specified yet.</p>
                    ) : (
                      (techStack || currentUser.techStack?.join(", ") || "").split(',').map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-yellow-300 border-2 border-ink-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-xs text-ink-black uppercase font-bold"
                        >
                          {tech.trim()}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Social / External Links */}
                {(github || linkedin || portfolio) && (
                  <div className="flex flex-wrap gap-3 pt-3 border-t border-zinc-200">
                    {github && (
                      <a
                        href={github}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-surface hover:bg-zinc-200 border-2 border-stark-black font-mono text-xs font-bold text-black flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">code</span> GitHub ↗
                      </a>
                    )}
                    {linkedin && (
                      <a
                        href={linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-surface hover:bg-zinc-200 border-2 border-stark-black font-mono text-xs font-bold text-black flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">link</span> LinkedIn ↗
                      </a>
                    )}
                    {portfolio && (
                      <a
                        href={portfolio}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-surface hover:bg-zinc-200 border-2 border-stark-black font-mono text-xs font-bold text-black flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">language</span> Portfolio ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Achievements Section */}
        <section className="bg-pure-white border-4 border-stark-black p-6 md:p-8 shadow-[6px_6px_0_#000]">
          <h2 className="font-headline-md text-xl md:text-2xl font-black uppercase text-stark-black mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-electric-blue">military_tech</span>
            Achievements & Credentials
          </h2>
          <p className="font-mono text-xs text-zinc-600 mb-4">
            Official performance certifications and awards cryptographically verified by CodeSrijan.
          </p>
          <div className="bg-surface p-4 border-2 border-stark-black flex items-center justify-between flex-wrap gap-3">
            <span className="font-mono text-xs text-stark-black">
              View your issued awards and participation credentials in the certificate center.
            </span>
            <Link
              to="/certificates"
              className="px-4 py-2 bg-electric-blue hover:bg-black text-white font-bold text-xs uppercase border-2 border-stark-black shadow-[2px_2px_0_#000] transition-colors"
            >
              Access Certificate Center ↗
            </Link>
          </div>
        </section>

        {/* Hackathon History Section */}
        <section className="bg-pure-white border-4 border-stark-black p-6 md:p-8 shadow-[6px_6px_0_#000]">
          <h2 className="font-headline-md text-xl md:text-2xl font-black uppercase text-stark-black mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-electric-blue">history_edu</span>
            Hackathon Arena History
          </h2>
          <p className="font-mono text-xs text-zinc-600 mb-4">
            Record of all registered hackathon operations and participation statuses.
          </p>
          {registrations.length ? (
            <ul className="space-y-3">
              {registrations.map(reg => {
                const event = hackathons.find(h => h.id === reg.hackathonId);
                return (
                  <li key={reg.id} className="border-2 border-stark-black p-4 bg-surface flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <strong className="font-headline-md text-base uppercase text-stark-black">
                        {event?.name || reg.hackathonId}
                      </strong>
                      <p className="font-mono text-xs text-zinc-600 mt-0.5">
                        Registration status: <span className="font-bold uppercase text-electric-blue">{reg.status}</span>
                      </p>
                    </div>
                    {event && (
                      <Link
                        to="/hackathons/$id"
                        params={{ id: event.id }}
                        className="px-3 py-1.5 bg-pure-white hover:bg-zinc-200 border-2 border-stark-black font-mono text-xs font-bold uppercase transition-colors"
                      >
                        Event Details →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="bg-surface p-6 border-2 border-stark-black text-center font-mono text-xs text-zinc-500">
              No hackathon registrations recorded yet. Check available hackathons in the Hub!
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
