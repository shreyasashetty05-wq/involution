/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Briefcase, TrendingUp, Presentation, CheckCircle2, Factory, LineChart, AlertTriangle, Activity, BrainCircuit, ShieldCheck, Scale, HeartPulse, Clock, Calendar, Users, FileText, ChevronRight } from "lucide-react";
import AIChat from "@/frontend/components/AIChat";
import ScrollReveal from "@/frontend/components/ScrollReveal";
import { motion } from "framer-motion";
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

    // Growth Indicators
    let revGrowth = 0;
    let profitGrowth = 0;
    if (approvedUpdates.length >= 2) {
        const last = approvedUpdates[approvedUpdates.length - 1];
        const prev = approvedUpdates[approvedUpdates.length - 2];
        if (Number(prev.revenue) > 0) {
            revGrowth = ((Number(last.revenue) - Number(prev.revenue)) / Number(prev.revenue)) * 100;
        }
        if (Number(prev.profit) !== 0) {
            profitGrowth = ((Number(last.profit) - Number(prev.profit)) / Math.abs(Number(prev.profit))) * 100;
        }
    }

    const latestUpdate = approvedUpdates.length > 0 ? approvedUpdates[approvedUpdates.length - 1] : null;

    // Timeline and Activities
    const groupedTimeline: any[] = [];
    const atomicActivities: any[] = [];
    
    approvedUpdates.forEach((update: any) => {
        const pType = update.reportingType || 'Monthly';
        const pDate = update.reportingDate || update.monthYear;
        const vDate = update.verifiedAt || update.dateSubmitted;
        
        groupedTimeline.push({
            label: 'Financial Update',
            desc: `Data for ${pType} (${pDate})`,
            revenue: update.revenue,
            profit: update.profit,
            netLoss: update.netLoss,
            time: vDate,
            status: update.status === 'Approved' ? 'Verified by InVolution' : 'Submitted',
            verified: update.status === 'Approved'
        });
        
        if (update.revenue) atomicActivities.push({ label: 'Revenue Updated', time: update.dateSubmitted, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' });
        if (update.profit !== undefined) atomicActivities.push({ label: 'Profit Updated', time: update.dateSubmitted, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' });
        if (update.netLoss) atomicActivities.push({ label: 'Loss Updated', time: update.dateSubmitted, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' });
        if (update.documentUrl) atomicActivities.push({ label: 'Documents Uploaded', time: update.dateSubmitted, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' });
        if (update.verifiedAt && update.status === 'Approved') atomicActivities.push({ label: 'Financials Verified', time: update.verifiedAt, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' });
    });
    
    groupedTimeline.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    atomicActivities.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Grid Lines for Charts
    const gridLines = [25, 50, 75];

    return (
        <div className="min-h-screen pb-20 bg-slate-50/50">
            {/* Hero Header */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-12">
                <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                    <ScrollReveal y={10}>
                        <Link href="/investors/search" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-6 transition-colors text-sm font-medium">
                            <ArrowLeft className="size-4" /> Back to Search
                        </Link>
                    </ScrollReveal>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <ScrollReveal className="flex items-start md:items-center gap-6" delay={0.05}>
                            {/* Circular Startup Logo */}
                            <div className="relative group shrink-0">
                                <div className="size-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-white flex items-center justify-center shadow-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                    <span className="text-3xl font-bold font-outfit text-slate-400">{startup?.name?.charAt(0) || 'S'}</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h1 className="text-3xl md:text-4xl font-bold font-outfit text-slate-900">{startup?.name || 'Startup'}</h1>
                                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-600 flex items-center gap-1 shadow-sm">
                                        <CheckCircle2 className="size-3.5" /> {startup.isStudent ? "Incubation Idea" : "KYC Verified"}
                                    </span>
                                </div>
                                <div className="flex items-center flex-wrap gap-4 text-sm text-slate-500 font-medium mt-3">
                                    <span className="flex items-center gap-1.5"><Factory className="size-4 text-slate-400" /> {startup.sector} • {startup.businessModel}</span>
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

                    {/* Compact Business Health Summary */}
                    {!startup.isStudent && (
                        <ScrollReveal delay={0.15}>
                            <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Financial Status</p>
                                    <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1"><ShieldCheck className="size-3" /> Verified</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Trust Score</p>
                                    <p className="text-sm font-semibold text-slate-800">Excellent</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Revenue Trend</p>
                                    <p className={`text-sm font-semibold ${revGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {revGrowth >= 0 ? '↑' : '↓'} {Math.abs(revGrowth).toFixed(1)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Profitability</p>
                                    <p className="text-sm font-semibold text-slate-800">{totalProfit > 0 ? 'Profitable' : 'Pre-profit'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                                    <p className="text-sm font-semibold text-slate-800">{latestUpdate ? formatRelativeTime(latestUpdate.dateSubmitted) : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Active Investors</p>
                                    <p className="text-sm font-semibold text-slate-800">{startup.investorCount || 0}</p>
                                </div>
                            </div>
                        </ScrollReveal>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 max-w-6xl mt-8 grid md:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Pitch Section */}
                    <ScrollReveal>
                    <div className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6 md:p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Presentation className="size-5 text-indigo-500" /> Executive Pitch
                        </h2>
                        <p className="text-slate-600 leading-relaxed font-inter">{startup.desc}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                            {Array.isArray(startup.videos) && startup.videos.map((v: unknown, idx: number) => {
                                const vid = v as Record<string, string>;
                                return (
                                <div key={idx} className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300">
                                    {(playingVideoIdx === idx && vid.url) ? (
                                        <iframe
                                            src={`${vid.url}${vid.url.includes('?') ? '&' : '?'}autoplay=1`}
                                            title={vid.title}
                                            className="absolute inset-0 size-full object-cover"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <div
                                            className="absolute inset-0 cursor-pointer"
                                            onClick={() => { if (vid.url) setPlayingVideoIdx(idx); }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-5 z-10 opacity-90 group-hover:opacity-100 transition-opacity">
                                                <h3 className="text-white font-bold text-sm leading-tight">{vid.title}</h3>
                                                {idx === 0 && <p className="text-emerald-400 font-medium text-[10px] mt-1.5 uppercase tracking-wider">Verified Pitch</p>}
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

                    {/* Advanced Financial Chart */}
                    {!startup.isStudent && (
                        <ScrollReveal delay={0.05}>
                        <div className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6 md:p-8 space-y-10">
                            {/* Cumulative Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Revenue</p>
                                    <p className="text-3xl font-bold font-mono text-slate-800">₹{totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Profit</p>
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
                                                {cumulativeUpdates[hoverIdx].netLoss > 0 && (
                                                    <div className="flex justify-between items-center"><span className="text-slate-400">Loss</span><span className="font-mono text-red-400 font-medium">₹{cumulativeUpdates[hoverIdx].netLoss}</span></div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profit Graph */}
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
                                    setHoverType("profit");
                                }}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><TrendingUp className="size-5 text-blue-500" /> Profit Trend</h3>
                                </div>
                                <div className="relative h-56 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50">
                                    <svg className="size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        {gridLines.map(line => (
                                            <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.5" />
                                        ))}
                                        <path d={profitChart.area} fill="url(#profitGradient)" className="transition-all duration-500 ease-out" />
                                        <path d={profitChart.path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500 ease-out" />
                                        
                                        {profitChart.min < 0 && (
                                            <line x1="0" y1={`${100 - ((0 - profitChart.min) / (profitChart.max - profitChart.min || 1)) * 100}`} x2="100" y2={`${100 - ((0 - profitChart.min) / (profitChart.max - profitChart.min || 1)) * 100}`} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1" />
                                        )}
                                        
                                        {hoverIdx !== null && hoverType === "profit" && cumulativeUpdates[hoverIdx] && (
                                            <g className="transition-all duration-200">
                                                <line 
                                                    x1={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} y1="0" 
                                                    x2={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} y2="100" 
                                                    stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="0.5" 
                                                />
                                                <circle 
                                                    cx={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} 
                                                    cy={100 - ((cumulativeUpdates[hoverIdx].cumulativeProfit - profitChart.min) / (profitChart.max - profitChart.min || 1)) * 100} 
                                                    r="2.5" fill="#3b82f6" stroke="white" strokeWidth="1" 
                                                />
                                            </g>
                                        )}
                                    </svg>

                                    {/* Tooltip */}
                                    {hoverIdx !== null && hoverType === "profit" && cumulativeUpdates[hoverIdx] && (
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
                                                <div className="flex justify-between items-center"><span className="text-slate-400">Profit</span><span className={`font-mono font-medium ${Number(cumulativeUpdates[hoverIdx].profit) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>₹{cumulativeUpdates[hoverIdx].profit}</span></div>
                                                {cumulativeUpdates[hoverIdx].netLoss > 0 && (
                                                    <div className="flex justify-between items-center"><span className="text-slate-400">Loss</span><span className="font-mono text-red-400 font-medium">₹{cumulativeUpdates[hoverIdx].netLoss}</span></div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Financial Timeline Section (Grouped) */}
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
                                                    {event.netLoss > 0 && <span className="text-slate-600">Loss: <strong className="text-red-500 font-mono">₹{event.netLoss}</strong></span>}
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

                    {/* AI Analyst Chat Widget */}
                    <ScrollReveal delay={0.05}>
                        <div className="mt-8 flex flex-col h-[600px] shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl overflow-hidden border border-slate-200 bg-white">
                            <AIChat startupId={(startup._id?.toString() || idValue) as string} />
                        </div>
                    </ScrollReveal>
                </div>

                {/* Sidebar Data */}
                <div className="space-y-6">
                    <ScrollReveal y={12}>
                    {/* Unified Business Snapshot Card */}
                    <div className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="size-5 text-emerald-600" /> Business Snapshot
                        </h3>

                        <div className="space-y-5 mb-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Target Capital</p>
                                <p className="text-2xl font-bold font-mono text-slate-800">₹ {(startup.requested / 100000).toFixed(1)} Lakhs</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Equity</p>
                                    <p className="text-lg font-bold text-emerald-600">{startup.equity}%</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Valuation</p>
                                    <p className="text-lg font-bold font-mono text-slate-700">
                                        {Number(startup.equity) > 0 ? `₹ ${((startup.requested / Number(startup.equity)) * 100 / 10000000).toFixed(2)} Cr` : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!startup.isStudent && (
                            <>
                                <div className="w-full h-px bg-slate-100 my-6"></div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">Latest Revenue</span>
                                        <div className="text-right flex items-center gap-2">
                                            {revGrowth !== 0 && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${revGrowth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {revGrowth > 0 ? '↑' : '↓'} {Math.abs(revGrowth).toFixed(1)}%
                                                </span>
                                            )}
                                            <span className="font-mono text-slate-800 font-bold">₹ {latestUpdate ? (latestUpdate.revenue / 1000).toFixed(0) : (startup.revenue / 1000).toFixed(0)}K</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center group">
                                        <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">Latest Profit</span>
                                        <div className="text-right flex items-center gap-2">
                                            {profitGrowth !== 0 && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${profitGrowth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {profitGrowth > 0 ? '↑' : '↓'} {Math.abs(profitGrowth).toFixed(1)}%
                                                </span>
                                            )}
                                            <span className={`font-mono font-bold ${latestUpdate && Number(latestUpdate.profit) < 0 ? 'text-red-500' : 'text-slate-800'}`}>₹ {latestUpdate ? (latestUpdate.profit / 1000).toFixed(0) : 0}K</span>
                                        </div>
                                    </div>
                                    {latestUpdate?.netLoss > 0 && (
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">Latest Loss</span>
                                            <span className="font-mono text-red-500 font-bold">₹ {(latestUpdate.netLoss / 1000).toFixed(0)}K</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center group">
                                        <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">Last Updated</span>
                                        <span className="text-sm text-slate-700 font-medium">{latestUpdate ? formatRelativeTime(latestUpdate.dateSubmitted) : 'N/A'}</span>
                                    </div>
                                </div>

                                {latestUpdate && (
                                    <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                        <p className="text-xs text-emerald-700 font-bold uppercase mb-3 flex items-center gap-1.5"><CheckCircle2 className="size-4" /> Financials Verified</p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Verified By</span>
                                                <span className="font-medium text-slate-800">InVolution</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Last Verified</span>
                                                <span className="font-medium text-slate-800">{formatRelativeTime(latestUpdate.verifiedAt || latestUpdate.dateSubmitted)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Reporting Type</span>
                                                <span className="font-medium text-slate-800">{latestUpdate.reportingType || 'Monthly'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    </ScrollReveal>

                    {/* Founder Activity */}
                    {!startup.isStudent && atomicActivities.length > 0 && (
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

                            <Link href={`/startups/${idValue}/trust`} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="size-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Trust Score</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><CheckCircle2 className="size-3 text-emerald-500" /> Verified</p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </Link>

                            <Link href={`/startups/${idValue}/compliance`} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group">
                                <div className="flex items-center gap-3">
                                    <Scale className="size-5 text-purple-500 group-hover:text-purple-600 transition-colors" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Legal Compliance</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><CheckCircle2 className="size-3 text-emerald-500" /> Verified</p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                            </Link>
                        </div>
                    </div>
                    </ScrollReveal>
                </div>
            </div>
        </div>
    );
}
