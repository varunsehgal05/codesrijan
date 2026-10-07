import { useState, useEffect } from "react";
import axios from "axios";
import { useAppStore } from "../lib/store";
import { Link } from "@tanstack/react-router";

export function NotificationBell() {
    const { currentUser } = useAppStore();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem("codesrijan_auth_token");
                if (!token) return;
                const BASE_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');
                const res = await axios.get(`${BASE_URL}/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifications(res.data);
            } catch (e) {
                // Ignore silent failures
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleMarkAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem("codesrijan_auth_token");
            const BASE_URL = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api.onrender.com/api');
            await axios.patch(`${BASE_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) {}
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
                <div className="absolute top-full right-0 mt-2 w-80 bg-surface dark:bg-ink-black border-2 border-ink-black brutal-shadow z-[60] flex flex-col max-h-96 overflow-y-auto">
                    <div className="p-3 border-b-2 border-ink-black bg-electric-blue text-white flex justify-between items-center sticky top-0">
                        <h3 className="font-label-bold uppercase">System Alerts</h3>
                        {unreadCount > 0 && <span className="text-xs bg-ink-black px-2 py-1 rounded">{unreadCount} UNREAD</span>}
                    </div>
                    
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-surface-variant font-mono text-sm">
                            No active transmissions.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-4 border-b-2 border-ink-black last:border-b-0 ${n.isRead ? 'bg-surface-container opacity-70' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-label-bold uppercase text-ink-black text-sm">{n.title}</span>
                                        {!n.isRead && (
                                            <button onClick={() => handleMarkAsRead(n.id)} className="text-[10px] bg-electric-blue text-white px-2 py-0.5 uppercase brutal-border hover:bg-stark-black">
                                                MARK READ
                                            </button>
                                        )}
                                    </div>
                                    <p className="font-body-sm text-stark-black text-xs">{n.message}</p>
                                    
                                    {/* Action Links based on type */}
                                    {n.type === 'join_request' && !n.isRead && (
                                        <Link to="/dashboard" onClick={() => setIsOpen(false)} className="inline-block mt-2 text-xs font-bold text-electric-blue hover:underline">
                                            REVIEW REQUEST &rarr;
                                        </Link>
                                    )}
                                    {n.type === 'team_invite' && !n.isRead && (
                                        <Link to="/recruitment" onClick={() => setIsOpen(false)} className="inline-block mt-2 text-xs font-bold text-electric-blue hover:underline">
                                            VIEW INVITES &rarr;
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
