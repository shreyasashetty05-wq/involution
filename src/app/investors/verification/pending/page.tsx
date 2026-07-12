"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Lock } from "lucide-react";

export default function VerificationPendingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                        <Clock className="size-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Verification Submitted Successfully</h1>
                    <p className="text-slate-600 mb-2">Thank you for submitting your investor profile.</p>
                    <p className="text-slate-600">Your profile is currently under review. Our verification team will review your information within 48 hours.</p>

                    <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Current Status</span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-sm">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                Pending Verification
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Submitted Date</span>
                            <span className="text-slate-900 font-semibold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Estimated Time</span>
                            <span className="text-slate-900 font-semibold">Within 48 Hours</span>
                        </div>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t-2 border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-between">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-white">
                                    <CheckCircle2 className="size-5" />
                                </div>
                                <span className="mt-4 text-sm font-semibold text-slate-900">Submitted</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white shadow-sm ring-4 ring-white">
                                    <Clock className="size-5" />
                                </div>
                                <span className="mt-4 text-sm font-semibold text-yellow-600">Under Review</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 shadow-sm ring-4 ring-white">
                                    <span className="w-2.5 h-2.5 rounded-full bg-transparent"></span>
                                </div>
                                <span className="mt-4 text-sm font-medium text-slate-500">Approved</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-400 shadow-sm ring-4 ring-white">
                                    <span className="w-2.5 h-2.5 rounded-full bg-transparent"></span>
                                </div>
                                <span className="mt-4 text-sm font-medium text-slate-500">Verified Investor</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Locked Features */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Lock className="size-6 text-slate-400" />
                        <h2 className="text-xl font-bold text-slate-900">Features Locked</h2>
                    </div>
                    <p className="text-slate-600 mb-6 pb-6 border-b border-slate-100">These features will become available after your investor profile has been verified.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {["Startup Discovery", "Open Deal Room", "Send Messages", "Investment Features"].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="p-2 rounded-lg bg-white shadow-sm">
                                    <Lock className="size-4 text-slate-400" />
                                </div>
                                <span className="font-medium text-slate-500 line-through decoration-slate-300">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => router.push("/login")}
                        className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
