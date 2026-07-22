"use client";

import Link from "next/link";
import { FileText, MessageSquare, TrendingUp, Download, Eye, Clock, ShieldCheck, Loader2, Bookmark, ArrowRight, Rss, Briefcase, ChevronRight, Activity, Users, Scale, Factory, MapPin, Search, Star, PieChart, ActivitySquare, CheckCircle2, BrainCircuit, PlayCircle, BarChart3, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/utils/timeHelper";
import { createClient } from "@/utils/supabase/client";

interface Agreement { id: string; startup: string; date: string; amount: string; equity: string; status: string; }
interface ActiveChat { id: string; startupId: string; startup: string; lastMessage: string; time: string; unread: number; }
interface PortfolioStats { totalCapital: string; activeStartups: number; }

export default function InvestorDashboard() {
    // Existing State
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [chats, setChats] = useState<ActiveChat[]>([]);
    const [stats, setStats] = useState<PortfolioStats>({ totalCapital: "₹ 0", activeStartups: 0 });
    const [loading, setLoading] = useState(true);
    const [followedStartups, setFollowedStartups] = useState<any[]>([]);
    
    // New State
    const [savedStartups, setSavedStartups] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [recommendedStartups, setRecommendedStartups] = useState<any[]>([]);
    const [investorProfile, setInvestorProfile] = useState<any>({ name: "Investor", joined: "2024" });
    const [analytics, setAnalytics] = useState<any>({ industries: 0, verified: 0, avgTrust: 0, avgAi: 0 });

    const supabase = createClient();

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                // 1. Fetch Dashboard API (Agreements, Chats, Stats)
                const resDash = await fetch('/api/investors/dashboard');
                const dataDash = await resDash.json();
                
                let loadedAgreements: Agreement[] = [];
                if (dataDash.success) {
                    loadedAgreements = dataDash.executedAgreements || [];
                    setAgreements(loadedAgreements);
                    setChats(dataDash.activeChats || []);
                    setStats(dataDash.portfolioStats || { totalCapital: "₹ 0", activeStartups: 0 });
                }

                // 2. Fetch User Profile
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setInvestorProfile({
                        name: user.user_metadata?.full_name || "Investor",
                        joined: new Date(user.created_at || Date.now()).getFullYear().toString()
                    });
                }

                // 3. Fetch All Startups to build Followed, Saved, Recommended, Analytics
                const { data: followData } = await supabase
                    .from('startup_follows')
                    .select('startup_id')
                    .eq('investor_email', user?.email);
                
                let followedIds = followData ? followData.map((f: any) => f.startup_id) : [];
                
                // Fallback to local storage to ensure UI works even if DB isn't updated
                const f = localStorage.getItem('inv_followed_startups');
                if (f) {
                    const localIds = JSON.parse(f);
                    followedIds = Array.from(new Set([...followedIds, ...localIds]));
                }
                
                const s = localStorage.getItem('inv_saved_startups');
                const savedIds = s ? JSON.parse(s) : [];

                const resStartups = await fetch('/api/startups?type=regular');
                const jsonStartups = await resStartups.json();
                
                if (jsonStartups.success) {
                    const allStartups = jsonStartups.data;
                    
                    // Filter Followed
                    const followed = allStartups.filter((st: any) => followedIds.includes(st._id || st.id));
                    setFollowedStartups(followed);

                    // Filter Saved
                    const saved = allStartups.filter((st: any) => savedIds.includes(st._id || st.id));
                    setSavedStartups(saved);

                    // Recommended (Not saved, not followed)
                    const recommended = allStartups.filter((st: any) => !followedIds.includes(st._id || st.id) && !savedIds.includes(st._id || st.id))
                        .sort((a: any, b: any) => (b.trustScore || 85) - (a.trustScore || 85))
                        .slice(0, 3);
                    setRecommendedStartups(recommended);

                    // Fetch Real Recent Activity from Notifications
                    const resNotifs = await fetch('/api/user-alerts');
                    const jsonNotifs = await resNotifs.json();
                    let activity: any[] = [];
                    
                    if (jsonNotifs.success) {
                        const notifs = jsonNotifs.data;
                        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        
                        activity = notifs
                            .filter((n: any) => n.role === 'investor' && followedIds.includes(n.startup_id))
                            .filter((n: any) => new Date(n.created_at) >= twentyFourHoursAgo)
                            .map((n: any) => {
                                let iconType = 'financial';
                                if (n.type === 'video_uploaded') iconType = 'video';
                                if (n.type === 'deal_executed') iconType = 'deal';
                                return {
                                    type: iconType,
                                    title: n.title,
                                    desc: n.description,
                                    time: new Date(n.created_at),
                                    id: n.id
                                };
                            });
                    }
                    setRecentActivity(activity.slice(0, 5));

                    // Build Analytics
                    const uniqueIndustries = new Set(followed.map((st: any) => st.sector)).size;
                    const verifiedCount = followed.filter((st: any) => st.kyc_status === 'Approved').length;
                    const avgTrustScore = followed.length > 0 ? Math.round(followed.reduce((sum: number, st: any) => sum + (st.trustScore || 85), 0) / followed.length) : 0;
                    const avgAiScore = followed.length > 0 ? Math.round(followed.reduce((sum: number, st: any) => sum + (st.score || 70), 0) / followed.length) : 0;
                    
                    setAnalytics({
                        industries: uniqueIndustries,
                        verified: verifiedCount,
                        avgTrust: avgTrustScore,
                        avgAi: avgAiScore
                    });
                }
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
        
        const intervalId = setInterval(() => {
            loadDashboard(); // Simplified to just reload everything to keep state in sync
        }, 120000); // Refresh every 2 minutes to avoid excessive API calls
        
        return () => clearInterval(intervalId);
    }, []);

    const unfollow = (id: string) => {
        const next = followedStartups.filter(s => (s._id || s.id) !== id);
        setFollowedStartups(next);
        
        fetch(`/api/startups/${id}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unfollow' })
        }).catch(console.error);
    };

    // Helper functions for UI
    const getApprovedUpdates = (s: any) => s.financial_updates?.filter((u: any) => u.status === 'Approved').sort((a: any, b: any) => new Date(a.reportingDate || a.monthYear).getTime() - new Date(b.reportingDate || b.monthYear).getTime()) || [];
    const calculateHealth = (s: any) => {
        let healthScore = 65;
        const updates = getApprovedUpdates(s);
        if (updates.length > 0) healthScore += 15;
        if (s.credibility?.gstRegistered) healthScore += 10;
        if (s.score > 80) healthScore += 10;
        return Math.min(100, healthScore);
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
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl min-h-screen bg-slate-50/50">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-bold font-outfit shadow-lg shadow-slate-900/20 shrink-0">
                        {investorProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                            {investorProfile.name}
                            <ShieldCheck className="size-5 text-emerald-500" />
                        </h1>
                        <p className="text-slate-500 font-inter text-sm flex items-center gap-3">
                            <span>Verified Investor</span>
                            <span className="size-1 bg-slate-300 rounded-full"></span>
                            <span>Member since {investorProfile.joined}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link href="/investors/saved" className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold rounded-xl transition-all shadow-sm hover:shadow-md">
                        <Bookmark className="size-4" /> Saved
                    </Link>
                    <Link href="/investors/search" className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                        <Search className="size-4" /> Discover
                    </Link>
                </div>
            </div>

            {/* 1. Dashboard Overview (4 Summary Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp className="size-16 text-emerald-600" /></div>
                    <p className="text-sm font-bold text-slate-500 mb-1 relative z-10 uppercase tracking-wide">Total Investments</p>
                    <p className="text-2xl font-bold font-mono text-slate-900 relative z-10">{stats.totalCapital}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Rss className="size-16 text-indigo-600" /></div>
                    <p className="text-sm font-bold text-slate-500 mb-1 relative z-10 uppercase tracking-wide">Following Startups</p>
                    <p className="text-2xl font-bold font-mono text-slate-900 relative z-10">{followedStartups.length} <span className="text-sm font-normal text-slate-400">Companies</span></p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><MessageSquare className="size-16 text-blue-500" /></div>
                    <p className="text-sm font-bold text-slate-500 mb-1 relative z-10 uppercase tracking-wide">Active Deal Rooms</p>
                    <p className="text-2xl font-bold font-mono text-slate-900 relative z-10">{chats.length} <span className="text-sm font-normal text-slate-400">Open</span></p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FileText className="size-16 text-slate-900" /></div>
                    <p className="text-sm font-bold text-slate-500 mb-1 relative z-10 uppercase tracking-wide">Executed Agreements</p>
                    <p className="text-2xl font-bold font-mono text-slate-900 relative z-10">{agreements.length} <span className="text-sm font-normal text-slate-400">Signed</span></p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-10">
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Active Negotiations */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <MessageSquare className="size-5 text-blue-500" /> Active Negotiations
                            </h2>
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{chats.length} Open</span>
                        </div>
                        <div className="p-6">
                            {chats.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <MessageSquare className="size-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-900 font-medium">No active deal rooms.</p>
                                    <p className="text-slate-500 text-sm mt-1">Start a conversation with a startup to negotiate terms.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {chats.map((chat) => (
                                        <div key={chat.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-100 shrink-0">
                                                    {chat.startup.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{chat.startup}</h3>
                                                    <p className="text-sm text-slate-500 line-clamp-1">{chat.lastMessage}</p>
                                                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mt-1"><Clock className="size-3" /> {chat.time}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 w-full sm:w-auto border-t sm:border-0 border-slate-200 pt-3 sm:pt-0">
                                                {chat.unread > 0 && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold animate-pulse shrink-0">
                                                        {chat.unread} New
                                                    </span>
                                                )}
                                                <Link href={`/messages?startupId=${chat.startupId}&name=${encodeURIComponent(chat.startup)}`} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-bold rounded-xl text-sm transition-colors text-center group-hover:text-blue-600">
                                                    Continue Deal Room
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Following Startups */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Rss className="size-5 text-indigo-500" /> Following Startups
                            </h2>
                            <Link href="/investors/search" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                                Discover More <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="p-6">
                            {followedStartups.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                    <div className="size-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Rss className="size-8 text-indigo-300" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold text-lg">No Followed Startups Yet</h3>
                                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto mb-5">Follow startups to receive financial updates and notifications.</p>
                                    <Link href="/investors/search" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors inline-block shadow-md">
                                        Explore Startups
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-5">
                                    {followedStartups.map(s => {
                                        const approved = getApprovedUpdates(s);
                                        const latestRev = approved.length > 0 ? approved[approved.length - 1].revenue : 0;
                                        const health = calculateHealth(s);
                                        return (
                                            <div key={s._id || s.id} className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl shrink-0">
                                                                {s.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{s.name}</h3>
                                                                <p className="text-xs text-slate-500 flex items-center gap-1"><Factory className="size-3" /> {s.sector || 'Various'}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => unfollow(s._id || s.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Unfollow">
                                                            <Bookmark className="size-4 fill-current" />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Health</p>
                                                            <p className="font-bold text-sm text-slate-800 flex items-center gap-1">
                                                                <ActivitySquare className={`size-3 ${health >= 75 ? 'text-emerald-500' : 'text-yellow-500'}`} /> {health}/100
                                                            </p>
                                                        </div>
                                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Revenue</p>
                                                            <p className="font-bold text-sm text-slate-800 font-mono">₹{latestRev > 0 ? (latestRev / 100000).toFixed(1) + 'L' : '0'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 mt-2 gap-y-3">
                                                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg" title="Trust Score"><ShieldCheck className="size-3" /> {s.trustScore || 85}</span>
                                                        <span className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-lg" title="AI Match"><BrainCircuit className="size-3" /> {s.score || 70}%</span>
                                                        {s.kyc_status === 'Approved' && <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg"><CheckCircle2 className="size-3" /> Verified</span>}
                                                    </div>
                                                    <Link href={`/startups/${s._id || s.id}`} className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto text-center">
                                                        View Startup
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Executed Agreements */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                            <FileText className="size-5 text-emerald-600" />
                            <h2 className="text-lg font-bold text-slate-900">Executed Agreements</h2>
                        </div>
                        <div className="p-6">
                            {agreements.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                    <div className="size-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FileText className="size-8 text-emerald-300" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold text-lg">No Investments Yet</h3>
                                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto mb-5">Start exploring verified startups to begin investing.</p>
                                    <Link href="/investors/search" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors inline-block shadow-md">
                                        Explore Verified Startups
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {agreements.map((agr) => (
                                        <div key={agr.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md hover:border-emerald-200 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100 shrink-0">
                                                    {agr.startup.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-bold text-slate-900 text-lg leading-none">{agr.startup}</h3>
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-md tracking-wider">
                                                            {agr.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 flex items-center gap-4">
                                                        <span>Ref: {agr.id}</span>
                                                        <span>{agr.date}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto justify-between bg-slate-50 p-4 sm:p-3 rounded-xl border border-slate-100">
                                                <div className="flex items-center justify-around w-full sm:w-auto gap-6">
                                                    <div className="text-center">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Investment</p>
                                                        <p className="font-mono text-slate-800 font-bold">{agr.amount}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Equity</p>
                                                        <p className="font-mono text-slate-800 font-bold">{agr.equity}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 sm:border-l border-slate-200 sm:pl-4 w-full sm:w-auto justify-center pt-3 sm:pt-0 border-t sm:border-t-0">
                                                    <Link href={`/messages/agreement?startup=${encodeURIComponent(agr.startup)}&amount=${encodeURIComponent(agr.amount)}&equity=${encodeURIComponent(agr.equity)}&signature=John+Doe`} className="p-2 bg-white border border-slate-200 hover:border-emerald-400 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors" title="View Document">
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <Link href={`/messages/agreement?startup=${encodeURIComponent(agr.startup)}&amount=${encodeURIComponent(agr.amount)}&equity=${encodeURIComponent(agr.equity)}&signature=John+Doe`} className="p-2 bg-white border border-slate-200 hover:border-emerald-400 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors" title="Download">
                                                        <Download className="size-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (Sidebar Content) */}
                <div className="lg:col-span-1 space-y-8">
                    
                    {/* Portfolio Analytics */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <PieChart className="size-4 text-emerald-500" /> Portfolio Analytics
                            </h2>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <Factory className="size-5 text-slate-400 mb-2" />
                                    <p className="text-2xl font-bold text-slate-800 font-mono">{analytics.industries}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Industries</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <CheckCircle2 className="size-5 text-emerald-500 mb-2" />
                                    <p className="text-2xl font-bold text-slate-800 font-mono">{analytics.verified}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Verified Cos</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <ShieldCheck className="size-5 text-blue-500 mb-2" />
                                    <p className="text-2xl font-bold text-slate-800 font-mono">{analytics.avgTrust}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Avg Trust</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <BrainCircuit className="size-5 text-purple-500 mb-2" />
                                    <p className="text-2xl font-bold text-slate-800 font-mono">{analytics.avgAi}%</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Avg AI Match</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Saved Startups Widget */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Bookmark className="size-4 text-slate-700" /> Saved Startups
                            </h2>
                            <Link href="/investors/saved" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">View All</Link>
                        </div>
                        <div className="p-5">
                            {savedStartups.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm">
                                    <Bookmark className="size-6 text-slate-300 mx-auto mb-2" />
                                    <p className="font-bold text-slate-700">No Saved Startups</p>
                                    <span className="text-xs">Save interesting startups to revisit them later.</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {savedStartups.slice(0, 3).map(s => (
                                        <Link href={`/startups/${s._id || s.id}`} key={s._id || s.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                                            <div className="size-10 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold shrink-0">
                                                {s.name?.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">{s.name}</h4>
                                                <p className="text-xs text-slate-500 truncate">{s.sector || 'Various'}</p>
                                            </div>
                                            <div className="shrink-0 bg-purple-50 text-purple-600 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                                                <BrainCircuit className="size-3" /> {s.score || 75}%
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="size-4 text-orange-500" /> Recent Activity
                            </h2>
                        </div>
                        <div className="p-5">
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm">
                                    <Activity className="size-6 text-slate-300 mx-auto mb-2" />
                                    No recent activity in the last 24 hours.
                                </div>
                            ) : (
                                <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                    {recentActivity.map((act, i) => (
                                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center size-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                                                {act.type === 'financial' && <TrendingUp className="size-4 text-emerald-500" />}
                                                {act.type === 'video' && <PlayCircle className="size-4 text-purple-500" />}
                                                {act.type === 'deal' && <FileText className="size-4 text-blue-500" />}
                                            </div>
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-snug mb-2">{act.desc}</p>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatRelativeTime(act.time)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="bg-gradient-to-b from-purple-50 to-white border border-purple-100 rounded-3xl shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BrainCircuit className="size-24" /></div>
                        <div className="p-5 border-b border-purple-100/50 flex items-center justify-between relative z-10">
                            <h2 className="text-base font-bold text-purple-900 flex items-center gap-2">
                                <Star className="size-4 text-purple-500 fill-purple-200" /> AI Recommendations
                            </h2>
                        </div>
                        <div className="p-5 relative z-10">
                            {recommendedStartups.length === 0 ? (
                                <div className="text-center py-4 text-sm text-purple-500">
                                    Loading recommendations...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recommendedStartups.map(s => (
                                        <Link href={`/startups/${s._id || s.id}`} key={s._id || s.id} className="flex flex-col p-4 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{s.name}</h4>
                                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                                                    {s.score || 80}% MATCH
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-3 line-clamp-1">{s.desc}</p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{s.sector}</span>
                                                <span className="text-xs font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    Explore <ArrowRight className="size-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
