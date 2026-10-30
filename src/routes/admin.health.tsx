import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/health")({
  component: AdminHealthDashboard,
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function AdminHealthDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHealth = useCallback(async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load telemetry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-6 pb-20">
      {/* Header Banner */}
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-3 py-1 inline-block transform -skew-x-6">
            PLATFORM HEALTH &amp; TELEMETRY
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
            <span className={`material-symbols-outlined text-[16px] animate-pulse ${data?.status === 'operational' ? 'text-success' : 'text-error'}`}>
              radio_button_checked
            </span>
            Realtime Infrastructure Diagnostic Console
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-stark-black text-pure-white px-4 py-2 font-code-snippet font-bold tracking-widest brutal-border text-xs uppercase">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={() => { setLoading(true); fetchHealth(); }}
            className="bg-electric-blue text-pure-white px-4 py-2 font-label-bold brutal-border brutal-shadow-hover hover:-translate-y-0.5 transition-all text-xs uppercase flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">refresh</span> Sync Now
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="bg-pure-white p-16 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl mb-4 animate-spin text-electric-blue">sync</span>
          <p className="font-code-snippet uppercase tracking-widest text-sm">Querying active services...</p>
        </div>
      ) : error ? (
        <div className="bg-error/10 border-4 border-error p-8 brutal-shadow">
          <div className="flex items-center gap-3 text-error mb-2">
            <span className="material-symbols-outlined text-3xl">error</span>
            <h3 className="font-headline-md text-xl uppercase">Diagnostic Interruption</h3>
          </div>
          <p className="font-code-snippet text-sm mb-4">{error}</p>
          <button
            onClick={fetchHealth}
            className="bg-error text-pure-white px-6 py-2 font-label-bold brutal-border uppercase text-xs"
          >
            Retry Diagnostic
          </button>
        </div>
      ) : (
        <>
          {/* Services Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Backend API */}
            <div className="bg-pure-white p-6 brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-stark-black pb-2">
                  <span className="font-label-bold uppercase text-xs tracking-wider">Backend Service</span>
                  <span className="bg-success text-pure-white px-2 py-0.5 font-label-bold text-[10px] uppercase">
                    {data?.services?.backend?.status || "UNKNOWN"}
                  </span>
                </div>
                <div className="space-y-2 font-code-snippet text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Uptime:</span>
                    <span className="font-bold">{formatUptime(data?.services?.backend?.uptimeSeconds || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Node Engine:</span>
                    <span className="font-bold">{data?.services?.backend?.nodeVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Heap Memory:</span>
                    <span className="font-bold">{formatBytes(data?.services?.backend?.memoryUsage?.heapUsed || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">RSS Memory:</span>
                    <span className="font-bold">{formatBytes(data?.services?.backend?.memoryUsage?.rss || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-surface-variant/20 text-[10px] text-zinc-600 font-bold uppercase font-code-snippet">
                Provider: Render Free Web Service
              </div>
            </div>

            {/* MongoDB Database */}
            <div className="bg-pure-white p-6 brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-stark-black pb-2">
                  <span className="font-label-bold uppercase text-xs tracking-wider">Primary Database</span>
                  <span className={`px-2 py-0.5 font-label-bold text-[10px] uppercase text-pure-white ${data?.services?.database?.status === 'operational' ? 'bg-success' : 'bg-error'}`}>
                    {data?.services?.database?.status || "UNKNOWN"}
                  </span>
                </div>
                <div className="space-y-2 font-code-snippet text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Keyspace:</span>
                    <span className="font-bold">{data?.services?.database?.databaseName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Ready State:</span>
                    <span className="font-bold text-success">{data?.services?.database?.readyState === 1 ? '1 (Connected)' : '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Cluster Tier:</span>
                    <span className="font-bold">Atlas M0 Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Cost Budget:</span>
                    <span className="font-bold text-success">$0.00 / mo</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-surface-variant/20 text-[10px] text-zinc-600 font-bold uppercase font-code-snippet">
                Storage: Isolated &amp; Credentials Secret
              </div>
            </div>

            {/* Private Storage (GridFS) */}
            <div className="bg-pure-white p-6 brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-stark-black pb-2">
                  <span className="font-label-bold uppercase text-xs tracking-wider">Payment Vault</span>
                  <span className="bg-success text-pure-white px-2 py-0.5 font-label-bold text-[10px] uppercase">
                    {data?.services?.storage?.status || "UNKNOWN"}
                  </span>
                </div>
                <div className="space-y-2 font-code-snippet text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Engine:</span>
                    <span className="font-bold uppercase">{data?.services?.storage?.provider || 'GridFS'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Committed:</span>
                    <span className="font-bold">{formatBytes(data?.services?.storage?.committedBytes || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Vault Budget:</span>
                    <span className="font-bold">{formatBytes(data?.services?.storage?.budgetBytes || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Headroom:</span>
                    <span className="font-bold text-success">{formatBytes(data?.services?.storage?.remainingBudgetBytes || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-surface-container h-2 brutal-border overflow-hidden">
                  <div
                    className="bg-electric-blue h-full"
                    style={{ width: `${Math.min(100, data?.services?.storage?.usagePercent || 0)}%` }}
                  />
                </div>
                <span className="font-code-snippet text-[10px] text-zinc-600 font-bold mt-1 block text-right">
                  {data?.services?.storage?.usagePercent || 0}% Allocated
                </span>
              </div>
            </div>

            {/* Email Relay */}
            <div className="bg-pure-white p-6 brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-stark-black pb-2">
                  <span className="font-label-bold uppercase text-xs tracking-wider">Email Dispatch</span>
                  <span className={`px-2 py-0.5 font-label-bold text-[10px] uppercase text-pure-white ${data?.services?.emailRelay?.status === 'configured' ? 'bg-success' : 'bg-warning text-stark-black'}`}>
                    {data?.services?.emailRelay?.status === 'configured' ? 'CONFIGURED' : 'UNCONFIGURED'}
                  </span>
                </div>
                <div className="space-y-2 font-code-snippet text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Provider:</span>
                    <span className="font-bold">Google Apps Script</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Quota Limit:</span>
                    <span className="font-bold">100 / day (Free)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Delivery Cost:</span>
                    <span className="font-bold text-success">$0.00 / mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 font-bold">Templates:</span>
                    <span className="font-bold text-success">Auth &amp; Receipts</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-surface-variant/20 text-[10px] text-zinc-600 font-bold uppercase font-code-snippet">
                Relay URL Secured Server-Side
              </div>
            </div>
          </div>

          {/* Operational Metrics Counter Cards */}
          <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-headline-md uppercase text-xl mb-4 border-b-2 border-stark-black pb-2 flex items-center justify-between">
              <span>Platform Operational Queues</span>
              <span className="font-code-snippet text-xs font-normal text-zinc-600 font-bold">Live DB Aggregation</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/admin/payments"
                className="bg-surface-container-lowest p-4 brutal-border hover:bg-surface-bright hover:-translate-y-0.5 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-bold text-xs uppercase text-zinc-600 font-bold">Payment Reviews</span>
                  <span className="material-symbols-outlined text-sm text-electric-blue">receipt_long</span>
                </div>
                <div className={`font-display-lg text-3xl mt-2 ${(data?.operationalMetrics?.pendingPaymentReviews || 0) > 0 ? 'text-error' : 'text-success'}`}>
                  {data?.operationalMetrics?.pendingPaymentReviews ?? 0}
                </div>
                <span className="font-code-snippet text-[10px] text-zinc-600 font-bold uppercase">Awaiting admin review</span>
              </Link>

              <Link
                to="/admin/support"
                className="bg-surface-container-lowest p-4 brutal-border hover:bg-surface-bright hover:-translate-y-0.5 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-bold text-xs uppercase text-zinc-600 font-bold">Active Tickets</span>
                  <span className="material-symbols-outlined text-sm text-electric-blue">support_agent</span>
                </div>
                <div className="font-display-lg text-3xl mt-2 text-stark-black">
                  {data?.operationalMetrics?.activeSupportTickets ?? 0}
                </div>
                <span className="font-code-snippet text-[10px] text-zinc-600 font-bold uppercase">
                  {data?.operationalMetrics?.resolvedSupportTickets ?? 0} Resolved / Closed
                </span>
              </Link>

              <Link
                to="/admin/hackathons"
                className="bg-surface-container-lowest p-4 brutal-border hover:bg-surface-bright hover:-translate-y-0.5 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-bold text-xs uppercase text-zinc-600 font-bold">Hackathons</span>
                  <span className="material-symbols-outlined text-sm text-electric-blue">event</span>
                </div>
                <div className="font-display-lg text-3xl mt-2 text-electric-blue">
                  {data?.operationalMetrics?.activeHackathons ?? 0}
                </div>
                <span className="font-code-snippet text-[10px] text-zinc-600 font-bold uppercase">Active / Published Events</span>
              </Link>

              <Link
                to="/admin/teams"
                className="bg-surface-container-lowest p-4 brutal-border hover:bg-surface-bright hover:-translate-y-0.5 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-bold text-xs uppercase text-zinc-600 font-bold">Squads &amp; Operatives</span>
                  <span className="material-symbols-outlined text-sm text-electric-blue">groups</span>
                </div>
                <div className="font-display-lg text-3xl mt-2 text-stark-black">
                  {data?.operationalMetrics?.totalSquads ?? 0}
                </div>
                <span className="font-code-snippet text-[10px] text-zinc-600 font-bold uppercase">
                  {data?.operationalMetrics?.totalUsers ?? 0} Registered Users
                </span>
              </Link>
            </div>
          </div>

          {/* Infrastructure Budget & Architecture Card */}
          <div className="bg-stark-black text-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-success">verified</span>
                <h4 className="font-display-md text-lg uppercase tracking-wider text-pure-white">
                  $0.00 / Month Budget Hard Guarantee Active
                </h4>
              </div>
              <p className="font-code-snippet text-xs text-pure-white/80 max-w-2xl leading-relaxed">
                CodeSrijan 1.0 operates completely within free-tier limits: Vercel (Hobby edge distribution), Render (Free web instance), MongoDB Atlas (M0 Shared 512MB keyspace), and Google Apps Script (Zero-cost transactional email relay). Zero cloud charges incurred.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                to="/admin/logs"
                className="bg-pure-white text-stark-black px-4 py-2 font-label-bold brutal-border uppercase text-xs hover:bg-electric-blue hover:text-pure-white transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">history</span>
                Audit Trail
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
