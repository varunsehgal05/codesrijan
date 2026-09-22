import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../lib/store";
import axios from "axios";

export const Route = createFileRoute("/recruitment")({
  component: RecruitmentMatrix,
  head: () => ({
    meta: [
      { title: "Squad Builder | CodeSrijan" },
    ],
  }),
});

function RecruitmentMatrix() {
  const { currentUser, teams, users, refetchData } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'find' | 'join' | 'create'>('find');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const BASE_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com';
  const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

  if (!currentUser) return <Navigate to="/login" />;

  const handleJoinByCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    const teamCode = formData.get("teamCode") as string;
    const token = localStorage.getItem("codesrijan_auth_token");
    try {
      await axios.post(`${API_URL}/teams/join`, { teamCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refetchData();
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to join squad.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSquad = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const token = localStorage.getItem("codesrijan_auth_token");
    try {
      await axios.post(`${API_URL}/teams`, { name, description }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refetchData();
      navigate({ to: "/dashboard" });
    } catch (err: any) {
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (teamId: string) => {
    try {
      setLoading(true);
      setErrorMsg("");
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/teams/${teamId}/request`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Join signature transmitted! Await Squad Leader approval.");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to transmit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId: string) => {
    try {
      setLoading(true);
      setErrorMsg("");
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/teams/${currentUser.teamId}/invite`, { receiverId: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Invite dispatched to Operative.");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to dispatch invite.");
    } finally {
      setLoading(false);
    }
  };

  const hasSquad = !!currentUser.teamId;
  const currentTeam = teams.find(t => t.id === currentUser.teamId);
  const isTeamLeader = currentTeam?.leaderId === currentUser.id;

  return (
    <div className="min-h-screen bg-background text-on-background">
      <main className="flex-grow max-w-[1200px] w-full mx-auto px-margin-desktop py-16 flex flex-col gap-12">

        <div className="w-full mb-2">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue transition-all group w-fit cursor-pointer">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            GO BACK
          </button>
        </div>

        <header className="flex flex-col gap-4 md:flex-row justify-between items-end border-b-4 border-ink-black pb-8">
          <div className="max-w-2xl">
            <h1 className="font-headline-lg text-[48px] text-ink-black uppercase tracking-tighter mb-2">Squad Builder</h1>
            <p className="font-body-lg text-text-muted">Deploy a highly-specialized team of 4 hackers. Link up directly to enter the arena.</p>
          </div>

          <div className="flex bg-surface-container-high brutal-border p-1 w-full md:w-auto relative group brutal-shadow-sm self-start md:self-end mt-4 md:mt-0 font-label-bold">
            <button
              onClick={() => setActiveTab('find')}
              className={`flex-1 md:w-32 px-4 py-2 transition-all border-2 ${activeTab === 'find' ? 'bg-electric-blue text-pure-white border-stark-black brutal-shadow' : 'bg-surface text-ink-black border-transparent hover:border-ink-black hover:-translate-y-1'}`}
            >
              FIND
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 md:w-32 px-4 py-2 transition-all border-2 ${activeTab === 'join' ? 'bg-electric-blue text-pure-white border-stark-black brutal-shadow' : 'bg-surface text-ink-black border-transparent hover:border-ink-black hover:-translate-y-1'}`}
            >
              JOIN
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 md:w-32 px-4 py-2 transition-all border-2 ${activeTab === 'create' ? 'bg-electric-blue text-pure-white border-stark-black brutal-shadow' : 'bg-surface text-ink-black border-transparent hover:border-ink-black hover:-translate-y-1'}`}
            >
              CREATE
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="p-4 bg-error text-pure-white font-label-bold uppercase brutal-border">
            ERR: {errorMsg}
          </div>
        )}

        {hasSquad && !isTeamLeader && (
          <div className="p-6 bg-[#FFD700] text-stark-black font-label-bold uppercase brutal-border brutal-shadow mb-4">
            ⚠ WARNING: YOU ARE ALREADY BOUND TO A SQUAD ({currentTeam?.name}). CREATING OR JOINING A NEW MATRIX IS CURRENTLY LOCKED.
          </div>
        )}
        {isTeamLeader && (
          <div className="p-6 bg-electric-blue text-pure-white font-label-bold uppercase brutal-border brutal-shadow mb-4">
            SQUAD LEADER ACTIVE. YOU MAY RECRUIT FREE HACKERS FROM THE MARKETPLACE.
          </div>
        )}

        <div className="relative">
          {activeTab === 'find' && (
            <section className="flex flex-col gap-6">
              <h2 className="font-headline-md uppercase">{isTeamLeader ? "Recruit Free Hackers" : "Active Squad Marketplace"}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {isTeamLeader ? (
                  users.filter(u => !u.teamId && u.role === 'student' && u.id !== currentUser.id).length === 0 ? (
                    <div className="col-span-full text-center bg-surface brutal-border p-12">
                      <h2 className="font-headline-md text-ink-black uppercase">No Free Hackers</h2>
                      <p className="font-mono text-zinc-500 mt-2">All registered operatives are currently assigned to squads.</p>
                    </div>
                  ) : (
                    users.filter(u => !u.teamId && u.role === 'student' && u.id !== currentUser.id).map(user => (
                      <article key={user.id} className="bg-surface brutal-border brutal-shadow px-6 py-6 flex flex-col gap-4 relative group hover:-translate-y-1 transition-transform">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full border-2 border-ink-black flex items-center justify-center bg-electric-blue text-white font-bold text-xl uppercase">
                            {(user.name || "?").charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-headline-md uppercase text-xl truncate">{user.name}</h3>
                            <p className="font-label-caps text-xs text-text-muted">{user.email}</p>
                          </div>
                        </div>
                        <button onClick={() => handleInvite(user.id)} className="mt-4 w-full bg-electric-blue text-pure-white brutal-border py-2 font-button-text hover:bg-stark-black transition-colors" disabled={loading}>
                          Dispatch Invite
                        </button>
                      </article>
                    ))
                  )
                ) : (
                  teams.filter(t => t.memberIds && t.memberIds.length < 4).length === 0 ? (
                    <div className="col-span-full text-center bg-surface brutal-border p-12">
                      <h2 className="font-headline-md text-ink-black uppercase">No Open Squads</h2>
                      <p className="font-mono text-zinc-500 mt-2">All scanned teams are packed to max capacity (4 Hackers).</p>
                    </div>
                  ) : (
                    teams.filter(t => t.memberIds && t.memberIds.length < 4).map((team) => (
                      <article key={team.id} className="bg-surface brutal-border brutal-shadow px-6 py-6 flex flex-col gap-4 relative group hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start">
                          <h3 className="font-headline-md uppercase text-2xl truncate">{team.name}</h3>
                          <span className="bg-stark-black text-pure-white px-2 py-1 font-label-bold text-xs brutal-border">{team.memberIds.length} / 4 SLOTS</span>
                        </div>
                        <div className="h-0.5 w-full bg-ink-black opacity-30"></div>
                        <p className="font-body-md text-ink-black italic line-clamp-2 min-h-[48px]">
                          {team.description || "Deploying custom tech stack for massive disruption."}
                        </p>
                        <button onClick={() => handleRequestJoin(team.id)} className="mt-4 w-full bg-electric-blue text-pure-white brutal-border py-2 font-button-text hover:bg-stark-black transition-colors" disabled={hasSquad || loading}>
                          Transmit Join Signature
                        </button>
                      </article>
                    ))
                  )
                )}
              </div>
            </section>
          )}

          {activeTab === 'join' && (
            <section className="max-w-xl mx-auto w-full bg-surface brutal-border brutal-shadow p-8">
              <h2 className="font-headline-md uppercase mb-2">Connect to Matrix</h2>
              <p className="font-body-md text-text-muted mb-6">Enter the exact Squad Authorization Code provided by the team leader.</p>
              <form onSubmit={handleJoinByCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase">Squad Code (Terminal ID)</label>
                  <input name="teamCode" type="text" className="bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none uppercase" required placeholder="t-178..." />
                </div>
                <button disabled={loading || hasSquad} type="submit" className="mt-4 bg-ink-black text-pure-white font-label-bold px-6 py-4 brutal-border brutal-shadow-hover transition-all disabled:opacity-50">
                  {loading ? 'AUTHENTICATING...' : 'JOIN SQUAD'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'create' && (
            <section className="max-w-2xl mx-auto w-full bg-surface brutal-border brutal-shadow p-8">
              <h2 className="font-headline-md uppercase mb-2">Initialize New Squad</h2>
              <p className="font-body-md text-text-muted mb-6">You will automatically be locked in as the designated Team Leader.</p>
              <form onSubmit={handleCreateSquad} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase">Squad Designation</label>
                  <input name="name" type="text" className="bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" required placeholder="Cyber Punks" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-bold uppercase">Operation Parameters (Description)</label>
                  <textarea name="description" rows={4} className="bg-surface-container py-3 px-4 font-code-snippet brutal-border focus:ring-2 focus:outline-none" placeholder="We are building an AI-orchestrated blockchain app..." />
                </div>
                <button disabled={loading || hasSquad} type="submit" className="md:self-end bg-electric-blue text-pure-white font-label-bold px-8 py-4 brutal-border brutal-shadow-hover transition-all disabled:opacity-50">
                  {loading ? 'DEPLOYING SQUAD...' : 'DEPLOY SQUAD'}
                </button>
              </form>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
