"use client";

import { useState } from "react";
import { Briefcase, Eye, Clock, ShieldCheck, Loader2 } from "lucide-react";

interface Props {
    startupName: string;
    onSelectPreference: (preference: string, dismissDays?: number) => Promise<void>;
}

export default function PortfolioPreferenceModal({ startupName, onSelectPreference }: Props) {
    const [loading, setLoading] = useState(false);

    const handleSelect = async (pref: string, days?: number) => {
        setLoading(true);
        await onSelectPreference(pref, days);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <ShieldCheck className="size-48 text-emerald-600" />
                </div>
                
                <div className="relative z-10 text-center mb-8">
                    <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="size-8" />
                    </div>
                    <h2 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Investment Successfully Completed</h2>
                    <p className="text-slate-500">Congratulations! {startupName} has secured investment. How would you like to manage your fundraising visibility going forward?</p>
                </div>

                <div className="grid gap-4 relative z-10">
                    <button 
                        onClick={() => handleSelect('Continue Fundraising')}
                        disabled={loading}
                        className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                    >
                        <div className="size-12 bg-white rounded-full flex items-center justify-center border border-slate-200 group-hover:border-emerald-200 shrink-0 shadow-sm">
                            <Eye className="size-5 text-slate-600 group-hover:text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-emerald-700">Continue Fundraising</h3>
                            <p className="text-sm text-slate-500">Keep my startup publicly visible in the discovery dashboard to attract new investors.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleSelect('Portfolio Management')}
                        disabled={loading}
                        className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                    >
                        <div className="size-12 bg-white rounded-full flex items-center justify-center border border-slate-200 group-hover:border-blue-200 shrink-0 shadow-sm">
                            <Briefcase className="size-5 text-slate-600 group-hover:text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-700">Move to Portfolio Management</h3>
                            <p className="text-sm text-slate-500">Hide my startup from public discovery. I only want to collaborate with my current investors in a private workspace.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleSelect('Decide Later', 7)}
                        disabled={loading}
                        className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group text-left"
                    >
                        <div className="size-12 bg-white rounded-full flex items-center justify-center border border-slate-200 group-hover:border-slate-300 shrink-0 shadow-sm">
                            <Clock className="size-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 mb-1">Decide Later</h3>
                            <p className="text-sm text-slate-500">I'm not ready to make this decision yet. Remain public for now and remind me in 7 days.</p>
                        </div>
                    </button>
                </div>
                
                {loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="size-8 animate-spin text-emerald-600" />
                            <span className="font-medium text-slate-600">Updating Preference...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
