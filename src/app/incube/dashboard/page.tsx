"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle, CheckCircle2, AlertCircle, FileText, Activity, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function IncubeDashboard() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: appData, error } = await supabase
                .from('incubation_applications')
                .select('*')
                .eq('owner_email', user.email)
                .maybeSingle();

            if (!error && appData) {
                setApplication(appData);
            }
            setLoading(false);
        };

        fetchDashboardData();
    }, [supabase, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="size-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8faf9] py-12">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 font-outfit">Student Dashboard</h1>
                    <p className="text-slate-500 mt-2">Manage your Incubation application and monitor your progress.</p>
                </div>

                {!application ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="size-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="size-10 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">No Application Submitted</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            You haven't submitted your Incubation application yet. Complete the student-focused application to get started.
                        </p>
                        <Link href="/incube/publish" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg">
                            <PlusCircle className="size-5" /> Start Application
                        </Link>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Idea Summary */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-4">
                                        {application.idea_logo_url ? (
                                            <img src={application.idea_logo_url} className="size-16 rounded-xl object-cover" />
                                        ) : (
                                            <div className="size-16 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-2xl">
                                                {application.project_name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">{application.project_name}</h2>
                                            <p className="text-slate-500 mt-1">{application.institution_name} • {application.education_type}</p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${
                                        application.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                        application.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {application.status.replace('_', ' ')}
                                    </span>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Problem Statement</h3>
                                        <p className="text-slate-700 leading-relaxed">{application.problem_statement}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Solution</h3>
                                        <p className="text-slate-700 leading-relaxed">{application.solution_description}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* AI Student Analysis */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2 mb-6">
                                    <Activity className="size-6 text-blue-600" /> AI Student Analysis
                                </h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <div className="text-2xl font-bold text-blue-600">{application.ai_match_score || 0}%</div>
                                        <div className="text-xs text-slate-500 font-medium uppercase mt-1">Match Score</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <div className="text-2xl font-bold text-emerald-600">{application.innovation_score || 0}%</div>
                                        <div className="text-xs text-slate-500 font-medium uppercase mt-1">Innovation</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <div className="text-2xl font-bold text-purple-600">{application.incubation_readiness || 0}%</div>
                                        <div className="text-xs text-slate-500 font-medium uppercase mt-1">Readiness</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <div className="text-2xl font-bold text-amber-600">{application.feasibility_score || 0}%</div>
                                        <div className="text-xs text-slate-500 font-medium uppercase mt-1">Feasibility</div>
                                    </div>
                                </div>
                                
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <div className="text-sm font-bold text-blue-800 mb-1">AI Recommendation</div>
                                    <p className="text-blue-900/80 text-sm">{application.ai_recommendation || "Undergoing evaluation..."}</p>
                                </div>
                            </div>
                            
                        </div>

                        <div className="lg:col-span-1 space-y-8">
                            
                            {/* Funding Request */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                                    <Zap className="size-5 text-indigo-600" /> Funding Request
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Ask Amount</span>
                                        <span className="font-bold text-slate-900">₹{(application.ask_amount / 100000).toFixed(1)}L</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Equity Offered</span>
                                        <span className="font-bold text-blue-600">{application.equity_offered}%</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-slate-500">Implied Valuation</span>
                                        <span className="font-bold text-slate-900 font-mono">
                                            ₹{((application.ask_amount / (application.equity_offered / 100)) / 10000000).toFixed(2)}Cr
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="size-5 text-blue-600" /> Application Status
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="size-4 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">Submitted</p>
                                            <p className="text-xs text-slate-500">Form received</p>
                                        </div>
                                    </div>
                                    <div className="w-0.5 h-6 bg-slate-100 ml-4 -my-2" />
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${application.status === 'under_review' || application.status === 'approved' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                            <Loader2 className={`size-4 ${application.status === 'under_review' ? 'text-blue-600 animate-spin' : 'text-slate-400'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">Under Review</p>
                                            <p className="text-xs text-slate-500">Admin evaluation</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldCheck className="size-24" /></div>
                                <h3 className="font-bold text-xl mb-2 relative z-10">Active Deal Rooms</h3>
                                <p className="text-blue-100 text-sm mb-6 relative z-10">Check your messages to see if any investors have opened a Deal Room with you.</p>
                                <Link href="/messages" className="inline-block w-full text-center bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors relative z-10 shadow-sm">
                                    View Messages
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
