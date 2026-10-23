import { useState, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { Link } from "@tanstack/react-router";

const BASE_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

const NOTIF_META: Record<string, { icon: string; color: string; label: string }> = {
    payment_approved:  { icon: 'check_circle', color: 'text-emerald-500', label: 'Payment Approved' },
    payment_rejected:  { icon: 'cancel',       color: 'text-rose-500',    label: 'Payment Rejected' },
    team_updated:      { icon: 'group',         color: 'text-electric-blue', label: 'Team Update' },
    team_disqualified: { icon: 'gavel',         color: 'text-rose-600',    label: 'Disqualification' },
    admin_message:     { icon: 'campaign',      color: 'text-violet-600',  label: 'Admin Message' },
    join_request:      { icon: 'person_add',    color: 'text-amber-500',   label: 'Join Request' },
    team_invite:       { icon: 'mail',          color: 'text-electric-blue', label: 'Team Invite' },
    chat_message:      { icon: 'chat',          color: 'text-sky-500',     label: 'Squad Chat' },
};

export function NotificationBell() {
    const { currentUser } = useAppStore();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            if (!token) return;
            const res = await axios.get(`${BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (e) { /* Ignore */ }
    };

    useEffect(() => {
        if (!currentUser) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleMarkAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.patch(`${BASE_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) {}
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            await axios.patch(`${BASE_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) {} finally { setMarkingAll(false); }
    };

    if (!currentUser) return null;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-ink-black dark:text-surface-bright hover:text-electric-blue transition-colors focus:outline-none"
                title="Notifications"
            >
                <span className="material-symbols-outlined text-2xl">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-surface dark:border-ink-black animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-surface dark:bg-ink-black border-2 border-ink-black brutal-shadow z-[60] flex flex-col max-h-[520px]">
                    {/* Header */}
                    <div className="p-3 border-b-2 border-ink-black bg-electric-blue text-white flex justify-between items-center sticky top-0 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">notifications</span>
                            <h3 className="font-label-bold uppercase">System Alerts</h3>
                            {unreadCount > 0 && <span className="text-xs bg-ink-black px-2 py-0.5 rounded font-bold">{unreadCount} NEW</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={markingAll}
                                    className="text-[10px] bg-white/20 hover:bg-white/40 text-white px-2 py-0.5 uppercase font-bold transition-all disabled:opacity-50"
                                >
                                    {markingAll ? '...' : 'ALL READ'}
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-white hover:text-ink-black text-xs font-bold">✕</button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="flex flex-col overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-surface-variant font-mono text-sm flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-3xl text-zinc-300">inbox</span>
                                No active transmissions.
                            </div>
                        ) : (
                            notifications.map(n => {
                                const meta = NOTIF_META[n.type] || { icon: 'notifications', color: 'text-zinc-500', label: n.type || 'Notice' };
                                return (
                                    <div key={n.id} className={`p-4 border-b-2 border-ink-black last:border-b-0 transition-colors ${n.isRead ? 'bg-surface-container opacity-60' : 'bg-white hover:bg-zinc-50'}`}>
                                        {/* Top row: icon + title + read button */}
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className={`material-symbols-outlined text-lg shrink-0 ${meta.color}`}>{meta.icon}</span>
                                                <div className="min-w-0">
                                                    <span className="font-label-bold uppercase text-ink-black text-xs block truncate">{n.title || meta.label}</span>
                                                    {!n.isRead && (
                                                        <span className="inline-block w-1.5 h-1.5 bg-electric-blue rounded-full"></span>
                                                    )}
                                                </div>
                                            </div>
                                            {!n.isRead && (
                                                <button onClick={() => handleMarkAsRead(n.id)} className="text-[9px] bg-electric-blue text-white px-1.5 py-0.5 uppercase brutal-border hover:bg-stark-black shrink-0 font-bold">
                                                    READ
                                                </button>
                                            )}
                                        </div>

                                        {/* Message */}
                                        <p className="font-body-sm text-stark-black text-xs leading-relaxed">{n.message}</p>

                                        {/* Rejection Reason (if embedded) */}
                                        {n.rejectionReason && (
                                            <div className="mt-2 bg-rose-50 border-l-2 border-rose-400 p-2 text-xs text-rose-700">
                                                <span className="font-bold block">Reason:</span> {n.rejectionReason}
                                            </div>
                                        )}

                                        {/* Contextual Action Links */}
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {(n.type === 'payment_rejected' || n.type === 'payment_approved') && (
                                                <Link to="/payment" onClick={() => setIsOpen(false)} className="inline-flex items-center gap-1 text-[10px] font-bold text-electric-blue hover:underline uppercase">
                                                    <span className="material-symbols-outlined text-xs">receipt_long</span>
                                                    VIEW PAYMENT STATUS
                                                </Link>
                                            )}
                                            {(n.type === 'team_updated' || n.type === 'team_disqualified' || n.type === 'admin_message') && (
                                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="inline-flex items-center gap-1 text-[10px] font-bold text-electric-blue hover:underline uppercase">
                                                    <span className="material-symbols-outlined text-xs">dashboard</span>
                                                    GO TO DASHBOARD
                                                </Link>
                                            )}
                                            {n.type === 'join_request' && (
                                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="inline-flex items-center gap-1 text-[10px] font-bold text-electric-blue hover:underline uppercase">
                                                    <span className="material-symbols-outlined text-xs">person_add</span>
                                                    REVIEW REQUEST
                                                </Link>
                                            )}
                                            {n.type === 'team_invite' && (
                                                <Link to="/recruitment" onClick={() => setIsOpen(false)} className="inline-flex items-center gap-1 text-[10px] font-bold text-electric-blue hover:underline uppercase">
                                                    <span className="material-symbols-outlined text-xs">mail</span>
                                                    VIEW INVITES
                                                </Link>
                                            )}
                                            {n.type === 'chat_message' && (
                                                <Link to="/workspace" onClick={() => setIsOpen(false)} className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-500 hover:underline uppercase">
                                                    <span className="material-symbols-outlined text-xs">chat</span>
                                                    OPEN SQUAD WORKSPACE
                                                </Link>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        {n.createdAt && (
                                            <p className="text-[9px] text-zinc-400 mt-1 font-mono">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
