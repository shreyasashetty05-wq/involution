"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, MessageSquare, TrendingUp, Eye, CheckCircle2, ShieldCheck, Activity, Users, Star, BarChart3, Clock, LineChart } from "lucide-react";

interface StartupDashboardClientProps {
    myStartups: any[];
}

/**
 * Renders the startup founder dashboard with profile metrics, active investor deals, and secured funding agreements.
 * @example
 * StartupDashboardClient({ myStartups })
 * <StartupDashboardClient myStartups={[]} />
 * @param {{ myStartups: any[] }} myStartups - List of startup profiles belonging to the current user.
 * @returns {JSX.Element} The startup dashboard UI.
 **/
export default function StartupDashboardClient({ myStartups }: StartupDashboardClientProps) {
    const [activeDeals, setActiveDeals] = useState<any[]>([]);
    const [agreements, setAgreements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        /**
        * Fetches startup deal data from the API and updates the active deals and agreements state.
        * @example
        * sync()
        * undefined
        * @returns {void} No return value.
        **/
        const fetchDeals = async () => {
            try {
                const res = await fetch('/api/startups/deals');
                const json = await res.json();
                if (json.success) {
                    setActiveDeals(json.activeChats || []);
                    setAgreements(json.executedAgreements || []);
                }
            } catch (err) {
                console.error("Failed to fetch startup deals", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (myStartups.length > 0) {
            fetchDeals();
        } else {
            setIsLoading(false);
        }
    }, [myStartups]);

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl min-h-[calc(100vh-80px)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Founder Command Center</h1>
                    <p className="text-slate-500 font-inter">Monitor your live profile performance and manage active investor negotiations.</p>
                </div>
                <Link href="/startups/publish" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_-3px_rgba(163,230,53,0.3)]">
                    <FileText className="size-4" /> Publish Another Profile
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column: Live Profile Performance */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Live Stats mapping */}
                    {myStartups.length > 0 ? (
                        myStartups.map((myStartup, idx) => (
                            <div key={myStartup._id.toString()} className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 border-b border-slate-200 pb-4">
                                    <BuildingIcon className="size-6 text-emerald-600" />
                                    {myStartup.name}
                                </h2>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 bg-white">
                                        <div className="size-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                                            <Eye className="size-5 text-emerald-600" />
                                        </div>
                                        <p className="text-xs text-slate-9000 uppercase tracking-wider mb-1">Profile Views</p>
                                        <p className="text-2xl font-bold font-mono text-slate-900">{1492 + idx * 83}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 bg-white">
                                        <div className="size-10 bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                                            <Activity className="size-5 text-emerald-600" />
                                        </div>
                                        <p className="text-xs text-slate-9000 uppercase tracking-wider mb-1">Deal Room Saves</p>
                                        <p className="text-2xl font-bold font-mono text-slate-900">{38 + idx * 4}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 bg-white">
                                        <div className="size-10 bg-amber-900/30 rounded-full flex items-center justify-center mb-3">
                                            <Star className="size-5 text-amber-500" />
                                        </div>
                                        <p className="text-xs text-slate-9000 uppercase tracking-wider mb-1">AI Match Score</p>
                                        <p className="text-2xl font-bold font-mono text-slate-900">{myStartup.score || "75"}<span className="text-sm text-slate-9000">/100</span></p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 bg-white">
                                        <div className="size-10 bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                                            <Users className="size-5 text-emerald-600" />
                                        </div>
                                        <p className="text-xs text-slate-9000 uppercase tracking-wider mb-1">Active Deals</p>
                                        <p className="text-2xl font-bold font-mono text-slate-900">{idx === 0 ? activeDeals.length : 0}</p>
                                    </div>
                                </div>

                                {/* Financial Update CTA Action */}
                                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-2"><TrendingUp className="size-5 text-emerald-500" /> Monthly Financial Report</h3>
                                        <p className="text-sm text-slate-500 mt-1 max-w-lg">
                                            Keep your profile active and improve your AI Match Score by reporting your monthly revenue and burn.
                                        </p>
                                    </div>
                                    <Link href={`/startups/${myStartup._id.toString()}/financial-update`} className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 font-semibold rounded-xl transition-colors whitespace-nowrap shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)] flex items-center gap-2">
                                        <LineChart className="size-4" /> Submit Financial Update
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center border-dashed border-2 bg-white">
                            <ShieldCheck className="size-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No Profile Found</h3>
                            <p className="text-slate-9000 mb-6 max-w-sm mx-auto">You haven't published a startup profile under this email address yet. Investors cannot discover you until you do.</p>
                            <Link href="/startups/publish" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors inline-block shadow-[0_0_15px_-3px_rgba(163,230,53,0.3)]">
                                Publish Pitch Profile
                            </Link>
                        </div>
                    )}


                    {/* Active Deals / Inbox */}
                    {myStartups.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-12 bg-white">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                                <MessageSquare className="size-5 text-emerald-600" /> Active Investor Workspaces
                            </h2>

                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="text-center py-8">
                                        <Activity className="size-8 text-emerald-500 animate-spin mx-auto mb-2" />
                                        <p className="text-slate-500 text-sm">Loading active deals...</p>
                                    </div>
                                ) : activeDeals.map((deal) => (
                                    <Link href={`/messages?startupId=${deal.startupId}&investorId=${encodeURIComponent(deal.investor)}&name=${encodeURIComponent(deal.startupName)}`} key={deal.id} className="block bg-slate-200/30 hover:bg-slate-200 border border-slate-200 hover:border-emerald-300 rounded-xl p-5 transition-all group shadow-sm">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                                            <div className="grow">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{deal.investor}</h3>
                                                    {deal.unread > 0 && (
                                                        <span className="px-2 py-0.5 bg-emerald-500 rounded-full text-[10px] font-bold text-white">
                                                            {deal.unread} New
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-1 flex items-center gap-2">
                                                    <MessageSquare className="size-3 text-slate-9000" /> {deal.lastMessage}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-200 md:border-none">
                                                <div className="text-left md:text-right">
                                                    <p className="text-[10px] text-slate-9000 font-bold uppercase tracking-wider mb-1">Current Lifecycle</p>
                                                    <p className="text-sm font-semibold text-emerald-600 bg-lime-900/20 px-3 py-1 rounded-lg border border-lime-500/20">Phase {deal.phase}</p>
                                                </div>
                                                <div className="text-right ml-auto md:ml-0">
                                                    <p className="text-[10px] text-slate-9000 uppercase tracking-wider mb-1 flex items-center justify-end gap-1"><Clock className="size-3" /> Last Activity</p>
                                                    <p className="text-sm text-slate-700 font-medium">{deal.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}

                                {!isLoading && activeDeals.length === 0 && (
                                    <div className="text-center py-12 opacity-50 border border-dashed border-slate-300 rounded-xl">
                                        <ShieldCheck className="size-8 text-slate-400 mx-auto mb-3" />
                                        <p className="text-slate-9000 text-sm">No active deals yet. Ensure your pitch profile is complete and fully verified.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Historical / Info */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Public Profile Link block */}
                    {myStartups.map((myRes, i) => (
                        <div key={`link-${i}`} className="bg-gradient-to-br from-lime-950/40 to-emerald-950/40 border border-lime-500/20 p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 size-32 bg-lime-500/10 rounded-full blur-2xl"></div>
                            <h3 className="text-emerald-600 font-bold text-lg mb-2 relative z-10">Live on Network</h3>
                            <p className="text-sm text-slate-700 mb-2 relative z-10">Your startup <span className="font-bold text-slate-800">{myRes.name}</span> is currently visible in the investor search engine.</p>
                            <p className="text-xs text-slate-500 mb-6 font-mono bg-white/50 p-2 rounded border border-slate-200 relative z-10">/{myRes.name}</p>
                            <Link href={`/startups/${myRes._id.toString()}`} className="w-full py-3 bg-slate-50 border border-slate-300 hover:border-emerald-400 hover:bg-slate-200 text-slate-800 hover:text-emerald-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative z-10">
                                <Eye className="size-4" /> View Public Profile
                            </Link>
                        </div>
                    ))}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-full bg-white">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                            <CheckCircle2 className="size-5 text-emerald-600" /> Secured Funding
                        </h2>

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <Activity className="size-8 text-emerald-500 animate-spin mx-auto mb-2" />
                                </div>
                            ) : agreements.map((agr) => (
                                <div key={agr.id} className="bg-slate-200/30 border border-slate-200 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-slate-800 text-sm">{agr.investor}</h3>
                                        <span className="px-2 py-0.5 bg-emerald-900/30 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                                            <ShieldCheck className="size-3" /> {agr.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="text-xs text-slate-9000 mb-0.5">Raised Capital</p>
                                            <p className="font-mono text-emerald-600 font-bold">{agr.amount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-9000 mb-0.5">Equity Dilution</p>
                                            <p className="font-mono text-slate-800 font-semibold">{agr.equity}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!isLoading && agreements.length === 0 && (
                                <div className="text-center py-8 opacity-50">
                                    <BarChart3 className="size-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-slate-9000 text-sm">No secured funding agreements on file.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

/**
 * Renders an SVG icon component for a stylized building/dashboard graphic.
 * @example
 * StartupDashboardClient(props)
 * <svg>...</svg>
 * @param {React.SVGProps<SVGSVGElement>} props - Props to spread onto the SVG element.
 * @returns {JSX.Element} The rendered SVG icon component.
 */
const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
    </svg>
)
