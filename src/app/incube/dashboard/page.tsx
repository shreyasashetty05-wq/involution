"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { 
    Loader2, PlusCircle, CheckCircle2, AlertCircle, FileText, Activity, Zap, 
    ShieldCheck, Eye, Bookmark, Users, User, MessageSquare, Clock, TrendingUp, 
    Share2, Edit3, HeartPulse, Scale, BrainCircuit, LineChart, Target, Building,
    Star, Lightbulb, Rocket, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/utils/timeHelper";
import { useToast } from "@/components/ui/ToastProvider";

export default function IncubeDashboard() {
    const supabase = createClient();
    const router = useRouter();
    const toast = useToast();
    
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState<any>(null);
    const [activeDeals, setActiveDeals] = useState<any[]>([]);
    
    // New state for stats and notifications
    const [stats, setStats] = useState({
        profileViews: 0,
        savedByInvestors: 0,
        investorFollowing: 0,
    });
    const [notifications, setNotifications] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                if (isMounted) router.push('/login');
                return;
            }

            const { data: appData, error } = await supabase
                .from('incubation_applications')
                .select('*')
                .eq('owner_email', user.email)
                .maybeSingle();

            if (!error && appData && isMounted) {
                setApplication(appData);
                
                // Fetch Deals
                const { data: dealsData } = await supabase
                    .from("deals")
                    .select("*")
                    .eq("startup_id", appData.id)
                    .order('updated_at', { ascending: false });
                    
                let enrichedDeals: any[] = [];
                if (dealsData && dealsData.length > 0) {
                    const investorEmails = dealsData.map(d => d.investor_id);
                    const { data: kycDocs } = await supabase
                        .from('kyc_documents')
                        .select('email, name')
                        .in('email', investorEmails);
                    
                    const nameMap = (kycDocs || []).reduce((acc: any, doc: any) => {
                        acc[doc.email] = doc.name;
                        return acc;
                    }, {});

                    enrichedDeals = dealsData.map(deal => {
                        const lastMsg = deal.messages?.at(-1);
                        return {
                            ...deal,
                            investorName: nameMap[deal.investor_id] || deal.investor_id.split('@')[0],
                            lastMessage: lastMsg?.text || ""
                        };
                    });
                    setActiveDeals(enrichedDeals);
                } else {
                    setActiveDeals([]);
                }
                
                // Fetch Stats
                try {
                    // Profile Views
                    const { count: viewCount } = await supabase
                        .from('startup_profile_views')
                        .select('*', { count: 'exact', head: true })
                        .eq('startup_id', appData.id);
                        
                    // Saved/Bookmarked by Investors
                    const { count: saveCount } = await supabase
                        .from('startup_follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('startup_id', appData.id);
                        
                    setStats({
                        profileViews: appData.profile_views || viewCount || 0,
                        savedByInvestors: appData.saves_count || saveCount || 0,
                        investorFollowing: appData.followers_count || saveCount || 0
                    });
                } catch (err) {
                    console.error("Stats fetch error", err);
                }
                
                // Fetch Notifications
                try {
                    const { data: notifs } = await supabase
                        .from('notifications')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    if (notifs) setNotifications(notifs);
                } catch(err) {
                    console.error("Notifs fetch error", err);
                }

                // Generate Recent Activity
                const activities: any[] = [];
                if (appData.created_at) {
                    activities.push({
                        id: 'created',
                        type: 'Application submitted',
                        icon: 'Rocket',
                        color: 'text-blue-500',
                        bg: 'bg-blue-50',
                        time: appData.created_at
                    });
                }
                if (appData.updated_at && appData.updated_at !== appData.created_at) {
                    activities.push({
                        id: 'updated',
                        type: 'Profile updated',
                        icon: 'Edit3',
                        color: 'text-emerald-500',
                        bg: 'bg-emerald-50',
                        time: appData.updated_at
                    });
                }
                if (appData.ai_analysis_timestamp) {
                    activities.push({
                        id: 'ai_analysis',
                        type: 'AI Analysis updated',
                        icon: 'Activity',
                        color: 'text-purple-500',
                        bg: 'bg-purple-50',
                        time: appData.ai_analysis_timestamp
                    });
                }
                enrichedDeals.forEach(deal => {
                    if (deal.created_at) {
                        activities.push({
                            id: `deal_${deal.id}`,
                            type: `Investor ${deal.investorName} opened Deal Room`,
                            icon: 'MessageSquare',
                            color: 'text-indigo-500',
                            bg: 'bg-indigo-50',
                            time: deal.created_at
                        });
                    }
                });
                // Sort chronologically descending
                activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
                setRecentActivity(activities.slice(0, 5));
            }
            if (isMounted) setLoading(false);
        };

        fetchDashboardData();
        const intervalId = setInterval(fetchDashboardData, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [supabase, router]);

    const formatCurrency = (val: number) => {
        if (!val) return 'Not Available';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toLocaleString()}`;
    };

    const getStatusBadge = (status: string) => {
        const s = (status || 'pending').toLowerCase();
        if (s === 'approved' || s === 'accepted') return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold capitalize flex items-center gap-1 border border-green-200"><CheckCircle2 className="size-3" /> {s.replace('_', ' ')}</span>;
        if (s === 'rejected') return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold capitalize flex items-center gap-1 border border-red-200"><AlertCircle className="size-3" /> {s.replace('_', ' ')}</span>;
        if (s === 'under_review') return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold capitalize flex items-center gap-1 border border-amber-200"><Clock className="size-3" /> Under Review</span>;
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold capitalize flex items-center gap-1 border border-blue-200"><Loader2 className="size-3 animate-spin" /> Pending</span>;
    };

    const getAppId = (id: string) => {
        if (!id) return "INV-STU-XXXX";
        return `INV-STU-${id.split('-')[0].toUpperCase()}`;
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="size-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-12">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                
                {!application ? (
                    <div className="bg-white rounded-3xl border-2 border-slate-200 border-dashed p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
                        <div className="size-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="size-12 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 font-outfit mb-3">No Application Submitted</h2>
                        <p className="text-slate-500 text-lg mx-auto mb-8">
                            You haven't submitted your Incubation application yet. Complete the student-focused application to get started and unlock AI matching.
                        </p>
                        <Link href="/incube/publish" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]">
                            <PlusCircle className="size-5" /> Start Application
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        
                        {/* 1. Top Hero Card */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                                <div className="size-20 md:size-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white text-3xl font-bold font-outfit shrink-0 border-2 border-white overflow-hidden">
                                    {application.idea_logo_url ? (
                                        <img src={application.idea_logo_url} alt={application.project_name} className="w-full h-full object-cover" />
                                    ) : (
                                        application.project_name?.charAt(0) || 'I'
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                        <h1 className="text-2xl md:text-3xl font-outfit font-bold text-slate-900">{application.project_name || 'Not Available'}</h1>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                            {application.industry || 'Not Available'}
                                        </span>
                                        <span className="bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                            {application.current_stage || 'Not Available'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                                        <span className="flex items-center gap-1.5"><Building className="size-4" /> {application.institution_name || 'Not Available'}</span>
                                        <span className="hidden sm:inline text-slate-300">•</span>
                                        <span className="flex items-center gap-1.5"><User className="size-4" /> Founder: {application.full_name || 'Not Available'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto border-t md:border-0 border-slate-100 pt-4 md:pt-0 shrink-0">
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <Link href="/incube/publish" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm">
                                        <Edit3 className="size-4" /> Edit Profile
                                    </Link>
                                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/incube/${application.id}`); toast.success('Link copied!'); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm">
                                        <Share2 className="size-4" /> Share Profile
                                    </button>
                                    <Link href={`/incube/${application.id}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md">
                                        <Eye className="size-4" /> View published profile
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 2. Statistics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform"><Eye className="size-24 text-blue-500" /></div>
                                <div className="size-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 relative z-10 border border-blue-100"><Eye className="size-5" /></div>
                                <p className="text-xs font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Profile Views</p>
                                <p className="text-3xl font-bold font-mono text-slate-900 relative z-10">{stats.profileViews}</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform"><Bookmark className="size-24 text-red-500" /></div>
                                <div className="size-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 relative z-10 border border-red-100"><Bookmark className="size-5 fill-current" /></div>
                                <p className="text-xs font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Saved by Investors</p>
                                <p className="text-3xl font-bold font-mono text-slate-900 relative z-10">{stats.savedByInvestors}</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform"><Star className="size-24 text-amber-500" /></div>
                                <div className="size-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 relative z-10 border border-amber-100"><Star className="size-5 fill-current" /></div>
                                <p className="text-xs font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Investor Following</p>
                                <p className="text-3xl font-bold font-mono text-slate-900 relative z-10">{stats.investorFollowing}</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform"><Users className="size-24 text-indigo-500" /></div>
                                <div className="size-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 relative z-10 border border-indigo-100"><Users className="size-5 fill-current" /></div>
                                <p className="text-xs font-bold text-slate-400 mb-1 relative z-10 uppercase tracking-widest">Active Deal Rooms</p>
                                <p className="text-3xl font-bold font-mono text-slate-900 relative z-10">{activeDeals.length}</p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            
                            {/* Left Column */}
                            <div className="lg:col-span-2 space-y-6">
                                
                                {/* 3. AI Student Analysis */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                                    <div className="p-8 relative">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                        <h3 className="font-bold text-white text-xl flex items-center gap-2 mb-6 relative z-10">
                                            <BrainCircuit className="size-6 text-indigo-400" /> AI Student Analysis
                                        </h3>
                                        
                                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                                            <div className="shrink-0">
                                                <div className="relative size-40 flex items-center justify-center">
                                                    <svg className="absolute inset-0 size-full -rotate-90">
                                                        <circle cx="80" cy="80" r="72" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                                                        <circle cx="80" cy="80" r="72" stroke="#4ade80" strokeWidth="12" fill="none" strokeDasharray="452.4" strokeDashoffset={452.4 - (452.4 * (application.ai_analysis_score || 0)) / 100} className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]" strokeLinecap="round" />
                                                    </svg>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-5xl font-bold text-white font-mono">{application.ai_analysis_score || 0}</span>
                                                        <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest mt-1">
                                                            {application.ai_analysis_score >= 80 ? 'Excellent' : application.ai_analysis_score >= 60 ? 'Good Potential' : 'Needs Work'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 w-full space-y-6">
                                                <p className="text-slate-300 text-sm leading-relaxed">
                                                    {application.ai_recommendation || "Your idea shows potential for incubation. Complete your profile and submit a financial update to generate detailed AI insights and matchmaking parameters."}
                                                </p>
                                                
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Incubation Readiness</p>
                                                        <p className="text-sm font-bold text-emerald-400">{application.ai_investment_readiness || 'Suitable'}</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Risk Level</p>
                                                        <p className="text-sm font-bold text-amber-400">{application.ai_score_breakdown?.risk_assessment ? (application.ai_score_breakdown.risk_assessment > 70 ? 'Low' : application.ai_score_breakdown.risk_assessment > 40 ? 'Medium' : 'High') : 'Medium'}</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Business Quality</p>
                                                        <p className="text-sm font-bold text-blue-400">{application.ai_score_breakdown?.business_quality || 'Good'}</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Confidence Level</p>
                                                        <p className="text-sm font-bold text-purple-400">{application.ai_confidence || 'Not Available'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#111827] border-t border-slate-800 p-8">
                                        <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
                                            <Activity className="size-5 text-indigo-400" /> Score Breakdown
                                        </h3>
                                        
                                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                                            {[
                                                { label: 'Founder Potential', key: 'founderPotential', max: 15, icon: <CheckCircle2 className="size-4 text-emerald-400" /> },
                                                { label: 'Innovation', key: 'innovation', max: 20, icon: <Lightbulb className="size-4 text-yellow-400" /> },
                                                { label: 'Problem-Solution Fit', key: 'problemSolutionFit', max: 20, icon: <Target className="size-4 text-purple-400" /> },
                                                { label: 'Technical Feasibility', key: 'technicalFeasibility', max: 15, icon: <Zap className="size-4 text-blue-400" /> },
                                                { label: 'Prototype Readiness', key: 'prototypeReadiness', max: 10, icon: <Activity className="size-4 text-blue-400" /> },
                                                { label: 'Market Potential', key: 'marketPotential', max: 10, icon: <TrendingUp className="size-4 text-orange-400" /> },
                                                { label: 'Incubation Readiness', key: 'incubationReadiness', max: 5, icon: <Rocket className="size-4 text-emerald-400" /> },
                                                { label: 'Risk Assessment', key: 'riskAssessment', max: 5, icon: <AlertTriangle className="size-4 text-red-400" /> }
                                            ].map((config, idx) => {
                                                const val = application.ai_score_breakdown?.[config.key] || 0;
                                                const percent = (val / config.max) * 100;
                                                
                                                let pbColor = "bg-red-500";
                                                if (percent >= 80) pbColor = "bg-emerald-500";
                                                else if (percent >= 60) pbColor = "bg-yellow-500";
                                                else if (percent >= 40) pbColor = "bg-orange-500";

                                                return (
                                                    <div key={idx} className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2 w-44">
                                                            {config.icon}
                                                            <span className="text-sm font-medium text-slate-300 truncate">{config.label}</span>
                                                        </div>
                                                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${pbColor} transition-all duration-700`} style={{ width: `${percent}%` }}></div>
                                                        </div>
                                                        <div className="w-12 text-right">
                                                            <span className="text-sm font-bold text-white">{val} <span className="text-slate-500 text-xs">/ {config.max}</span></span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="mt-8 bg-[#1e1b4b]/60 border border-[#4c1d95]/60 p-5 rounded-2xl flex gap-4 items-start shadow-inner">
                                            <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-700 flex items-center justify-center shrink-0">
                                                <BrainCircuit className="size-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-indigo-300 mb-1.5">Executive Summary</h4>
                                                <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
                                                    {application.ai_executive_summary || "No executive summary generated yet. Continue updating your profile to unlock this feature."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Recent Activity */}
                                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <TrendingUp className="size-5 text-indigo-500" /> Recent Activity
                                        </h3>
                                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View All</button>
                                    </div>
                                    
                                    {recentActivity.length > 0 ? (
                                        <div className="space-y-6">
                                            {recentActivity.map((activity, i) => (
                                                <div key={activity.id + i} className="flex gap-4 group">
                                                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${activity.bg}`}>
                                                        {activity.icon === 'Rocket' && <Activity className={`size-5 ${activity.color}`} />}
                                                        {activity.icon === 'Edit3' && <Edit3 className={`size-5 ${activity.color}`} />}
                                                        {activity.icon === 'Activity' && <Activity className={`size-5 ${activity.color}`} />}
                                                        {activity.icon === 'MessageSquare' && <MessageSquare className={`size-5 ${activity.color}`} />}
                                                    </div>
                                                    <div className="flex-1 pt-2 border-b border-slate-50 pb-6 group-last:border-0 group-last:pb-0">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-bold text-slate-800">{activity.type}</p>
                                                            <span className="text-[10px] font-bold text-slate-400">{formatRelativeTime(activity.time)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-slate-500 font-medium">No recent activity.</p>
                                        </div>
                                    )}
                                </div>
                                
                            </div>
                            
                            {/* Right Column */}
                            <div className="lg:col-span-1 space-y-6">
                                
                                {/* 4. Founder Health */}
                                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <HeartPulse className="size-5 text-emerald-500" /> Founder Health
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-sm font-medium text-slate-600">KYC Status</span>
                                            {application.kyc_status === 'Approved'
                                                ? <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200">Approved</span>
                                                : <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-200">Pending</span>
                                            }
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-sm font-medium text-slate-600">Trust Score</span>
                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold font-mono border border-blue-100">{application.trust_score || '88 / 100'}</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-slate-600">Profile Completion</span>
                                                <span className="text-xs font-bold text-purple-600">{application.score || 92}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${application.score || 92}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-sm font-medium text-slate-600">Idea Visibility</span>
                                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200">Public</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 5. Funding Request */}
                                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Zap className="size-5 text-indigo-500" /> Funding Request
                                    </h3>
                                    
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                            <span className="text-sm font-medium text-slate-500">Funding Required</span>
                                            <span className="font-bold font-mono text-slate-900">{formatCurrency(application.ask_amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                            <span className="text-sm font-medium text-slate-500">Equity Offered</span>
                                            <span className="font-bold text-slate-900">{application.equity_offered ? `${application.equity_offered}%` : 'Not Available'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                            <span className="text-sm font-medium text-slate-500">Current Valuation</span>
                                            <span className="font-bold font-mono text-slate-900">
                                                {application.ask_amount && application.equity_offered 
                                                    ? formatCurrency(application.ask_amount / (application.equity_offered / 100))
                                                    : 'Not Available'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Use of Funds</p>
                                        {application.fund_utilization && Array.isArray(application.fund_utilization) && application.fund_utilization.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {application.fund_utilization.map((item: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                                                        <CheckCircle2 className="size-3 text-indigo-400" /> {item}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 font-medium">Not Available</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* 6. Notifications */}
                                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <AlertCircle className="size-5 text-amber-500" /> Notifications
                                        </h3>
                                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View All</button>
                                    </div>
                                    
                                    {notifications.length > 0 ? (
                                        <div className="space-y-4">
                                            {notifications.map((notif, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                                        <AlertCircle className="size-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-snug">{notif.title}</p>
                                                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5 line-clamp-2">{notif.message}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{formatRelativeTime(notif.created_at)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-sm text-slate-500 font-medium">No new notifications.</p>
                                        </div>
                                    )}
                                </div>
                                
                            </div>
                        </div>

                        {/* 7. Active Deal Rooms */}
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <MessageSquare className="size-5 text-indigo-500" /> Active Deal Rooms
                                </h3>
                                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View All</button>
                            </div>
                            
                            <div className="p-6">
                                {activeDeals.length > 0 ? (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {activeDeals.map((deal) => (
                                            <div key={deal.id} className="bg-white border border-slate-100 hover:border-blue-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100 shrink-0">
                                                            {deal.investorName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-slate-900">{deal.investorName}</h4>
                                                                <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-md text-[10px] font-bold uppercase tracking-wider">Active</span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400">Created on {deal.created_at ? new Date(deal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Available'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-50 gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Last message</p>
                                                        <p className="text-xs text-slate-600 line-clamp-1 italic">
                                                            {deal.lastMessage ? `"${deal.lastMessage}"` : "No messages yet."}
                                                        </p>
                                                        {deal.updated_at && <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(deal.updated_at)}</p>}
                                                    </div>
                                                    <Link 
                                                        href={`/messages?startupId=${application.id}&investorId=${encodeURIComponent(deal.investor_id)}&name=${encodeURIComponent(application.project_name)}&isStudent=true`}
                                                        className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs rounded-xl transition-colors border border-blue-100 hover:border-blue-600"
                                                    >
                                                        Open Room
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                        <MessageSquare className="size-8 text-slate-300 mx-auto mb-3" />
                                        <p className="font-bold text-slate-700">No Active Deal Rooms</p>
                                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">When investors review your profile and initiate a conversation, it will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                    </div>
                )}
            </div>
        </div>
    );
}
