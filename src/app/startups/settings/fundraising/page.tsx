"use client";

import { useState, useEffect } from "react";
import { Eye, Briefcase, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";

export default function FundraisingSettings() {
    const toast = useToast();
    const [startups, setStartups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        const fetchStartups = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                    const { data, error } = await supabase
                        .from('startups')
                        .select('*')
                        .eq('owner_email', user.email);
                    if (!error && data) {
                        setStartups(data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch startups:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStartups();
    }, []);

    const updatePreference = async (startupId: string, status: string, dismissDays?: number) => {
        setUpdating(startupId);
        try {
            const res = await fetch(`/api/startups/${startupId}/portfolio/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolio_status: status, dismiss_reminder_days: dismissDays })
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Fundraising visibility updated successfully.');
                setStartups(prev => prev.map(s => s.id === startupId ? { ...s, portfolio_status: status } : s));
            } else {
                toast.error(json.error || 'Failed to update visibility.');
            }
        } catch (err) {
            toast.error('An error occurred.');
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="size-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl min-h-screen bg-slate-50/50">
            <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Fundraising Preferences</h1>
            <p className="text-slate-500 mb-8">Manage how your startup is discovered by investors after you complete an investment round.</p>
            
            {startups.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500">
                    You have not published any startups yet.
                </div>
            ) : (
                <div className="space-y-8">
                    {startups.map(startup => (
                        <div key={startup.id} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                            {updating === startup.id && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
                                    <Loader2 className="size-8 animate-spin text-emerald-600" />
                                </div>
                            )}
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                                    {startup.basic_info?.logoUrl ? (
                                        <img src={startup.basic_info.logoUrl} alt={startup.name} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <span className="text-2xl font-bold text-slate-400">{startup.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{startup.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Status:</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                            startup.portfolio_status === 'Portfolio Management' ? 'bg-blue-100 text-blue-700' :
                                            startup.portfolio_status === 'Continue Fundraising' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {startup.portfolio_status === 'Portfolio Management' ? <Briefcase className="size-3" /> :
                                             startup.portfolio_status === 'Continue Fundraising' ? <Eye className="size-3" /> :
                                             <Clock className="size-3" />}
                                            {startup.portfolio_status || 'Pending Decision'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <button 
                                    onClick={() => updatePreference(startup.id, 'Continue Fundraising')}
                                    className={`p-5 rounded-2xl border-2 transition-all text-left ${startup.portfolio_status === 'Continue Fundraising' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                                >
                                    <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${startup.portfolio_status === 'Continue Fundraising' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Eye className="size-5" />
                                    </div>
                                    <h3 className={`font-bold mb-1 ${startup.portfolio_status === 'Continue Fundraising' ? 'text-emerald-700' : 'text-slate-700'}`}>Continue Fundraising</h3>
                                    <p className="text-xs text-slate-500">Keep startup visible in discovery dashboard to attract new investors.</p>
                                </button>

                                <button 
                                    onClick={() => updatePreference(startup.id, 'Portfolio Management')}
                                    className={`p-5 rounded-2xl border-2 transition-all text-left ${startup.portfolio_status === 'Portfolio Management' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                                >
                                    <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${startup.portfolio_status === 'Portfolio Management' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Briefcase className="size-5" />
                                    </div>
                                    <h3 className={`font-bold mb-1 ${startup.portfolio_status === 'Portfolio Management' ? 'text-blue-700' : 'text-slate-700'}`}>Portfolio Management</h3>
                                    <p className="text-xs text-slate-500">Hide from public discovery. Only collaborate with current investors.</p>
                                </button>

                                <button 
                                    onClick={() => updatePreference(startup.id, 'Decide Later', 7)}
                                    className={`p-5 rounded-2xl border-2 transition-all text-left ${startup.portfolio_status === 'Decide Later' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300'}`}
                                >
                                    <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${startup.portfolio_status === 'Decide Later' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Clock className="size-5" />
                                    </div>
                                    <h3 className={`font-bold mb-1 ${startup.portfolio_status === 'Decide Later' ? 'text-amber-700' : 'text-slate-700'}`}>Decide Later</h3>
                                    <p className="text-xs text-slate-500">Remain public for now. Remind me to make a decision in 7 days.</p>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
