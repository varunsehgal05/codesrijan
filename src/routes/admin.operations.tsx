import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/operations")({
  component: AdminOperationsDashboard,
});

function AdminOperationsDashboard() {
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchOperations = useCallback(async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/hackathon-operations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOperations(res.data.operations || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load operations data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const handleExportCsv = async (hackathonId: string, eventName: string) => {
    try {
      setDownloadingId(hackathonId);
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/hackathons/${hackathonId}/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hackathon-${hackathonId}-roster.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to export CSV: " + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = operations.filter(h => {
    const matchesSearch = (h.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (h.id || '').toLowerCase().includes(search.toLowerCase());
    const matchesPhase = phaseFilter === 'all' || h.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'hacking': return 'bg-success text-pure-white';
      case 'registration_open': return 'bg-electric-blue text-pure-white';
      case 'evaluating': return 'bg-[#ffeb3b] text-stark-black font-bold';
      case 'concluded': return 'bg-surface-variant text-pure-white';
      default: return 'bg-stark-black text-pure-white';
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-6 pb-20">
      {/* Header Banner */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-3 py-1 inline-block transform -skew-x-6">
            HACKATHON OPERATIONS HUB
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-electric-blue text-[16px]">tune</span>
            Tournament Command, Squad Rosters &amp; Audit Exports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/hackathons"
            className="bg-stark-black text-pure-white px-4 py-2 font-label-bold brutal-border uppercase text-xs hover:bg-surface-variant transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">settings</span> Event Catalog
          </Link>
          <button
            onClick={() => { setLoading(true); fetchOperations(); }}
            className="bg-electric-blue text-pure-white px-4 py-2 font-label-bold brutal-border brutal-shadow-hover hover:-translate-y-0.5 transition-all text-xs uppercase flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">refresh</span> Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-pure-white p-4 brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hackathons by name or ID..."
            className="w-full bg-surface-container-lowest p-3 pr-10 font-code-snippet text-xs brutal-border focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
          <span className="material-symbols-outlined absolute right-3 top-3 text-surface-variant text-sm">search</span>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-label-bold text-xs uppercase text-surface-variant">Phase:</span>
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-surface-container-lowest p-3 font-code-snippet text-xs brutal-border focus:outline-none"
          >
            <option value="all">All Phases</option>
            <option value="registration_open">Registration Open</option>
            <option value="hacking">Hacking Live</option>
            <option value="evaluating">Evaluating</option>
            <option value="concluded">Concluded</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
      </div>

      {loading && operations.length === 0 ? (
        <div className="bg-pure-white p-16 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl mb-4 animate-spin text-electric-blue">sync</span>
          <p className="font-code-snippet uppercase tracking-widest text-sm">Loading hackathon operations...</p>
        </div>
      ) : error ? (
        <div className="bg-error/10 border-4 border-error p-8 brutal-shadow">
          <div className="flex items-center gap-3 text-error mb-2">
            <span className="material-symbols-outlined text-3xl">error</span>
            <h3 className="font-headline-md text-xl uppercase">Operations Error</h3>
          </div>
          <p className="font-code-snippet text-sm mb-4">{error}</p>
          <button
            onClick={fetchOperations}
            className="bg-error text-pure-white px-6 py-2 font-label-bold brutal-border uppercase text-xs"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-pure-white p-12 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-6xl mb-4 text-surface-variant">event_busy</span>
          <h3 className="font-headline-md uppercase text-xl">No Matching Hackathons</h3>
          <p className="font-code-snippet uppercase tracking-widest text-xs mt-2 text-surface-variant">
            No events match the current search or phase filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((h) => (
            <div
              key={h.id}
              className="bg-pure-white brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-6"
            >
              {/* Event Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-stark-black pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 font-label-bold text-[10px] uppercase ${getPhaseColor(h.phase)}`}>
                      {h.phase?.replace('_', ' ')}
                    </span>
                    <span className="bg-stark-black text-pure-white px-2 py-0.5 font-code-snippet text-[10px] uppercase">
                      ID: {h.id}
                    </span>
                    {h.isPaid ? (
                      <span className="bg-warning text-stark-black px-2 py-0.5 font-label-bold text-[10px] uppercase font-bold">
                        Paid ({h.currency} {h.fee})
                      </span>
                    ) : (
                      <span className="bg-success text-pure-white px-2 py-0.5 font-label-bold text-[10px] uppercase">
                        Free Entry
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline-md text-2xl uppercase tracking-tight text-stark-black">
                    {h.name}
                  </h3>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button
                    onClick={() => handleExportCsv(h.id, h.name)}
                    disabled={downloadingId === h.id}
                    className="bg-stark-black text-pure-white px-4 py-2 font-label-bold brutal-border brutal-shadow-hover hover:-translate-y-0.5 transition-all text-xs uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {downloadingId === h.id ? 'sync' : 'download'}
                    </span>
                    {downloadingId === h.id ? 'Exporting...' : 'Export CSV'}
                  </button>
                  <Link
                    to="/admin/hackathons"
                    className="bg-electric-blue text-pure-white px-4 py-2 font-label-bold brutal-border brutal-shadow-hover hover:-translate-y-0.5 transition-all text-xs uppercase flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span> Details
                  </Link>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-surface-container-lowest p-4 brutal-border">
                  <span className="font-label-bold text-[10px] uppercase text-surface-variant block">Total Registrations</span>
                  <span className="font-display-lg text-2xl text-stark-black">{h.metrics?.totalRegistrations || 0}</span>
                  <span className="font-code-snippet text-[10px] text-surface-variant block mt-1">
                    {h.metrics?.verifiedRegistrations || 0} verified
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 brutal-border">
                  <span className="font-label-bold text-[10px] uppercase text-surface-variant block">Payment Backlog</span>
                  <span className={`font-display-lg text-2xl ${(h.metrics?.pendingPaymentBacklog || 0) > 0 ? 'text-error' : 'text-success'}`}>
                    {h.metrics?.pendingPaymentBacklog || 0}
                  </span>
                  {(h.metrics?.pendingPaymentBacklog || 0) > 0 ? (
                    <Link to="/admin/payments" className="font-code-snippet text-[10px] text-error font-bold uppercase underline block mt-1">
                      Review payments →
                    </Link>
                  ) : (
                    <span className="font-code-snippet text-[10px] text-success block mt-1">All verified</span>
                  )}
                </div>

                <div className="bg-surface-container-lowest p-4 brutal-border">
                  <span className="font-label-bold text-[10px] uppercase text-surface-variant block">Active Squads</span>
                  <span className="font-display-lg text-2xl text-electric-blue">{h.metrics?.activeSquads || 0}</span>
                  <span className="font-code-snippet text-[10px] text-surface-variant block mt-1">
                    {h.metrics?.disqualifiedSquads || 0} disqualified
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 brutal-border">
                  <span className="font-label-bold text-[10px] uppercase text-surface-variant block">Submissions</span>
                  <span className="font-display-lg text-2xl text-stark-black">{h.metrics?.submissionsCount || 0}</span>
                  <span className="font-code-snippet text-[10px] text-surface-variant block mt-1">Project payloads</span>
                </div>

                <div className="bg-surface-container-lowest p-4 brutal-border">
                  <span className="font-label-bold text-[10px] uppercase text-surface-variant block">Problem Reveal</span>
                  <span className={`font-label-bold text-sm block mt-1 uppercase ${h.problemStatementsRevealed ? 'text-success' : 'text-error'}`}>
                    {h.problemStatementsRevealed ? 'Revealed' : 'Locked'}
                  </span>
                  <span className="font-code-snippet text-[10px] text-surface-variant block mt-1">Track visibility</span>
                </div>
              </div>

              {/* Deadlines Footer */}
              <div className="bg-surface-container-lowest p-3 brutal-border flex flex-wrap gap-6 text-xs font-code-snippet">
                <div>
                  <span className="text-surface-variant uppercase mr-2">Start:</span>
                  <span className="font-bold">{h.startDate ? new Date(h.startDate).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div>
                  <span className="text-surface-variant uppercase mr-2">Registration Deadline:</span>
                  <span className="font-bold">{h.registrationDeadline ? new Date(h.registrationDeadline).toLocaleString() : 'TBD'}</span>
                </div>
                <div>
                  <span className="text-surface-variant uppercase mr-2">Submission Deadline:</span>
                  <span className="font-bold">{h.submissionDeadline ? new Date(h.submissionDeadline).toLocaleString() : 'TBD'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
