"use client";

import Link from "next/link";
import { FileText, MessageSquare, TrendingUp, Download, Eye, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

// Types corresponding to our API response
interface Agreement { id: string; startup: string; date: string; amount: string; equity: string; status: string; }
interface ActiveChat { id: string; startupId: string; startup: string; lastMessage: string; time: string; unread: number; }
interface PortfolioStats { totalCapital: string; activeStartups: number; }

export default function InvestorDashboard() {
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [chats, setChats] = useState<ActiveChat[]>([]);
    const [stats, setStats] = useState<PortfolioStats>({ totalCapital: "₹ 0", activeStartups: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/investors/dashboard');
                const data = await res.json();

                if (data.success) {
                    setAgreements(data.executedAgreements || []);
                    setChats(data.activeChats || []);
                    setStats(data.portfolioStats || { totalCapital: "₹ 0", activeStartups: 0 });
                }
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-24 max-w-7xl min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
                <Loader2 className="size-12 animate-spin text-emerald-500 mb-4" />
                <h2 className="text-xl font-outfit text-slate-800">Loading your portfolio...</h2>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl min-h-[calc(100vh-80px)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2">My Portfolio & Dashboard</h1>
                    <p className="text-slate-500 font-inter">Manage your investments, active negotiations, and legal documents.</p>
                </div>
                <Link href="/investors/search" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                    Discover Startups
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column: Signed Agreements (History) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 rounded-2xl border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                            <FileText className="size-5 text-emerald-600" /> Executed Agreements
                        </h2>

                        <div className="space-y-4">
                            {agreements.length === 0 ? (
                                <div className="text-center py-8 opacity-50 bg-slate-50 rounded-xl border border-slate-100">
                                    <FileText className="size-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-slate-900 text-sm">No executed agreements yet.</p>
                                    <Link href="/investors/search" className="text-emerald-600 font-bold text-sm hover:underline mt-2 inline-block">Find Startups to invest in.</Link>
                                </div>
                            ) : (
                                agreements.map((agr) => (
                                    <div key={agr.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-400 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-slate-800 font-outfit text-lg">{agr.startup}</h3>
                                                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                                                    {agr.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-9000 flex items-center gap-4">
                                                <span>Ref: {agr.id}</span>
                                                <span>Date: {agr.date}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-200 md:border-none justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-9000 mb-0.5">Investment</p>
                                                <p className="font-mono text-slate-800 font-semibold">{agr.amount}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-9000 mb-0.5">Equity</p>
                                                <p className="font-mono text-slate-800 font-semibold">{agr.equity}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/messages/agreement?startup=${encodeURIComponent(agr.startup)}&amount=${encodeURIComponent(agr.amount)}&equity=${encodeURIComponent(agr.equity)}&signature=John+Doe`}
                                                    className="p-2 bg-slate-50 border border-slate-300 hover:bg-slate-200 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors group"
                                                    title="View Document"
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                {/* In a real app, this would trigger a PDF blob download. Here it takes them to the printable view where they can 'Save as PDF' */}
                                                <Link
                                                    href={`/messages/agreement?startup=${encodeURIComponent(agr.startup)}&amount=${encodeURIComponent(agr.amount)}&equity=${encodeURIComponent(agr.equity)}&signature=John+Doe`}
                                                    className="p-2 bg-slate-50 border border-slate-300 hover:bg-slate-200 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <Download className="size-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )))}
                        </div>
                    </div>

                    {/* Active Portfolio Stats */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 rounded-2xl flex items-center gap-4 border border-slate-200">
                            <div className="size-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-300">
                                <TrendingUp className="size-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-9000">Total Deployed Capital</p>
                                <p className="text-2xl font-bold font-mono text-slate-800">{stats.totalCapital}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 rounded-2xl flex items-center gap-4 border border-slate-200">
                            <div className="size-12 bg-emerald-900/30 rounded-full flex items-center justify-center border border-emerald-500/30">
                                <ShieldCheck className="size-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-9000">Active Startups</p>
                                <p className="text-2xl font-bold font-mono text-slate-800">{stats.activeStartups} Companies</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Deal Rooms */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 rounded-2xl h-full border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                            <MessageSquare className="size-5 text-emerald-600" /> Active Negotiations
                        </h2>

                        <div className="space-y-4">
                            {chats.map((chat) => (
                                <Link href={`/messages?startupId=${chat.startupId}&name=${encodeURIComponent(chat.startup)}`} key={chat.id} className="block bg-white hover:bg-slate-200 border border-slate-200 hover:border-emerald-400 rounded-xl p-4 transition-all group shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{chat.startup}</h3>
                                        <span className="text-xs text-slate-9000 flex items-center gap-1"><Clock className="size-3" /> {chat.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{chat.lastMessage}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-emerald-600">Continue Deal Room &rarr;</span>
                                        {chat.unread > 0 && (
                                            <span className="size-5 bg-emerald-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                                                {chat.unread}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}

                            {chats.length === 0 && (
                                <div className="text-center py-8 opacity-50 bg-slate-50 rounded-xl">
                                    <MessageSquare className="size-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-slate-900 text-sm">No active negotiations.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
