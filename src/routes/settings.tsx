import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAppStore } from "../lib/store";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings & System Security | CodeSrijan" },
    ],
  }),
});

function SettingsPage() {
  const { currentUser, logout } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

  // Notification Preferences State (Persisted in localStorage)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("codesrijan_pref_notifications");
      return saved ? JSON.parse(saved) : {
        broadcasts: true,
        evaluations: true,
        squadChat: true,
        securityAlerts: true
      };
    } catch {
      return { broadcasts: true, evaluations: true, squadChat: true, securityAlerts: true };
    }
  });

  const API_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-pure-white p-8 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <span className="material-symbols-outlined text-5xl text-error mb-4">lock</span>
          <h2 className="font-display-lg text-2xl uppercase text-stark-black">ACCESS RESTRICTED</h2>
          <p className="font-code-snippet text-xs text-on-surface-variant mt-2 uppercase tracking-widest">
            Identity not detected. Please authenticate at the gateway.
          </p>
          <Link to="/login" className="mt-6 inline-block bg-stark-black text-pure-white px-6 py-3 font-label-bold uppercase brutal-border hover:bg-electric-blue transition-all">
            GO TO GATEWAY ↗
          </Link>
        </div>
      </div>
    );
  }

  const handleTogglePref = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      localStorage.setItem("codesrijan_pref_notifications", JSON.stringify(updated));
      toast.success(`Preference [${key}] updated.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("codesrijan_auth_token");
      await axios.post(`${API_URL}/auth/sessions/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("All active sessions have been forcibly revoked across all hardware.");
      logout();
      setIsRevokeModalOpen(false);
      navigate({ to: "/login" });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "System fault during termination sequence.");
    } finally {
      setLoading(false);
    }
  };

  const handleStandardLogout = () => {
    logout();
    toast.success("Disconnected successfully.");
    navigate({ to: "/login" });
  };

  const handleRequestPasswordReset = async () => {
    if (!currentUser.email) return;
    try {
      setResetLoading(true);
      await axios.post(`${API_URL}/auth/forgot-password`, { email: currentUser.email });
      toast.success(`Password reset link dispatched to ${currentUser.email}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to dispatch password reset.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-stark-black p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="bg-pure-white p-6 brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display-lg text-3xl md:text-4xl font-black uppercase tracking-tight text-stark-black">
                SYSTEM SETTINGS
              </h1>
              <span className="bg-electric-blue text-pure-white font-mono text-xs font-bold px-2.5 py-1 border-2 border-stark-black uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="font-code-snippet text-on-surface-variant uppercase tracking-widest text-xs mt-1.5">
              Manage Operative Identity, Communication Relays & Cryptographic Vectors
            </p>
          </div>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 font-label-bold text-ink-black hover:text-electric-blue border-2 border-stark-black px-4 py-2 bg-surface-bright shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer text-xs uppercase"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            RETURN
          </button>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Identity & Profile */}
          <div className="bg-pure-white brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b-2 border-stark-black pb-3 mb-6">
                <h2 className="font-headline-md text-xl uppercase font-bold text-stark-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-electric-blue">person</span>
                  Identity Profile
                </h2>
                <span className="font-mono text-[10px] text-zinc-500 uppercase">AUTHENTICATED</span>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="bg-surface-container p-3 border-2 border-stark-black">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Callsign / Name</span>
                  <div className="text-base font-bold text-stark-black mt-0.5">{currentUser.name}</div>
                </div>

                <div className="bg-surface-container p-3 border-2 border-stark-black">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Comm Link (Email)</span>
                  <div className="text-base font-bold text-stark-black mt-0.5 break-all">{currentUser.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container p-3 border-2 border-stark-black">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Operative Clearance</span>
                    <div className="text-sm font-bold text-electric-blue mt-0.5 uppercase">{currentUser.role}</div>
                  </div>
                  <div className="bg-surface-container p-3 border-2 border-stark-black">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Hardware Node</span>
                    <div className="text-sm font-bold text-stark-black mt-0.5">LOCAL HOST</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Reset Action */}
            <div className="pt-4 border-t-2 border-stark-black">
              <span className="text-xs font-mono font-bold uppercase text-zinc-600 block mb-2">Credential Refresh:</span>
              <button
                onClick={handleRequestPasswordReset}
                disabled={resetLoading}
                className="w-full bg-surface-bright border-2 border-stark-black hover:bg-zinc-200 text-stark-black font-label-bold uppercase py-2.5 px-4 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">{resetLoading ? 'sync' : 'key'}</span>
                <span>{resetLoading ? 'DISPATCHING TOKEN...' : 'REQUEST PASSWORD RESET VIA EMAIL'}</span>
              </button>
            </div>
          </div>

          {/* Communication & Notification Preferences */}
          <div className="bg-pure-white brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-stark-black pb-3 mb-6">
              <h2 className="font-headline-md text-xl uppercase font-bold text-stark-black flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">tune</span>
                Preferences
              </h2>
              <span className="font-mono text-[10px] text-zinc-500 uppercase">LOCAL SYNC</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {[
                { key: 'broadcasts', label: 'Tournament Broadcasts', desc: 'Real-time alert pings for announcements and stage progression' },
                { key: 'evaluations', label: 'Score & Evaluation Alerts', desc: 'Notifications when judging reviews and scores update' },
                { key: 'squadChat', label: 'Squad & Team Chat Comms', desc: 'Unread message alerts in squad coordination channels' },
                { key: 'securityAlerts', label: 'Security & Session Monitor', desc: 'Warnings about session expiry and unusual login triggers' },
              ].map(item => {
                const isEnabled = (notifications as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleTogglePref(item.key as any)}
                    className="p-3 bg-surface-container border-2 border-stark-black flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-100 transition-colors"
                  >
                    <div>
                      <span className="font-bold uppercase text-stark-black block">{item.label}</span>
                      <span className="text-[10px] text-zinc-500 leading-tight block mt-0.5">{item.desc}</span>
                    </div>
                    <span className={`material-symbols-outlined text-2xl transition-colors ${isEnabled ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {isEnabled ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Security & Detachment Zone */}
        <div className="bg-pure-white brutal-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3 mb-4">
            <span className="material-symbols-outlined text-error text-2xl">shield</span>
            <h2 className="font-headline-md text-xl uppercase font-bold text-stark-black">
              Security Protocols & Mainframe Detachment
            </h2>
          </div>

          <p className="font-code-snippet text-xs text-zinc-600 mb-6 leading-relaxed">
            Execute localized detachment to sign out of this device, or force a global cryptographic revocation across all geographical hardware if compromised.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleStandardLogout}
              className="flex-1 bg-surface-bright hover:bg-zinc-200 text-stark-black font-label-bold uppercase py-3 px-6 border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              LOCAL DETACH (LOG OUT)
            </button>

            <button
              onClick={() => setIsRevokeModalOpen(true)}
              className="flex-1 bg-error hover:bg-red-800 text-pure-white font-label-bold uppercase py-3 px-6 border-2 border-stark-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">emergency_home</span>
              FORCE GLOBAL REVOCATION (ALL SESSIONS)
            </button>
          </div>
        </div>

      </div>

      {/* Force Global Revocation Confirmation Modal (replaces browser confirm) */}
      {isRevokeModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsRevokeModalOpen(false); }}
          className="fixed inset-0 bg-stark-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-pure-white brutal-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-stark-black pb-3">
              <span className="material-symbols-outlined text-error text-3xl">warning</span>
              <h3 className="font-headline-md text-lg uppercase text-stark-black">GLOBAL SESSION TERMINATION</h3>
            </div>
            
            <p className="font-code-snippet text-xs text-stark-black leading-relaxed">
              WARNING: This will immediately obliterate and revoke all active authentication tokens and sessions across all geographic devices. You will be logged out everywhere. Proceed?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsRevokeModalOpen(false)}
                className="px-4 py-2 border-2 border-stark-black font-label-bold uppercase bg-surface-bright hover:bg-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeSessions}
                disabled={loading}
                className="px-5 py-2 border-2 border-stark-black font-label-bold uppercase bg-error text-white hover:bg-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'gavel'}</span>
                <span>{loading ? 'TERMINATING...' : 'CONFIRM GLOBAL REVOCATION'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
