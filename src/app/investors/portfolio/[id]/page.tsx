"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Building, Target, Map, Calendar, FileText, CheckSquare, File, Users, MessageSquare, BarChart, History, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { formatRelativeTime } from "@/utils/timeHelper";

type Tab = 'overview' | 'roadmap' | 'milestones' | 'meetings' | 'updates' | 'directives' | 'documents' | 'team' | 'messages' | 'performance' | 'timeline';

export default function PortfolioWorkspace() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    
    const [startup, setStartup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    useEffect(() => {
        const fetchWorkspace = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user?.email) {
                    router.push('/login');
                    return;
                }

                // Verify access first
                const { data: deals } = await supabase
                    .from("deals")
                    .select("id")
                    .eq("startup_id", id)
                    .eq("investor_id", user.email)
                    .eq("status", "executed");
                    
                const { data: agreements } = await supabase
                    .from("smart_agreements")
                    .select("id")
                    .eq("startup_id", id)
                    .eq("investor_id", user.email)
                    .eq("status", "Deal Completed");
                    
                if ((!deals || deals.length === 0) && (!agreements || agreements.length === 0)) {
                    // Unauthorized
                    router.push('/investors/portfolio');
                    return;
                }

                // Fetch startup details
                const { data: startupData, error } = await supabase
                    .from("startups")
                    .select("*")
                    .eq("id", id)
                    .single();
                    
                if (error) throw error;
                
                setStartup(startupData);
            } catch (err) {
                console.error("Failed to load workspace:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchWorkspace();
        }
    }, [id, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-10 animate-spin text-emerald-600" />
                    <p className="text-slate-500 font-medium">Securing workspace...</p>
                </div>
            </div>
        );
    }

    if (!startup) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">Startup not found.</p>
            </div>
        );
    }

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: Building },
        { id: 'performance', label: 'Performance', icon: BarChart },
        { id: 'roadmap', label: 'Roadmap', icon: Map },
        { id: 'milestones', label: 'Milestones', icon: Target },
        { id: 'updates', label: 'Updates', icon: FileText },
        { id: 'directives', label: 'Directives', icon: CheckSquare },
        { id: 'meetings', label: 'Meetings', icon: Calendar },
        { id: 'documents', label: 'Documents', icon: File },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'timeline', label: 'Timeline', icon: History },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pt-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-[72px] z-30">
                <div className="container mx-auto px-4 md:px-6 py-6 max-w-7xl">
                    <Link href="/investors/portfolio" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors mb-4">
                        <ChevronLeft className="size-4" /> Back to Portfolio
                    </Link>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="flex items-center gap-5">
                            <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-sm">
                                {startup.basic_info?.logoUrl ? (
                                    <img src={startup.basic_info.logoUrl} alt={startup.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-400">{startup.name.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-outfit font-bold text-slate-900 flex items-center gap-2">
                                    {startup.name}
                                </h1>
                                <p className="text-slate-500 font-medium mt-1">{startup.sector} • {startup.stage}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1">
                                <ShieldCheck className="size-3.5" /> Private Workspace
                            </span>
                            <Link href={`/startups/${startup.id}`} target="_blank" className="p-2 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 rounded-lg transition-colors" title="View Public Profile">
                                <ExternalLink className="size-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar pt-4 border-t border-slate-100">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 pb-4 px-2 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                                        isActive 
                                            ? 'text-emerald-600 border-emerald-600' 
                                            : 'text-slate-500 border-transparent hover:text-slate-800'
                                    }`}
                                >
                                    <Icon className={`size-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm min-h-[500px]">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Building className="size-5 text-emerald-600" /> About {startup.name}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">{startup.desc}</p>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">Business Model</p>
                                    <p className="font-bold text-slate-800">{startup.business_model || 'N/A'}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">Risk Profile</p>
                                    <p className="font-bold text-slate-800">{startup.risk || 'Medium'}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">AI Trust Score</p>
                                    <p className="font-bold text-emerald-600">{startup.score || 80}/100</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'performance' && (
                        <div className="animate-in fade-in flex flex-col items-center justify-center py-20 text-center">
                            <BarChart className="size-16 text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Performance Metrics</h3>
                            <p className="text-slate-500 max-w-sm">Track key performance indicators, runway, burn rate, and custom metrics updated by the founder.</p>
                        </div>
                    )}
                    
                    {activeTab === 'roadmap' && (
                        <div className="animate-in fade-in flex flex-col items-center justify-center py-20 text-center">
                            <Map className="size-16 text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Strategic Roadmap</h3>
                            <p className="text-slate-500 max-w-sm">View the startup's long-term product and business expansion plans.</p>
                        </div>
                    )}

                    {activeTab === 'directives' && (
                        <div className="animate-in fade-in flex flex-col items-center justify-center py-20 text-center">
                            <CheckSquare className="size-16 text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Investor Directives</h3>
                            <p className="text-slate-500 max-w-sm">Assign actionable tasks and directives to the founder to guide company growth.</p>
                        </div>
                    )}

                    {activeTab === 'updates' && (
                        <div className="animate-in fade-in flex flex-col items-center justify-center py-20 text-center">
                            <FileText className="size-16 text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Founder Updates</h3>
                            <p className="text-slate-500 max-w-sm">Read the latest product releases, milestones, and fund utilization reports.</p>
                        </div>
                    )}

                    {['milestones', 'meetings', 'documents', 'team', 'messages', 'timeline'].includes(activeTab) && (
                        <div className="animate-in fade-in flex flex-col items-center justify-center py-20 text-center">
                            <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-slate-400 capitalize">{activeTab}</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2 capitalize">{activeTab} Module</h3>
                            <p className="text-slate-500 max-w-sm">This module is part of the portfolio management suite and is actively being loaded.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
