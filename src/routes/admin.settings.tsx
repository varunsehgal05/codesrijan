import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { API_BASE } from "../lib/utils";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const globalFlags = [
    { key: "registrationEnabled", label: "Global Registrations", desc: "Allow new operatives to sign up." },
    { key: "submissionEnabled", label: "Final Submissions", desc: "Unlock the project vault for file uploads." },
    { key: "chatEnabled", label: "Internal Comms (Chat)", desc: "Enable the Socket.io mesh network." },
    { key: "recruitmentEnabled", label: "Squad Marketplace", desc: "Keep the talent pool visible." },
    { key: "leaderboardVisible", label: "Public Leaderboard", desc: "Broadcast scores to the public." },
    { key: "maintenanceMode", label: "Lockdown Mode (Maintenance)", desc: "Take entire infrastructure offline." }
  ];

  const fetchSettings = () => {
    const token = localStorage.getItem("codesrijan_auth_token");
    axios.get(`${API_BASE}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const map: Record<string, any> = {};
        if (Array.isArray(res.data)) {
          res.data.forEach((s: any) => {
            map[s.key] = s.value;
          });
        }
        setSettings(map);
        setLoading(false);
      })
      .catch(err => {
        console.error("Settings error", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate({ to: "/dashboard" });
      return;
    }
    fetchSettings();
  }, [currentUser, navigate]);

  const handleToggle = async (key: string, currentValue: any, description: string) => {
    const newValue = !currentValue;
    setTogglingKey(key);
    setStatusMsg("");

    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: newValue }));

    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_BASE}/admin/settings`,
        { key, value: newValue, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMsg(`SYS_UPDATE: Parameter [${key}] successfully updated to [${String(newValue).toUpperCase()}].`);
    } catch (e: any) {
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: currentValue }));
      setStatusMsg(`ERR: Core parameter write failed for [${key}]. ${e.response?.data?.message || ''}`);
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* Header Panel */}
      <div className="bg-pure-white p-6 brutal-border brutal-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-headline-xl uppercase text-stark-black tracking-tight leading-none bg-error text-pure-white px-2 py-1 inline-block transform -skew-x-6">
            ROOT COMMAND
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2 font-bold tracking-widest text-sm uppercase">
            Global Settings Control Node
          </p>
        </div>
        <div className="flex bg-stark-black p-4 brutal-border">
          <span className="material-symbols-outlined text-error animate-pulse text-3xl">warning</span>
        </div>
      </div>

      <div className="bg-pure-white brutal-border brutal-shadow-lg p-8">
        <div className="bg-[#FFD700] p-4 brutal-border font-label-bold uppercase text-stark-black mb-8 flex items-start gap-4">
          <span className="material-symbols-outlined text-3xl">policy</span>
          <div>
            <span className="block text-xl">DANGER ZONE</span>
            <p className="font-code-snippet text-xs mt-1">
              Modifications strictly bypass security bounds and immediately reflect across the platform globally. Toggle parameters with absolute caution.
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-4 mb-6 brutal-border font-label-bold uppercase transition-all ${statusMsg.startsWith('ERR') ? 'bg-error text-white' : 'bg-success text-stark-black'}`}>
            {statusMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center font-code-snippet text-text-muted animate-pulse py-8">
              [SYS] AUTHENTICATING CONFIGURATION PAYLOADS...
            </div>
          ) : (
            globalFlags.map((flag) => {
              const isEnabled = settings[flag.key] === true;
              const isBusy = togglingKey === flag.key;

              return (
                <div key={flag.key} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container p-6 brutal-border hover:bg-surface-variant transition-colors group">
                  <div className="max-w-md">
                    <h3 className="font-headline-md uppercase text-xl leading-none">
                      {flag.label}
                    </h3>
                    <p className="font-code-snippet text-xs text-text-muted mt-2 uppercase tracking-wide">
                      [{flag.key}] • {flag.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(flag.key, isEnabled, flag.desc)}
                    disabled={isBusy}
                    className={`mt-4 md:mt-0 font-label-bold uppercase px-6 py-3 brutal-border-sm transition-all w-full md:w-44 flex items-center justify-between cursor-pointer disabled:opacity-50 ${isEnabled ? 'bg-stark-black text-white hover:bg-error' : 'bg-pure-white text-stark-black hover:bg-success hover:text-ink-black'
                      }`}
                  >
                    <span>{isBusy ? 'SYNCING...' : isEnabled ? 'ENABLED' : 'DISABLED'}</span>
                    <span className={`material-symbols-outlined text-[20px] transition-transform ${isEnabled ? 'text-success' : 'rotate-180 text-surface-variant'}`}>
                      {isEnabled ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
