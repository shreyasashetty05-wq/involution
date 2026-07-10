"use client";

import Link from "next/link";
import { FileText, MessageSquare, TrendingUp, Download, Eye, Clock, ShieldCheck, Loader2, Bell, Bookmark, ArrowRight, Rss } from "lucide-react";
import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/utils/timeHelper";
import { createClient } from "@/utils/supabase/client";

interface Agreement { id: string; startup: string; date: string; amount: string; equity: string; status: string; }
interface ActiveChat { id: string; startupId: string; startup: string; lastMessage: string; time: string; unread: number; }
interface PortfolioStats { totalCapital: string; activeStartups: number; }

export default function InvestorDashboard() {
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [chats, setChats] = useState<ActiveChat[]>([]);
    const [stats, setStats] = useState<PortfolioStats>({ totalCapital: "₹ 0", activeStartups: 0 });
    const [loading, setLoading] = useState(true);

    const [followedStartups, setFollowedStartups] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    
    const supabase = createClient();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/investors/dashboard');
                const data = await res.json();

                if (data.success) {
                    setAgreements(data.executedAgreements || []);
                    setChats(data.activeChats || []);
                    setStats(data.portfolioStats || { totalCapital: "₹ 0", activeStartups: 0 });
                }
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchFollowed = async () => {
            try {
                const f = localStorage.getItem('inv_followed_startups');
                const ids = f ? JSON.parse(f) : [];
                if (ids.length > 0) {
                    const res = await fetch('/api/startups?type=regular');
                    const json = await res.json();
                    if (json.success) {
                        const startups = json.data.filter((s: any) => ids.includes(s._id || s.id));
                        setFollowedStartups(startups);

                        // Generate Notifications
                        const notifs: any[] = [];
                        startups.forEach((s: any) => {
                            const approved = s.financial_updates?.filter((u: any) => u.status === 'Approved').sort((a: any, b: any) => new Date(a.reportingDate || a.monthYear).getTime() - new Date(b.reportingDate || b.monthYear).getTime()) || [];
                            
                            if (approved.length > 0) {
                                const last = approved[approved.length - 1];
                                const ms = new Date(last.dateSubmitted).getTime();
                                // if within last 14 days
                                if (Date.now() - ms < 14 * 24 * 60 * 60 * 1000) {
                                    notifs.push({
                                        id: `${s._id || s.id}-fin`,
                                        title: "Financials Verified & Updated",
                                        desc: `${s.name} recently updated their financial data.`,
                                        time: new Date(last.dateSubmitted),
                                        link: `/startups/${s._id || s.id}`
                                    });
                                }
                            }
                            
                            // Mock a founder activity or profile update if no recent financials
                            const createdMs = new Date(s.createdAt || 0).getTime();
                            if (Date.now() - createdMs < 7 * 24 * 60 * 60 * 1000 && approved.length === 0) {
                                notifs.push({
                                    id: `${s._id || s.id}-prof`,
                                    title: "New Pitch Deck",
                                    desc: `${s.name} updated their startup profile and documents.`,
                                    time: new Date(s.createdAt || Date.now()),
                                    link: `/startups/${s._id || s.id}`
                                });
                            }
                        });
                        
                        const sortedNotifs = notifs.sort((a, b) => b.time.getTime() - a.time.getTime());
                        setNotifications(sortedNotifs);

                        const { data: { user } } = await supabase.auth.getUser();
                        const readStorage = localStorage.getItem(`read_notifs_${user?.id || 'guest'}`);
                        const readIds = readStorage ? JSON.parse(readStorage) : [];
                        const unread = sortedNotifs.filter(n => !readIds.includes(n.id)).length;
                        setUnreadCount(unread);
                    }
                }
            } catch (e) {
                console.error("Failed to load followed startups", e);
            }
        };

        fetchDashboardData();
        fetchFollowed();
        
        const intervalId = setInterval(() => {
            fetchDashboardData();
        }, 1500);
        
        return () => clearInterval(intervalId);
    }, []);

    const unfollow = (id: string) => {
        const next = followedStartups.filter(s => (s._id || s.id) !== id);
        setFollowedStartups(next);
        localStorage.setItem('inv_followed_startups', JSON.stringify(next.map(s => s._id || s.id)));
    };

    const markAsRead = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        const readStorage = localStorage.getItem(`read_notifs_${user?.id || 'guest'}`);
        const readIds = readStorage ? JSON.parse(readStorage) : [];
        if (!readIds.includes(id)) {
            readIds.push(id);
            localStorage.setItem(`read_notifs_${user?.id || 'guest'}`, JSON.stringify(readIds));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-24 max-w-7xl min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
                <Loader2 className="size-12 animate-spin text-emerald-500 mb-4" />
                <h2 className="text-xl font-outfit text-slate-800">Loading your portfolio...</h2>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl min-h-[calc(100vh-80px)]">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">My Portfolio & Dashboard</h1>
                    <p className="text-slate-500 font-inter">Manage your investments, active negotiations, and legal documents.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Navigation Buttons */}
                    <Link href="/investors/saved" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-600 font-bold rounded-lg transition-colors shadow-sm">
                        <Bookmark className="size-4" /> Saved
                    </Link>
                    <Link href="/investors/search" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                        Discover Startups
                    </Link>

                    {/* Notifications Bell */}
                    <div className="relative">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors relative shadow-sm">
                            <Bell className="size-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white items-center justify-center text-[8px] font-bold text-white">{unreadCount}</span>
                                </span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><Bell className="size-4 text-emerald-500"/> Notifications</h3>
                                    <span className="text-xs font-bold text-slate-400">{unreadCount} New</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-500 text-sm">No new notifications from startups you follow.</div>
                                    ) : (
                                        notifications.map(n => {
                                            const readStorage = localStorage.getItem(`read_notifs_guest`); // We fallback to guest if not available syncly
                                            // The read sync is better handled but we can safely assume if it's read by using a quick check or just passing isRead down
                                            // Since we're mapping we can do a simple read check
                                            return (
                                            <Link href={n.link} key={n.id} onClick={() => {markAsRead(n.id); setShowNotifications(false);}} className="block p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <h4 className="font-bold text-sm text-slate-900 mb-0.5">{n.title}</h4>
                                                <p className="text-xs text-slate-500 mb-2">{n.desc}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatRelativeTime(n.time)}</p>
                                            </Link>
                                        )})
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column: Signed Agreements (History) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                            <FileText className="size-5 text-emerald-600" /> Executed Agreements
                        </h2>

                        <div className="space-y-4">
                            {agreements.length === 0 ? (
                                <div className="text-center py-8 opacity-50 bg-slate-50 rounded-xl border border-slate-100">
                                    <FileText className="size-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-slate-900 text-sm">No executed agreements yet.</p>
                                    <Link href="/investors/search" className="text-emerald-600 font-bold text-sm hover:underline mt-2 inline-block">Find Startups to invest in.</Link>
                                </div>
                            ) : (
                                agreements.map((agr) => (
                                    <div key={agr.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-400 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-slate-800 font-outfit text-lg">{agr.startup}</h3>
                                                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                                                    {agr.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-9000 flex items-center gap-4">
                                                <span>Ref: {agr.id}</span>
                                                <span>Date: {agr.date}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-200 md:border-none justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-9000 mb-0.5">Investment</p>
                                                <p className="font-mono text-slate-800 font-semibold">{agr.amount}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-9000 mb-0.5">Equity</p>
                                                <p className="font-mono text-slate-800 font-semibold">{agr.equity}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/messages/agreement?startup=${encodeURIComponent(agr.startup)}&amount=${encodeURIComponent(agr.amount)}&equity=${encodeURIComponent(agr.equity)}&signature=John+Doe`}
                                                    className="p-2 bg-slate-50 border border-slate-300 hover:bg-slate-200 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors group"
                                                    title="View Document"
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                {/* In a real app, this would trigger a PDF blob download. Here it takes them to the printable view where they can 'Save as PDF' */}
                                                <Link
                                                    href={`/messages/agreement?startup=${encodeURIComponent(agr.startup)}&amount=${encodeURIComponent(agr.amount)}&equity=${encodeURIComponent(agr.equity)}&signature=John+Doe`}
                                                    className="p-2 bg-slate-50 border border-slate-300 hover:bg-slate-200 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <Download className="size-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )))}
                        </div>
                    </div>

                    {/* Active Portfolio Stats */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center gap-4">
                            <div className="size-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-300">
                                <TrendingUp className="size-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-9000">Total Deployed Capital</p>
                                <p className="text-2xl font-bold font-mono text-slate-800">{stats.totalCapital}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center gap-4">
                            <div className="size-12 bg-emerald-900/30 rounded-full flex items-center justify-center border border-emerald-500/30">
                                <ShieldCheck className="size-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-9000">Active Startups</p>
                                <p className="text-2xl font-bold font-mono text-slate-800">{stats.activeStartups} Companies</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Deal Rooms */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-full">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                            <MessageSquare className="size-5 text-emerald-600" /> Active Negotiations
                        </h2>

                        <div className="space-y-4">
                            {chats.map((chat) => (
                                <Link href={`/messages?startupId=${chat.startupId}&name=${encodeURIComponent(chat.startup)}`} key={chat.id} className="block bg-white hover:bg-slate-200 border border-slate-200 hover:border-emerald-400 rounded-xl p-4 transition-all group shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{chat.startup}</h3>
                                        <span className="text-xs text-slate-9000 flex items-center gap-1"><Clock className="size-3" /> {chat.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{chat.lastMessage}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-emerald-600">Continue Deal Room &rarr;</span>
                                        {chat.unread > 0 && (
                                            <span className="size-5 bg-emerald-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                                                {chat.unread}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}

                            {chats.length === 0 && (
                                <div className="text-center py-8 opacity-50 bg-slate-50 rounded-xl">
                                    <MessageSquare className="size-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-slate-900 text-sm">No active negotiations.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Following Section */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-12">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Rss className="size-5 text-indigo-500" /> Following Startups
                    </h2>
                    <span className="text-sm font-bold text-slate-500">{followedStartups.length} Startups</span>
                </div>
                
                {followedStartups.length === 0 ? (
                    <div className="text-center py-10 opacity-50 bg-slate-50 rounded-xl border border-slate-100">
                        <Rss className="size-10 text-zinc-400 mx-auto mb-3" />
                        <p className="text-slate-900 font-medium">You aren't following any startups yet.</p>
                        <p className="text-slate-500 text-sm mt-1 mb-4">Follow startups to receive updates on their financial milestones.</p>
                        <Link href="/investors/search" className="text-indigo-600 font-bold text-sm hover:underline">Discover Startups</Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {followedStartups.map(s => (
                            <div key={s._id || s.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow group flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg font-outfit border border-indigo-100">
                                                {s.name?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                                                <p className="text-xs text-slate-500">{s.sector || 'Various'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => unfollow(s._id || s.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                                            Unfollow
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3 mb-2">
                                        <span className="text-slate-500">Asking Amount</span>
                                        <span className="font-mono font-bold text-slate-900">₹{(s.requested || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Equity Offered</span>
                                        <span className="font-bold text-emerald-600">{s.equity || 0}%</span>
                                    </div>
                                </div>
                                <Link href={`/startups/${s._id || s.id}`} className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm text-center rounded-lg transition-colors block">
                                    View Profile
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
