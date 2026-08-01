"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, TrendingUp, ShieldCheck, Activity } from "lucide-react";

interface AIAnalysisProps {
    type: 'startup' | 'incubation';
    score: number;
    executiveSummary: string;
    strengths: string[];
    weaknesses: string[];
    businessRisks: string[];
    improvementSuggestions: string[];
    investmentReadiness: string;
}

export function AIAnalysisCard({
    type,
    score,
    executiveSummary,
    strengths,
    weaknesses,
    businessRisks,
    improvementSuggestions,
    investmentReadiness
}: AIAnalysisProps) {
    // Determine color based on score
    let colorClass = "text-red-500";
    let borderClass = "border-red-500";
    let bgClass = "bg-red-500/10";
    let label = "Poor";

    if (score >= 90) {
        colorClass = "text-emerald-400";
        borderClass = "border-emerald-400";
        bgClass = "bg-emerald-400/10";
        label = "Excellent";
    } else if (score >= 75) {
        colorClass = "text-emerald-400";
        borderClass = "border-emerald-400";
        bgClass = "bg-emerald-400/10";
        label = "Good";
    } else if (score >= 60) {
        colorClass = "text-yellow-400";
        borderClass = "border-yellow-400";
        bgClass = "bg-yellow-400/10";
        label = "Average";
    } else if (score >= 40) {
        colorClass = "text-orange-400";
        borderClass = "border-orange-400";
        bgClass = "bg-orange-400/10";
        label = "Needs Improvement";
    }

    return (
        <div className="bg-[#0f172a] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800 w-full mb-8">
            {/* Background Icon Watermark */}
            <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] pointer-events-none">
                {type === 'startup' ? (
                    <Activity className="w-64 h-64" />
                ) : (
                    <Activity className="w-64 h-64" />
                )}
            </div>

            <div className="flex items-center gap-2 mb-8 relative z-10">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-100">
                    {type === 'startup' ? 'AI Startup Analysis' : 'AI Student Analysis'}
                </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12 border-b border-slate-800 pb-8 relative z-10">
                {/* Score Circle */}
                <div className="flex flex-col items-center">
                    <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-[6px] ${borderClass} mb-3`}>
                        <span className="text-4xl font-extrabold">{score || 0}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        AI Match Score
                    </span>
                    <span className={`text-sm font-medium mt-1 ${colorClass}`}>{label}</span>
                </div>

                {/* Primary Highlights - Mapping new fields to the screenshot style */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full text-center md:text-left">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Investment Readiness</p>
                        <p className={`font-semibold flex items-center justify-center md:justify-start gap-1.5 ${colorClass}`}>
                            <CheckCircle2 className="w-4 h-4" />
                            {score >= 75 ? 'Ready' : (score >= 50 ? 'Promising' : 'Not Ready')}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Business Risks</p>
                        <p className={`font-semibold flex items-center justify-center md:justify-start gap-1.5 ${businessRisks.length > 2 ? 'text-orange-400' : 'text-emerald-400'}`}>
                            <AlertTriangle className="w-4 h-4" />
                            {businessRisks.length > 2 ? 'High' : 'Low'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Strengths</p>
                        <p className="font-semibold flex items-center justify-center md:justify-start gap-1.5 text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                            {strengths.length} Found
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Improvement Areas</p>
                        <p className="font-semibold flex items-center justify-center md:justify-start gap-1.5 text-indigo-400">
                            <TrendingUp className="w-4 h-4" />
                            {improvementSuggestions.length} Needs
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed AI Recommendation / Executive Summary */}
            <div className="mt-8 relative z-10">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">AI Recommendation & Executive Summary</p>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {executiveSummary || "Analysis pending or unavailable."}
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Strengths
                        </p>
                        <ul className="space-y-2">
                            {strengths.map((str, idx) => (
                                <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5">•</span> {str}
                                </li>
                            ))}
                            {strengths.length === 0 && <li className="text-sm text-slate-500">None identified.</li>}
                        </ul>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Risks & Weaknesses
                        </p>
                        <ul className="space-y-2">
                            {businessRisks.map((risk, idx) => (
                                <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-orange-500 mt-0.5">•</span> {risk}
                                </li>
                            ))}
                            {weaknesses.map((weak, idx) => (
                                <li key={`w-${idx}`} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-yellow-500 mt-0.5">•</span> {weak}
                                </li>
                            ))}
                            {(businessRisks.length === 0 && weaknesses.length === 0) && <li className="text-sm text-slate-500">None identified.</li>}
                        </ul>
                    </div>
                </div>

                {investmentReadiness && (
                    <div className="mt-6 inline-block">
                        <div className={`px-4 py-2 rounded-lg text-xs font-bold border ${borderClass} ${bgClass} ${colorClass}`}>
                            {investmentReadiness}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
