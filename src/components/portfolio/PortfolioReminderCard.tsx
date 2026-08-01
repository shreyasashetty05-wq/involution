"use client";

import { useState } from "react";
import { Clock, Eye, Briefcase, Loader2, X } from "lucide-react";

interface Props {
    onSelectPreference: (preference: string, dismissDays?: number) => Promise<void>;
}

export default function PortfolioReminderCard({ onSelectPreference }: Props) {
    const [loading, setLoading] = useState(false);

    const handleSelect = async (pref: string, days?: number) => {
        setLoading(true);
        await onSelectPreference(pref, days);
        setLoading(false);
    };

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm relative overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Clock className="size-32 text-amber-500" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="size-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="size-7" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Fundraising Preference Reminder</h3>
                    <p className="text-slate-600 mb-4 max-w-2xl">
                        You recently completed an investment but haven't chosen what should happen to your startup's visibility. 
                        Please select an option below, or you can manage this anytime in Settings.
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => handleSelect('Continue Fundraising')}
                            disabled={loading}
                            className="px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-sm font-bold text-slate-700 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
                        >
                            <Eye className="size-4" /> Continue Fundraising
                        </button>
                        <button 
                            onClick={() => handleSelect('Portfolio Management')}
                            disabled={loading}
                            className="px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 text-sm font-bold text-slate-700 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
                        >
                            <Briefcase className="size-4" /> Move to Portfolio
                        </button>
                        <button 
                            onClick={() => handleSelect('Decide Later', 7)}
                            disabled={loading}
                            className="px-4 py-2 bg-transparent border border-transparent hover:bg-amber-100/50 text-sm font-medium text-amber-700 rounded-xl flex items-center gap-2 transition-colors"
                        >
                            Remind Me Later
                        </button>
                    </div>
                </div>
            </div>
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-amber-600" />
                </div>
            )}
        </div>
    );
}
