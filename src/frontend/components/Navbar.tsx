"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Bell, Video, Calendar, Menu, X } from "lucide-react";
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [router]);    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error && !error.message.includes("Auth session missing")) {
                    console.error("Auth fetch error:", error);
                }
                const user = data?.user;
                if (user?.email) {
                    const { data: roleData, error: roleError } = await supabase.from('user_roles').select('role').eq('email', user.email).maybeSingle();
                    if (roleError) console.error("Role fetch error:", roleError);
                    if (roleData?.role) {
                        setDbRole(roleData.role);
                    }
                }
                setUser(user || null);
            } catch (err) {
                console.error("Failed to fetch user in Navbar:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                const currentUser = session?.user ?? null;
                if (currentUser?.email) {
                    const { data, error } = await supabase.from('user_roles').select('role').eq('email', currentUser.email).maybeSingle();
                    if (error) console.error("Role fetch error on auth change:", error);
                    setDbRole(data?.role || null);
                } else {
                    setDbRole(null);
                }
                setUser(currentUser);
            } catch (err) {
                console.error("Failed to handle auth state change:", err);
            } finally {
                setLoading(false);
            }
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
        const channel = supabase.channel('public:notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
                    <Image src="/logo.jpg" alt="InVolution Logo" width={300} height={80} className="h-16 w-auto object-contain" priority />
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
                    <Link href="/about" className="hover:text-emerald-700 transition-colors">About</Link>

                    {isAuthenticated ? (
                        role === "admin" ? (
                            <>
                                <Link href="/admin/kyc" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">KYC Verification</Link>
                                <Link href="/admin/financial-verification" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">Financial Verification</Link>
                                <Link href="/admin/investors" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">Investor Verification</Link>
                                <Link href="/mentors/manage-knowledge" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">Manage Knowledge Hub</Link>
                            </>
                        ) : role === "mentor" ? (
                            <>
                                <Link href="/mentors/dashboard" className="hover:text-emerald-700 transition-colors">Mentor Dashboard</Link>
                                <Link href="/mentors/manage-knowledge" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">Manage Knowledge Hub</Link>
                            </>
                        ) : role === "investor" ? (
                            <>
                                <Link href="/investors/dashboard" className="hover:text-emerald-700 transition-colors">Overview</Link>
                                <Link href="/investors/portfolio" className="hover:text-emerald-700 transition-colors font-bold text-emerald-600">My Portfolio</Link>
                                <Link href="/investors/search" className="hover:text-emerald-700 transition-colors">Startups</Link>
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

                    {isAuthenticated && (
                        <Link href="/knowledge-hub" className="hover:text-emerald-700 transition-colors font-bold">Knowledge Hub</Link>
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
                                    <div className="absolute right-[-1rem] sm:right-0 mt-4 w-[calc(100vw-2rem)] sm:w-[360px] md:w-[420px] bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200 ease-out">
                                        <div className="px-5 py-4 border-b border-slate-100/50 bg-white/50 flex justify-between items-center">
                                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Notifications</h3>
                                            <button onClick={markAllAsRead} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors py-2 px-2 -mr-2">Mark all as read</button>
                                        </div>
                                        <div className="flex flex-col max-h-[400px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-slate-500 text-sm">No notifications available.</div>
                                            ) : (
                                                notifications.map(n => {
                                                    const isUnread = !n.is_read;
                                                    let Icon = Bell;
                                                    if (n.title?.toLowerCase().includes('meeting') || n.type === 'meeting') Icon = Video;
                                                    else if (n.title?.toLowerCase().includes('schedule')) Icon = Calendar;
                                                    
                                                    return (
                                                        <div key={n.id} onClick={() => { if(isUnread) markAsRead(n.id); if(n.link) router.push(n.link); }} className="p-5 flex gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer relative bg-white/40 border-b border-slate-50/50 group">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isUnread ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-transparent'}`}></div>
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                <div className={`size-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${isUnread ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                    <Icon className="size-5" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                                    <h4 className={`text-sm font-bold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</h4>
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shrink-0 ${isUnread ? 'text-emerald-600' : 'text-slate-400'}`}>{formatRelativeTime(new Date(n.created_at))}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-500 leading-snug line-clamp-2">{n.description}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <div className="p-3 border-t border-slate-100/50 bg-slate-50/50 text-center">
                                            <Link href="/notifications" className="block w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                                                View all notifications
                                            </Link>
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
                                <button onClick={handleSignOut} className="hidden sm:block text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors py-2">
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="hidden md:block text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors">
                                Login
                            </Link>
                            <Link href="/login" className="hidden md:block text-sm font-semibold bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 transition-colors shadow-sm">
                                Investor Portal
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="md:hidden ml-2 p-2 -mr-2 text-slate-500 hover:text-emerald-600 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-lg animate-in slide-in-from-top-2 flex flex-col py-2 z-40 max-h-[calc(100vh-70px)] overflow-y-auto">
                    <div className="flex flex-col px-4 gap-1">
                        <Link href="/about" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                        
                        {isAuthenticated ? (
                            role === "admin" ? (
                                <>
                                    <Link href="/admin/kyc" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-bold text-emerald-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>KYC Verification</Link>
                                    <Link href="/admin/financial-verification" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-bold text-emerald-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Financial Verification</Link>
                                    <Link href="/admin/investors" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-bold text-emerald-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Investor Verification</Link>
                                    <Link href="/mentors/manage-knowledge" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-bold text-emerald-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Manage Knowledge Hub</Link>
                                </>
                            ) : role === "mentor" ? (
                                <>
                                    <Link href="/mentors/dashboard" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Mentor Dashboard</Link>
                                    <Link href="/mentors/manage-knowledge" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-bold text-emerald-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Manage Knowledge Hub</Link>
                                </>
                            ) : role === "investor" ? (
                                <>
                                    <Link href="/investors/dashboard" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Overview</Link>
                                    <Link href="/investors/portfolio" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-bold text-emerald-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>My Portfolio</Link>
                                    <Link href="/investors/search" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Startups</Link>
                                    <Link href="/investors/incube" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Incube</Link>
                                </>
                            ) : (
                                <Link href="/startups/dashboard" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                            )
                        ) : (
                            <>
                                <Link href="/startups" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Startups</Link>
                                <Link href="/investors" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Investors</Link>
                                <Link href="/incube" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Incube</Link>
                            </>
                        )}

                        {isAuthenticated && (
                            <Link href="/knowledge-hub" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-bold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Knowledge Hub</Link>
                        )}

                        <Link href="/rules" className="block py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-slate-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Rules & FAQ</Link>

                        {isAuthenticated && (
                            <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="sm:hidden text-left block w-full py-3 px-4 hover:bg-slate-50 rounded-xl text-base font-semibold text-rose-500 transition-colors">
                                Sign Out
                            </button>
                        )}

                        {!isAuthenticated && (
                            <div className="w-full flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
                                <Link href="/login" className="w-full text-center text-base font-semibold text-slate-600 hover:bg-slate-100 transition-colors py-3.5 bg-slate-50 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                                    Login
                                </Link>
                                <Link href="/login" className="w-full text-center text-base font-semibold bg-emerald-600 text-white py-3.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm" onClick={() => setIsMobileMenuOpen(false)}>
                                    Investor Portal
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
