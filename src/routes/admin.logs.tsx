import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogs,
});

function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      const res = await axios.get(`${API_BASE}/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to sync audit logs.", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Simulate real-time polling every 30s
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-pure-white tracking-tight leading-none bg-stark-black px-2 py-1 inline-block transform -skew-x-6">
            SYSTEM AUDIT TRAIL
          </h2>
          <p className="font-code-snippet text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-success text-[16px] animate-pulse">radio_button_checked</span>
            Live Activity Recording Active
          </p>
        </div>
        <div className="bg-stark-black text-pure-white px-6 py-2 font-code-snippet font-bold tracking-widest brutal-border uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">history</span>
            Indexed Events: {logs.length}
        </div>
      </div>

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
                    <span className="material-symbols-outlined text-6xl mb-4 animate-spin">sync</span>
                    <p className="font-code-snippet uppercase tracking-widest">Parsing immutable ledger...</p>
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-70 p-12">
                    <span className="material-symbols-outlined text-6xl mb-4">gavel</span>
                    <h3 className="font-headline-md uppercase text-xl">NO ANOMALIES DETECTED</h3>
                    <p className="font-code-snippet uppercase tracking-widest text-xs mt-2">The system audit trail is currently completely empty.</p>
                </div>
            ) : (
                logs.map((log, i) => (
                    <div key={log.id || i} className="flex p-4 font-code-snippet text-xs border-b-2 border-surface-variant hover:bg-surface-bright transition-colors text-stark-black">
                        <div className="w-1/6 truncate pr-4 opacity-70">{new Date(log.createdAt).toLocaleString()}</div>
                        <div className="w-1/6 truncate pr-4 font-bold uppercase">{log.userId || 'SYSTEM'} <span className="opacity-50 font-normal">[{log.role || 'CORE'}]</span></div>
                        <div className="w-1/6 truncate pr-4 font-bold text-electric-blue uppercase">{log.action}</div>
                        <div className="w-2/6 truncate pr-4">{log.description || `Modified ${log.entityType} [${log.entityId}]`}</div>
                        <div className="w-1/6 text-right truncate opacity-70">{log.ipAddress || '127.0.0.1'}</div>
                    </div>
                ))
            )}
            
            {/* Ambient terminal lines effect */}
            {!loading && logs.length > 0 && (
                <div className="flex p-4 font-code-snippet text-xs text-stark-black opacity-30">
                    <div className="w-full truncate">... awaiting further inputs ...</div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
