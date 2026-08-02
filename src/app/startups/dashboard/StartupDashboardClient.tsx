"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, MessageSquare, TrendingUp, Eye, CheckCircle2, ShieldCheck, Activity, Users, Star, BarChart3, Clock, LineChart, Bookmark, Bell, HeartPulse, BrainCircuit, Rocket, Target, Award, Copy, Share2, AlertTriangle, Scale, Edit3, Lightbulb } from "lucide-react";
import { formatRelativeTime } from "@/utils/timeHelper";
import { useToast } from "@/components/ui/ToastProvider";
import { calculateFinancialMetrics } from "@/utils/financialMetrics";
import PortfolioPreferenceModal from "@/components/portfolio/PortfolioPreferenceModal";
import PortfolioReminderCard from "@/components/portfolio/PortfolioReminderCard";

interface StartupDashboardClientProps {
    myStartups: any[];
}

export default function StartupDashboardClient({ myStartups }: StartupDashboardClientProps) {
    const toast = useToast();
    const [activeDeals, setActiveDeals] = useState<any[]>([]);
    const [agreements, setAgreements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [localStartups, setLocalStartups] = useState<any[]>(myStartups);

    useEffect(() => {
        setLocalStartups(myStartups);
    }, [myStartups]);

    const handlePortfolioPreference = async (startupId: string, status: string, dismissDays?: number) => {
        try {
            const res = await fetch(`/api/startups/${startupId}/portfolio/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolio_status: status, dismiss_reminder_days: dismissDays })
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Fundraising preference updated successfully.');
                setLocalStartups(prev => prev.map(s => s._id === startupId || s.id === startupId ? { ...s, portfolio_status: status, reminder_dismissed_until: json.data.reminder_dismissed_until } : s));
            } else {
                toast.error(json.error || 'Failed to update preference.');
            }
        } catch (err) {
            toast.error('An error occurred.');
        }
    };

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const res = await fetch('/api/startups/deals');
                const json = await res.json();
                if (json.success) {
                    setActiveDeals(json.activeChats || []);
                    setAgreements(json.executedAgreements || []);
                }
            } catch (err) {
                console.error("Failed to fetch startup deals", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (localStartups.length > 0) {
            fetchDeals();
            const intervalId = setInterval(() => fetchDeals(), 5000);
            return () => clearInterval(intervalId);
        } else {
            setIsLoading(false);
        }
    }, [localStartups]);

    const calculateGrowthScore = (startup: any) => {
        let score = 30; // base score
        let actions = [];

        if (startup.desc && startup.desc.length > 100) score += 10;
        else actions.push("Expand your startup description for better AI matching.");

        if (startup.videos && startup.videos.length > 0) score += 15;
        else actions.push("Upload a pitch video to increase investor engagement.");

        const approvedUpdates = startup.financial_updates?.filter((u: any) => u.status === 'Approved') || [];
        if (approvedUpdates.length > 0) {
            score += 25;
            if (approvedUpdates.length > 1) score += 10;
        } else {
            actions.push("Submit a Financial Update to verify your revenue and get a 'Verified' badge.");
        }

        if (startup.kyc_status === 'Approved') score += 10;
        else actions.push("Complete KYC Verification to build investor trust.");

        if (actions.length === 0) actions.push("Your profile is fully optimized. Keep updating financials regularly!");

        return { score: Math.min(100, score), actions };
    };

    const getApprovedUpdates = (s: any) => s.financial_updates?.filter((u: any) => u.status === 'Approved').sort((a: any, b: any) => new Date(a.reportingDate || a.monthYear).getTime() - new Date(b.reportingDate || b.monthYear).getTime()) || [];

    const formatCurrency = (val: number) => {
        if (val === undefined || val === null || val === 0) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toLocaleString()}`;
    };

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl min-h-[calc(100vh-80px)] bg-slate-50/50">
            {localStartups.length === 0 ? (
                <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm p-12 text-center border-dashed max-w-2xl mx-auto mt-20">
                    <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Rocket className="size-12 text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-outfit font-bold text-slate-800 mb-3">Launch Your Startup</h3>
                    <p className="text-slate-500 mb-8 text-lg">Create a verified pitch profile to get discovered by our network of premium investors and secure funding.</p>
                    <Link href="/startups/publish" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]">
                        <FileText className="size-5" /> Publish Pitch Profile
                    </Link>
                </div>
            ) : (
                localStartups.map((myStartup, idx) => {
                    const { score: growthScore, actions: growthActions } = calculateGrowthScore(myStartup);
                    const dynamicFinancials = calculateFinancialMetrics(myStartup, true);
                    
                    const securedAmount = agreements.reduce((sum, agr) => {
                        const amountStr = String(agr.amount).replace(/[^0-9.]/g, '');
                        return sum + (Number(amountStr) || 0);
                    }, 0);
                    const fundingProgress = Math.min(100, Math.round((securedAmount / myStartup.requested) * 100)) || 0;
                    
                    const hasCompletedInvestment = agreements.length > 0;
                    const needsDecision = hasCompletedInvestment && (!myStartup.portfolio_status || myStartup.portfolio_status === 'Pending Decision');
                    
                    let showReminder = false;
                    if (hasCompletedInvestment && myStartup.portfolio_status === 'Decide Later') {
                        if (!myStartup.reminder_dismissed_until || new Date(myStartup.reminder_dismissed_until) < new Date()) {
                            showReminder = true;
                        }
                    }

                    return (
                        <div key={myStartup._id || myStartup.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            {needsDecision && (
                                <PortfolioPreferenceModal 
                                    startupName={myStartup.name}
                                    onSelectPreference={(pref, days) => handlePortfolioPreference(myStartup._id || myStartup.id, pref, days)}
                                />
                            )}
                            
                            {showReminder && (
                                <PortfolioReminderCard 
                                    onSelectPreference={(pref, days) => handlePortfolioPreference(myStartup._id || myStartup.id, pref, days)}
                                />
                            )}
                            
                            {/* Header Area */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Rocket className="size-40 text-emerald-600" /></div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white text-3xl font-bold font-outfit shrink-0 border-2 border-white overflow-hidden">
                                        {myStartup.basicInfo?.logoUrl ? (
                                            <img src={myStartup.basicInfo.logoUrl} alt={myStartup.name} className="w-full h-full object-cover" />
                                        ) : (
                                            myStartup.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h1 className="text-3xl md:text-4xl font-outfit font-bold text-slate-900">{myStartup.name}</h1>
                                            {dynamicFinancials.hasVerifiedData && <span className="bg-emerald-100 text-emerald-700 p-1 rounded-full" title="Financially Verified"><ShieldCheck className="size-5" /></span>}
                                        </div>
                                        <p className="text-slate-500 font-inter font-medium flex items-center gap-2">
                                            {myStartup.sector} • {myStartup.stage}
                                            <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"><Target className="size-3"/> Seeking {formatCurrency(myStartup.requested)}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                                    <Link href="/startups/publish" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold rounded-xl transition-all shadow-sm">
                                        <Edit3 className="size-4" /> Edit Profile
                                    </Link>
                                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/startups/${myStartup._id || myStartup.id}`); toast.success('✅ Public link copied to clipboard.'); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold rounded-xl transition-all shadow-sm">
                                        <Copy className="size-4" /> Share Link
                                    </button>
                                    <Link href={`/startups/${myStartup._id || myStartup.id}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md">
                                        <Eye className="size-4" /> View published profile
                                    </Link>
                                </div>
                            </div>

                            {/* Main Statistics Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform"><Eye className="size-24 text-blue-500" /></div>
                                    <div className="size-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 relative z-10 border border-blue-100"><Eye className="size-5" /></div>
                                    <p className="text-xs font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Profile Views</p>
                                    <p className="text-3xl font-bold font-mono text-slate-900 relative z-10">{myStartup.profile_views || 0}</p>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform"><Bookmark className="size-24 text-emerald-500" /></div>
                                    <div className="size-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 relative z-10 border border-emerald-100"><Bookmark className="size-5 fill-current" /></div>
                                    <p className="text-xs font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Saved by Investors</p>
                                    <p className="text-3xl font-bold font-mono text-slate-900 relative z-10">{myStartup.saves_count || 0}</p>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform"><Bell className="size-24 text-indigo-500" /></div>
                                    <div className="size-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 relative z-10 border border-indigo-100"><Bell className="size-5 fill-current" /></div>
                                    <p className="text-xs font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Investors Following</p>
                                    <p className="text-3xl font-bold font-mono text-slate-900 relative z-10">{myStartup.followers_count || 0}</p>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform"><MessageSquare className="size-24 text-purple-500" /></div>
                                    <div className="size-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 relative z-10 border border-purple-100"><MessageSquare className="size-5 fill-current" /></div>
                                    <p className="text-xs font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Active Deal Rooms</p>
                                    <p className="text-3xl font-bold font-mono text-slate-900 relative z-10">{activeDeals.length}</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Left Column: Actionable Cards */}
                                <div className="lg:col-span-2 space-y-6">
                                    
                                    {/* AI Startup Analysis */}
                                    <div className="bg-[#111827] border border-slate-800 rounded-3xl shadow-xl overflow-hidden mb-6">
                                        {/* Header */}
                                        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800">
                                            <div>
                                                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                                                    <Star className="size-6 text-indigo-400 fill-indigo-400" /> AI Startup Analysis
                                                </h3>
                                                <p className="text-slate-400 text-sm">Intelligent evaluation of your startup's investment potential</p>
                                            </div>
                                            {myStartup.ai_analysis_timestamp && (
                                                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300">
                                                    <FileText className="size-3.5" /> Generated on {new Date(myStartup.ai_analysis_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6 border-b border-slate-800">
                                            {/* Score Ring */}
                                            <div className="bg-[#172033] border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                                                <div className="relative size-40 flex items-center justify-center mb-6">
                                                    <svg className="absolute inset-0 size-full -rotate-90">
                                                        <circle cx="80" cy="80" r="68" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                                                        <circle cx="80" cy="80" r="68" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="427.2" strokeDashoffset={427.2 - (427.2 * (myStartup.ai_analysis_score || 0)) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                                                    </svg>
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-baseline text-white">
                                                            <span className="text-5xl font-bold font-mono leading-none">{myStartup.ai_analysis_score || 0}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-500 font-mono mt-1">/100</span>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 font-bold text-sm mb-3 text-center">
                                                    {myStartup.ai_analysis_score >= 80 ? 'Strong Startup' : myStartup.ai_analysis_score >= 60 ? 'Good Potential' : 'Needs Work'}
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">Investment Readiness Score</p>
                                            </div>

                                            {/* Executive Summary & Tags */}
                                            <div className="md:col-span-2 bg-[#172033] border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                        <FileText className="size-4 text-indigo-400" /> Executive Summary
                                                    </h4>
                                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                                        {myStartup.ai_executive_summary || "No executive summary generated yet. Continue updating your profile to unlock this feature."}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                                                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 flex items-center justify-center gap-1.5"><ShieldCheck className="size-3 text-emerald-500" /> Investment<br/>Readiness</p>
                                                        <p className="text-sm font-bold text-emerald-400 text-center">{myStartup.ai_investment_readiness || 'Ready'}</p>
                                                    </div>
                                                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 flex items-center justify-center gap-1.5"><AlertTriangle className="size-3 text-orange-500" /> Risk Level</p>
                                                        <p className="text-sm font-bold text-orange-400 text-center">{myStartup.ai_score_breakdown?.riskAssessment ? (myStartup.ai_score_breakdown.riskAssessment > 70 ? 'Low' : myStartup.ai_score_breakdown.riskAssessment > 40 ? 'Medium' : 'High') : 'Medium'}</p>
                                                    </div>
                                                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 flex items-center justify-center gap-1.5"><Activity className="size-3 text-blue-500" /> Business Quality</p>
                                                        <p className="text-sm font-bold text-blue-400 text-center">{myStartup.ai_score_breakdown?.businessQuality || 'Good'}</p>
                                                    </div>
                                                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 flex items-center justify-center gap-1.5"><Target className="size-3 text-purple-500" /> Confidence Level</p>
                                                        <p className="text-sm font-bold text-purple-400 text-center">{myStartup.ai_confidence || 'Medium'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score Breakdown */}
                                        <div className="p-6 md:p-8 bg-[#111827]">
                                            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                                                <Activity className="size-5 text-indigo-400" /> Score Breakdown
                                            </h3>
                                            
                                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                                                {[
                                                    { label: 'Founder & Team', key: 'founderAndTeam', max: 15, icon: <ShieldCheck className="size-4 text-emerald-400" /> },
                                                    { label: 'Business Idea', key: 'businessIdea', max: 20, icon: <Lightbulb className="size-4 text-yellow-400" /> },
                                                    { label: 'Market Opportunity', key: 'marketOpportunity', max: 15, icon: <TrendingUp className="size-4 text-purple-400" /> },
                                                    { label: 'Business Model', key: 'businessModel', max: 15, icon: <Target className="size-4 text-blue-400" /> },
                                                    { label: 'Financial Health', key: 'financialHealth', max: 15, icon: <Activity className="size-4 text-orange-400" /> },
                                                    { label: 'Growth Potential', key: 'growthPotential', max: 10, icon: <TrendingUp className="size-4 text-emerald-400" /> },
                                                    { label: 'Business Verification', key: 'businessVerification', max: 5, icon: <ShieldCheck className="size-4 text-blue-400" /> },
                                                    { label: 'Risk Assessment', key: 'riskAssessment', max: 5, icon: <AlertTriangle className="size-4 text-red-400" /> }
                                                ].map((config, idx) => {
                                                    const val = myStartup.ai_score_breakdown?.[config.key] || 0;
                                                    const percent = (val / config.max) * 100;
                                                    
                                                    let pbColor = "bg-red-500";
                                                    if (percent >= 80) pbColor = "bg-emerald-500";
                                                    else if (percent >= 60) pbColor = "bg-yellow-500";
                                                    else if (percent >= 40) pbColor = "bg-orange-500";

                                                    return (
                                                        <div key={idx} className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3 w-48">
                                                                {config.icon}
                                                                <span className="text-sm font-medium text-slate-300 truncate">{config.label}</span>
                                                            </div>
                                                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${pbColor} transition-all duration-700`} style={{ width: `${percent}%` }}></div>
                                                            </div>
                                                            <div className="w-16 text-right font-mono text-sm">
                                                                <span className="font-bold text-white">{val} </span>
                                                                <span className="text-slate-500">/ {config.max}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verified Financial Summary */}
                                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 relative overflow-hidden">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                    <BarChart3 className="size-5 text-emerald-600" /> Financial Summary
                                                </h2>
                                                <p className="text-sm text-slate-500">Verified numbers shown to investors.</p>
                                            </div>
                                            <Link href={`/startups/${myStartup._id || myStartup.id}/financial-update`} className="px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl transition-colors border border-emerald-200 flex items-center gap-2 text-sm w-full md:w-auto justify-center">
                                                <LineChart className="size-4" /> Submit Update
                                            </Link>
                                        </div>

                                        {dynamicFinancials.hasVerifiedData ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Latest Revenue</p>
                                                    <p className="text-xl font-bold font-mono text-emerald-600">{formatCurrency(dynamicFinancials.monthlyRevenue)}</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Latest Profit/Loss</p>
                                                    <p className={`text-xl font-bold font-mono ${dynamicFinancials.monthlyProfit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(dynamicFinancials.monthlyProfit)}</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Burn Rate</p>
                                                    <p className="text-xl font-bold font-mono text-amber-600">{formatCurrency(dynamicFinancials.monthlyBurnRate)}</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Last Updated</p>
                                                    <p className="text-sm font-bold text-slate-800 mt-1">{dynamicFinancials.latestUpdateDate ? formatRelativeTime(dynamicFinancials.latestUpdateDate) : 'Unknown'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                                <AlertTriangle className="size-8 text-yellow-500 mx-auto mb-2" />
                                                <p className="font-bold text-slate-700">No Verified Financials</p>
                                                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Submit your first financial update to get the verified badge and increase your visibility.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Active Deal Rooms */}
                                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <MessageSquare className="size-5 text-blue-500" /> Active Investor Workspaces
                                            </h2>
                                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{activeDeals.length} Open</span>
                                        </div>
                                        <div className="p-6">
                                            {isLoading ? (
                                                <div className="text-center py-8"><Activity className="size-8 text-emerald-500 animate-spin mx-auto" /></div>
                                            ) : activeDeals.length === 0 ? (
                                                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                                    <div className="size-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <Users className="size-8 text-blue-300" />
                                                    </div>
                                                    <h3 className="text-slate-900 font-bold text-lg">No Active Deals</h3>
                                                    <p className="text-slate-500 text-sm mt-1">When investors initiate a deal, they will appear here.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {activeDeals.map((deal) => (
                                                        <Link href={`/messages?startupId=${deal.startupId}&investorId=${encodeURIComponent(deal.investor)}&name=${encodeURIComponent(deal.startupName)}`} key={deal.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-100 shrink-0 overflow-hidden">
                                                                    {deal.investorPhoto ? (
                                                                        <img src={deal.investorPhoto} alt={deal.investorName || "Investor"} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        (deal.investorName || deal.investor).charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h3 className="font-bold text-slate-900">{deal.investorName || deal.investor}</h3>
                                                                        {deal.isRejected && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold border border-red-200">Negotiation Rejected</span>}
                                                                        {deal.unread > 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold animate-pulse">{deal.unread} New</span>}
                                                                    </div>
                                                                    <p className="text-sm text-slate-500 line-clamp-1 flex items-center gap-1.5"><MessageSquare className="size-3"/> {deal.lastMessage}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4 w-full sm:w-auto border-t sm:border-0 border-slate-200 pt-3 sm:pt-0">
                                                                <div className="text-left md:text-right">
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Phase {deal.phase}</p>
                                                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Clock className="size-3" /> {deal.time}</span>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                                    <TrendingUp className="size-4" />
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Sidebar Metrics */}
                                <div className="lg:col-span-1 space-y-6">
                                    
                                    {/* Founder Health Card */}
                                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><HeartPulse className="size-24 text-emerald-500" /></div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 relative z-10"><HeartPulse className="size-5 text-emerald-500" /> Founder Health</h3>
                                        
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-sm font-medium text-slate-600">KYC Status</span>
                                                {myStartup.kyc_status === 'Approved'
                                                    ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 className="size-3"/> Approved</span>
                                                    : <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><AlertTriangle className="size-3"/> Pending</span>
                                                }
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-sm font-medium text-slate-600">Financial Verification</span>
                                                {dynamicFinancials.hasVerifiedData
                                                    ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><ShieldCheck className="size-3"/> Verified</span>
                                                    : <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><AlertTriangle className="size-3"/> Required</span>
                                                }
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-sm font-medium text-slate-600">Trust Score</span>
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Scale className="size-3"/> {myStartup.trustScore || 85}/100</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-sm font-medium text-slate-600">Profile Completion</span>
                                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><BrainCircuit className="size-3"/> {myStartup.score || 75}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Funding Progress Card */}
                                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Target className="size-5 text-indigo-500" /> Funding Progress</h3>
                                        
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-bold text-slate-700">Raised: {formatCurrency(securedAmount)}</span>
                                                    <span className="font-bold text-slate-500">Goal: {formatCurrency(myStartup.requested)}</span>
                                                </div>
                                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 relative" style={{ width: `${fundingProgress}%` }}>
                                                        <div className="absolute inset-0 bg-white/20 overflow-hidden"><div className="w-full h-full animate-[shimmer_2s_infinite] -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div></div>
                                                    </div>
                                                </div>
                                                <p className="text-right text-xs font-bold text-indigo-600 mt-2">{fundingProgress}% Funded</p>
                                            </div>

                                            <div className="border-t border-slate-100 pt-4">
                                                <p className="text-xs uppercase font-bold text-slate-400 mb-3 tracking-wider">Executed Agreements</p>
                                                {agreements.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {agreements.map(agr => (
                                                            <div key={agr.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                <div>
                                                                    <p className="font-bold text-sm text-slate-800">{agr.investor}</p>
                                                                    <p className="text-xs text-slate-500">{agr.date}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-mono font-bold text-emerald-600 text-sm">{agr.amount}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">{agr.equity} Equity</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                        <p className="text-sm text-slate-500 font-medium">No agreements executed yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

/**
 * Renders an SVG icon component for a stylized building/dashboard graphic.
 * @example
 * StartupDashboardClient(props)
 * <svg>...</svg>
 * @param {React.SVGProps<SVGSVGElement>} props - Props to spread onto the SVG element.
 * @returns {JSX.Element} The rendered SVG icon component.
 */
const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
    </svg>
)
