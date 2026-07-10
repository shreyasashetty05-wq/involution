"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Briefcase, TrendingUp, Presentation, CheckCircle2, Factory, LineChart, AlertTriangle, Activity, BrainCircuit, ShieldCheck, Scale, HeartPulse, Clock, Calendar, Users } from "lucide-react";
import AIChat from "@/frontend/components/AIChat";
import ScrollReveal from "@/frontend/components/ScrollReveal";
import { motion } from "framer-motion";
import { formatRelativeTime } from "@/utils/timeHelper";


// Remove mock data. We will fetch dynamically now.


/**
 * Displays a startup profile page with pitch media, financial charts, activity status, and AI analysis tools.
 * @example
 * StartupProfile()
 * <div>Startup profile UI</div>
 * @returns {JSX.Element} The rendered startup profile page.
 */
export default function StartupProfile() {
    const params = useParams();
    const idValue = Array.isArray(params.id) ? params.id[0] : params.id;
    const [startup, setStartup] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);
    const [playingVideoIdx, setPlayingVideoIdx] = useState<number | null>(null);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [hoverType, setHoverType] = useState<"rev" | "profit" | null>(null);

    useEffect(() => {
        /**
        * Loads a startup by ID from the startups API and updates component state.
        * @example
        * sync()
        * undefined
        * @returns {Promise<void>} Resolves when the startup data has been fetched and state is updated.
        **/
        const fetchStartup = async () => {
            try {
                // We're reusing the /api/startups GET which currently returns all
                // In a production app, we'd make a dedicated /api/startups/[id] GET
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

    // Multi-Graph Data Generation Helpers
    /**
     * Generates SVG path and area strings from a numeric dataset.
     * @example
     * generateChartPaths([1, 3, 2, 5])
     * { path: "M 0.00 100.00 L 33.33 50.00 L 66.67 75.00 L 100.00 0.00", area: "M 0.00 100.00 L 33.33 50.00 L 66.67 75.00 L 100.00 0.00 L 100 100 L 0 100 Z", max: 5, min: 1 }
     * @param {number[]} data - Array of numeric values used to build the chart path.
     * @returns {{ path: string, area: string, max: number, min: number }} Object containing the SVG path, filled area path, and value bounds.
     */
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

    const calculateActivity = () => {
        const lastApproved = approvedUpdates.length > 0 ? approvedUpdates[approvedUpdates.length - 1] : null;
        if (!lastApproved) return { status: "Unknown", color: "text-slate-400", bg: "bg-slate-100", border: "border-slate-200", days: -1, isStale: false };
        
        const updatedDate = new Date(lastApproved.verifiedAt || lastApproved.dateSubmitted);
        const diffTime = Math.abs(new Date().getTime() - updatedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const isStale = diffDays > 32;

        if (diffDays <= 7) return { status: "Highly Active", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", days: diffDays, isStale, timeStr: formatRelativeTime(updatedDate) };
        if (diffDays <= 30) return { status: "Active", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", days: diffDays, isStale, timeStr: formatRelativeTime(updatedDate) };
        if (diffDays <= 60) return { status: "Needs Update", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", days: diffDays, isStale, timeStr: formatRelativeTime(updatedDate) };
        return { status: "Inactive", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", days: diffDays, isStale, timeStr: formatRelativeTime(updatedDate) };
    };

    const activityStatus = startup ? calculateActivity() : null;

    const timelineEvents: any[] = [];
    approvedUpdates.forEach((update: any) => {
        const pType = update.reportingType || 'Monthly';
        const pDate = update.reportingDate || update.monthYear;
        
        timelineEvents.push({
            label: 'Financial Update Submitted',
            desc: `Financial data submitted for ${pType} (${pDate})`,
            time: update.dateSubmitted,
            status: 'Submitted',
            color: 'bg-blue-500',
            ring: 'ring-blue-200'
        });
        timelineEvents.push({
            label: 'Revenue Updated',
            desc: `Revenue logged for ${pType}`,
            time: update.dateSubmitted,
            status: 'Submitted',
            color: 'bg-indigo-500',
            ring: 'ring-indigo-200'
        });
        if (update.profit !== undefined) {
            timelineEvents.push({
                label: 'Profit Updated',
                desc: `Net Profit logged for ${pType}`,
                time: update.dateSubmitted,
                status: 'Submitted',
                color: 'bg-indigo-500',
                ring: 'ring-indigo-200'
            });
        }
        if (update.netLoss) {
            timelineEvents.push({
                label: 'Loss Updated',
                desc: `Net Loss logged for ${pType}`,
                time: update.dateSubmitted,
                status: 'Submitted',
                color: 'bg-orange-500',
                ring: 'ring-orange-200'
            });
        }
        if (update.documentUrl) {
            timelineEvents.push({
                label: 'Supporting Document Uploaded',
                desc: `Financial proof attached for ${pType}`,
                time: update.dateSubmitted,
                status: 'Submitted',
                color: 'bg-purple-500',
                ring: 'ring-purple-200'
            });
        }
        if (update.verifiedAt && update.status === 'Approved') {
            timelineEvents.push({
                label: 'Admin Approved',
                desc: `Financials verified by Admin for ${pType}`,
                time: update.verifiedAt,
                status: 'Approved',
                color: 'bg-emerald-500',
                ring: 'ring-emerald-200'
            });
        }
    });
    timelineEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Header */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-16">
                <div className="container mx-auto px-6 max-w-5xl">
                    <ScrollReveal y={10}>
                        <Link href="/investors/search" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-8 transition-colors">
                            <ArrowLeft className="size-4" /> Back to Search
                        </Link>
                    </ScrollReveal>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <ScrollReveal className="flex items-center gap-6" delay={0.05}>
                            <div className="size-24 rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center shadow-xl">
                                <span className="text-4xl font-bold font-outfit text-slate-600">{startup.name.charAt(0)}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-4xl font-bold font-outfit text-slate-900">{startup.name}</h1>
                                    <span className="px-3 py-1 bg-emerald-900/30 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="size-3" /> {startup.isStudent ? "Incubation Idea" : "KYC Verified"}
                                    </span>
                                </div>
                                <div className="flex items-center flex-wrap gap-4 text-sm text-slate-500 font-medium mt-3">
                                    <span className="flex items-center gap-1"><Factory className="size-4 text-slate-400" /> {startup.sector} • {startup.businessModel}</span>
                                    <span className="flex items-center gap-1 text-zinc-300">|</span>
                                    <span className="flex items-center gap-1"><AlertTriangle className={`size-4 ${startup.risk === 'Low' ? 'text-emerald-600' : 'text-yellow-500'}`} /> {startup.risk} Risk Profile</span>
                                    <span className="flex items-center gap-1 text-zinc-300">|</span>
                                    <span className="flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full"><Users className="size-4" /> No. of Investors: {startup.investorCount || 0}</span>
                                </div>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.1} y={12}>
                            <Link href={`/messages?startupId=${startup._id?.toString() || idValue}&name=${encodeURIComponent(startup.name)}`} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_-3px_rgba(163,230,53,0.3)] flex items-center gap-2 w-full md:w-auto justify-center">
                                <MessageSquare className="size-5" /> Open Deal Room
                            </Link>
                        </ScrollReveal>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-5xl mt-8 grid md:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Pitch Section */}
                    <ScrollReveal>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-4 flex items-center gap-2">
                            <Presentation className="size-5 text-indigo-400" /> Executive Standard Pitch
                        </h2>
                        <p className="text-slate-500 leading-relaxed font-inter">{startup.desc}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                            {Array.isArray(startup.videos) && startup.videos.map((v: unknown, idx: number) => {
                                const vid = v as Record<string, string>;
                                return (
                                <div key={idx} className="aspect-video bg-white border border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden group shadow-lg">
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
                                            onClick={() => {
                                                if (vid.url) {
                                                    setPlayingVideoIdx(idx);
                                                } else {
                                                    console.warn("No video URL is currently provided for this pitch.");
                                                }
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 z-10 transition-opacity">
                                                <h3 className="text-white font-bold text-sm leading-tight">{vid.title}</h3>
                                                {idx === 0 && <p className="text-slate-500 text-[10px] mt-1">Exclusive Verified Pitch</p>}
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                                <div className="size-12 rounded-full bg-white/20 group-hover:bg-emerald-600/80 backdrop-blur-md flex items-center justify-center transition-all group-hover:scale-110">
                                                    <div className="size-0 border-y-[8px] border-y-transparent border-l-[14px] border-l-white group-hover:border-l-zinc-950 ml-1"></div>
                                                </div>
                                            </div>
                                            <img src={vid.thumb} alt={vid.title} className="absolute inset-0 size-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 transition-opacity duration-500 delay-75 pointer-events-none" />
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
                        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 space-y-8">
                            {/* Cumulative Summary */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cumulative Revenue</p>
                                    <p className="text-3xl font-bold font-mono text-emerald-600">₹{totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cumulative Profit</p>
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><LineChart className="size-4 text-emerald-600" /> Cumulative Revenue Growth</h3>
                                <div className="text-right">
                                    <span className="text-emerald-600 font-mono text-sm font-bold block">Max: ₹{revChart.max}</span>
                                </div>
                            </div>
                            <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <svg className="size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d={revChart.area} fill="url(#revGradient)" />
                                    <path d={revChart.path} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    
                                    {hoverIdx !== null && hoverType === "rev" && cumulativeUpdates[hoverIdx] && (
                                        <g>
                                            <line 
                                                x1={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} 
                                                y1="0" 
                                                x2={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} 
                                                y2="100" 
                                                stroke="#94a3b8" 
                                                strokeDasharray="2 2" 
                                                strokeWidth="0.5" 
                                            />
                                            <circle 
                                                cx={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} 
                                                cy={100 - ((cumulativeUpdates[hoverIdx].cumulativeRev - revChart.min) / (revChart.max - revChart.min || 1)) * 100} 
                                                r="2" 
                                                fill="#10b981" 
                                                stroke="white" 
                                                strokeWidth="0.5" 
                                            />
                                        </g>
                                    )}
                                </svg>
                                
                                {/* Tooltip */}
                                {hoverIdx !== null && hoverType === "rev" && cumulativeUpdates[hoverIdx] && (
                                    <div 
                                        className="absolute top-2 bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none border border-slate-700 w-48 z-10"
                                        style={{ 
                                            left: `${Math.min(80, Math.max(0, (hoverIdx / (cumulativeUpdates.length - 1)) * 100))}%`,
                                            transform: 'translateX(-50%)' 
                                        }}
                                    >
                                        <p className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-2">{cumulativeUpdates[hoverIdx].reportingType} • {cumulativeUpdates[hoverIdx].reportingDate}</p>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-400">Added Rev:</span>
                                            <span className="font-mono text-emerald-400 font-bold">₹{cumulativeUpdates[hoverIdx].revenue}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Total Rev:</span>
                                            <span className="font-mono text-white font-bold">₹{cumulativeUpdates[hoverIdx].cumulativeRev}</span>
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><TrendingUp className="size-4 text-emerald-600" /> Cumulative Net Profit</h3>
                                <div className="text-right">
                                    <span className="text-emerald-600 font-mono text-sm font-bold block">Peak: ₹{profitChart.max}</span>
                                </div>
                            </div>
                            <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <svg className="size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#a3e635" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d={profitChart.area} fill="url(#profitGradient)" />
                                    <path d={profitChart.path} fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    {profitChart.min < 0 && (
                                        <line x1="0" y1={`${100 - ((0 - profitChart.min) / (profitChart.max - profitChart.min || 1)) * 100}`} x2="100" y2={`${100 - ((0 - profitChart.min) / (profitChart.max - profitChart.min || 1)) * 100}`} stroke="#52525b" strokeDasharray="2 2" strokeWidth="1" />
                                    )}
                                    
                                    {hoverIdx !== null && hoverType === "profit" && cumulativeUpdates[hoverIdx] && (
                                        <g>
                                            <line 
                                                x1={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} 
                                                y1="0" 
                                                x2={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} 
                                                y2="100" 
                                                stroke="#94a3b8" 
                                                strokeDasharray="2 2" 
                                                strokeWidth="0.5" 
                                            />
                                            <circle 
                                                cx={(hoverIdx / (cumulativeUpdates.length - 1)) * 100 || 0} 
                                                cy={100 - ((cumulativeUpdates[hoverIdx].cumulativeProfit - profitChart.min) / (profitChart.max - profitChart.min || 1)) * 100} 
                                                r="2" 
                                                fill="#84cc16" 
                                                stroke="white" 
                                                strokeWidth="0.5" 
                                            />
                                        </g>
                                    )}
                                </svg>

                                {/* Tooltip */}
                                {hoverIdx !== null && hoverType === "profit" && cumulativeUpdates[hoverIdx] && (
                                    <div 
                                        className="absolute top-2 bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none border border-slate-700 w-48 z-10"
                                        style={{ 
                                            left: `${Math.min(80, Math.max(0, (hoverIdx / (cumulativeUpdates.length - 1)) * 100))}%`,
                                            transform: 'translateX(-50%)' 
                                        }}
                                    >
                                        <p className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-2">{cumulativeUpdates[hoverIdx].reportingType} • {cumulativeUpdates[hoverIdx].reportingDate}</p>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-400">Added Profit:</span>
                                            <span className={`font-mono font-bold ${Number(cumulativeUpdates[hoverIdx].profit) >= 0 ? 'text-lime-400' : 'text-red-400'}`}>₹{cumulativeUpdates[hoverIdx].profit}</span>
                                        </div>
                                        {cumulativeUpdates[hoverIdx].netLoss > 0 && (
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-400">Added Loss:</span>
                                                <span className="font-mono text-red-400 font-bold">₹{cumulativeUpdates[hoverIdx].netLoss}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Total Profit:</span>
                                            <span className="font-mono text-white font-bold">₹{cumulativeUpdates[hoverIdx].cumulativeProfit}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-6">
                            <h3 className="text-slate-900 font-bold text-lg mb-4">Unit Economics & ROI</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Proj. ROI</p>
                                    <p className="text-2xl font-bold text-emerald-600 font-mono">{startup.financials?.roi}%</p>
                                </div>
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">CAC</p>
                                    <p className="text-xl font-bold text-slate-600 font-mono">₹{startup.financials?.cac}</p>
                                </div>
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Est. LTV</p>
                                    <p className="text-xl font-bold text-slate-600 font-mono">₹{startup.financials?.ltv}</p>
                                </div>
                            </div>
                        </div>

                        {/* Activity Timeline Section */}
                        <div className="border-t border-slate-200 pt-6">
                            <h3 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2"><Clock className="size-4 text-indigo-500" /> Financial Activity Timeline</h3>
                            <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2">
                                {timelineEvents.slice(0, 10).map((event: any, idx: number) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className={`absolute top-1.5 -left-[5px] size-2 rounded-full ${event.color} border-2 border-white ring-1 ${event.ring}`}></div>
                                        <p className="text-sm font-semibold text-slate-800">{event.label}</p>
                                        <p className="text-xs text-slate-500">{event.desc}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className={`text-[10px] font-bold uppercase ${event.status === 'Approved' ? 'text-emerald-600' : 'text-slate-400'}`}>{event.status}</p>
                                            <span className="text-[10px] text-slate-400">• {formatRelativeTime(event.time)}</span>
                                        </div>
                                    </div>
                                ))}
                                {timelineEvents.length === 0 && (
                                    <p className="text-sm text-slate-400 italic pl-6">No approved financial activity yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    </ScrollReveal>
                    )}

                    {/* AI Analyst Chat Widget */}
                    <ScrollReveal delay={0.05}>
                        <div className="mt-8 flex flex-col h-[600px]">
                            <AIChat startupId={(startup._id?.toString() || idValue) as string} />
                        </div>
                    </ScrollReveal>
                </div>

                {/* Sidebar Data */}
                <div className="space-y-6">
                    <ScrollReveal y={12}>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4 flex items-center gap-2">
                            <TrendingUp className="size-5 text-emerald-600" /> Financial Ask
                        </h3>

                        <div className="space-y-4 mb-8">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Target Capital</p>
                                <p className="text-2xl font-bold font-mono text-slate-800">₹ {(startup.requested / 100000).toFixed(1)} Lakhs</p>
                            </div>
                            <div className="w-full h-px bg-slate-200"></div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Equity Offered</p>
                                <p className="text-xl font-bold text-emerald-600">{startup.equity}% Common Stock</p>
                            </div>
                            <div className="w-full h-px bg-slate-200"></div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Implied Valuation</p>
                                <p className="text-lg font-mono text-slate-500">
                                    {Number(startup.equity) > 0 
                                        ? `₹ ${((startup.requested / Number(startup.equity)) * 100 / 10000000).toFixed(2)} Cr` 
                                        : "N/A"}
                                </p>
                        </div>

                        {!startup.isStudent && (
                            <>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-4 flex items-center gap-2">
                                    <Briefcase className="size-5 text-emerald-600" /> Current Metrics
                                </h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Latest Revenue</span>
                                <div className="text-right flex items-center gap-2">
                                    {revGrowth !== 0 && (
                                        <span className={`text-[10px] font-bold ${revGrowth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {revGrowth > 0 ? '↑' : '↓'} {Math.abs(revGrowth).toFixed(1)}%
                                        </span>
                                    )}
                                    <span className="font-mono text-emerald-600 font-medium">₹ {approvedUpdates.length > 0 ? (approvedUpdates[approvedUpdates.length - 1].revenue / 1000).toFixed(0) : (startup.revenue / 1000).toFixed(0)}K</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Latest Profit</span>
                                <div className="text-right flex items-center gap-2">
                                    {profitGrowth !== 0 && (
                                        <span className={`text-[10px] font-bold ${profitGrowth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {profitGrowth > 0 ? '↑' : '↓'} {Math.abs(profitGrowth).toFixed(1)}%
                                        </span>
                                    )}
                                    <span className={`font-mono font-medium ${approvedUpdates.length > 0 && Number(approvedUpdates[approvedUpdates.length - 1].profit) < 0 ? 'text-red-400' : 'text-slate-600'}`}>₹ {approvedUpdates.length > 0 ? (approvedUpdates[approvedUpdates.length - 1].profit / 1000).toFixed(0) : 0}K</span>
                                </div>
                            </div>
                            {approvedUpdates.length > 0 && approvedUpdates[approvedUpdates.length - 1].netLoss && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Latest Loss</span>
                                    <span className="font-mono text-red-500 font-medium">₹ {(approvedUpdates[approvedUpdates.length - 1].netLoss / 1000).toFixed(0)}K</span>
                                </div>
                            )}
                            {approvedUpdates.length > 0 && (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
                                    <p className="text-xs text-emerald-600 font-bold uppercase mb-2 flex items-center gap-1"><CheckCircle2 className="size-4" /> Financials Verified</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="text-slate-400">Last Verified Date</p>
                                            <p className="font-medium text-slate-700">{formatRelativeTime(approvedUpdates[approvedUpdates.length - 1].verifiedAt || approvedUpdates[approvedUpdates.length - 1].dateSubmitted)}</p>
                                        </div>
                                        <div className="col-span-1">
                                            <p className="text-slate-400">Verified By</p>
                                            <p className="font-medium text-slate-700 truncate" title="InVolution Verification Team">InVolution Verification Team</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Reporting Type</p>
                                            <p className="font-medium text-slate-700">{approvedUpdates[approvedUpdates.length - 1].reportingType || 'Monthly'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Reporting Date</p>
                                            <p className="font-medium text-slate-700">{approvedUpdates[approvedUpdates.length - 1].reportingDate || approvedUpdates[approvedUpdates.length - 1].monthYear}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Last Approved Revenue</p>
                                            <p className="font-medium text-emerald-600 font-mono">₹{approvedUpdates[approvedUpdates.length - 1].revenue}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Last Approved Profit</p>
                                            <p className="font-medium text-emerald-600 font-mono">₹{approvedUpdates[approvedUpdates.length - 1].profit}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                            </>
                        )}

                        {activityStatus && (
                            <>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-4 flex items-center gap-2">
                                    <Clock className="size-5 text-emerald-600" /> Founder Activity
                                </h3>
                                <div className="mb-8 p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-full flex items-center justify-center border ${activityStatus.bg} ${activityStatus.border}`}>
                                            <Activity className={`size-5 ${activityStatus.color}`} />
                                        </div>
                                        <div>
                                            <p className={`font-bold ${activityStatus.color}`}>{activityStatus.status}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {activityStatus.isStale 
                                                    ? 'No verified update data available' 
                                                    : `✓ Updated ${activityStatus.timeStr}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {activityStatus.isStale && (
                                    <div className="mb-8 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium flex gap-2">
                                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                                        Financial information has not been updated for more than 32 days.
                                    </div>
                                )}
                            </>
                        )}

                        {/* AI Intelligence Suite */}
                        <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-4 flex items-center gap-2">
                            <BrainCircuit className="size-5 text-indigo-400" /> AI Intelligence Suite
                        </h3>
                        <div className="space-y-2">
                            <Link href={`/startups/${idValue}/due-diligence`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 transition-colors group">
                                <BrainCircuit className="size-4 text-indigo-400 shrink-0 group-hover:text-emerald-600 transition-colors" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">AI Due Diligence</p>
                                    <p className="text-[10px] text-slate-400">Full financial + risk analysis</p>
                                </div>
                            </Link>
                            <Link href={`/startups/${idValue}/health`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 transition-colors group">
                                <HeartPulse className="size-4 text-emerald-600 shrink-0 group-hover:text-emerald-600 transition-colors" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Health Monitor</p>
                                    <p className="text-[10px] text-slate-400">Live operational vitals</p>
                                </div>
                            </Link>
                            <Link href={`/startups/${idValue}/trust`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 transition-colors group">
                                <ShieldCheck className="size-4 text-blue-400 shrink-0 group-hover:text-emerald-600 transition-colors" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Trust Score</p>
                                    <p className="text-[10px] text-slate-400">Verified reputation rating</p>
                                </div>
                            </Link>
                            <Link href={`/startups/${idValue}/compliance`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 transition-colors group">
                                <Scale className="size-4 text-purple-400 shrink-0 group-hover:text-emerald-600 transition-colors" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Legal Compliance</p>
                                    <p className="text-[10px] text-slate-400">Regulatory status check</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                    </ScrollReveal>
                </div>

            </div>
        </div>
    );
}
