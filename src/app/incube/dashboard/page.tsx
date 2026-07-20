"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle, CheckCircle2, AlertCircle, FileText } from "lucide-react";
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
            <div className="container mx-auto px-6 max-w-6xl">
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
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">{application.project_name}</h2>
                                        <p className="text-slate-500 mt-1">{application.institution_name} • {application.education_level}</p>
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
                                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{application.problem_statement}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Solution</h3>
                                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{application.solution_description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-1 space-y-6">
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

                            {application.status === 'rejected' && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                                    <AlertCircle className="size-5 text-red-500 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-red-700 text-sm">Action Required</h4>
                                        <p className="text-sm text-red-600 mt-1">Your application requires updates. Please check your notifications or email for details.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
