"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, TrendingUp, ShieldCheck, Activity, BrainCircuit, Target, Lightbulb, Zap, Rocket, Star, ChevronRight, FileText } from "lucide-react";

interface AIAnalysisProps {
    type: 'startup' | 'incubation';
    score: number;
    executiveSummary: string;
    strengths: string[];
    improvements: string[];
    risks: string[];
    recommendation: string;
    confidence: string;
    scoreBreakdown?: Record<string, number>;
    stage?: string;
}

export function AIAnalysisCard({
    type,
    score,
    executiveSummary,
    strengths,
    improvements,
    risks,
    recommendation,
    confidence,
    scoreBreakdown,
    stage
}: AIAnalysisProps) {
    
    // 1. Determine Score Colors & Labels
    let ringColor = "text-red-500";
    let strokeColor = "#ef4444";
    let label = "Poor";
    let textColor = "text-red-400";
    let bgColor = "bg-red-500/10";
    let riskLevel = "High";

    if (score >= 90) {
        ringColor = "text-emerald-500";
        strokeColor = "#10b981"; // Dark Green/Emerald
        textColor = "text-emerald-500";
        bgColor = "bg-emerald-500/10";
        label = type === 'startup' ? "Exceptional Startup" : "Exceptional Potential";
        riskLevel = "Low";
    } else if (score >= 80) {
        ringColor = "text-emerald-400";
        strokeColor = "#34d399"; // Green
        textColor = "text-emerald-400";
        bgColor = "bg-emerald-400/10";
        label = type === 'startup' ? "Strong Startup" : "Strong Potential";
        riskLevel = "Low";
    } else if (score >= 70) {
        ringColor = "text-yellow-400";
        strokeColor = "#facc15"; // Yellow
        textColor = "text-yellow-400";
        bgColor = "bg-yellow-400/10";
        label = type === 'startup' ? "Good Startup" : "Good Potential";
        riskLevel = "Medium";
    } else if (score >= 60) {
        ringColor = "text-orange-400";
        strokeColor = "#fb923c"; // Orange
        textColor = "text-orange-400";
        bgColor = "bg-orange-400/10";
        label = "Average";
        riskLevel = "Medium";
    } else if (score >= 40) {
        ringColor = "text-orange-500";
        strokeColor = "#f97316"; 
        textColor = "text-orange-500";
        bgColor = "bg-orange-500/10";
        label = "Weak";
        riskLevel = "High";
    }

    if (risks?.length > 2) riskLevel = "High";

    const circumference = 2 * Math.PI * 54; // r=54
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // 2. Score Breakdown Mapping
    const startupMaxScores: Record<string, { label: string, max: number, icon: any }> = {
        founderAndTeam: { label: "Founder & Team", max: 15, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
        businessIdea: { label: "Business Idea", max: 20, icon: <Lightbulb className="w-4 h-4 text-yellow-400" /> },
        marketOpportunity: { label: "Market Opportunity", max: 15, icon: <TrendingUp className="w-4 h-4 text-purple-400" /> },
        businessModel: { label: "Business Model", max: 15, icon: <Target className="w-4 h-4 text-blue-400" /> },
        financialHealth: { label: "Financial Health", max: 15, icon: <Activity className="w-4 h-4 text-orange-400" /> },
        growthPotential: { label: "Growth Potential", max: 10, icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
        businessVerification: { label: "Business Verification", max: 5, icon: <ShieldCheck className="w-4 h-4 text-blue-400" /> },
        riskAssessment: { label: "Risk Assessment", max: 5, icon: <AlertTriangle className="w-4 h-4 text-red-400" /> }
    };

    const incubationMaxScores: Record<string, { label: string, max: number, icon: any }> = {
        founderPotential: { label: "Founder Potential", max: 15, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
        innovation: { label: "Innovation", max: 20, icon: <Lightbulb className="w-4 h-4 text-yellow-400" /> },
        problemSolutionFit: { label: "Problem-Solution Fit", max: 20, icon: <Target className="w-4 h-4 text-purple-400" /> },
        technicalFeasibility: { label: "Technical Feasibility", max: 15, icon: <Zap className="w-4 h-4 text-blue-400" /> },
        prototypeReadiness: { label: "Prototype Readiness", max: 10, icon: <Activity className="w-4 h-4 text-blue-400" /> },
        marketPotential: { label: "Market Potential", max: 10, icon: <TrendingUp className="w-4 h-4 text-orange-400" /> },
        incubationReadiness: { label: "Incubation Readiness", max: 5, icon: <Rocket className="w-4 h-4 text-emerald-400" /> },
        riskAssessment: { label: "Risk Assessment", max: 5, icon: <AlertTriangle className="w-4 h-4 text-red-400" /> }
    };

    const breakdownMap = type === 'startup' ? startupMaxScores : incubationMaxScores;

    return (
        <div className="w-full bg-[#0a0f1c] rounded-[24px] p-6 text-slate-100 font-sans shadow-2xl border border-slate-800/60 mb-12">
            
            {/* Top Header Section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-indigo-400 fill-indigo-400" />
                        <h2 className="text-xl font-bold text-white tracking-wide">
                            {type === 'startup' ? 'AI Startup Analysis' : 'AI Student Analysis'}
                        </h2>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                        {type === 'startup' 
                            ? "Intelligent evaluation of your startup's investment potential" 
                            : "AI-powered evaluation of student startup idea and incubation potential"}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                    <FileText className="w-3.5 h-3.5" />
                    Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </div>

            {/* Top Cards: Score & Executive Summary */}
            <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-6">
                
                {/* Score Card */}
                <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute top-4 left-4">
                        <Star className="w-5 h-5 text-indigo-500 opacity-50" />
                    </div>
                    
                    <div className="relative flex items-center justify-center w-40 h-40 mb-4 mt-2">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                            <circle 
                                cx="80" cy="80" r="54" stroke={strokeColor} strokeWidth="8" fill="transparent" 
                                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                                className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                            <span className="text-5xl font-black text-white tracking-tighter">{score || 0}</span>
                            <span className="text-sm font-bold text-slate-400 mt-1">/100</span>
                        </div>
                    </div>
                    
                    <div className={`px-4 py-1.5 rounded-full border border-current text-sm font-bold shadow-sm ${textColor} ${bgColor}`}>
                        {label}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-3 text-center">
                        {type === 'startup' ? 'Investment Readiness Score' : 'Incubation Readiness Score'}
                    </p>
                </div>

                {/* Executive Summary Card */}
                <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-400" /> Executive Summary
                        </h3>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            {executiveSummary || "Analysis pending or unavailable for this profile."}
                        </p>
                    </div>

                    {/* Mini Badges row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        
                        {type === 'startup' ? (
                            <>
                                <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-400">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Investment Readiness
                                    </div>
                                    <span className={`text-sm font-bold ${score >= 80 ? 'text-emerald-400' : (score >= 60 ? 'text-yellow-400' : 'text-orange-400')}`}>
                                        {score >= 80 ? 'Ready' : (score >= 60 ? 'Nearly Ready' : 'Not Ready')}
                                    </span>
                                </div>
                                <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-400">
                                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> Risk Level
                                    </div>
                                    <span className={`text-sm font-bold ${riskLevel === 'Low' ? 'text-emerald-400' : (riskLevel === 'Medium' ? 'text-yellow-400' : 'text-orange-400')}`}>{riskLevel}</span>
                                </div>
                                <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-400">
                                        <Activity className="w-3.5 h-3.5 text-blue-500" /> Business Quality
                                    </div>
                                    <span className={`text-sm font-bold ${score >= 70 ? 'text-blue-400' : 'text-slate-400'}`}>{score >= 80 ? 'Good' : (score >= 60 ? 'Average' : 'Poor')}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-400">
                                        <Rocket className="w-3.5 h-3.5 text-emerald-500" /> Incubation Readiness
                                    </div>
                                    <span className={`text-sm font-bold ${score >= 60 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                        {score >= 60 ? 'Suitable' : 'Not Suitable'}
                                    </span>
                                </div>
                                <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-400">
                                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Idea Stage
                                    </div>
                                    <span className="text-sm font-bold text-yellow-500">{stage || 'Idea Stage'}</span>
                                </div>
                                <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-400">
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Risk Level
                                    </div>
                                    <span className={`text-sm font-bold ${riskLevel === 'Low' ? 'text-emerald-400' : (riskLevel === 'Medium' ? 'text-yellow-400' : 'text-orange-400')}`}>{riskLevel}</span>
                                </div>
                            </>
                        )}

                        <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-400">
                                <Target className="w-3.5 h-3.5 text-purple-500" /> Confidence Level
                            </div>
                            <span className="text-sm font-bold text-purple-400">{confidence || 'Medium'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Score Breakdown Section */}
            {scoreBreakdown && Object.keys(scoreBreakdown).length > 0 && (
                <div className="mb-6">
                    <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-400" /> Score Breakdown
                    </h3>
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-5 bg-[#111827] border border-slate-800 rounded-3xl p-6 md:p-8">
                        {Object.entries(breakdownMap).map(([key, config]) => {
                            const val = scoreBreakdown[key] || 0;
                            const percent = (val / config.max) * 100;
                            // Progress bar color based on percentage
                            let pbColor = "bg-red-500";
                            if (percent >= 80) pbColor = "bg-emerald-500";
                            else if (percent >= 60) pbColor = "bg-yellow-500";
                            else if (percent >= 40) pbColor = "bg-orange-500";

                            return (
                                <div key={key} className="flex items-center justify-between gap-4">
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
                </div>
            )}

            {/* Bottom Grid: Strengths, Areas to Improve, Risks, Recommendation */}
            <div className="grid md:grid-cols-2 gap-6">
                
                {/* Strengths */}
                <div className="bg-[#062417] border border-[#064e3b]/60 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 opacity-10">
                        <ShieldCheck className="w-32 h-32 text-emerald-500" />
                    </div>
                    <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 fill-emerald-400" /> Top Strengths
                    </h3>
                    <ul className="space-y-3 relative z-10">
                        {strengths?.slice(0, 5).map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-emerald-100/90 leading-relaxed">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Improvement Areas */}
                <div className="bg-[#2c1c0a] border border-[#78350f]/60 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 opacity-10">
                        <Target className="w-32 h-32 text-orange-500" />
                    </div>
                    <h3 className="text-base font-bold text-orange-400 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Areas to Improve
                    </h3>
                    <ul className="space-y-3 relative z-10">
                        {improvements?.slice(0, 5).map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-orange-100/90 leading-relaxed">
                                <div className="w-4 h-4 rounded-full border border-orange-500/50 flex items-center justify-center mt-0.5 shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                </div>
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Risks */}
                <div className="bg-[#2a0e12] border border-[#7f1d1d]/60 rounded-3xl p-6 shadow-inner">
                    <h3 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 fill-red-400/20" /> Top Risks
                    </h3>
                    <div className="space-y-3">
                        {risks?.slice(0, 3).map((r, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-[#3f0f15]/50 border border-red-900/40 rounded-xl p-3">
                                <Activity className="w-4 h-4 text-red-500 shrink-0" />
                                <span className="text-sm text-red-100/90 leading-snug">{r}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-[#1e1b4b]/60 border border-[#4c1d95]/60 rounded-3xl p-6 shadow-inner flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-indigo-300 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-indigo-400" /> {type === 'startup' ? 'AI Recommendation' : 'Incubation Recommendation'}
                        </h3>
                        <div className="flex gap-4 items-start">
                            <div className="w-16 h-16 rounded-full bg-indigo-900/50 border-[4px] border-indigo-700 flex items-center justify-center shrink-0 shadow-lg">
                                <Star className="w-8 h-8 text-indigo-400 fill-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-indigo-300 mb-1">{recommendation || (score >= 80 ? 'Investment Ready' : 'Needs Improvement')}</h4>
                                <p className="text-sm text-indigo-100/80 leading-relaxed">
                                    Based on the strengths and risks identified, our AI engine suggests this overall rating.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex">
                        <button className="flex items-center gap-2 text-xs font-bold text-indigo-300 hover:text-white transition-colors bg-indigo-950/50 hover:bg-indigo-900 px-4 py-2 rounded-xl border border-indigo-800/50 w-full justify-between">
                            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> View Detailed Report</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Footer Disclaimer */}
            <div className="mt-8 flex items-start gap-3 bg-[#111827] border border-slate-800 rounded-xl p-4">
                <div className="w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold font-serif italic">i</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                    This analysis is AI-generated based on the information provided{type === 'startup' ? ' by the startup' : ' by the student'}. {type === 'startup' ? 'Investors should conduct their own due diligence before making investment decisions.' : 'It is intended to support incubation decision making and not a final verdict. Further evaluation by mentors is recommended.'}
                </p>
            </div>
            
        </div>
    );
}
