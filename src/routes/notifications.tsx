import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import toast from "react-hot-toast";
import { getNotificationAction } from "../components/NotificationBell";

const BASE_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');

export const Route = createFileRoute("/notifications")({
    component: NotificationCenterComponent,
});

const NOTIF_ICONS: Record<string, { icon: string; color: string; label: string }> = {
    payment_approved: { icon: 'verified', color: 'text-emerald-500', label: 'Payment Approved' },
    payment_rejected: { icon: 'cancel', color: 'text-rose-500', label: 'Payment Declined' },
    team_updated: { icon: 'groups', color: 'text-electric-blue', label: 'Squad Update' },
    team_disqualified: { icon: 'gavel', color: 'text-rose-600', label: 'Disqualification' },
    admin_message: { icon: 'campaign', color: 'text-amber-500', label: 'Command Broadcast' },
    join_request: { icon: 'person_add', color: 'text-electric-blue', label: 'Recruitment Request' },
    team_invite: { icon: 'forward_to_inbox', color: 'text-electric-blue', label: 'Squad Invite' },
    chat_message: { icon: 'chat', color: 'text-sky-500', label: 'Squad Comms' },
    default: { icon: 'notifications', color: 'text-zinc-400', label: 'System Notification' }
};

export const getNotificationTag = (notification: any) => {
    const t = ((notification?.type || '') + ' ' + (notification?.title || '') + ' ' + (notification?.message || '')).toLowerCase();
    if (t.includes('payment')) return { label: 'PAYMENT', bg: 'bg-emerald-100 text-emerald-800 border-emerald-600' };
    if (t.includes('squad')) return { label: 'SQUAD', bg: 'bg-indigo-100 text-indigo-800 border-indigo-600' };
    if (t.includes('support')) return { label: 'SUPPORT', bg: 'bg-rose-100 text-rose-800 border-rose-600' };
    if (t.includes('system')) return { label: 'SYSTEM', bg: 'bg-zinc-100 text-zinc-800 border-zinc-400' };
    return { label: 'GENERAL', bg: 'bg-yellow-100 text-yellow-800 border-yellow-600' };
};

export function NotificationCenterComponent() {
    const { currentUser } = useAppStore();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'payments' | 'squads' | 'comms' | 'problems'>('all');
    const [processingAction, setProcessingAction] = useState(false);

    const fetchNotifications = async () => {
        const token = localStorage.getItem("codesrijan_auth_token");
        if (!token) {
            navigate({ to: '/login' });
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get(`${BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data || []);
        } catch (e: any) {
            toast.error("Failed to load notifications: " + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigate({ to: '/login' });
            return;
        }
        fetchNotifications();
    }, [currentUser]);

    // Handle single item deletion
    const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const token = localStorage.getItem("codesrijan_auth_token");
        if (!token) return;

        try {
            await axios.delete(`${BASE_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
            setSelectedIds(prev => prev.filter(item => item !== id));
            toast.success("Notification deleted.");
        } catch (err: any) {
            toast.error("Failed to delete notification.");
        }
    };

    // Handle toggle single select
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Handle Select All
    const handleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id));
        }
    };

    // Clear Selected action
    const handleClearSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedIds.length} selected notifications? This action cannot be undone.`)) return;

        const token = localStorage.getItem("codesrijan_auth_token");
        if (!token) return;

        setProcessingAction(true);
        try {
            await axios.post(`${BASE_URL}/notifications/clear-selected`, { ids: selectedIds }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
            setSelectedIds([]);
            toast.success(`Cleared ${selectedIds.length} notifications.`);
        } catch (err: any) {
            toast.error("Failed to clear selected notifications.");
        } finally {
            setProcessingAction(false);
        }
    };

    // Mark single as read
    const handleMarkAsRead = async (id: string) => {
        const token = localStorage.getItem("codesrijan_auth_token");
        if (!token) return;

        try {
            await axios.patch(`${BASE_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) { }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        const token = localStorage.getItem("codesrijan_auth_token");
        if (!token) return;

        setProcessingAction(true);
        try {
            await axios.patch(`${BASE_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("All notifications marked as read.");
        } catch (err: any) {
            toast.error("Failed to mark all as read.");
        } finally {
            setProcessingAction(false);
        }
    };

    // Filter logic
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        const act = getNotificationAction(n);
        if (filter === 'payments') return act.badge === 'PAYMENT';
        if (filter === 'squads') return act.badge === 'SQUAD' || act.badge === 'RECRUITMENT';
        if (filter === 'comms') return act.badge === 'COMMS';
        if (filter === 'problems') return act.badge === 'PROBLEMS' || act.badge === 'HACKATHONS' || act.badge === 'SYSTEM';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-surface-container py-10 px-4 sm:px-6 lg:px-8 font-mono">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Breadcrumb / Back Link */}
                <div className="flex items-center justify-between">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase text-zinc-600 hover:text-electric-blue transition-colors">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Command Center
                    </Link>
                    <button
                        onClick={fetchNotifications}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-600 hover:text-stark-black"
                    >
                        <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        Refresh Stream
                    </button>
                </div>

                {/* Main Header Card */}
                <div className="bg-pure-white brutal-border p-6 shadow-[6px_6px_0px_0px_#000000]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-stark-black pb-5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-electric-blue text-3xl">notifications_active</span>
                                <h1 className="text-2xl sm:text-3xl font-black uppercase text-stark-black tracking-tight">
                                    Notification Center
                                </h1>
                                {unreadCount > 0 && (
                                    <span className="bg-rose-500 text-white text-xs font-black px-2 py-0.5 brutal-border animate-pulse">
                                        {unreadCount} UNREAD
                                    </span>
                                )}
                            </div>
                            <p className="text-zinc-600 text-xs font-bold uppercase">
                                Real-time dispatch ledger for hackathon clearances, squad transmissions &amp; audit decisions.
                            </p>
                        </div>

                        {/* Top Action Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={processingAction}
                                    className="px-3 py-2 bg-pure-white text-stark-black text-xs font-black uppercase brutal-border hover:bg-zinc-100 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000000]"
                                >
                                    <span className="material-symbols-outlined text-sm">mark_email_read</span>
                                    Mark All Read
                                </button>
                            )}
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleClearSelected}
                                    disabled={processingAction}
                                    className="px-3 py-2 bg-rose-500 text-white text-xs font-black uppercase brutal-border hover:bg-rose-600 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000000]"
                                >
                                    <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                    Clear Selected ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter and Select Bar */}
                    <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { id: 'all', label: `ALL (${notifications.length})` },
                                { id: 'unread', label: `UNREAD (${unreadCount})` },
                                { id: 'payments', label: 'PAYMENTS' },
                                { id: 'squads', label: 'SQUADS' },
                                { id: 'comms', label: 'COMMS' },
                                { id: 'problems', label: 'PROBLEMS / SYSTEM' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id as any)}
                                    className={`px-3 py-1 text-xs font-bold uppercase brutal-border transition-all ${filter === tab.id
                                        ? 'bg-stark-black text-white shadow-[2px_2px_0px_0px_#0055FF]'
                                        : 'bg-pure-white text-stark-black hover:bg-zinc-100'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {filteredNotifications.length > 0 && (
                            <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 accent-electric-blue cursor-pointer"
                                    />
                                    <span>Select All ({filteredNotifications.length})</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-pure-white brutal-border p-12 text-center text-zinc-500 font-bold uppercase text-sm">
                            <span className="material-symbols-outlined text-3xl animate-spin mb-2 block text-electric-blue">sync</span>
                            Interrogating Transmission Mesh...
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="bg-pure-white brutal-border p-16 text-center text-zinc-500 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
                            <span className="material-symbols-outlined text-5xl text-zinc-300">inbox</span>
                            <h3 className="text-base font-black uppercase text-stark-black">No Transmissions Recorded</h3>
                            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                You have zero active transmissions in this view. Updates regarding registrations, squads, and clearances will appear here.
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map(n => {
                            const meta = NOTIF_ICONS[n.type] || NOTIF_ICONS.default;
                            const isSelected = selectedIds.includes(n.id);

                            return (
                                <div
                                    key={n.id}
                                    onClick={() => handleToggleSelect(n.id)}
                                    className={`bg-pure-white brutal-border p-4 transition-all cursor-pointer relative ${!n.isRead ? 'border-l-8 border-l-electric-blue bg-white shadow-[4px_4px_0px_0px_#0055FF]' : 'opacity-85 shadow-[3px_3px_0px_0px_#000000] hover:opacity-100'
                                        } ${isSelected ? 'ring-2 ring-electric-blue bg-blue-50/30' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-3">

                                        {/* Selection Checkbox & Type Icon */}
                                        <div className="flex items-center gap-3 pt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleSelect(n.id)}
                                                onClick={e => e.stopPropagation()}
                                                className="w-4 h-4 accent-electric-blue cursor-pointer"
                                            />
                                            <span className={`material-symbols-outlined text-xl ${meta.color}`}>
                                                {meta.icon}
                                            </span>
                                        </div>

                                        {/* Content Area */}
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-xs font-black uppercase text-stark-black tracking-tight">
                                                    {n.title || meta.label}
                                                </h4>
                                                {!n.isRead && (
                                                    <span className="bg-electric-blue text-white text-[9px] font-black px-1.5 py-0.2 uppercase">
                                                        NEW
                                                    </span>
                                                )}
                                                {(() => {
                                                    const action = getNotificationAction(n);
                                                    const tag = getNotificationTag(n);
                                                    return (
                                                        <span className={`text-[10px] font-black px-2 py-0.5 uppercase border font-mono tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${tag.bg || action.badgeClass}`}>
                                                            {tag.label || action.badge}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            <p className="text-xs text-stark-black leading-relaxed font-semibold">
                                                {n.message}
                                            </p>

                                            {/* Rejection / Audit Reason Notice */}
                                            {n.rejectionReason && (
                                                <div className="mt-2 bg-rose-50 border-2 border-rose-500 p-2.5 text-xs text-rose-700">
                                                    <p className="font-black uppercase text-[10px] text-rose-800 flex items-center gap-1 mb-0.5">
                                                        <span className="material-symbols-outlined text-xs">error</span>
                                                        Authoritative Audit Note / Decline Reason:
                                                    </p>
                                                    <p className="font-mono text-xs">{n.rejectionReason}</p>
                                                </div>
                                            )}

                                            {/* Universal Destination Action Button */}
                                            {(() => {
                                                const action = getNotificationAction(n);
                                                return (
                                                    <div className="pt-2 flex flex-wrap items-center gap-3" onClick={e => e.stopPropagation()}>
                                                        <Link
                                                            to={action.url}
                                                            className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-pure-white bg-electric-blue hover:bg-stark-black px-3.5 py-1.5 brutal-border shadow-[2px_2px_0px_0px_#000000] hover:-translate-y-0.5 transition-all cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">{action.icon}</span>
                                                            <span>{action.label} &rarr;</span>
                                                        </Link>
                                                        {!n.isRead && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(n.id)}
                                                                className="text-[11px] font-bold text-zinc-500 hover:text-stark-black uppercase underline cursor-pointer"
                                                            >
                                                                Mark as Read
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Right Controls: Timestamp & Single Delete Button */}
                                        <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-2">
                                            <button
                                                onClick={(e) => handleDeleteOne(n.id, e)}
                                                title="Delete this transmission"
                                                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">close</span>
                                            </button>

                                            {n.createdAt && (
                                                <span className="text-[10px] text-zinc-400 font-mono mt-auto">
                                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
