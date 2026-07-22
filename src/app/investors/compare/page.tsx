"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, ShieldCheck, TrendingUp, CheckCircle2, Factory, Scale } from "lucide-react";
import { formatRelativeTime } from "@/utils/timeHelper";

export default function CompareStartups() {
    const [compareList, setCompareList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const formatCurrency = (val: number) => {
        if (val === undefined || val === null || val === 0) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toLocaleString()}`;
    };

    useEffect(() => {
        const fetchStartups = async () => {
            try {
                const c = localStorage.getItem('inv_compare_list');
                const ids = c ? JSON.parse(c) : [];

                if (ids.length > 0) {
                    const res = await fetch('/api/startups?type=regular');
                    const json = await res.json();
                    if (json.success) {
                        const filtered = json.data.filter((s: any) => ids.includes(s._id || s.id));
                        setCompareList(filtered);
                    }
                }
            } catch (err) {
                console.error("Failed to load startups for comparison", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStartups();
    }, []);

    if (isLoading) {
        return (
            <div className="container mx-auto px-6 py-24 max-w-7xl min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
                <Scale className="size-12 animate-pulse text-emerald-500 mb-4" />
                <h2 className="text-xl font-outfit text-slate-800">Preparing Comparison...</h2>
            </div>
        );
    }

    if (compareList.length === 0) {
        return (
            <div className="container mx-auto px-6 py-24 max-w-7xl min-h-[calc(100vh-80px)] text-center">
                <Scale className="size-16 text-slate-300 mx-auto mb-6" />
                <h1 className="text-3xl font-bold font-outfit text-slate-900 mb-4">No Startups Selected</h1>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">You haven't selected any startups to compare. Head over to the Discover page and select up to 4 startups.</p>
                <Link href="/investors/search" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2">
                    <ArrowLeft className="size-4" /> Go to Discover
                </Link>
            </div>
        );
    }

    // Prepare data rows and highlight logic
    const extractMetric = (s: any, metric: string) => {
        const updates = getApprovedUpdates(s);
        const latestUpdate = updates.length > 0 ? updates[updates.length - 1] : null;
        switch (metric) {
            case 'asking': return s.requested || 0;
            case 'equity': return Number(s.equity) || 0;
            case 'valuation': return Number(s.equity) > 0 ? s.requested / (Number(s.equity) / 100) : 0;
            case 'revenue': return latestUpdate ? Number(latestUpdate.revenue) : 0;
            case 'profit': return latestUpdate ? Number(latestUpdate.profit) : 0;
            case 'loss': return latestUpdate && latestUpdate.netLoss > 0 ? Number(latestUpdate.netLoss) : 0;
            case 'growth': return getGrowth(s);
            case 'health': return calculateHealth(s);
            case 'trust': return getTrust(s);
            case 'ai': return s.score || 0;
            default: return 0;
        }
    };

    const getBestValue = (metric: string) => {
        const values = compareList.map(s => extractMetric(s, metric));
        if (metric === 'asking' || metric === 'valuation' || metric === 'loss') return Math.min(...values.filter(v => v > 0).length ? values.filter(v => v > 0) : [0]); // Lower is better
        return Math.max(...values); // Higher is better
    };

    const isBest = (s: any, metric: string) => {
        const val = extractMetric(s, metric);
        if (val === 0 && (metric === 'revenue' || metric === 'profit')) return false; // Don't highlight 0 as best if everyone is 0
        const best = getBestValue(metric);
        return val === best && best !== 0; // If best is 0, don't highlight
    };

    const removeStartup = (id: string) => {
        const next = compareList.filter(s => (s._id || s.id) !== id);
        setCompareList(next);
        localStorage.setItem('inv_compare_list', JSON.stringify(next.map(s => s._id || s.id)));
    };

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl min-h-screen bg-slate-50/30">
            <div className="mb-10 animate-in fade-in slide-in-from-top-4">
                <Link href="/investors/search" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors mb-6">
                    <ArrowLeft className="size-4" /> Back to Discover
                </Link>
                <h1 className="text-3xl md:text-4xl font-outfit font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <Scale className="size-8 text-emerald-500" /> Compare Startups
                </h1>
                <p className="text-slate-500 font-inter">Side-by-side analysis of key metrics, financials, and AI scores.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8">
                <div className="overflow-x-auto custom-scrollbar pb-6">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr>
                                <th className="p-6 border-b border-slate-200 w-64 bg-slate-50/50"></th>
                                {compareList.map((startup) => (
                                    <th key={startup._id || startup.id} className="p-6 border-b border-slate-200 bg-slate-50/50 relative min-w-[280px]">
                                        <button onClick={() => removeStartup(startup._id || startup.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-xs font-bold transition-colors">
                                            Remove
                                        </button>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold font-outfit text-lg shrink-0">
                                                {startup.name?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg truncate">{startup.name}</h3>
                                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{startup.sector || 'Various'}</span>
                                            </div>
                                        </div>
                                        <Link href={`/startups/${startup._id || startup.id}`} className="block w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors">
                                            View Profile
                                        </Link>
                                    </th>
                                ))}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => (
                                    <th key={`empty-${i}`} className="p-6 border-b border-slate-200 bg-slate-50/50 min-w-[280px]">
                                        <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                                            <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                <span className="text-xl text-slate-300 font-bold">+</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-400">Add Startup</p>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* --- General Info --- */}
                            <tr>
                                <td colSpan={4} className="p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest">Business Overview</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Business Model</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4 text-sm font-medium text-slate-900">{s.businessModel || 'N/A'}</td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Stage</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4 text-sm font-medium text-slate-900">{s.stage || 'N/A'}</td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>

                            {/* --- Funding Ask --- */}
                            <tr>
                                <td colSpan={4} className="p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200">Investment Metrics</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Asking Amount</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-mono font-bold ${isBest(s, 'asking') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-900'}`}>{formatCurrency(extractMetric(s, 'asking'))}</span>
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Equity Offered</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isBest(s, 'equity') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-900'}`}>{extractMetric(s, 'equity')}%</span>
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Implied Valuation</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-mono font-bold ${isBest(s, 'valuation') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-900'}`}>{formatCurrency(extractMetric(s, 'valuation'))}</span>
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>

                            {/* --- Financials --- */}
                            <tr>
                                <td colSpan={4} className="p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200">Financial Snapshot</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Monthly Revenue</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-mono font-bold ${isBest(s, 'revenue') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-900'}`}>{extractMetric(s, 'revenue') > 0 ? formatCurrency(extractMetric(s, 'revenue')) : 'N/A'}</span>
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Monthly Profit / Loss</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4 text-sm font-mono font-bold">
                                    {extractMetric(s, 'profit') > 0 ? (
                                        <span className={`px-3 py-1 rounded-lg ${isBest(s, 'profit') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-blue-600'}`}>+{formatCurrency(extractMetric(s, 'profit'))}</span>
                                    ) : extractMetric(s, 'loss') > 0 ? (
                                        <span className={`px-3 py-1 rounded-lg ${isBest(s, 'loss') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-red-500'}`}>-{formatCurrency(extractMetric(s, 'loss'))}</span>
                                    ) : 'N/A'}
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Revenue Growth</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    {extractMetric(s, 'growth') !== 0 ? (
                                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isBest(s, 'growth') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : extractMetric(s, 'growth') > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {extractMetric(s, 'growth') > 0 ? '↑' : '↓'} {Math.abs(extractMetric(s, 'growth')).toFixed(1)}%
                                        </span>
                                    ) : <span className="text-slate-400">N/A</span>}
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>

                            {/* --- Scores --- */}
                            <tr>
                                <td colSpan={4} className="p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200">Scoring & Trust</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">AI Match Score</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center w-max gap-1.5 ${isBest(s, 'ai') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-900'}`}><BrainCircuit className="size-4"/> {extractMetric(s, 'ai')}</span>
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Business Health Score</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center w-max gap-1.5 ${isBest(s, 'health') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-900'}`}><TrendingUp className="size-4"/> {extractMetric(s, 'health')}</span>
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Trust Score</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center w-max gap-1.5 ${isBest(s, 'trust') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-900'}`}><ShieldCheck className="size-4"/> {extractMetric(s, 'trust')}</span>
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>

                            {/* --- Verification --- */}
                            <tr>
                                <td colSpan={4} className="p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200">Verification & Activity</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">KYC Status</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    {(s.credibility?.gstRegistered || s.credibility?.panVerified) ? 
                                        <span className="text-emerald-600 font-bold text-sm flex items-center gap-1"><CheckCircle2 className="size-4"/> Verified</span> : 
                                        <span className="text-slate-400 font-medium text-sm flex items-center gap-1">Pending</span>}
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Financial Verification</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4">
                                    {getApprovedUpdates(s).length > 0 ? 
                                        <span className="text-indigo-600 font-bold text-sm flex items-center gap-1"><ShieldCheck className="size-4"/> Verified by InVolution</span> : 
                                        <span className="text-slate-400 font-medium text-sm flex items-center gap-1">Not Verified</span>}
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Founder Activity</td>
                                {compareList.map(s => <td key={s._id || s.id} className="p-4 text-sm font-medium text-slate-900">
                                    {getApprovedUpdates(s).length > 2 ? 'High (Regular Updates)' : getApprovedUpdates(s).length > 0 ? 'Moderate' : 'Low'}
                                </td>)}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 text-sm font-medium text-slate-500">Last Financial Update</td>
                                {compareList.map(s => {
                                    const u = getApprovedUpdates(s);
                                    return (
                                    <td key={s._id || s.id} className="p-4 text-sm font-medium text-slate-900">
                                        {u.length > 0 ? formatRelativeTime(u[u.length - 1].dateSubmitted) : 'N/A'}
                                    </td>)
                                })}
                                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => <td key={`empty-${i}`}></td>)}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
