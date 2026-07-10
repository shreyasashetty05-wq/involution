/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Activity, Users, Clock, Briefcase, ChevronRight, Scale, Bell, Share2, ShieldCheck, BrainCircuit, TrendingUp, CheckCircle2, Factory, MapPin, X, Copy, Mail, MessageCircle, Linkedin, FileText } from "lucide-react";
import { formatRelativeTime } from "@/utils/timeHelper";
import { useToast } from "@/components/ui/ToastProvider";

export default function SavedStartups() {
    const toast = useToast();
    const [savedStartups, setSavedStartups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [followedList, setFollowedList] = useState<string[]>([]);
    const [compareList, setCompareList] = useState<string[]>([]);
    const [shareModalData, setShareModalData] = useState<any>(null);

    useEffect(() => {
        const fetchStartups = async () => {
            try {
                const s = localStorage.getItem('inv_saved_startups');
                const savedIds = s ? JSON.parse(s) : [];
                
                const f = localStorage.getItem('inv_followed_startups');
                if (f) setFollowedList(JSON.parse(f));
                
                const c = localStorage.getItem('inv_compare_list');
                if (c) setCompareList(JSON.parse(c));

                if (savedIds.length > 0) {
                    const res = await fetch('/api/startups?type=regular');
                    const json = await res.json();
                    if (json.success) {
                        const filtered = json.data.filter((st: any) => savedIds.includes(st._id || st.id));
                        setSavedStartups(filtered);
                    }
                }
            } catch (err) {
                console.error("Failed to load saved startups", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStartups();
    }, []);

    const toggleSave = (id: string) => {
        const next = savedStartups.filter((s: any) => (s._id || s.id) !== id);
        setSavedStartups(next);
        localStorage.setItem('inv_saved_startups', JSON.stringify(next.map(s => s._id || s.id)));
        
        // Since we are only removing from saved on this page:
        fetch(`/api/startups/${id}/metrics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', delta: -1 })
        }).catch(console.error);
    };

    const toggleFollow = (id: string) => {
        const isFollowing = !followedList.includes(id);
        const next = isFollowing ? [...followedList, id] : followedList.filter(x => x !== id);
        setFollowedList(next);
        localStorage.setItem('inv_followed_startups', JSON.stringify(next));

        fetch(`/api/startups/${id}/metrics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'follow', delta: isFollowing ? 1 : -1 })
        }).catch(console.error);
    };

    const toggleCompare = (id: string) => {
        if (compareList.includes(id)) {
            const next = compareList.filter(x => x !== id);
            setCompareList(next);
            localStorage.setItem('inv_compare_list', JSON.stringify(next));
        } else {
            if (compareList.length >= 3) return;
            const next = [...compareList, id];
            setCompareList(next);
            localStorage.setItem('inv_compare_list', JSON.stringify(next));
        }
    };

    const getApprovedUpdates = (s: any) => s.financial_updates?.filter((u: any) => u.status === 'Approved').sort((a: any, b: any) => new Date(a.reportingDate || a.monthYear).getTime() - new Date(b.reportingDate || b.monthYear).getTime()) || [];

    const getGrowth = (s: any) => {
        const updates = getApprovedUpdates(s);
        if (updates.length >= 2) {
            const last = updates[updates.length - 1];
            const prev = updates[updates.length - 2];
            if (Number(prev.revenue) > 0) return ((Number(last.revenue) - Number(prev.revenue)) / Number(prev.revenue)) * 100;
        }
        return 0;
    };

    const getTrust = (s: any) => s.trustScore || 85;

    const calculateHealth = (s: any) => {
        let healthScore = 65;
        const updates = getApprovedUpdates(s);
        if (updates.length > 0) healthScore += 15;
        if (getGrowth(s) > 0) healthScore += 10;
        if (s.credibility?.gstRegistered) healthScore += 5;
        if (s.score > 80) healthScore += 5;
        return Math.min(100, healthScore);
    };

    const getHealthStatus = (score: number) => {
        if (score >= 90) return { text: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50" };
        if (score >= 75) return { text: "Good", color: "text-blue-600", bg: "bg-blue-50" };
        if (score >= 60) return { text: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50" };
        return { text: "Needs Attention", color: "text-red-600", bg: "bg-red-50" };
    };

    const formatCurrency = (val: number) => {
        if (val === undefined || val === null || val === 0) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Crore`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
        return `₹${val.toLocaleString()}`;
    };

    const generateMiniSparkline = (data: number[]) => {
        if (!data || data.length < 2) return null;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max === min ? 1 : max - min;
        return data.map((val, i) => {
            const x = (i / (data.length - 1)) * 40;
            const y = 20 - ((val - min) / range) * 20;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-6 py-24 max-w-7xl min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
                <Bookmark className="size-12 animate-pulse text-emerald-500 mb-4" />
                <h2 className="text-xl font-outfit text-slate-800">Loading your Saved Startups...</h2>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl min-h-screen bg-slate-50/30">
            <div className="mb-10 animate-in fade-in slide-in-from-top-4">
                <Link href="/investors/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors mb-6">
                    <ArrowLeft className="size-4" /> Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-outfit font-bold text-slate-900 mb-2 flex items-center gap-3">
                            <Bookmark className="size-8 text-emerald-500 fill-emerald-100" /> Saved Startups
                        </h1>
                        <p className="text-slate-500 font-inter">Your personal watchlist of curated investment opportunities.</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold font-mono">
                        {savedStartups.length} Saved
                    </div>
                </div>
            </div>

            {savedStartups.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                    <Bookmark className="size-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">No Saved Startups</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">You haven't added any startups to your watchlist yet. Discover startups and click the bookmark icon to save them here.</p>
                    <Link href="/investors/search" className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors inline-block">
                        Discover Startups
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {savedStartups.map((startup, idx) => {
                        const startupId = startup._id || startup.id;
                        const equityVal = Number(startup.equity) || 0;
                        const impliedValuation = equityVal > 0 ? startup.requested / (equityVal / 100) : 0;
                        
                        const approvedUpdates = getApprovedUpdates(startup);
                        const latestUpdate = approvedUpdates.length > 0 ? approvedUpdates[approvedUpdates.length - 1] : null;
                        const revGrowth = getGrowth(startup);
                        
                        const healthScore = calculateHealth(startup);
                        const healthStatus = getHealthStatus(healthScore);
                        
                        const recentRevs = approvedUpdates.slice(-6).map((u: any) => u.revenue);
                        const sparklinePath = generateMiniSparkline(recentRevs);

                        return (
                            <div key={startupId}
                                className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col gap-6 group relative animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${Math.min(idx * 50, 500)}ms` }}
                            >
                                {/* Header Info */}
                                <div className="flex gap-4 items-start">
                                    <div className="relative shrink-0">
                                        <div className="size-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                                            <span className="text-2xl font-bold font-outfit text-slate-400">{startup?.name?.charAt(0) || 'S'}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h3 className="text-xl font-bold text-slate-900 font-outfit truncate group-hover:text-emerald-600 transition-colors">{startup.name}</h3>
                                            {(startup.credibility?.gstRegistered || startup.credibility?.panVerified) && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="size-3"/> KYC Verified</span>}
                                            {approvedUpdates.length > 0 && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold flex items-center gap-1"><ShieldCheck className="size-3"/> Financial Verified</span>}
                                            {startup.score > 0 && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold flex items-center gap-1"><BrainCircuit className="size-3"/> AI Reviewed</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 mb-3">
                                            <span className="flex items-center gap-1"><Factory className="size-3 text-slate-400"/> {startup.sector || 'Various'}</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{startup.businessModel || 'Any'}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{startup.stage || 'Seed'}</span>
                                        </div>
                                        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed pr-8">{startup.desc}</p>
                                    </div>
                                </div>

                                {/* Grid Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                                    {/* Funding */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Funding Ask</h4>
                                        <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Asking Amount</span><span className="text-sm font-mono font-bold text-slate-900">{formatCurrency(startup.requested)}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Equity Offered</span><span className="text-sm font-bold text-emerald-600">{startup.equity}%</span></div>
                                        <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Valuation</span><span className="text-sm font-mono font-bold text-slate-900">{formatCurrency(impliedValuation)}</span></div>
                                    </div>
                                    
                                    {/* Financial Snapshot */}
                                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex justify-between items-center">
                                            Financial Snapshot
                                        </h4>
                                        {latestUpdate ? (
                                            <>
                                                <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Monthly Rev</span><span className="text-sm font-mono font-bold text-emerald-600">{formatCurrency(latestUpdate.revenue)}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Monthly Profit</span><span className={`text-sm font-mono font-bold ${latestUpdate.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(latestUpdate.profit)}</span></div>
                                                {latestUpdate.netLoss > 0 && <div className="flex justify-between items-center"><span className="text-sm text-slate-500 font-medium">Monthly Loss</span><span className="text-sm font-mono font-bold text-red-500">{formatCurrency(latestUpdate.netLoss)}</span></div>}
                                            </>
                                        ) : (
                                            <div className="py-4 text-center"><span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">No approved financial data yet.</span></div>
                                        )}
                                    </div>

                                    {/* AI & Health */}
                                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Business Health</h4>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500 font-medium">Health Score</span>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-slate-800 flex items-center justify-end gap-1"><TrendingUp className={`size-3 ${healthStatus.color}`}/> {healthScore}/100</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2"><span className="text-sm text-slate-500 font-medium">Trust Score</span><span className="text-sm font-bold text-slate-800 flex items-center gap-1"><ShieldCheck className="size-3 text-blue-500"/> {getTrust(startup)}/100</span></div>
                                    </div>
                                </div>

                                {/* Bottom Actions Row */}
                                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6 mt-1">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 w-full sm:w-auto mb-4 sm:mb-0">
                                        <span className="flex items-center gap-1.5"><Users className="size-3.5 text-slate-400" /> Team: {startup.teamSize || 'N/A'}</span>
                                        <span className="flex items-center gap-1.5"><Briefcase className="size-3.5 text-slate-400" /> Investors: {startup.investorCount || 0}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-slate-400" /> Updated: {latestUpdate ? formatRelativeTime(latestUpdate.dateSubmitted) : formatRelativeTime(startup.createdAt || new Date())}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="flex items-center gap-1">
                                            <div className="relative group/tt">
                                                <button onClick={() => toggleSave(startupId)} className={`p-2 rounded-xl transition-all bg-emerald-100 text-emerald-600`}>
                                                    <Bookmark className={`size-4 fill-current`}/>
                                                </button>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">Remove from Saved</span>
                                            </div>
                                            
                                            <div className="relative group/tt">
                                                <button onClick={() => setShareModalData(startup)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Share2 className="size-4"/></button>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">Share Startup</span>
                                            </div>

                                            <div className="relative group/tt">
                                                <button onClick={() => toggleCompare(startupId)} className={`p-2 rounded-xl transition-all ${compareList.includes(startupId) ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}>
                                                    <Scale className="size-4"/>
                                                </button>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">Compare Startups</span>
                                            </div>

                                            <div className="relative group/tt">
                                                <button onClick={() => toggleFollow(startupId)} className={`p-2 rounded-xl transition-all ${followedList.includes(startupId) ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                                    <Bell className={`size-4 ${followedList.includes(startupId) ? 'fill-current' : ''}`}/>
                                                </button>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">Follow Startup</span>
                                            </div>
                                        </div>
                                        <Link href={`/startups/${startupId}`} className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg ml-2 group/btn">
                                            Explore Startup <ChevronRight className="size-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Compare Floating Banner */}
            {compareList.length >= 2 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10 border border-slate-700">
                    <div className="flex items-center gap-2">
                        <Scale className="size-5 text-emerald-400" />
                        <span className="font-bold text-sm whitespace-nowrap">{compareList.length} Selected for Comparison</span>
                    </div>
                    <Link href="/investors/compare" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-colors text-sm shadow-md whitespace-nowrap">
                        Compare Now
                    </Link>
                    <button onClick={() => {setCompareList([]); localStorage.setItem('inv_compare_list', '[]')}} className="p-1 text-slate-400 hover:text-white transition-colors">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Share Modal */}
            {shareModalData && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 border border-slate-100">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-slate-900">Share Startup</h3>
                                <button onClick={() => setShareModalData(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X className="size-4"/></button>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold font-outfit shrink-0">
                                    {shareModalData.name?.charAt(0) || 'S'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-sm truncate">{shareModalData.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{shareModalData.sector}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`); toast.success('✅ Public link copied to clipboard.'); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Copy className="size-4"/></div>
                                    Copy Startup Link
                                </button>
                                <a href={`https://wa.me/?text=Check out this startup on InVolution: ${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600"><MessageCircle className="size-4"/></div>
                                    Share via WhatsApp
                                </a>
                                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Linkedin className="size-4"/></div>
                                    Share via LinkedIn
                                </a>
                                <a href={`mailto:?subject=Investment Opportunity: ${shareModalData.name}&body=Check out ${shareModalData.name} on InVolution!%0D%0A%0D%0A${shareModalData.desc}%0D%0A%0D%0AView Deal: ${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Mail className="size-4"/></div>
                                    Share via Email
                                </a>
                                <button onClick={() => {
                                    const summary = `Startup: ${shareModalData.name}\nIndustry: ${shareModalData.sector}\nAsking: ${formatCurrency(shareModalData.requested)}\nView Deal: ${window.location.origin}/startups/${shareModalData._id || shareModalData.id}`;
                                    navigator.clipboard.writeText(summary); toast.success('✅ Summary copied to clipboard.'); 
                                }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-sm font-medium text-slate-700">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><FileText className="size-4"/></div>
                                    Copy Startup Summary
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
