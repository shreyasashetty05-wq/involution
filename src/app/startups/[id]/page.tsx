"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Briefcase, TrendingUp, Presentation, CheckCircle2, Factory, LineChart, AlertTriangle, Activity, BrainCircuit, ShieldCheck, Scale, HeartPulse, Clock, Calendar, Users, FileText, ChevronRight, Globe, Target, MapPin, Zap, Info, Building2, UserCircle2, Linkedin, Banknote, ShieldAlert, X, ChevronDown, Download, Share2, Play, Bot, MessageCircle } from "lucide-react";
import { formatRelativeTime } from "@/utils/timeHelper";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AIChat from "@/frontend/components/AIChat";

const formatCurrency = (val: number | string) => {
    if (!val && val !== 0) return "₹0";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val));
};

export default function StartupProfile() {
    const params = useParams();
    const idValue = Array.isArray(params.id) ? params.id[0] : params.id;
    const [startup, setStartup] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [playingVideoIdx, setPlayingVideoIdx] = useState<number | null>(null);
    const [chartTimeframe, setChartTimeframe] = useState("Monthly");
    const [showAllUpdates, setShowAllUpdates] = useState(false);
    const [showChat, setShowChat] = useState(false);

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

    // Team Members
    const founder = {
        name: basic_info.founderName || "Founder Name",
        role: basic_info.founderRole || "Founder & CEO",
        photoUrl: basic_info.founderPhotoUrl || null,
        linkedin: basic_info.founderLinkedin || null
    };
    let teamMembers = [founder];
    if (basic_info.teamMembersData && Array.isArray(basic_info.teamMembersData)) {
        teamMembers = [...teamMembers, ...basic_info.teamMembersData].slice(0, 5); // Max 5
    }

    // Determine grid columns dynamically based on team size
    let gridClass = "grid-cols-1"; // Founder only (default handled by flex justify-center)
    if (teamMembers.length === 2) gridClass = "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (teamMembers.length === 3) gridClass = "grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto";
    if (teamMembers.length === 4) gridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 max-w-5xl mx-auto";
    if (teamMembers.length === 5) gridClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-6xl mx-auto";

    // Financial Updates & Chart Data
    const approvedUpdates = startup.financial_updates?.filter((u: any) => u.status === 'Approved')
        .sort((a: any, b: any) => new Date(b.dateSubmitted || b.monthYear).getTime() - new Date(a.dateSubmitted || a.monthYear).getTime()) || [];
    
    // For timeline, maintain exactly 10 latest
    const timelineUpdates = approvedUpdates.slice(0, 10);
    const visibleUpdates = showAllUpdates ? timelineUpdates : timelineUpdates.slice(0, 2);

    // Prepare chart data (reverse sort for chronological order in chart)
    const chartData = [...approvedUpdates].sort((a: any, b: any) => new Date(a.reportingDate || a.monthYear).getTime() - new Date(b.reportingDate || b.monthYear).getTime()).map((u: any) => ({
        date: new Date(u.reportingDate || u.monthYear).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        revenue: Number(u.revenue) || 0,
        expenses: Number(u.expenses) || 0,
        profit: Number(u.profit) || 0,
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-xl min-w-[200px]">
                    <p className="text-slate-300 font-bold mb-3 border-b border-slate-700 pb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 capitalize flex items-center gap-1">
                                <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                {entry.name}
                            </span>
                            <span className="font-mono font-bold text-white ml-4">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen pb-20 bg-slate-50 font-outfit">
            
            {/* Header / Hero Banner */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-12 shadow-sm">
                <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                    <Link href="/investors/search" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-8 transition-colors text-sm font-bold uppercase tracking-wider">
                        <ArrowLeft className="size-4" /> Back to Discover
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="flex items-start md:items-center gap-6">
                            <div className="size-28 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                                {basic_info.logoUrl ? (
                                    <img src={basic_info.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-slate-400">{startup.name?.charAt(0) || 'S'}</span>
                                )}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h1 className="text-4xl font-black text-slate-900">{basic_info.startupName || startup.name || 'Startup Name'}</h1>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-bold text-emerald-700 flex items-center gap-1 shadow-sm">
                                            <BrainCircuit className="size-3.5" /> AI Verified
                                        </span>
                                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-md text-xs font-bold text-indigo-700 flex items-center gap-1 shadow-sm">
                                            <CheckCircle2 className="size-3.5" /> KYC Verified
                                        </span>
                                    </div>
                                </div>
                                <p className="text-slate-500 font-medium text-lg max-w-2xl">{basic_info.startupTagline || startup.desc || 'Premium startup offering robust solutions.'}</p>
                                
                                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 font-bold mt-4">
                                    <span className="flex items-center gap-2"><Factory className="size-4 text-slate-400" /> {business_info.industry || startup.sector || 'Industry'}</span>
                                    <span className="flex items-center gap-2"><TrendingUp className="size-4 text-slate-400" /> {business_info.startupStage || startup.stage || 'Stage'}</span>
                                    <span className="flex items-center gap-2"><MapPin className="size-4 text-slate-400" /> {business_info.headquarters || 'Headquarters'}</span>
                                    <span className="flex items-center gap-2"><Calendar className="size-4 text-slate-400" /> Founded {business_info.yearFounded || 'Year'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                            <button className="px-6 py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 flex-1 md:flex-none">
                                <Share2 className="size-4" /> Share Profile
                            </button>
                            <Link href={`/messages?startupId=${startup._id?.toString() || idValue}&name=${encodeURIComponent(startup.name || '')}`} className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 flex-1 md:flex-none">
                                <MessageSquare className="size-4" /> Open Deal Room
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 max-w-6xl mt-12 space-y-12">
                
                {/* 2. Founder & Team */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Users className="size-6 text-indigo-500" /> Founder & Team
                    </h2>
                    {teamMembers.length === 1 ? (
                        <div className="flex justify-center">
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center w-64 shadow-sm hover:shadow-md transition-shadow">
                                <div className="size-24 rounded-2xl bg-indigo-50 mx-auto mb-4 overflow-hidden flex items-center justify-center">
                                    {teamMembers[0].photoUrl ? <img src={teamMembers[0].photoUrl} alt="Founder" className="w-full h-full object-cover" /> : <UserCircle2 className="size-10 text-indigo-300" />}
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg truncate">{teamMembers[0].name}</h3>
                                <p className="text-sm font-medium text-slate-500 truncate mb-4">{teamMembers[0].role}</p>
                                {teamMembers[0].linkedin && (
                                    <a href={teamMembers[0].linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                                        <Linkedin className="size-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={`grid gap-6 ${gridClass}`}>
                            {teamMembers.map((member, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                    <div className="size-24 rounded-2xl bg-indigo-50 mx-auto mb-4 overflow-hidden flex items-center justify-center">
                                        {member.photoUrl ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" /> : <UserCircle2 className="size-10 text-indigo-300" />}
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg truncate">{member.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 truncate mb-4">{member.role}</p>
                                    {member.linkedin && (
                                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
                                            <Linkedin className="size-5" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 3. Investment Snapshot */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Target className="size-6 text-emerald-500" /> Investment Snapshot
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Investment Required</p>
                            <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(investment_details.investmentRequired || startup.requested)}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Equity Offered</p>
                            <p className="text-2xl font-black text-slate-900">{investment_details.equityOffered || startup.equity || "0"}%</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Valuation</p>
                            <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(investment_details.currentValuation || "0")}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Minimum Investment</p>
                            <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(investment_details.minimumInvestment || "0")}</p>
                        </div>
                    </div>
                    {investment_details.useOfFunds && Object.keys(investment_details.useOfFunds).length > 0 && (
                        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                            <p className="text-sm font-bold text-slate-500 min-w-max"><Banknote className="size-4 inline mr-1 text-slate-400" /> Use of Funds:</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(investment_details.useOfFunds).filter(([_, v]) => v).map(([k]) => {
                                    // Assign a predictable color based on string
                                    const colors = ['bg-blue-50 text-blue-700', 'bg-emerald-50 text-emerald-700', 'bg-purple-50 text-purple-700', 'bg-amber-50 text-amber-700', 'bg-indigo-50 text-indigo-700', 'bg-pink-50 text-pink-700'];
                                    const idx = k.length % colors.length;
                                    return (
                                        <span key={k} className={`px-3 py-1 text-xs font-bold rounded-lg capitalize ${colors[idx]}`}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>

                {/* 4. Business Overview */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Briefcase className="size-6 text-blue-500" /> Business Overview
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-12">
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Industry</p><p className="font-bold text-slate-900">{business_info.industry || "Not Available"}</p></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business Model</p><p className="font-bold text-slate-900">{business_info.businessModel || "Not Available"}</p></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Revenue Model</p><p className="font-bold text-slate-900">{business_info.revenueModel || "Not Available"}</p></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Company Type</p><p className="font-bold text-slate-900">{business_info.companyType || "Not Available"}</p></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Market</p><p className="font-bold text-slate-900">{business_info.targetMarket || "Not Available"}</p></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Headquarters</p><p className="font-bold text-slate-900">{business_info.headquarters || "Not Available"}</p></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Website</p>
                                    {business_info.website ? <a href={business_info.website} target="_blank" className="font-bold text-indigo-600 hover:underline flex items-center gap-1">{business_info.website.replace('https://', '')} <Globe className="size-3" /></a> : <p className="font-bold text-slate-900">Not Available</p>}
                                </div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Competitors</p><p className="font-bold text-slate-900">{business_info.competitors || "Not Available"}</p></div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Startup Description</h4>
                                <p className="text-slate-700 font-medium leading-relaxed">{business_info.startupDescription || startup.desc || "No description provided."}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Problem Statement</h4>
                                <p className="text-slate-700 font-medium leading-relaxed">{business_info.problemStatement || "Not Available"}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Solution</h4>
                                <p className="text-slate-700 font-medium leading-relaxed">{business_info.solution || "Not Available"}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Unique Value Proposition</h4>
                                <p className="text-slate-700 font-medium leading-relaxed">{business_info.uvp || "Not Available"}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Financial Overview */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Banknote className="size-6 text-emerald-500" /> Financial Overview
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><TrendingUp className="size-3 text-emerald-500" /> Monthly Revenue</p>
                            <p className="text-lg font-black text-slate-900 font-mono">{formatCurrency(financials_monthly.monthlyRevenue || startup.revenue)}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><TrendingUp className="size-3 text-red-500 rotate-180" /> Monthly Expenses</p>
                            <p className="text-lg font-black text-slate-900 font-mono">{formatCurrency(financials_monthly.monthlyExpenses || "0")}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><Banknote className="size-3 text-emerald-500" /> Monthly Profit</p>
                            <p className="text-lg font-black text-slate-900 font-mono">{formatCurrency(financials_monthly.monthlyProfit || "0")}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><Building2 className="size-3 text-indigo-500" /> Cash in Bank</p>
                            <p className="text-lg font-black text-slate-900 font-mono">{formatCurrency(financials_monthly.cashInBank || "0")}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><Activity className="size-3 text-amber-500" /> Burn Rate</p>
                            <p className="text-lg font-black text-slate-900 font-mono">{formatCurrency(financials_monthly.monthlyBurnRate || startup.burn)}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><Clock className="size-3 text-amber-500" /> Runway</p>
                            <p className="text-lg font-black text-slate-900 font-mono">{financials_monthly.runway || "0"} Months</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><TrendingUp className="size-3 text-purple-500" /> Profit Margin</p>
                            <p className="text-lg font-black text-slate-900 font-mono">
                                {Number(financials_monthly.monthlyRevenue) > 0 ? ((Number(financials_monthly.monthlyProfit) / Number(financials_monthly.monthlyRevenue)) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>
                </section>

                {/* 6. AI Startup Analysis */}
                <section>
                    <div className="bg-[#0b1021] rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><BrainCircuit className="size-64" /></div>
                        
                        <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><BrainCircuit className="size-6 text-indigo-400" /> AI Startup Analysis</h2>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                            <div className="flex flex-col items-center justify-center size-40 rounded-full border-[6px] border-emerald-400 bg-[#121936] shrink-0 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                                <span className="text-5xl font-black text-white">92</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mt-1">Match Score</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 w-full">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Business Strength</p>
                                    <p className="text-lg font-bold text-white flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> Strong</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Risk Level</p>
                                    <p className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangle className="size-4 text-emerald-400" /> Low</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Financial Health</p>
                                    <p className="text-lg font-bold text-white flex items-center gap-2"><HeartPulse className="size-4 text-emerald-400" /> Healthy</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Growth Potential</p>
                                    <p className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp className="size-4 text-emerald-400" /> High</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                            <h4 className="font-bold text-indigo-300 mb-3 uppercase text-sm tracking-wider">AI Recommendation</h4>
                            <p className="text-slate-300 text-base leading-relaxed max-w-4xl">
                                Strong financial performance with healthy profit margins and low operational risk. The startup's consistent revenue growth and manageable burn rate provide a solid foundation. The team holds significant relevant industry experience. Suitable for Seed & Series A investors.
                            </p>
                            <span className="inline-block mt-4 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg">Suitable for Seed & Series A Investors</span>
                        </div>
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* 7. Verification Badges */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <ShieldCheck className="size-6 text-emerald-500" /> Verification Badges
                        </h2>
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-full">
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries({
                                    'KYC Verified': true,
                                    'GST Registered': credibility?.verification?.gstRegistered || false,
                                    'Company PAN Verified': credibility?.verification?.panVerified || false,
                                    'Bank Account Verified': credibility?.verification?.bankVerified || false,
                                    'Startup India': credibility?.verification?.startupIndia || false,
                                    'MSME Registered': credibility?.verification?.msmeRegistered || false,
                                    'Patent Filed': credibility?.verification?.patentFiled || false,
                                    'Patent Granted': credibility?.verification?.patentGranted || false,
                                }).map(([label, verified]) => verified && (
                                    <div key={label} className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-800">
                                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 8. Risk Disclosure */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <ShieldAlert className="size-6 text-amber-500" /> Risk Disclosure
                        </h2>
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-full">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <span className="text-sm font-bold text-slate-700">Pending Legal Cases</span>
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${risk_disclosure?.pendingLegalCases ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                        {risk_disclosure?.pendingLegalCases ? 'Yes' : 'None'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <span className="text-sm font-bold text-slate-700">Outstanding Loans</span>
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${risk_disclosure?.outstandingLoans ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                        {risk_disclosure?.outstandingLoans ? 'Yes' : 'None'}
                                    </span>
                                </div>
                                
                                {risk_disclosure?.previousFundingRaised && (
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Previous Funding Details</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Amount</p>
                                                <p className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(risk_disclosure?.fundingAmount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Round</p>
                                                <p className="text-sm font-bold text-slate-900">{risk_disclosure?.fundingRound}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Investors</p>
                                                <p className="text-sm font-bold text-slate-900">{risk_disclosure?.investorName}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* 9. Pitch Media */}
                {startup.videos && startup.videos.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Presentation className="size-6 text-indigo-500" /> Pitch Media
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-slate-900 rounded-3xl aspect-video overflow-hidden shadow-lg relative group">
                                {playingVideoIdx === 0 ? (
                                    <iframe src={`${startup.videos[0].url}${startup.videos[0].url.includes('?') ? '&' : '?'}autoplay=1`} title={startup.videos[0].title} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                ) : (
                                    <div className="absolute inset-0 cursor-pointer flex items-center justify-center" onClick={() => setPlayingVideoIdx(0)}>
                                        <img src={startup.videos[0].thumb} alt={startup.videos[0].title} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 transition-opacity" />
                                        <div className="size-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
                                            <Play className="size-6 text-white ml-1 fill-white" />
                                        </div>
                                        <div className="absolute top-4 left-6 z-10"><p className="text-white font-bold text-sm tracking-wide">{startup.videos[0].title}</p></div>
                                    </div>
                                )}
                            </div>
                            
                            {startup.videos.length > 1 && (
                                <div className="grid grid-cols-2 gap-4">
                                    {startup.videos.slice(1).map((vid: any, idx: number) => (
                                        <div key={idx} className="bg-slate-900 rounded-2xl aspect-video overflow-hidden shadow-sm relative group cursor-pointer" onClick={() => window.open(vid.url, '_blank')}>
                                            <img src={vid.thumb} alt={vid.title} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10">
                                                    <Play className="size-4 text-white ml-0.5 fill-white" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 left-3 z-10"><p className="text-white font-bold text-[10px] tracking-wide truncate pr-2">{vid.title}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* 10. Revenue & Financial Charts */}
                <section>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <LineChart className="size-6 text-indigo-500" /> Revenue & Financial Charts
                        </h2>
                        <select 
                            className="bg-white border border-slate-200 text-sm font-bold text-slate-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-4 sm:mt-0"
                            value={chartTimeframe} onChange={(e) => setChartTimeframe(e.target.value)}
                        >
                            <option value="Daily">Daily</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-1.5"><TrendingUp className="size-4 text-emerald-500" /> Revenue Trend</h3>
                            <div className="h-64 w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsLineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} />
                                            <YAxis tickFormatter={(value) => `₹${value >= 100000 ? (value/100000).toFixed(0)+'L' : value}`} tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} width={45} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-slate-400 text-sm text-center pt-24">No Data Yet</p>}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-1.5"><TrendingUp className="size-4 text-orange-500 rotate-180" /> Expenses Trend</h3>
                            <div className="h-64 w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsLineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} />
                                            <YAxis tickFormatter={(value) => `₹${value >= 100000 ? (value/100000).toFixed(0)+'L' : value}`} tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} width={45} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" strokeWidth={3} dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-slate-400 text-sm text-center pt-24">No Data Yet</p>}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-1.5"><TrendingUp className="size-4 text-blue-500" /> Profit Trend</h3>
                            <div className="h-64 w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsLineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} />
                                            <YAxis tickFormatter={(value) => `₹${value >= 100000 ? (value/100000).toFixed(0)+'L' : value}`} tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} width={45} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-slate-400 text-sm text-center pt-24">No Data Yet</p>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 11. Financial Timeline */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Calendar className="size-6 text-indigo-500" /> Financial Timeline
                    </h2>
                    
                    {visibleUpdates.length > 0 ? (
                        <div className="space-y-6">
                            {visibleUpdates.map((update: any, idx: number) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-6 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="w-1 absolute left-0 top-0 bottom-0 bg-emerald-400"></div>
                                    
                                    <div className="md:w-32 shrink-0">
                                        <p className="font-bold text-slate-900">{new Date(update.reportingDate || update.monthYear).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">{update.reportingType || 'Monthly'}</p>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Revenue</p><p className="font-bold text-slate-900 font-mono text-sm">{formatCurrency(update.revenue)}</p></div>
                                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Expenses</p><p className="font-bold text-slate-900 font-mono text-sm">{formatCurrency(update.expenses)}</p></div>
                                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Profit</p><p className={`font-bold font-mono text-sm ${Number(update.profit) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(update.profit)}</p></div>
                                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Cash in Bank</p><p className="font-bold text-slate-900 font-mono text-sm">{formatCurrency(update.cashInBank)}</p></div>
                                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Burn Rate</p><p className="font-bold text-slate-900 font-mono text-sm">{formatCurrency(update.burnRate)} /mo</p></div>
                                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Runway</p><p className="font-bold text-slate-900 text-sm">{update.burnRate > 0 ? (Number(update.cashInBank) / Number(update.burnRate)).toFixed(1) : 0} Months</p></div>
                                        </div>
                                        {update.milestones && (
                                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <strong className="text-slate-800">Founder Update:</strong> {update.milestones}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:w-40 shrink-0 text-center flex flex-col items-center justify-center">
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold w-full mb-3 shadow-sm">
                                            Approved
                                        </span>
                                        <p className="text-[10px] text-slate-500 font-medium">Verified on<br/>{new Date(update.verifiedAt || update.dateSubmitted).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>by Admin</p>

                                    </div>
                                </div>
                            ))}

                            {!showAllUpdates && timelineUpdates.length > 2 && (
                                <button 
                                    onClick={() => setShowAllUpdates(true)}
                                    className="w-full py-4 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    See More Updates <ChevronDown className="size-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 font-medium">No verified financial updates available yet.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Floating AI Chat Widget */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
                {/* Chat Window */}
                {showChat && (
                    <div className="mb-4 w-[400px] max-w-[calc(100vw-48px)] shadow-2xl rounded-[24px] overflow-hidden pointer-events-auto transition-all animate-in slide-in-from-bottom-8 fade-in duration-300 relative group/chatwidget">
                        <button 
                            onClick={() => setShowChat(false)}
                            className="absolute top-4 right-4 z-[60] p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                        <div className="h-[700px] max-h-[calc(100dvh-120px-env(safe-area-inset-top))]">
                            <AIChat startupId={idValue as string} />
                        </div>
                    </div>
                )}

                {/* Floating Action Button */}
                <button 
                    onClick={() => setShowChat(!showChat)}
                    className="size-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 pointer-events-auto relative group"
                >
                    {showChat ? (
                        <X className="size-6" />
                    ) : (
                        <div className="relative">
                            <Bot className="size-6" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>
                    )}
                    
                    {!showChat && (
                        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none hidden md:block">
                            Ask InVolution AI
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
