"use client";

import { Clock, RefreshCcw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function KYCPendingPage() {
    const supabase = createClient();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(false);

    const checkStatus = async () => {
        setIsChecking(true);
        // Force session update to fetch latest JWT / user metadata
        await supabase.auth.refreshSession();
        router.refresh();
        setTimeout(() => {
            setIsChecking(false);
        }, 1500);
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl min-h-[80vh] flex flex-col items-center justify-center">
            <div className="bg-white border border-slate-200 shadow-lg rounded-3xl p-12 text-center max-w-xl w-full relative overflow-hidden animate-fade-in-up">
                <div className="absolute -top-32 -left-32 size-64 bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-32 -right-32 size-64 bg-pink-500/10 rounded-full blur-[100px]" />
                
                <div className="inline-flex justify-center items-center size-24 rounded-full bg-indigo-50 mb-6 border-8 border-indigo-50/50">
                    <Clock className="size-10 text-indigo-600" />
                </div>
                
                <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-4">Application Under Review</h1>
                <p className="text-slate-600 font-inter mb-8 text-lg">
                    Your KYC documents have been successfully submitted and are currently being reviewed by our admin team. You will be able to access your dashboard once your application is approved.
                </p>

                <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                    <p className="text-sm text-slate-500 mb-2">Current Status</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                        <div className="size-2 rounded-full bg-yellow-500 animate-pulse" />
                        Pending Admin Approval
                    </div>
                </div>

                <button
                    onClick={checkStatus}
                    disabled={isChecking}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-3 w-full disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <RefreshCcw className={`size-5 ${isChecking ? 'animate-spin' : ''}`} />
                    {isChecking ? "Checking Status..." : "Refresh Status"}
                </button>
            </div>
        </div>
    );
}
