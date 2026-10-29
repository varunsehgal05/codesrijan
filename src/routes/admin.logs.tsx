import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogs,
});

export function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "action">("newest");

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to sync audit logs.", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Unique actions for filtering
  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered and sorted logs
  const processedLogs = useMemo(() => {
    let result = logs.filter(log => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (log.userId && log.userId.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.description && log.description.toLowerCase().includes(q)) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(q)) ||
        (log.entityType && log.entityType.toLowerCase().includes(q)) ||
        (log.entityId && log.entityId.toLowerCase().includes(q));

      const matchesRole = roleFilter === "all" ||
        (log.role && log.role.toLowerCase() === roleFilter.toLowerCase());

      const matchesAction = actionFilter === "all" ||
        (log.action && log.action.toLowerCase() === actionFilter.toLowerCase());

      return matchesSearch && matchesRole && matchesAction;
    });

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "action") {
      result.sort((a, b) => (a.action || "").localeCompare(b.action || ""));
    }

    return result;
  }, [logs, search, roleFilter, actionFilter, sortBy]);

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit-trail-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      {/* Banner */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            SYSTEM AUDIT TRAIL
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-success text-[16px] animate-pulse">radio_button_checked</span>
            Live Activity Recording Active • Real-Time Mesh
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-stark-black text-pure-white px-5 py-2.5 font-code-snippet font-bold tracking-widest brutal-border uppercase flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[16px]">history</span>
            Indexed Events: {logs.length}
          </div>
          <button
            onClick={handleExportJson}
            disabled={processedLogs.length === 0}
            className="bg-electric-blue text-pure-white px-4 py-2.5 font-label-bold brutal-border brutal-shadow-hover hover:-translate-y-0.5 transition-all text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export JSON
          </button>
          <button
            onClick={() => { setLoading(true); fetchLogs(); }}
            className="bg-pure-white text-stark-black px-4 py-2.5 font-label-bold brutal-border brutal-shadow-hover hover:-translate-y-0.5 transition-all text-xs uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="bg-pure-white p-4 brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by user ID, action, target, or IP address..."
            className="w-full bg-surface-container-lowest p-3 pr-10 font-code-snippet text-xs brutal-border focus:outline-none focus:ring-2 focus:ring-electric-blue text-stark-black"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-black font-bold text-sm"
            >
              ✕
            </button>
          ) : (
            <span className="material-symbols-outlined absolute right-3 top-3 text-surface-variant text-sm">search</span>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-label-bold text-xs uppercase text-surface-variant">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-surface-container-lowest p-2.5 font-code-snippet text-xs brutal-border focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
              <option value="judge">Judge</option>
              <option value="mentor">Mentor</option>
              <option value="core">Core / System</option>
            </select>
          </div>

          {/* Action Filter */}
          {uniqueActions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-label-bold text-xs uppercase text-surface-variant">Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-surface-container-lowest p-2.5 font-code-snippet text-xs brutal-border focus:outline-none max-w-[160px]"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="font-label-bold text-xs uppercase text-surface-variant">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface-container-lowest p-2.5 font-code-snippet text-xs brutal-border focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="action">Action (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[70vh] relative">
        <div className="bg-stark-black text-pure-white flex p-4 font-label-bold uppercase tracking-widest text-xs border-b-4 border-stark-black shrink-0">
          <div className="w-1/6">Timestamp</div>
          <div className="w-1/6">Initiator ID</div>
          <div className="w-1/6">Command / Action</div>
          <div className="w-2/6">System Response / Target</div>
          <div className="w-1/6 text-right">IP Tracer</div>
        </div>

        <div className="overflow-y-auto flex-grow bg-surface-container-lowest">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50 p-12">
              <span className="material-symbols-outlined text-6xl mb-4 animate-spin text-electric-blue">sync</span>
              <p className="font-code-snippet uppercase tracking-widest text-sm">Parsing immutable ledger...</p>
            </div>
          ) : processedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-70 p-12">
              <span className="material-symbols-outlined text-6xl mb-4 text-zinc-400">gavel</span>
              <h3 className="font-headline-md uppercase text-xl text-stark-black">NO MATCHING AUDIT RECORDS</h3>
              <p className="font-code-snippet uppercase tracking-widest text-xs mt-2 text-zinc-500">
                {logs.length === 0 ? "The system audit trail is currently empty." : "No events matched the search or filter criteria."}
              </p>
              {search && (
                <button
                  onClick={() => { setSearch(""); setRoleFilter("all"); setActionFilter("all"); }}
                  className="mt-4 bg-stark-black text-white px-4 py-2 font-mono text-xs uppercase brutal-border"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            processedLogs.map((log, i) => (
              <div key={log.id || i} className="flex p-4 font-code-snippet text-xs border-b-2 border-surface-variant hover:bg-surface-bright transition-colors text-stark-black items-center">
                <div className="w-1/6 truncate pr-4 text-zinc-500">{new Date(log.createdAt).toLocaleString()}</div>
                <div className="w-1/6 truncate pr-4 font-bold uppercase text-stark-black">
                  {log.userId || 'SYSTEM'}{" "}
                  <span className="opacity-60 font-normal text-[10px] bg-zinc-200 px-1 py-0.5 brutal-border-sm">
                    {log.role || 'CORE'}
                  </span>
                </div>
                <div className="w-1/6 truncate pr-4 font-bold text-electric-blue uppercase">
                  <span className="bg-electric-blue/10 px-1.5 py-0.5 border border-electric-blue/30 inline-block">
                    {log.action}
                  </span>
                </div>
                <div className="w-2/6 truncate pr-4 text-zinc-700">
                  {log.description || `Modified ${log.entityType || 'Node'} [${log.entityId || '-'}]`}
                </div>
                <div className="w-1/6 text-right truncate font-mono text-zinc-500">{log.ipAddress || '127.0.0.1'}</div>
              </div>
            ))
          )}

          {/* Ambient terminal footer */}
          {!loading && processedLogs.length > 0 && (
            <div className="flex p-4 font-code-snippet text-xs text-stark-black opacity-40 justify-between items-center bg-zinc-100 border-t border-zinc-200">
              <div>Displaying {processedLogs.length} of {logs.length} indexed records</div>
              <div className="truncate">... awaiting further transactions ...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
