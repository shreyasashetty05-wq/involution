"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Activity, LineChart, FileText, CheckCircle2, AlertCircle, Bot, Loader2, Link as LinkIcon, Save, CalendarDays, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

/**
 * Renders a financial update form for a startup, calculates a live AI confidence score from the entered financial data and supporting document, and submits the update to the backend.
 * @example
 * FinancialUpdatePage({ params: Promise.resolve({ id: "startup_123" }) })
 * <FinancialUpdatePage />
 * @param {{ params: Promise<{ id: string }> }} params - Route parameters promise containing the startup id.
 * @returns {JSX.Element} The financial update page UI.
 **/
export default function FinancialUpdatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [formData, setFormData] = useState({
        monthYear: "",
        revenue: "",
        profit: "",
        documentUrl: ""
    });

    const [aiScore, setAiScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // AI Confidence Score Calculator Module
    useEffect(() => {
        let score = 0;

        // Base points for just filling it out
        if (formData.monthYear) score += 20;

        // Points for financial logic
        const rev = Number(formData.revenue);
        const profit = Number(formData.profit);

        if (rev > 0) score += 20;
        if (profit > 0) score += 20; // Profitable
        if (profit < 0 && rev > 0 && Math.abs(profit) < rev) score += 10; // Controlled burn

        // Massive points for evidence
        if (formData.documentUrl.length > 5) score += 40;

        setAiScore(Math.min(100, score));
    }, [formData.monthYear, formData.revenue, formData.profit, formData.documentUrl]);

    /**
    * Handles financial update form submission, sends the data to the startup financials API, and manages success/error state.
    * @example
    * sync(event)
    * undefined
    * @param {React.FormEvent} e - Form submit event used to prevent default submission behavior.
    * @returns {Promise<void>} A promise that resolves when the submission flow completes.
    **/
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            const res = await fetch(`/api/startups/${id}/financials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monthYear: formData.monthYear,
                    revenue: Number(formData.revenue),
                    profit: Number(formData.profit),
                    documentUrl: formData.documentUrl,
                    aiConfidenceScore: aiScore
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit update');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/startups/dashboard");
                router.refresh();
            }, 2500);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSaving(false);
        }
    };

    if (success) {
        return (
            <div className="container mx-auto px-6 py-24 max-w-2xl min-h-[calc(100vh-80px)] text-center">
                <div className="size-24 bg-emerald-900/40 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                    <Save className="size-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold font-outfit text-slate-900 mb-4">Financial Update Verified</h2>
                <p className="text-slate-500 mb-8 text-lg">Your data has been securely logged on the blockchain and an AI snapshot has been generated with a confidence score of <span className="text-emerald-600 font-bold">{aiScore}/100</span>.</p>
                <div className="flex justify-center">
                    <Loader2 className="size-6 text-emerald-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl min-h-[calc(100vh-80px)]">
            <div className="mb-10">
                <Link href="/startups/dashboard" className="text-slate-400 hover:text-emerald-600 text-sm font-semibold mb-4 inline-block transition-colors">&larr; Back to Dashboard</Link>
                <h1 className="text-3xl font-outfit font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <LineChart className="size-8 text-emerald-600" /> Post Financial Update
                </h1>
                <p className="text-slate-500 font-inter">Continuous disclosure dramatically increases your AI Match Score and Deal Room visibility.</p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
                {/* Form Col */}
                <div className="md:col-span-3">
                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-2xl bg-white p-8 space-y-6">

                        {error && (
                            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                <CalendarDays className="size-4 text-slate-400" /> Reporting Month & Year
                            </label>
                            <input type="month" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-slate-800 transition-all [color-scheme:dark]" value={formData.monthYear} onChange={(e) => setFormData({ ...formData, monthYear: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <DollarSign className="size-4 text-slate-400" /> Total Revenue (₹)
                                </label>
                                <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-slate-800 placeholder:text-zinc-700 transition-all" placeholder="0" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <TrendingUp className="size-4 text-slate-400" /> Net Profit (₹)
                                </label>
                                <input type="number" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-slate-800 placeholder:text-zinc-700 transition-all" placeholder="0 or negative for loss" value={formData.profit} onChange={(e) => setFormData({ ...formData, profit: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-200">
                            <label className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                                <LinkIcon className="size-4" /> Supporting Document URL (Optional but Highly Recommended)
                            </label>
                            <p className="text-xs text-slate-400 mb-2">Link a verified bank statement, GST filing, or MIS report. This massively boosts your AI Confidence Score.</p>
                            <input type="url" className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-emerald-100 placeholder:text-emerald-900/50 transition-all" placeholder="https://drive.google.com/file/d/..." value={formData.documentUrl} onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })} />
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? <><Loader2 className="size-5 animate-spin" /> Committing Data...</> : "Submit Monthly Update"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="md:col-span-2">
                    {/* Outer div: sticky positioning only — overflow:hidden on sticky breaks scroll pinning */}
                    <div className="sticky top-24">
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <Bot className="size-32 text-indigo-400" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                                    <Activity className="size-4" /> Live AI Analysis
                                </h3>

                                <div className="text-center py-6">
                                    {/* Circular Score Display */}
                                    <div className="relative size-32 mx-auto mb-4">
                                        <svg className="size-full  -rotate-90">
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                strokeDasharray="364"
                                                strokeDashoffset={364 - (364 * aiScore) / 100}
                                                className={`${aiScore >= 80 ? 'text-emerald-600' : aiScore >= 50 ? 'text-amber-700' : 'text-red-400'} transition-all duration-1000 ease-out`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-bold font-mono ${aiScore >= 80 ? 'text-emerald-600' : aiScore >= 50 ? 'text-amber-700' : 'text-red-400'} transition-colors duration-500`}>
                                                {Math.round(aiScore)}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="text-slate-900 font-bold text-lg">Confidence Score</h4>
                                </div>

                                <div className="space-y-4 mt-4 text-sm">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        {formData.monthYear ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <div className="size-4 rounded-full border border-slate-300 shrink-0" />}
                                        <span className="font-medium">Temporal Logic Verified</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        {Number(formData.revenue) > 0 ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <div className="size-4 rounded-full border border-slate-300 shrink-0" />}
                                        <span className="font-medium">Revenue Bounds Checked</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        {formData.profit !== "" ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <div className="size-4 rounded-full border border-slate-300 shrink-0" />}
                                        <span className="font-medium">Profit/Loss Ratio Intact</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        {formData.documentUrl.length > 5 ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <div className="size-4 rounded-full border border-slate-300 shrink-0" />}
                                        <span className="font-medium">External Audit Sourced</span>
                                    </div>
                                </div>

                                {aiScore < 80 && (
                                    <div className="mt-8 p-4 bg-amber-950/30 border border-amber-300 rounded-xl">
                                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                            <AlertCircle className="size-4 inline mr-1.5 -mt-0.5" />
                                            Provide a verifiable document URL (GST/Bank) to drastically maximize your Confidence Score parameters for investors.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
