import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import { useState, useEffect } from "react";
import axios from "axios";

export const Route = createFileRoute("/workspace")({
  component: WorkspaceHUD,
});

function WorkspaceHUD() {
  const { currentUser, teams, tasks, hackathons, refetchData } = useAppStore();
  const navigate = useNavigate();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [demoLink, setDemoLink] = useState("");

  const userTeam = teams.find(t => t.id === currentUser?.teamId);
  const activeEvent = hackathons[0];

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

  useEffect(() => {
    if (userTeam) {
      setGithubLink(userTeam.githubLink || userTeam.repositoryUrl || "");
      setFigmaLink(userTeam.figmaLink || "");
      setDemoLink(userTeam.demoLink || userTeam.demoUrl || "");
    }
  }, [userTeam]);

  useEffect(() => {
    if (!currentUser) navigate({ to: "/login" });
  }, [currentUser]);

  if (!currentUser) return null;

  if (!userTeam) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-pure-white p-8 border-4 border-ink-black neo-shadow max-w-lg text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-6xl text-error mb-4">gpp_maybe</span>
          <h2 className="font-display-lg text-3xl uppercase mb-2">ACCESS RESTRICTED</h2>
          <p className="font-body-md text-text-muted mb-6">You must establish or enlist in a Squad before accessing visual workspace sectors.</p>
          <Link to="/dashboard" className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold uppercase border-2 border-transparent brutal-hover hover:-translate-y-1 block max-w-xs mx-auto">
            RETURN TO DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  const handleTaskCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (userTeam.isSubmitted) return alert("WORKSPACE LOCKED.");

    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.post(`${BASE}/teams/${userTeam.id}/tasks`,
        { title: newTaskTitle, description: "New Task Objective", status: 'todo' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTaskTitle("");
      await refetchData(); // Re-poll tasks automatically
    } catch (e: any) { alert(e.response?.data?.message || "Task generation failed."); }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (userTeam.isSubmitted) return alert("WORKSPACE LOCKED.");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.put(`${BASE}/teams/${userTeam.id}/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refetchData();
    } catch (e) { alert("State transmission fault."); }
  };

  const deleteTask = async (taskId: string) => {
    if (userTeam.isSubmitted) return alert("WORKSPACE LOCKED.");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.delete(`${BASE}/teams/${userTeam.id}/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refetchData();
    } catch (e: any) { alert(e.response?.data?.message || "Destruction protocol fault."); }
  };

  const handleSaveLinks = async () => {
    if (userTeam.isSubmitted) return alert("WORKSPACE LOCKED.");
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.put(`${BASE}/teams/${userTeam.id}/links`,
        { githubLink, figmaLink, demoLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refetchData();
      alert("Payload links safely registered.");
    } catch (e) { alert("Failed to store structural payloads."); }
  };

  const handleFinalSubmit = async () => {
    if (!githubLink && !figmaLink && !demoLink) {
      return alert("CRITICAL: You must append at least one physical Payload Link (GitHub, Prisma, etc.) before running the Submissions routine.");
    }
    if (!confirm("ABSOLUTE WARNING: Transmitting final payload permanently LOCKS this workspace. No operatives may leave, and tasks cannot be altered. Initiate sequence?")) return;

    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      await axios.post(`${BASE}/teams/${userTeam.id}/submit`,
        {}, { headers: { Authorization: `Bearer ${token}` } }
      );
      await refetchData();
    } catch (e: any) { alert(e.response?.data?.message || "Transmission completely denied by server."); }
  };

  const kanbanColumns = ['todo', 'in-progress', 'review', 'completed'];
  const columnLabels = ['IDLE / BACKLOG', 'ACTIVE OPERATIONS', 'QA / REVIEW DECK', 'EXECUTED'];

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-background pb-16 px-gutter md:px-0 bg-[radial-gradient(#00000018_1px,transparent_1px)] bg-[size:16px_16px]">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8 md:pt-16 pt-8">
        {/* Header block */}
        <div className="w-full flex md:flex-row flex-col items-start md:items-center justify-between border-4 border-ink-black pb-8 bg-pure-white p-8 brutal-shadow">
          <div>
            <Link to="/dashboard" className="font-label-bold uppercase text-ink-black flex items-center gap-2 mb-4 transition-transform hover:-translate-x-1 w-fit">
              <span className="material-symbols-outlined">arrow_back</span>
              RETURN TO DASHBOARD
            </Link>
            <h1 className="font-display-lg text-4xl md:text-5xl uppercase tracking-tight text-ink-black">
              SQUAD WORKSPACE
            </h1>
            <p className="font-mono text-sm text-surface-variant flex gap-4 mt-2 font-bold flex-wrap">
              <span className="uppercase text-electric-blue">DESIGNATION: {userTeam.name}</span>
              <span className="hidden md:inline">|</span>
              <span>EVENT ID: {activeEvent?.slug?.toUpperCase()}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 mt-6 md:mt-0">
            <span className="font-label-bold uppercase text-surface-variant">Framework Status</span>
            {userTeam.isSubmitted ? (
              <span className="bg-success text-pure-white px-4 py-2 font-label-bold uppercase tracking-widest flex items-center gap-2 border-2 border-success brutal-shadow-sm">
                <span className="material-symbols-outlined">lock</span> PAYLOAD DELIVERED
              </span>
            ) : (
              <span className="bg-warning text-ink-black px-4 py-2 font-label-bold uppercase tracking-widest flex items-center gap-2 border-2 border-ink-black brutal-shadow-sm">
                <span className="material-symbols-outlined">shield</span> SYSTEMS UNLOCKED
              </span>
            )}
          </div>
        </div>

        {/* Kanban Grid */}
        <div className="bg-pure-white border-4 border-ink-black brutal-shadow p-8">
          <h2 className="font-headline-lg uppercase text-electric-blue border-b-4 border-ink-black pb-2 mb-6">Active Operations Vectors</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {kanbanColumns.map((col, idx) => (
              <div key={col} className={`bg-surface-container border-4 ${col === 'completed' && userTeam.isSubmitted ? 'border-success' : 'border-ink-black'} min-h-[400px] flex flex-col brutal-shadow-sm`}>
                <div className={`p-3 font-label-bold uppercase text-center border-b-4 tracking-wider ${(col === 'completed' || userTeam.isSubmitted) ? 'bg-ink-black text-pure-white border-ink-black' : 'bg-electric-blue text-pure-white border-ink-black'}`}>
                  {columnLabels[idx]}
                </div>
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                  {tasks.filter(t => t.status === col).map(task => (
                    <div key={task.id} className="bg-white border-2 border-ink-black p-4 brutal-shadow-sm group transition-all hover:-translate-y-1 hover:brutal-shadow relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono font-bold text-surface-variant uppercase">{task.id}</span>
                        {!userTeam.isSubmitted && (
                          <button onClick={() => deleteTask(task.id)} className="text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error/10 absolute right-2 top-2">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                      <p className="font-label-bold uppercase leading-snug mb-3 pr-4">{task.title}</p>

                      {!userTeam.isSubmitted && (
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className="w-full bg-surface-container border-2 border-ink-black text-xs font-label-bold uppercase p-2 cursor-pointer focus:outline-none focus:border-electric-blue outline-none"
                        >
                          {kanbanColumns.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>

                {col === 'todo' && !userTeam.isSubmitted && (
                  <form onSubmit={handleTaskCreate} className="p-4 border-t-4 border-ink-black bg-white flex gap-2">
                    <input
                      type="text"
                      placeholder="NEW OBJECTIVE"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-grow border-2 border-ink-black p-2 text-xs font-label-bold uppercase placeholder-surface-variant outline-none focus:border-electric-blue transition-colors"
                    />
                    <button type="submit" className="bg-electric-blue text-pure-white px-3 border-2 border-electric-blue hover:-translate-y-0.5 transition-transform font-bold">
                      <span className="material-symbols-outlined align-middle text-sm">add</span>
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deliverable Payload Engine */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2 bg-pure-white border-4 border-ink-black brutal-shadow p-8 flex flex-col gap-6">
            <h2 className="font-headline-lg uppercase text-electric-blue border-b-4 border-ink-black pb-2">Payload Attachments</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block font-label-bold uppercase text-xs mb-2">GitHub Repository Core</label>
                <input disabled={userTeam.isSubmitted} type="text" value={githubLink} onChange={e => setGithubLink(e.target.value)} placeholder="https://github.com/..." className="w-full bg-surface-container border-2 border-ink-black p-4 font-mono text-sm focus:border-electric-blue outline-none transition-colors" />
              </div>
              <div>
                <label className="block font-label-bold uppercase text-xs mb-2">Figma Prototype Matrix</label>
                <input disabled={userTeam.isSubmitted} type="text" value={figmaLink} onChange={e => setFigmaLink(e.target.value)} placeholder="https://figma.com/..." className="w-full bg-surface-container border-2 border-ink-black p-4 font-mono text-sm focus:border-electric-blue outline-none transition-colors" />
              </div>
              <div>
                <label className="block font-label-bold uppercase text-xs mb-2">Live Demo / Video Pitch</label>
                <input disabled={userTeam.isSubmitted} type="text" value={demoLink} onChange={e => setDemoLink(e.target.value)} placeholder="https://youtube.com/..." className="w-full bg-surface-container border-2 border-ink-black p-4 font-mono text-sm focus:border-electric-blue outline-none transition-colors" />
              </div>
            </div>

            {!userTeam.isSubmitted && (
              <button onClick={handleSaveLinks} className="w-full md:w-fit bg-ink-black text-pure-white px-8 py-4 font-label-bold uppercase border-2 border-transparent brutal-hover mt-2">
                STORE LINKS TO CLUSTER
              </button>
            )}
          </div>

          <div className={`col-span-1 border-4 brutal-shadow p-8 flex flex-col items-center justify-center text-center ${userTeam.isSubmitted ? 'bg-success border-success text-pure-white' : 'bg-pure-white border-error text-ink-black'}`}>
            {!userTeam.isSubmitted ? (
              <>
                <span className="material-symbols-outlined text-error text-6xl mb-4 animate-pulse">crisis_alert</span>
                <h3 className="font-display-lg uppercase text-error text-4xl md:text-3xl mb-4 leading-none mx-auto max-w-[250px]">TRANSMIT PAYLOAD</h3>
                <p className="font-mono text-sm mb-8 px-4 opacity-80">Execute this action ONLY when your squad has finalized structural construction. This will lockdown your Kanban arrays indefinitely.</p>
                <button onClick={handleFinalSubmit} className="bg-error text-pure-white font-headline-md uppercase px-8 py-4 w-full border-4 border-error brutal-hover hover:-translate-y-1 block mx-auto max-w-xs">
                  INITIATE LOCKDOWN
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-pure-white text-6xl mb-4">gpp_good</span>
                <h3 className="font-display-lg uppercase text-pure-white text-4xl mb-4 leading-none mx-auto max-w-[250px]">STRUCTURE LOCKED</h3>
                <p className="font-mono text-sm text-pure-white/90">Your squad data is currently under strict immutability. Awaiting internal Evaluation Engine overrides.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
