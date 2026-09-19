import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate({ to: "/dashboard" });
      return;
    }

    const token = localStorage.getItem("codesrijan_auth_token");
    axios.get(`${API_URL}/admin/logs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Telemetry failure", err);
        setLoading(false);
      });
  }, [currentUser, navigate]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-[calc(100vh-140px)]">
      <div className="bg-pure-white p-6 brutal-border brutal-shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-[#FFD700] px-2 py-1 inline-block transform -skew-x-6">
            TELEMETRY // LOGS
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            Live Administrative Audit Trail
          </p>
        </div>
        <div className="flex gap-4 font-mono text-sm bg-stark-black text-pure-white px-4 py-2 brutal-border">
          <div>SCANNING: <span className="text-electric-blue">150 NODES</span></div>
        </div>
      </div>

      <div className="bg-stark-black brutal-border brutal-shadow-lg p-6 flex-grow flex flex-col overflow-hidden relative">
        {/* HUD Scanline Effect */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-30"></div>

        <div className="flex justify-between items-center text-pure-white uppercase font-mono text-xs border-b-2 border-[#333] pb-2 mb-4">
          <span className="w-1/6">TIMESTAMP</span>
          <span className="w-1/6">USER ID</span>
          <span className="w-1/6">ACTION</span>
          <span className="w-1/2">PAYLOAD / SECTOR</span>
        </div>

        <div className="flex-grow overflow-y-auto scrollbar-hide flex flex-col gap-2 relative z-20">
          {loading ? (
            <div className="text-electric-blue font-code-snippet animate-pulse py-8">
              [SYS] INITIATING LOG PULL...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-[#666] font-code-snippet py-8">
              [SYS] ZERO AUDIT EVENTS DETECTED IN STORAGE MATRIX.
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center text-pure-white font-code-snippet text-sm py-2 hover:bg-[#111] transition-colors border-b border-[#222]">
                <span className="w-full md:w-1/6 text-[#FFD700] opacity-80">
                  {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                </span>
                <span className="w-full md:w-1/6 opacity-60 truncate pr-4">
                  {log.userId || 'SYSTEM_NODE'}
                </span>
                <span className="w-full md:w-1/6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-electric-blue">chevron_right</span>
                  {log.action}
                </span>
                <span className="w-full md:w-1/2 opacity-90 truncate">
                  {log.description} [T: {log.entityType}]
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
