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

export const getNotificationAction = (n: any) => {
    const type = (n?.type || '').toLowerCase();
    const title = (n?.title || '').toLowerCase();
    const message = (n?.message || '').toLowerCase();
    const text = `${type} ${title} ${message}`;

    if (text.includes('payment') || text.includes('fee') || text.includes('utr') || text.includes('proof') || text.includes('clearance') || text.includes('refund')) {
        return {
            url: '/payment',
            label: 'VIEW PAYMENT STATUS',
            icon: 'receipt_long',
            badge: 'PAYMENT',
            badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-600'
        };
    }
    if (text.includes('problem') || text.includes('statement') || text.includes('track') || text.includes('challenge')) {
        return {
            url: '/problems',
            label: 'EXPLORE PROBLEM STATEMENTS',
            icon: 'lightbulb',
            badge: 'PROBLEMS',
            badgeClass: 'bg-amber-100 text-amber-800 border-amber-600'
        };
    }
    if (text.includes('chat') || text.includes('message') || text.includes('comms') || text.includes('transmission')) {
        return {
            url: '/chat',
            label: 'OPEN SECURE COMMS CHAT',
            icon: 'chat',
            badge: 'COMMS',
            badgeClass: 'bg-sky-100 text-sky-800 border-sky-600'
        };
    }
    if (text.includes('invite') || text.includes('recruit') || text.includes('marketplace') || text.includes('comrade') || text.includes('friend')) {
        return {
            url: '/recruitment',
            label: 'VIEW RECRUITMENT & INVITES',
            icon: 'group_add',
            badge: 'RECRUITMENT',
            badgeClass: 'bg-blue-100 text-blue-800 border-blue-600'
        };
    }
    if (text.includes('team') || text.includes('squad') || text.includes('roster')) {
        return {
            url: '/dashboard',
            label: 'VIEW SQUAD DASHBOARD',
            icon: 'groups',
            badge: 'SQUAD',
            badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-600'
        };
    }
    if (text.includes('leaderboard') || text.includes('score') || text.includes('rank') || text.includes('standing')) {
        return {
            url: '/leaderboard',
            label: 'VIEW GLOBAL LEADERBOARD',
            icon: 'leaderboard',
            badge: 'LEADERBOARD',
            badgeClass: 'bg-purple-100 text-purple-800 border-purple-600'
        };
    }
    if (text.includes('announcement') || text.includes('broadcast')) {
        return {
            url: '/announcements',
            label: 'VIEW ANNOUNCEMENTS',
            icon: 'campaign',
            badge: 'ANNOUNCEMENT',
            badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-600'
        };
    }
    if (text.includes('support') || text.includes('ticket') || text.includes('sos')) {
        return {
            url: '/support',
            label: 'OPEN SUPPORT DESK',
            icon: 'contact_support',
            badge: 'SUPPORT',
            badgeClass: 'bg-rose-100 text-rose-800 border-rose-600'
        };
    }
    if (text.includes('hackathon') || text.includes('arena') || text.includes('enroll')) {
        return {
            url: '/hackathons',
            label: 'VIEW HACKATHON ARENAS',
            icon: 'terminal',
            badge: 'HACKATHONS',
            badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-600'
        };
    }
    return {
        url: '/dashboard',
        label: 'VISIT COMMAND CENTER',
        icon: 'dashboard',
        badge: 'SYSTEM',
        badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-400'
    };
};

export const getNotificationTag = (notification: any) => {
    const t = ((notification?.type || '') + ' ' + (notification?.title || '') + ' ' + (notification?.message || '')).toLowerCase();
    if (t.includes('payment')) return { label: 'PAYMENT', bg: 'bg-emerald-100 text-emerald-800 border-emerald-600' };
    if (t.includes('squad')) return { label: 'SQUAD', bg: 'bg-indigo-100 text-indigo-800 border-indigo-600' };
    if (t.includes('support')) return { label: 'SUPPORT', bg: 'bg-rose-100 text-rose-800 border-rose-600' };
    if (t.includes('system')) return { label: 'SYSTEM', bg: 'bg-zinc-100 text-zinc-800 border-zinc-400' };
    return { label: 'GENERAL', bg: 'bg-yellow-100 text-yellow-800 border-yellow-600' };
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
                            <div className="p-8 text-center text-zinc-500 font-mono text-sm flex flex-col items-center gap-2 font-bold">
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
                                                <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-label-bold uppercase text-ink-black text-xs block truncate">{n.title || meta.label}</span>
                                                    {(() => {
                                                        const action = getNotificationAction(n);
                                                        const tag = getNotificationTag(n);
                                                        return (
                                                            <span className={`text-[8px] font-black px-1.5 py-0.2 uppercase border font-mono tracking-wider ${tag.bg || action.badgeClass}`}>
                                                                {tag.label || action.badge}
                                                            </span>
                                                        );
                                                    })()}
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

                                        {/* Universal Page Action Link */}
                                        {(() => {
                                            const action = getNotificationAction(n);
                                            return (
                                                <div className="mt-2.5 pt-2 border-t border-zinc-200 flex items-center justify-between gap-2">
                                                    <Link
                                                        to={action.url}
                                                        onClick={() => setIsOpen(false)}
                                                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-pure-white bg-electric-blue hover:bg-stark-black px-2.5 py-1 brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">{action.icon}</span>
                                                        <span>{action.label} &rarr;</span>
                                                    </Link>
                                                    {!n.isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(n.id)}
                                                            className="text-[9px] font-bold text-zinc-500 hover:text-stark-black uppercase underline cursor-pointer"
                                                        >
                                                            MARK READ
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}

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

                    {/* Footer link to dedicated /notifications page */}
                    <div className="p-2 border-t-2 border-ink-black bg-zinc-50 text-center">
                        <Link 
                            to="/notifications" 
                            onClick={() => setIsOpen(false)}
                            className="text-[11px] font-bold text-electric-blue hover:text-stark-black uppercase inline-flex items-center gap-1 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                            OPEN TRANSMISSION CENTER &rarr;
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
