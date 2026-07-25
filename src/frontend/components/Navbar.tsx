"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatRelativeTime } from "@/utils/timeHelper";

const supabase = createClient();

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [dbRole, setDbRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                const { data } = await supabase.from('user_roles').select('role').eq('email', user.email).maybeSingle();
                if (data?.role) {
                    setDbRole(data.role);
                }
            }
            setUser(user);
            setLoading(false);
        };
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            if (currentUser?.email) {
                const { data } = await supabase.from('user_roles').select('role').eq('email', currentUser.email).maybeSingle();
                setDbRole(data?.role || null);
            } else {
                setDbRole(null);
            }
            setUser(currentUser);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const role = dbRole || user?.user_metadata?.role || "investor";
        const isAuthenticated = !loading && !!user;
        if (!isAuthenticated) return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/user-alerts');
                const json = await res.json();
                let notifs = json.success ? json.data : [];

                const readStorage = localStorage.getItem(`read_notifs_${user?.id || 'guest'}`);
                const deletedStorage = localStorage.getItem(`deleted_notifs_${user?.id || 'guest'}`);
                const readIds = readStorage ? JSON.parse(readStorage) : [];
                const deletedIds = deletedStorage ? JSON.parse(deletedStorage) : [];

                // Filter out any locally deleted global notifications
                notifs = notifs.filter((n: any) => !deletedIds.includes(n.id));

                // Map local read status for global notifications
                notifs = notifs.map((n: any) => ({
                    ...n,
                    is_read: n.is_read || readIds.includes(n.id)
                }));

                // Filter for investors to only see notifications for startups they follow (if they are investor-role global broadcasts)
                if (role === 'investor') {
                    const f = localStorage.getItem('inv_followed_startups');
                    const followedIds = f ? JSON.parse(f) : [];
                    
                    notifs = notifs.filter((n: any) => {
                        // If it's specifically addressed to this user, keep it
                        if (n.user_email === user?.email) return true;
                        // If it's a global investor broadcast, check if they follow the startup
                        if (n.role === 'investor') {
                            return n.startup_id && followedIds.includes(n.startup_id);
                        }
                        return false;
                    });
                }

                setNotifications(notifs);

                // Update unread count based on actual is_read from DB or local storage fallback
                // We'll trust the DB is_read now
                const unread = notifs.filter((n: any) => !n.is_read).length;
                setUnreadCount(unread);
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };

        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 60000);
        return () => clearInterval(intervalId);
    }, [loading, user, dbRole]);

    const markAsRead = async (id: string) => {
        try {
            const readStorage = localStorage.getItem(`read_notifs_${user?.id || 'guest'}`);
            const readIds = readStorage ? JSON.parse(readStorage) : [];
            if (!readIds.includes(id)) {
                readIds.push(id);
                localStorage.setItem(`read_notifs_${user?.id || 'guest'}`, JSON.stringify(readIds));
            }

            await fetch(`/api/user-alerts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
    };

    const markAllAsRead = async () => {
        const readStorage = localStorage.getItem(`read_notifs_${user?.id || 'guest'}`);
        const readIds = readStorage ? JSON.parse(readStorage) : [];
        
        notifications.forEach(n => {
            if (!readIds.includes(n.id)) readIds.push(n.id);
        });
        localStorage.setItem(`read_notifs_${user?.id || 'guest'}`, JSON.stringify(readIds));

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/");
    };

    const role = dbRole || user?.user_metadata?.role || "investor";
    const name = (user?.user_metadata?.kycStatus === 'Approved' ? user?.user_metadata?.kyc_name : null) || user?.user_metadata?.full_name || "User";
    const image = user?.user_metadata?.avatar_url || null;
    const isAuthenticated = !loading && !!user;

    return (
        <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 shadow-sm">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="font-outfit text-lg font-bold tracking-tight flex items-center gap-2.5 text-slate-900">
                    <Image src="/logo.svg" alt="InVolution Logo" width={30} height={30} className="size-7 object-contain" />
                    <span>InVolution</span>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
                    <Link href="/about" className="hover:text-emerald-700 transition-colors">About</Link>

                    {isAuthenticated ? (
                        role === "admin" ? (
                            <>
                                <Link href="/admin/kyc" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">Admin Panel</Link>
                                <Link href="/admin/financial-verification" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">Financial Verification</Link>
                                <Link href="/admin/investors" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">Investor Verification</Link>
                                <Link href="/admin/users" className="hover:text-emerald-700 transition-colors">Users</Link>
                            </>
                        ) : role === "investor" ? (
                            <>
                                <Link href="/investors/dashboard" className="hover:text-emerald-700 transition-colors">Portfolio</Link>
                                <Link href="/investors/incube" className="hover:text-emerald-700 transition-colors">Incube</Link>
                            </>
                        ) : (
                            <Link href="/startups/dashboard" className="hover:text-emerald-700 transition-colors">Dashboard</Link>
                        )
                    ) : (
                        <>
                            <Link href="/startups" className="hover:text-emerald-700 transition-colors">Startups</Link>
                            <Link href="/investors" className="hover:text-emerald-700 transition-colors">Investors</Link>
                            <Link href="/incube" className="hover:text-emerald-700 transition-colors">Incube</Link>
                        </>
                    )}

                    <Link href="/rules" className="hover:text-emerald-700 transition-colors">Rules & FAQ</Link>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <Link
                                href={role === "investor" ? "/investors/search" : "/startups/dashboard"}
                                className="hidden md:block text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
                            >
                                {role === "investor" ? "Discover" : "Dashboard"}
                            </Link>
                            
                            {/* Global Notification Center */}
                            <div className="relative ml-2">
                                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors relative">
                                    <Bell className="size-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex size-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full size-4 bg-red-500 border-2 border-white items-center justify-center text-[8px] font-bold text-white">{unreadCount}</span>
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                            <h3 className="font-bold text-slate-900 flex items-center gap-2">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllAsRead} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Mark all as read</button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-slate-500 text-sm">No new notifications.</div>
                                            ) : (
                                                notifications.map(n => {
                                                    const isRead = n.is_read;
                                                    return (
                                                    <div key={n.id} className={`p-4 transition-colors relative group ${isRead ? 'bg-white' : 'bg-emerald-50/30'}`}>
                                                        {!isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                                                        <div className="flex justify-between items-start mb-1">
                                                            <Link href={n.link} onClick={() => {markAsRead(n.id); setShowNotifications(false);}} className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors pr-6">
                                                                {n.title}
                                                            </Link>
                                                        </div>
                                                        <p className="text-xs text-slate-600 mb-2">{n.description}</p>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatRelativeTime(new Date(n.created_at))}</span>
                                                            {!isRead && (
                                                                <button onClick={() => markAsRead(n.id)} className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Mark as read</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )})
                                            )}
                                        </div>
                                        <div className="p-3 border-t border-slate-100 text-center bg-slate-50">
                                            <Link href="/notifications" className="text-xs font-bold text-slate-500 hover:text-slate-700">View All Notifications</Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 ml-2">
                                {image ? (
                                    <Image src={image} alt="Avatar" width={28} height={28} className="size-7 rounded-full border-2 border-emerald-200 shadow-sm" />
                                ) : (
                                    <div className="size-7 rounded-full border-2 border-emerald-200 shadow-sm bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                                        {name?.charAt(0) || "U"}
                                    </div>
                                )}
                                <button onClick={handleSignOut} className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors">
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
                                Login
                            </Link>
                            <Link href="/login" className="text-sm font-semibold bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 transition-colors shadow-sm">
                                Investor Portal
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
