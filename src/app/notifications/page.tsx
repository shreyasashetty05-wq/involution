"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/utils/timeHelper";
import Link from "next/link";
import { Check, CheckCircle2, Trash2, BellOff, Loader2 } from "lucide-react";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [userId, setUserId] = useState<string>('guest');

    useEffect(() => {
        const getUserId = async () => {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (data?.user?.id) setUserId(data.user.id);
        };
        getUserId();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const json = await res.json();
            if (json.success) {
                let notifs = json.data;
                const readStorage = localStorage.getItem(`read_notifs_${userId}`);
                const deletedStorage = localStorage.getItem(`deleted_notifs_${userId}`);
                const readIds = readStorage ? JSON.parse(readStorage) : [];
                const deletedIds = deletedStorage ? JSON.parse(deletedStorage) : [];

                notifs = notifs.filter((n: any) => !deletedIds.includes(n.id)).map((n: any) => ({
                    ...n,
                    is_read: n.is_read || readIds.includes(n.id)
                }));
                setNotifications(notifs);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId !== 'guest') fetchNotifications();
    }, [userId]);

    const markAsRead = async (id: string) => {
        try {
            const readStorage = localStorage.getItem(`read_notifs_${userId}`);
            const readIds = readStorage ? JSON.parse(readStorage) : [];
            if (!readIds.includes(id)) {
                readIds.push(id);
                localStorage.setItem(`read_notifs_${userId}`, JSON.stringify(readIds));
            }

            await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    const markAllAsRead = async () => {
        try {
            const readStorage = localStorage.getItem(`read_notifs_${userId}`);
            const readIds = readStorage ? JSON.parse(readStorage) : [];
            
            notifications.forEach(n => {
                if (!readIds.includes(n.id)) readIds.push(n.id);
            });
            localStorage.setItem(`read_notifs_${userId}`, JSON.stringify(readIds));

            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            
            for (const id of unreadIds) {
                fetch(`/api/notifications/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_read: true })
                }).catch(console.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const deletedStorage = localStorage.getItem(`deleted_notifs_${userId}`);
            const deletedIds = deletedStorage ? JSON.parse(deletedStorage) : [];
            if (!deletedIds.includes(id)) {
                deletedIds.push(id);
                localStorage.setItem(`deleted_notifs_${userId}`, JSON.stringify(deletedIds));
            }

            await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.id !== id));
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (e) {
            console.error(e);
        }
    };

    const deleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} notification(s)?`)) return;

        try {
            const idsToDelete = Array.from(selectedIds);
            const deletedStorage = localStorage.getItem(`deleted_notifs_${userId}`);
            const deletedIds = deletedStorage ? JSON.parse(deletedStorage) : [];
            idsToDelete.forEach(id => {
                if (!deletedIds.includes(id)) deletedIds.push(id);
            });
            localStorage.setItem(`deleted_notifs_${userId}`, JSON.stringify(deletedIds));

            setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
            setSelectedIds(new Set());

            for (const id of idsToDelete) {
                fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(console.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const clearAll = async () => {
        if (!confirm("Are you sure you want to clear all your notifications? This cannot be undone.")) return;
        setClearing(true);
        try {
            const deletedStorage = localStorage.getItem(`deleted_notifs_${userId}`);
            const deletedIds = deletedStorage ? JSON.parse(deletedStorage) : [];
            notifications.forEach(n => {
                if (!deletedIds.includes(n.id)) deletedIds.push(n.id);
            });
            localStorage.setItem(`deleted_notifs_${userId}`, JSON.stringify(deletedIds));

            await fetch(`/api/notifications?action=clear_all`, { method: 'DELETE' });
            setNotifications([]);
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
        } finally {
            setClearing(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-6">
            <div className="container mx-auto max-w-4xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 font-outfit">Notifications</h1>
                        <p className="text-slate-500 mt-1">Manage all your alerts and activities.</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedIds.size > 0 && (
                            <button onClick={deleteSelected} className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-200">
                                Delete Selected ({selectedIds.size})
                            </button>
                        )}
                        <button onClick={markAllAsRead} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <CheckCircle2 className="size-4" /> Mark All Read
                        </button>
                        <button onClick={clearAll} disabled={clearing} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-2">
                            {clearing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Clear All
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="size-8 text-emerald-500 animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
                        <BellOff className="size-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No notifications available.</h3>
                        <p className="text-slate-500 mt-2">Notifications will appear here when new events occur.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-4 md:p-6 transition-colors flex gap-4 ${n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70'}`}>
                                    <div className="pt-1">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(n.id)}
                                            onChange={() => toggleSelection(n.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                                            <Link href={n.link} onClick={() => !n.is_read && markAsRead(n.id)} className="font-bold text-slate-900 hover:text-emerald-600 transition-colors text-lg">
                                                {n.title}
                                            </Link>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                                                {formatRelativeTime(new Date(n.created_at))}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 mb-3">{n.description}</p>
                                        <div className="flex items-center gap-4">
                                            {!n.is_read && (
                                                <button onClick={() => markAsRead(n.id)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                                    <Check className="size-3" /> Mark as Read
                                                </button>
                                            )}
                                            <button onClick={() => deleteNotification(n.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1">
                                                <Trash2 className="size-3" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
