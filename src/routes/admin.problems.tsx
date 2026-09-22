import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/problems")({
  component: AdminProblems,
});

function AdminProblems() {
  const matches = useMatches();
  const isExact = matches[matches.length - 1]?.routeId === Route.id;

  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isExact) return;
    const token = localStorage.getItem("codesrijan_auth_token");
    axios.get(`${API_BASE}/admin/problems`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        setProblems(r.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Admin problems fetch error:", err);
        setLoading(false);
      });
  }, [isExact]);

  if (!isExact) {
    return <Outlet />;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-electric-blue text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            PROBLEM STATEMENTS
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Challenge Directives Manager
          </p>
        </div>
        <Link to="/admin/problems/create" className="bg-electric-blue text-pure-white px-6 py-3 font-label-bold brutal-border brutal-shadow-hover transition-all uppercase flex items-center gap-2 hover:bg-stark-black">
          <span className="material-symbols-outlined">add_task</span>
          New Statement
        </Link>
      </div>

      {loading ? (
        <div className="bg-surface-container p-16 brutal-border text-center">
          <p className="font-code-snippet uppercase tracking-widest animate-pulse">Syncing Problem Statements Matrix...</p>
        </div>
      ) : (problems.length === 0) ? (
        <div className="bg-surface-container p-16 brutal-border text-center flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-6xl text-text-muted">assignment_late</span>
          <h3 className="font-display-lg uppercase text-2xl text-ink-black">No Active Directives</h3>
          <p className="font-mono text-zinc-500 uppercase tracking-widest text-xs mb-4">No challenge statements have been authored yet.</p>
          <Link to="/admin/problems/create" className="bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase brutal-border brutal-shadow hover:bg-electric-blue transition-all">
            + Author First Problem Statement
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map(p => (
            <div key={p.id} className="bg-pure-white p-6 brutal-border brutal-shadow hover:-translate-y-1 transition-transform flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 text-xs font-bold uppercase border-2 ${p.isPublished ? 'bg-success/20 text-success border-success' : 'bg-surface-variant text-ink-black border-ink-black'}`}>
                    {p.isPublished ? 'PUBLISHED' : 'DRAFT'}
                  </span>
                  {p.isLocked && <span className="material-symbols-outlined text-error text-sm">lock</span>}
                </div>
                <h3 className="font-headline-sm uppercase text-ink-black mb-2">{p.title}</h3>
                <p className="font-mono text-sm text-surface-variant line-clamp-2">{p.description}</p>
              </div>
              <div className="mt-6 flex gap-2">
                <Link to={`/admin/problems/${p.id}`} className="bg-ink-black text-pure-white px-4 py-2 font-label-bold text-xs brutal-hover flex-1 text-center border-2 border-transparent hover:bg-electric-blue">CONTROL PANEL</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
