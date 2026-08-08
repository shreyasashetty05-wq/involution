"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Activity, ShieldCheck, Search, ChevronRight, Loader2, Target, Rocket } from "lucide-react";
import { formatRelativeTime } from "@/utils/timeHelper";
import { createClient } from "@/utils/supabase/client";

export default function MyPortfolioPage() {
    const [startups, setStartups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user?.email) {
                    const res = await fetch('/api/investors/portfolio', {
                        headers: {
                            'x-user-email': user.email
                        }
                    });
                    const json = await res.json();
                    if (json.success) {
                        setStartups(json.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch portfolio:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
    }, []);

    const filteredStartups = startups.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.sector?.toLowerCase().includes(search.toLowerCase()));

    const formatCurrency = (val: number) => {
        if (val === undefined || val === null || val === 0) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toLocaleString()}`;
    };

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl pt-28 min-h-screen bg-slate-50/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                            <Briefcase className="size-6" />
                        </div>
                        My Portfolio
                    </h1>
                    <p className="text-slate-500 mt-2">Manage and collaborate with startups you have invested in.</p>
                </div>
                
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                    <input 
                        type="text"
                        placeholder="Search portfolio..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="size-10 animate-spin text-emerald-600 mb-4" />
                    <p className="text-slate-500">Loading your portfolio...</p>
                </div>
            ) : filteredStartups.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                    <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Rocket className="size-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Your Portfolio is Empty</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">You haven't completed any investments yet, or none match your search criteria. Discover promising startups to build your portfolio.</p>
                    <Link href="/investors/search" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                        <Search className="size-4" /> Discover Startups
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStartups.map((startup, idx) => (
                        <Link href={`/investors/portfolio/${startup._id}`} key={idx} className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all group block relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                                <Briefcase className="size-32 text-emerald-600" />
                            </div>
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex gap-4 items-center">
                                    <div className="size-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden shadow-sm">
                                        {startup.basicInfo?.logoUrl ? (
                                            <img src={startup.basicInfo.logoUrl} alt={startup.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-slate-400">{startup.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                            {startup.name}
                                            {startup.kyc_status === 'Approved' && <ShieldCheck className="size-3.5 text-emerald-500" />}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">{startup.sector} • {startup.stage}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-slate-500 flex items-center gap-1.5"><Activity className="size-3.5" /> Health Score</span>
                                        <span className="font-bold text-slate-700">{startup.score || 80}/100</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${startup.score || 80}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Raised</p>
                                    <p className="font-mono font-bold text-slate-700 text-sm">{formatCurrency(startup.requested)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Visibility</p>
                                    <p className="font-bold text-slate-700 text-xs mt-0.5">
                                        {startup.portfolioStatus === 'Portfolio Management' ? 'Private' : 'Public'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-emerald-600 font-bold text-sm pt-4 border-t border-slate-100">
                                <span>Enter Workspace</span>
                                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
