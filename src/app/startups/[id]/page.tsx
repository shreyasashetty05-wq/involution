/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Briefcase, TrendingUp, Presentation, CheckCircle2, Factory, LineChart, AlertTriangle, Activity, BrainCircuit, ShieldCheck, Scale, HeartPulse, Clock, Calendar, Users, FileText, ChevronRight, Globe, Target, MapPin, Zap, Info, Building2, UserCircle2, Linkedin, Banknote, ShieldAlert, X } from "lucide-react";
import AIChat from "@/frontend/components/AIChat";
import ScrollReveal from "@/frontend/components/ScrollReveal";
import { formatRelativeTime } from "@/utils/timeHelper";

export default function StartupProfile() {
    const params = useParams();
    const idValue = Array.isArray(params.id) ? params.id[0] : params.id;
    const [startup, setStartup] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);
    const [playingVideoIdx, setPlayingVideoIdx] = useState<number | null>(null);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [hoverType, setHoverType] = useState<"rev" | "profit" | null>(null);

    useEffect(() => {
        const fetchStartup = async () => {
            try {
                const res = await fetch('/api/startups');
                const json = await res.json();
                if (json.success) {
                    const match = json.data.find((s: Record<string, unknown>) => String(s._id) === idValue || String(s.id) === String(idValue));
                    setStartup(match);
                }
            } catch (error) {
                console.error("Failed to load startup", error);
            } finally {
                setLoading(false);
            }
        };
        if (idValue) fetchStartup();
    }, [idValue]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24 pb-20">
                <div className="py-24 text-center">
                    <Activity className="size-16 text-emerald-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-900">Decrypting Profile...</h3>
                </div>
            </div>
        );
    }

    if (!startup) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24 pb-20">
                <div className="text-center">
                    <AlertTriangle className="size-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Startup Not Found</h3>
                    <p className="text-slate-400">This profile might have been delisted or restricted.</p>
                    <Link href="/investors/search" className="mt-6 inline-block px-6 py-2 bg-slate-50 border border-slate-300 hover:border-emerald-400 hover:text-emerald-600 text-slate-700 rounded-lg transition-colors">Return to Search</Link>
                </div>
            </div>
        );
    }

    const {
        basic_info = {},
        business_info = {},
        investment_details = {},
        financials_monthly = {},
        growth_metrics = {},
        credibility = {},
        risk_disclosure = {}
    } = startup;

    const generatePath = (data: number[]) => {
        if (!data || data.length === 0) return { path: "", area: "", max: 0, min: 0 };
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max === min ? 1 : max - min;

        const pathData = data.map((val, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((val - min) / range) * 100;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        }).join(' ');

        const areaPath = `${pathData} L 100 100 L 0 100 Z`;
        return { path: pathData, area: areaPath, max, min };
    };

    const approvedUpdates = startup.financial_updates?.filter((u: any) => u.status === 'Approved')
        .sort((a: any, b: any) => new Date(a.reportingDate || a.monthYear).getTime() - new Date(b.reportingDate || b.monthYear).getTime()) || [];

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    
    const cumulativeUpdates = approvedUpdates.map((u: any) => {
        totalRevenue += Number(u.revenue) || 0;
        totalProfit += Number(u.profit) || 0;
        totalLoss += Number(u.netLoss) || 0;
        return {
            ...u,
            cumulativeRev: totalRevenue,
            cumulativeProfit: totalProfit,
            cumulativeLoss: totalLoss
        };
    });

    const revChart = generatePath(cumulativeUpdates.length > 0 ? cumulativeUpdates.map((u: any) => u.cumulativeRev) : (startup.financials?.revenue || []));
    const profitChart = generatePath(cumulativeUpdates.length > 0 ? cumulativeUpdates.map((u: any) => u.cumulativeProfit) : (startup.financials?.netProfit || []));

    let revGrowth = 0;
    let profitGrowth = 0;
    if (approvedUpdates.length >= 2) {
        const last = approvedUpdates[approvedUpdates.length - 1];
        const prev = approvedUpdates[approvedUpdates.length - 2];
        if (Number(prev.revenue) > 0) revGrowth = ((Number(last.revenue) - Number(prev.revenue)) / Number(prev.revenue)) * 100;
        if (Number(prev.profit) !== 0) profitGrowth = ((Number(last.profit) - Number(prev.profit)) / Math.abs(Number(prev.profit))) * 100;
    }

    const latestUpdate = approvedUpdates.length > 0 ? approvedUpdates[approvedUpdates.length - 1] : null;

    const groupedTimeline: any[] = [];
    const atomicActivities: any[] = [];
    
    approvedUpdates.forEach((update: any) => {
        const pType = update.reportingType || 'Monthly';
        const pDate = update.reportingDate || update.monthYear;
        const vDate = update.verifiedAt || update.dateSubmitted;
        
        groupedTimeline.push({
            label: 'Financial Update', desc: `Data for ${pType} (${pDate})`,
            revenue: update.revenue, profit: update.profit, netLoss: update.netLoss,
            time: vDate, status: update.status === 'Approved' ? 'Verified by InVolution' : 'Submitted', verified: update.status === 'Approved'
        });
        
        if (update.revenue) atomicActivities.push({ label: 'Revenue Updated', time: update.dateSubmitted, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' });
        if (update.profit !== undefined) atomicActivities.push({ label: 'Profit Updated', time: update.dateSubmitted, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' });
        if (update.netLoss) atomicActivities.push({ label: 'Loss Updated', time: update.dateSubmitted, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' });
        if (update.verifiedAt && update.status === 'Approved') atomicActivities.push({ label: 'Financials Verified', time: update.verifiedAt, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' });
    });
    
    groupedTimeline.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    atomicActivities.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const gridLines = [25, 50, 75];

    return (
        <div className="min-h-screen pb-20 bg-slate-50/50">
            {/* Header / Branding */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-12">
                <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                    <ScrollReveal y={10}>
                        <Link href="/investors/search" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-6 transition-colors text-sm font-medium">
                            <ArrowLeft className="size-4" /> Back to Search
                        </Link>
                    </ScrollReveal>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <ScrollReveal className="flex items-start md:items-center gap-6" delay={0.05}>
                            <div className="relative group shrink-0">
                                <div className="size-24 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center shadow-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                    {basic_info?.logoUrl ? (
                                        <img src={basic_info.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold font-outfit text-slate-400">{startup?.name?.charAt(0) || 'S'}</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h1 className="text-3xl md:text-4xl font-bold font-outfit text-slate-900">{basic_info?.startupName || startup?.name || 'Startup'}</h1>
                                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-600 flex items-center gap-1 shadow-sm">
                                        <CheckCircle2 className="size-3.5" /> {startup.isStudent ? "🏛 Incubation Startup" : "KYC Verified"}
                                    </span>
                                </div>
                                <p className="text-slate-500 font-medium">{basic_info?.startupTagline || startup?.desc?.substring(0, 80) + '...'}</p>
                                <div className="flex items-center flex-wrap gap-4 text-sm text-slate-500 font-medium mt-3">
                                    <span className="flex items-center gap-1.5"><Factory className="size-4 text-slate-400" /> {business_info?.industry || startup.sector} • {business_info?.businessModel || startup.business_model}</span>
                                    <span className="hidden md:inline text-slate-300">|</span>
                                    <span className="flex items-center gap-1.5"><AlertTriangle className={`size-4 ${startup.risk === 'Low' ? 'text-emerald-500' : 'text-yellow-500'}`} /> {startup.risk} Risk</span>
                                </div>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.1} y={12} className="w-full md:w-auto mt-4 md:mt-0">
                            <Link href={`/messages?startupId=${startup._id?.toString() || idValue}&name=${encodeURIComponent(startup.name)}`} className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 w-full md:w-auto justify-center group">
                                <MessageSquare className="size-5 text-slate-300 group-hover:text-white transition-colors" /> Open Deal Room
                            </Link>
                        </ScrollReveal>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 max-w-6xl mt-8 grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">

                    {/* AI Insights & Scores */}
                    <ScrollReveal>
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><BrainCircuit className="size-48" /></div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BrainCircuit className="size-6 text-indigo-400" /> AI Analyst Review</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 relative z-10">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center">
                                    <p className="text-indigo-200 text-sm mb-1 uppercase tracking-wider font-bold">Match Score</p>
                                    <p className="text-4xl font-black text-white">88<span className="text-lg text-indigo-300">%</span></p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center">
                                    <p className="text-emerald-200 text-sm mb-1 uppercase tracking-wider font-bold">Trust Score</p>
                                    <p className="text-4xl font-black text-white">92<span className="text-lg text-emerald-300">%</span></p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center">
                                    <p className="text-blue-200 text-sm mb-1 uppercase tracking-wider font-bold">Health Score</p>
                                    <p className="text-4xl font-black text-white">85<span className="text-lg text-blue-300">%</span></p>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 relative z-10">
                                <h4 className="font-bold text-indigo-200 mb-2">AI Recommendation</h4>
                                <p className="text-slate-200 text-sm leading-relaxed">
                                    This startup shows strong early-stage growth metrics with a highly scalable B2B SaaS model. The low monthly burn rate compared to their cash reserves indicates a healthy runway of {financials_monthly?.runway || '12+'} months. The founding team has relevant industry experience. Proceeding with due diligence is highly recommended.
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Section 2: Founder & Team */}
                    <ScrollReveal>
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Users className="size-6 text-indigo-500" /> Founder & Team</h2>
                            <div className="space-y-6">
                                {/* Founder Card */}
                                <div className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <div className="size-16 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {basic_info?.founderPhotoUrl ? <img src={basic_info.founderPhotoUrl} alt="Founder" className="w-full h-full object-cover" /> : <UserCircle2 className="size-8 text-indigo-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg">{basic_info?.founderName || 'Founder Name'}</h4>
                                                <p className="text-indigo-600 font-medium text-sm">{basic_info?.founderRole || 'Founder'} {basic_info?.founderAge ? `• ${basic_info.founderAge} yrs` : ''}</p>
                                            </div>
                                            {basic_info?.founderLinkedin && (
                                                <a href={basic_info.founderLinkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800"><Linkedin className="size-5" /></a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Team Cards */}
                                {basic_info?.teamMembersData && basic_info.teamMembersData.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        {basic_info.teamMembersData.map((member: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                                                <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    {member.photoUrl ? <img src={member.photoUrl} alt="Team" className="w-full h-full object-cover" /> : <UserCircle2 className="size-6 text-slate-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 truncate">{member.name}</h4>
                                                    <p className="text-xs text-slate-500 truncate">{member.role}</p>
                                                </div>
                                                {member.linkedin && <a href={member.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600"><Linkedin className="size-4" /></a>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Section 3 & 4: Business Details */}
                    <ScrollReveal>
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Briefcase className="size-6 text-emerald-500" /> Business Overview</h2>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 mb-1">Industry</p><p className="font-bold text-slate-800">{business_info?.industry || startup.sector}</p></div>
                                <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 mb-1">Stage</p><p className="font-bold text-slate-800">{business_info?.startupStage || 'Seed'}</p></div>
                                <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 mb-1">Founded</p><p className="font-bold text-slate-800">{business_info?.yearFounded || '2023'}</p></div>
                                <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 mb-1">Type</p><p className="font-bold text-slate-800">{business_info?.companyType || 'Private Ltd'}</p></div>
                            </div>
                            
                            <div className="space-y-6 text-sm text-slate-600">
                                <div><h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Target className="size-4 text-emerald-500" /> Problem Statement</h4><p className="bg-slate-50 p-4 rounded-xl">{business_info?.problemStatement || 'Not provided'}</p></div>
                                <div><h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Zap className="size-4 text-emerald-500" /> Solution & UVP</h4><p className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">{business_info?.solution || 'Not provided'}<br/><br/><strong className="text-emerald-800">UVP:</strong> {business_info?.uvp || 'Not provided'}</p></div>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div><h4 className="font-bold text-slate-900 mb-2">Target Market</h4><p>{business_info?.targetMarket || 'Not provided'}</p></div>
                                    <div><h4 className="font-bold text-slate-900 mb-2">Competitors</h4><p>{business_info?.competitors || 'Not provided'}</p></div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Section 5 & 6: Investment & Financial Details */}
                    <ScrollReveal>
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Banknote className="size-6 text-blue-500" /> Investment & Financials</h2>
                            
                            <div className="grid sm:grid-cols-3 gap-6 mb-8">
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
                                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Ask</p>
                                    <p className="text-2xl font-black text-blue-900">₹{(Number(investment_details?.investmentRequired) / 100000).toFixed(1) || 0}L</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
                                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Equity</p>
                                    <p className="text-2xl font-black text-blue-900">{investment_details?.equityOffered || 0}%</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
                                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Valuation</p>
                                    <p className="text-2xl font-black text-blue-900">₹{investment_details?.currentValuation ? (Number(investment_details.currentValuation) / 10000000).toFixed(2) : 0}Cr</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                <div><p className="text-xs text-slate-500">Monthly Revenue</p><p className="font-bold text-slate-800">₹{financials_monthly?.monthlyRevenue || 0}</p></div>
                                <div><p className="text-xs text-slate-500">Monthly Burn Rate</p><p className="font-bold text-slate-800">₹{financials_monthly?.monthlyBurnRate || 0}</p></div>
                                <div><p className="text-xs text-slate-500">Runway</p><p className="font-bold text-slate-800">{financials_monthly?.runway || 0} Months</p></div>
                                <div><p className="text-xs text-slate-500">Cash in Bank</p><p className="font-bold text-slate-800">₹{financials_monthly?.cashInBank || 0}</p></div>
                            </div>
                            
                            {investment_details?.useOfFunds && (
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-3 text-sm">Use of Funds</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(investment_details.useOfFunds).filter(([_, v]) => v).map(([k]) => (
                                            <span key={k} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollReveal>

                    {/* Section 7: Growth Metrics */}
                    <ScrollReveal>
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><TrendingUp className="size-6 text-emerald-500" /> Growth Metrics</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div><p className="text-xs text-slate-500 mb-1">Total Customers</p><p className="text-xl font-bold text-slate-900">{growth_metrics?.totalCustomers || 0}</p></div>
                                <div><p className="text-xs text-slate-500 mb-1">Monthly Active Users</p><p className="text-xl font-bold text-slate-900">{growth_metrics?.monthlyActiveUsers || 0}</p></div>
                                <div><p className="text-xs text-slate-500 mb-1">MoM Growth</p><p className="text-xl font-bold text-emerald-600">{growth_metrics?.monthlyGrowth || 0}%</p></div>
                                <div><p className="text-xs text-slate-500 mb-1">Customer Retention</p><p className="text-xl font-bold text-blue-600">{growth_metrics?.customerRetention || 0}%</p></div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Section 8 & 9: Verification & Risk */}
                    <ScrollReveal>
                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-500" /> Verification Badges</h2>
                                <div className="space-y-3">
                                    {Object.entries(credibility?.verification || {}).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            {v ? <CheckCircle2 className="size-4 text-emerald-500" /> : <X className="size-4 text-slate-300" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><ShieldAlert className="size-5 text-red-500" /> Risk Disclosure</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Pending Legal Cases</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${risk_disclosure?.pendingLegalCases ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{risk_disclosure?.pendingLegalCases ? 'Yes' : 'None'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Outstanding Loans</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${risk_disclosure?.outstandingLoans ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{risk_disclosure?.outstandingLoans ? 'Yes' : 'None'}</span>
                                    </div>
                                    {risk_disclosure?.previousFundingRaised && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                            <p className="font-bold text-slate-800 mb-1">Previous Funding Details</p>
                                            <p className="text-slate-600">Amount: ₹{risk_disclosure?.fundingAmount}</p>
                                            <p className="text-slate-600">Investor: {risk_disclosure?.investorName}</p>
                                            <p className="text-slate-600">Round: {risk_disclosure?.fundingRound}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Section 10: Pitch Videos */}
                    <ScrollReveal>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Presentation className="size-5 text-indigo-500" /> Pitch Media
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                                {Array.isArray(startup.videos) && startup.videos.map((v: unknown, idx: number) => {
                                    const vid = v as Record<string, string>;
                                    return (
                                    <div key={idx} className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300">
                                        {(playingVideoIdx === idx && vid.url) ? (
                                            <iframe src={`${vid.url}${vid.url.includes('?') ? '&' : '?'}autoplay=1`} title={vid.title} className="absolute inset-0 size-full object-cover" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                        ) : (
                                            <div className="absolute inset-0 cursor-pointer" onClick={() => { if (vid.url) setPlayingVideoIdx(idx); }}>
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-5 z-10 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    <h3 className="text-white font-bold text-sm leading-tight">{vid.title}</h3>
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                                    <div className="size-14 rounded-full bg-white/20 group-hover:bg-emerald-500 backdrop-blur-md flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg">
                                                        <div className="size-0 border-y-[8px] border-y-transparent border-l-[14px] border-l-white group-hover:border-l-white ml-1"></div>
                                                    </div>
                                                </div>
                                                <img src={vid.thumb} alt={vid.title} className="absolute inset-0 size-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />
                                            </div>
                                        )}
                                    </div>
                                )})}
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Advanced Financial Chart & Timeline (Preserved) */}
                    {true && (
                        <ScrollReveal delay={0.05}>
                        <div className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6 md:p-8 space-y-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Revenue (Verified)</p>
                                    <p className="text-3xl font-bold font-mono text-slate-800">₹{totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Profit (Verified)</p>
                                    <p className={`text-3xl font-bold font-mono ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>₹{totalProfit.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Revenue Graph */}
                            <div 
                                className="relative group cursor-crosshair"
                                onMouseLeave={() => { setHoverIdx(null); setHoverType(null); }}
                                onMouseMove={(e) => {
                                    if (cumulativeUpdates.length === 0) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percentage = x / rect.width;
                                    const idx = Math.min(cumulativeUpdates.length - 1, Math.max(0, Math.round(percentage * (cumulativeUpdates.length - 1))));
                                    setHoverIdx(idx);
                                    setHoverType("rev");
                                }}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><LineChart className="size-5 text-emerald-500" /> Revenue Trend</h3>
                                </div>
                                <div className="relative h-56 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50">
                                    <svg className="size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        {gridLines.map(line => (
                                            <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.5" />
                                        ))}
                                        <path d={revChart.area} fill="url(#revGradient)" className="transition-all duration-500 ease-out" />
                                        <path d={revChart.path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500 ease-out" />
                                        
                                        {hoverIdx !== null && hoverType === "rev" && cumulativeUpdates[hoverIdx] && (
                                            <g className="transition-all duration-200">
                                                <line 
                                                    x1={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} y1="0" 
                                                    x2={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} y2="100" 
                                                    stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="0.5" 
                                                />
                                                <circle 
                                                    cx={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} 
                                                    cy={100 - ((cumulativeUpdates[hoverIdx].cumulativeRev - revChart.min) / (revChart.max - revChart.min || 1)) * 100} 
                                                    r="2.5" fill="#10b981" stroke="white" strokeWidth="1" 
                                                />
                                            </g>
                                        )}
                                    </svg>
                                    
                                    {/* Tooltip */}
                                    {hoverIdx !== null && hoverType === "rev" && cumulativeUpdates[hoverIdx] && (
                                        <div 
                                            className="absolute top-2 bg-slate-900/95 backdrop-blur-md text-white text-xs p-3.5 rounded-xl shadow-xl pointer-events-none border border-slate-700 w-56 z-10 transition-all duration-150 ease-out"
                                            style={{ 
                                                left: `${Math.min(80, Math.max(20, (hoverIdx / (cumulativeUpdates.length - 1)) * 100))}%`,
                                                transform: 'translateX(-50%)' 
                                            }}
                                        >
                                            <p className="font-bold text-slate-200 border-b border-slate-700 pb-2 mb-2 flex justify-between items-center">
                                                <span>{cumulativeUpdates[hoverIdx].reportingDate}</span>
                                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{cumulativeUpdates[hoverIdx].reportingType}</span>
                                            </p>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center"><span className="text-slate-400">Revenue</span><span className="font-mono text-emerald-400 font-medium">₹{cumulativeUpdates[hoverIdx].revenue}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-slate-400">Profit</span><span className={`font-mono font-medium ${Number(cumulativeUpdates[hoverIdx].profit) >= 0 ? 'text-lime-400' : 'text-red-400'}`}>₹{cumulativeUpdates[hoverIdx].profit}</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Financial Timeline Section */}
                            <div className="border-t border-slate-100 pt-8 mt-8">
                                <h3 className="text-slate-900 font-bold text-lg mb-6 flex items-center gap-2"><Calendar className="size-5 text-indigo-500" /> Financial Timeline</h3>
                                <div className="space-y-6">
                                    {groupedTimeline.slice(0, 5).map((event: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className="size-3 rounded-full bg-indigo-500 ring-4 ring-indigo-50 group-hover:scale-125 transition-transform duration-300"></div>
                                                {idx !== Math.min(4, groupedTimeline.length - 1) && <div className="w-px h-full bg-slate-200 mt-2"></div>}
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-1 hover:shadow-md transition-all duration-300 -mt-1.5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800">{event.label}</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">{event.desc}</p>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium">{formatRelativeTime(event.time)}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mt-3 pt-3 border-t border-slate-200">
                                                    <span className="text-slate-600">Rev: <strong className="text-emerald-600 font-mono">₹{event.revenue}</strong></span>
                                                    <span className="text-slate-600">Profit: <strong className="text-slate-800 font-mono">₹{event.profit}</strong></span>
                                                </div>
                                                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                    {event.verified ? <CheckCircle2 className="size-3 text-emerald-500" /> : <Clock className="size-3 text-slate-400" />} {event.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {groupedTimeline.length === 0 && (
                                        <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-slate-500">No financial updates submitted yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        </ScrollReveal>
                    )}
                </div>

                {/* Sidebar Data */}
                <div className="space-y-6">
                    <ScrollReveal y={12}>
                    <div className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="size-5 text-emerald-600" /> Executive Summary
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Target Capital</p>
                                <p className="text-2xl font-bold font-mono text-slate-800">₹ {(Number(investment_details?.investmentRequired || startup.requested) / 100000).toFixed(1)} Lakhs</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Equity</p>
                                    <p className="text-lg font-bold text-emerald-600">{investment_details?.equityOffered || startup.equity}%</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Valuation</p>
                                    <p className="text-lg font-bold font-mono text-slate-700">
                                        ₹ {investment_details?.currentValuation ? (Number(investment_details.currentValuation) / 10000000).toFixed(2) : ((startup.requested / Number(startup.equity)) * 100 / 10000000).toFixed(2)} Cr
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100 my-6"></div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-medium text-slate-500">Current Monthly Rev</span>
                                <span className="font-mono text-slate-800 font-bold">₹ {financials_monthly?.monthlyRevenue || (startup.revenue / 12).toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-medium text-slate-500">Current Burn Rate</span>
                                <span className="font-mono text-red-500 font-bold">₹ {financials_monthly?.monthlyBurnRate || (startup.burn / 12).toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-sm font-medium text-slate-500">Active Investors</span>
                                <span className="font-bold text-slate-800">{startup.investorCount || 0}</span>
                            </div>
                        </div>
                    </div>
                    </ScrollReveal>

                    {/* Founder Activity */}
                    {atomicActivities.length > 0 && (
                        <ScrollReveal y={12} delay={0.1}>
                        <div className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Activity className="size-5 text-blue-500" /> Founder Activity
                            </h3>
                            <div className="space-y-4">
                                {atomicActivities.slice(0, 5).map((act, i) => (
                                    <div key={i} className="flex items-center gap-3 group">
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${act.bg} shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                                            <act.icon className={`size-4 ${act.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{act.label}</p>
                                            <p className="text-xs text-slate-500">{formatRelativeTime(act.time)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </ScrollReveal>
                    )}

                    {/* AI Intelligence Suite */}
                    <ScrollReveal y={12} delay={0.15}>
                    <div className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <BrainCircuit className="size-5 text-indigo-500" /> AI Intelligence Suite
                        </h3>
                        <div className="space-y-3">
                            <Link href={`/startups/${idValue}/due-diligence`} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 group">
                                <div className="flex items-center gap-3">
                                    <BrainCircuit className="size-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">AI Due Diligence</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><CheckCircle2 className="size-3 text-emerald-500" /> Complete</p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                            </Link>
                            
                            <Link href={`/startups/${idValue}/health`} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 group">
                                <div className="flex items-center gap-3">
                                    <HeartPulse className="size-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Health Monitor</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active</p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </Link>
                        </div>
                    </div>
                    </ScrollReveal>

                    {/* AI Analyst Chat Widget */}
                    <ScrollReveal delay={0.05}>
                        <div className="mt-8 flex flex-col h-[500px] shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl overflow-hidden border border-slate-200 bg-white">
                            <AIChat startupId={(startup._id?.toString() || idValue) as string} />
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </div>
    );
}
