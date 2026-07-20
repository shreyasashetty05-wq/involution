"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, CheckCircle2, AlertCircle, RefreshCcw, ShieldCheck, Lock, FileText, ChevronRight, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/utils/timeHelper";
import Link from "next/link";

export default function KYCPendingPage() {
    const supabase = createClient();
    const router = useRouter();
    
    const [kycRecord, setKycRecord] = useState<any>(null);
    const [latestNotification, setLatestNotification] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchStatus = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) return;

            const { data: kyc } = await supabase
                .from("kyc_documents")
                .select("*")
                .eq("email", user.email)
                .maybeSingle();

            setKycRecord(kyc);
            setLastUpdate(new Date());

            if (kyc?.status === 'Rejected') {
                const { data: notif } = await supabase
                    .from("notifications")
                    .select("*")
                    .eq("user_email", user.email)
                    .in("type", ["kyc_rejected", "kyc_more_info"])
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                setLatestNotification(notif);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 15000); // Auto-refresh every 15s
        return () => clearInterval(interval);
    }, [fetchStatus]);

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="flex flex-col items-center text-slate-500">
                    <RefreshCcw className="size-8 animate-spin mb-4 text-indigo-500" />
                    <p>Loading status...</p>
                </div>
            </div>
        );
    }

    if (!kycRecord) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
                <AlertCircle className="size-16 text-slate-400 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">No KYC Application Found</h1>
                <p className="text-slate-500 mb-6">You have not submitted a KYC application yet.</p>
                <Link href="/kyc" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                    Submit KYC
                </Link>
            </div>
        );
    }

    // --- Approved State ---
    if (kycRecord.status === 'Approved') {
        return (
            <div className="container mx-auto px-6 py-12 max-w-3xl min-h-[80vh] flex flex-col items-center justify-center">
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-12 text-center w-full relative overflow-hidden animate-in zoom-in duration-500">
                    <div className="absolute -top-32 -left-32 size-64 bg-green-500/10 rounded-full blur-[100px]" />
                    <div className="inline-flex justify-center items-center size-24 rounded-full bg-green-50 mb-6">
                        <CheckCircle2 className="size-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-4">Identity Verified</h1>
                    <p className="text-slate-600 font-inter mb-8 text-lg max-w-lg mx-auto">
                        Your KYC has been approved successfully. You now have full access to the InVolution platform.
                    </p>
                    <button onClick={() => {
                        let dashUrl = '/investors/dashboard';
                        if (kycRecord.type === 'Startup Founder') dashUrl = '/startups/dashboard';
                        if (kycRecord.type === 'Incubation Founder') dashUrl = '/incube';
                        if (kycRecord.type === 'Mentor') dashUrl = '/mentors/dashboard';
                        router.push(dashUrl);
                    }} className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mx-auto">
                        Continue to Dashboard <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
        );
    }

    // --- Rejected / More Info State ---
    if (kycRecord.status === 'Rejected') {
        const isMoreInfo = latestNotification?.type === 'kyc_more_info';
        
        return (
            <div className="container mx-auto px-6 py-12 max-w-3xl min-h-[80vh] flex flex-col items-center justify-center">
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-10 w-full relative overflow-hidden animate-in fade-in">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className={`inline-flex justify-center items-center size-20 rounded-full mb-6 ${isMoreInfo ? 'bg-orange-50' : 'bg-red-50'}`}>
                            <AlertCircle className={`size-10 ${isMoreInfo ? 'text-orange-500' : 'text-red-500'}`} />
                        </div>
                        <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">
                            {isMoreInfo ? "More Information Requested" : "KYC Rejected"}
                        </h1>
                        <p className="text-slate-500 max-w-md mx-auto">Your application requires your attention before we can proceed.</p>
                    </div>

                    <div className={`p-6 rounded-2xl mb-8 border ${isMoreInfo ? 'bg-orange-50/50 border-orange-100' : 'bg-red-50/50 border-red-100'}`}>
                        <p className={`text-sm font-semibold mb-2 ${isMoreInfo ? 'text-orange-800' : 'text-red-800'}`}>Reason provided by Admin:</p>
                        <p className="text-slate-800 font-medium text-lg">"{latestNotification?.description || 'Please review your documents and ensure they are clear and valid.'}"</p>
                        
                        <div className="mt-5 pt-4 border-t border-slate-200/50 flex justify-between text-xs font-medium text-slate-500">
                            <span>Reviewed On: {new Date(latestNotification?.created_at || kycRecord.updated_at).toLocaleDateString()}</span>
                            <span>Reviewed By: Admin Team</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <Link href="/kyc" className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow">
                            Resubmit Documents
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // --- Pending / Under Review State ---
    const submittedDate = new Date(kycRecord.created_at);

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl min-h-screen">
            <div className="mb-10 text-center animate-fade-in-up">
                <div className="inline-flex justify-center items-center size-16 rounded-full bg-indigo-50 mb-4 border border-indigo-100">
                    <ShieldCheck className="size-8 text-indigo-600" />
                </div>
                <h1 className="text-4xl font-outfit font-bold text-slate-900 mb-4">Application Under Review</h1>
                <p className="text-slate-500 font-inter max-w-xl mx-auto">
                    Your KYC documents have been successfully submitted and are currently being reviewed by our admin team.
                </p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
                {/* Left Column: Progress & Status */}
                <div className="md:col-span-3 space-y-6">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 relative overflow-hidden">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 font-outfit">Verification Progress</h2>
                        
                        <div className="relative pl-4 border-l-2 border-indigo-100 space-y-8">
                            <div className="relative">
                                <div className="absolute -left-[25px] top-0.5 size-5 bg-indigo-600 rounded-full border-[4px] border-indigo-100 flex items-center justify-center">
                                    <Check className="size-2.5 text-white" />
                                </div>
                                <h3 className="font-semibold text-slate-900">Documents Submitted</h3>
                                <p className="text-sm text-slate-500">{submittedDate.toLocaleDateString()} at {submittedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute -left-[25px] top-0.5 size-5 bg-yellow-400 rounded-full border-[4px] border-yellow-100 animate-pulse" />
                                <h3 className="font-semibold text-slate-900">Under Review</h3>
                                <p className="text-sm text-slate-500">Our team is verifying your identity documents.</p>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[25px] top-0.5 size-5 bg-slate-200 rounded-full border-[4px] border-white" />
                                <h3 className="font-semibold text-slate-400">Verification Complete</h3>
                                <p className="text-sm text-slate-400">You will be notified once approved.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-slate-900 mb-4 font-outfit uppercase tracking-wider">Status History</h2>
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <Clock className="size-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Under Review</p>
                                        <p className="text-slate-500 text-xs">Currently in queue</p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-slate-400">Active</span>
                            </div>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="size-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <CheckCircle2 className="size-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Submitted</p>
                                        <p className="text-slate-500 text-xs">KYC details provided</p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-slate-400">{formatRelativeTime(kycRecord.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Info Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 font-outfit uppercase tracking-wider">Application Details</h3>
                        
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between pb-3 border-b border-slate-200">
                                <span className="text-slate-500">Applicant</span>
                                <span className="font-medium text-slate-900 text-right">{kycRecord.name}</span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-slate-200">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium text-slate-900 text-right">{submittedDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-slate-200">
                                <span className="text-slate-500">Time</span>
                                <span className="font-medium text-slate-900 text-right">{submittedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-slate-200">
                                <span className="text-slate-500">Estimated Review</span>
                                <span className="font-medium text-slate-900 text-right">24 - 48 Hours</span>
                            </div>
                            <div className="flex justify-between pt-1 items-center">
                                <span className="text-slate-500">Last Updated</span>
                                <span className="font-medium text-indigo-600 flex items-center gap-1.5 text-xs bg-indigo-100/50 px-2 py-1 rounded">
                                    <RefreshCcw className="size-3" />
                                    {lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 p-5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-2"><Lock className="size-4 text-indigo-500" /> End-to-End Encrypted</div>
                        <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-green-500" /> Admin Only Access</div>
                        <div className="flex items-center gap-2"><FileText className="size-4 text-orange-500" /> Secure Document Storage</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
